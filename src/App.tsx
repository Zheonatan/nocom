import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyList } from "@/components/EmptyList";
import { TabStrip } from "@/components/TabStrip";
import { TodoRow } from "@/components/TodoRow";
import { useFlipRows } from "@/hooks/use-flip-rows";
import { t, type MessageKey } from "@/lib/i18n";
import { hasAddedTask, markTaskAdded } from "@/lib/onboarding";
import {
  addTodo,
  byCreatedAt,
  byDisplayOrder,
  clearCompleted,
  closeTab,
  createTab,
  deleteTodo,
  errorDetail,
  getActiveTab,
  hideWindow,
  listTabs,
  listTodos,
  neighbourTabId,
  nextTabName,
  renameTab,
  renameTodo,
  restoreTab,
  restoreTodos,
  setActiveTab,
  TITLE_MAX_LENGTH,
  toggleTodo,
  TOGGLE_SHORTCUT,
  type ClosedTab,
  type Tab,
  type Todo,
} from "@/lib/todos";

/** Uma linha só existe no backend depois que `add_todo` responde. */
const OPTIMISTIC_PREFIX = "optimistic-";

/** Erro e oferta de desfazer somem sozinhos no mesmo tempo. */
const NOTICE_TIMEOUT_MS = 6000;

/**
 * Alvos em que o mousedown é do elemento, não da janela: arrastar a partir daí
 * roubaria o clique de fechar ou o foco de um campo de texto.
 */
const NO_DRAG = "button, input, textarea, select, label, a, [role='checkbox']";

/**
 * As duas coisas dividem a mesma faixa acima da lista: a janela não tem altura
 * para uma barra a mais, e ambas são passageiras pelo mesmo motivo.
 *
 * O desfazer carrega a AÇÃO, e não o que foi removido: são três gestos
 * destrutivos com formas diferentes de voltar (uma tarefa, as concluídas, uma aba
 * inteira com as tarefas dela) e uma faixa só para oferecer o desfazer. Guardando
 * a ação, o aviso continua sendo um caminho de código único.
 */
type Notice =
  | { kind: "error"; id: string; text: string; detail: string }
  | { kind: "undo"; id: string; text: string; run: () => Promise<void> }
  /**
   * A dica que aparece UMA vez na vida, quando a primeira tarefa entra.
   *
   * Divide a faixa com erro e desfazer porque é da mesma natureza dos dois: é
   * passageira, se dispensa sozinha em 6 segundos e não vale altura permanente.
   * Não carrega ação nem detalhe — a renderização da faixa já trata "não é erro"
   * como cinza e "não é desfazer" como sem botão, então esta variante entra sem
   * um `if` novo na tela.
   */
  | { kind: "hint"; id: string; text: string };

/** "N tarefas voltam" — é o que o desfazer de fechar aba precisa prometer. */
function closedTabText({ tab, todos }: ClosedTab): string {
  const n = todos.length;
  // Aba vazia não fala de tarefa nenhuma: "0 tarefas voltam" é ruído.
  if (n === 0) return t("undo.tabClosed", { name: tab.name });
  return t("undo.tabClosedWithTasks", { name: tab.name, n });
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  /**
   * Se esta pessoa ainda não acrescentou nenhuma tarefa nesta máquina. Governa
   * qual dos dois estados vazios a lista mostra e se a faixa de boas-vindas
   * ainda tem uma aparição pela frente. Lido uma vez, na montagem: o valor muda
   * por gesto do usuário, nunca por conta própria.
   */
  const [firstRun, setFirstRun] = useState(() => !hasAddedTask());

  const listRef = useRef<HTMLUListElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  // Âncora para achar o viewport do ScrollArea: o ref vai no conteúdo, e o
  // viewport é encontrado subindo por `closest`. Pendurar um ref no ScrollArea
  // dependeria de ele repassar `ref` até o elemento que de fato rola.
  const listBoxRef = useRef<HTMLDivElement>(null);
  // O foco da janela chega de fora do React. O listener é assinado uma vez só e
  // lê o estado daqui, para não precisar reassinar a cada tecla digitada.
  const editingRef = useRef(false);
  // Trocar de aba dispara um `list_todos`, e trocar duas vezes rápido dispara
  // dois. Sem este selo, a resposta da PRIMEIRA aba poderia chegar depois e
  // encher a tela da segunda com a lista errada.
  const loadRef = useRef(0);

  const pending = todos.reduce((n, item) => (item.done ? n : n + 1), 0);
  const completed = todos.length - pending;
  const allDone = todos.length > 0 && pending === 0;

  // O estado fica sempre na ordem canônica do contrato; a ordem de exibição é
  // aplicada só aqui, na borda da renderização.
  const visible = useMemo(() => [...todos].sort(byDisplayOrder), [todos]);

  // A linha em edição pode sumir sem passar por `onCancelEdit`: remover a tarefa
  // ou limpar as concluídas desmonta o editor por baixo. `editingId` ficava
  // apontando para uma tarefa que não existe mais — e como ele é o guard do
  // Escape e do foco, o Escape parava de esconder a janela para sempre e a
  // janela nunca mais devolvia o cursor ao campo. Derivar em vez de confiar no
  // estado cru fecha esse buraco em qualquer caminho de remoção, inclusive nos
  // que ainda não existem.
  const editing =
    editingId !== null && todos.some((item) => item.id === editingId) ? editingId : null;
  // Mesma armadilha, agora com abas: fechar a aba cujo nome está sendo editado
  // (ou trocar de aba no meio da edição) desmonta o campo sem cancelar.
  const editingTab =
    editingTabId !== null && tabs.some((item) => item.id === editingTabId)
      ? editingTabId
      : null;

  useFlipRows(
    listRef,
    visible.map((item) => `${item.id}:${item.done ? 1 : 0}`).join(),
  );

  /**
   * A mensagem na tela é NOSSA, escolhida pela operação que falhou, e diz o que
   * aconteceu com os dados ("a tarefa continua na lista"). A frase crua do
   * backend não serve para isso: ela fala de ids e de arquivos, sai sempre em
   * português mesmo com a interface em inglês, e não responde a única pergunta
   * que importa na hora — se algo se perdeu.
   *
   * O texto cru não é jogado fora: vai para o `title`, que o Adendo 3 já
   * estabeleceu como o lugar onde o texto inteiro do erro continua alcançável.
   */
  const fail = useCallback((err: unknown, key: MessageKey) => {
    // Objeto novo a cada falha: dois erros iguais seguidos ainda reiniciam o
    // timer de auto-dismiss abaixo, que compara por identidade.
    setNotice({
      kind: "error",
      id: crypto.randomUUID(),
      text: t(key, { shortcut: TOGGLE_SHORTCUT }),
      detail: errorDetail(err),
    });
  }, []);

  const offerUndo = useCallback((text: string, run: () => Promise<void>) => {
    setUndoing(false);
    setNotice({ kind: "undo", id: crypto.randomUUID(), text, run });
  }, []);

  const focusDraft = useCallback(() => {
    draftRef.current?.focus();
  }, []);

  /**
   * Carrega a lista de uma aba. O selo (`loadRef`) faz valer só a carga mais
   * recente: qualquer caminho que troque de aba por conta própria — criar,
   * fechar, desfazer — invalida as anteriores incrementando o mesmo contador.
   */
  const loadTodosFor = useCallback(
    async (tabId: string): Promise<Todo[] | null> => {
      const token = (loadRef.current += 1);
      setLoading(true);
      try {
        const list = await listTodos(tabId);
        if (loadRef.current !== token) return null;
        const ordenada = [...list].sort(byCreatedAt);
        setTodos(ordenada);
        // Devolve a lista, e não só grava no estado: a carga inicial precisa
        // saber se havia tarefa em disco para decidir se esta é uma instalação
        // nova ou uma atualização, e ler `todos` logo depois do `setTodos` daria
        // o valor do render anterior. `null` é "não use isto" — ou a carga foi
        // invalidada por outra mais recente, ou ela falhou.
        return ordenada;
      } catch (err) {
        if (loadRef.current !== token) return null;
        fail(err, "error.load");
        return null;
      } finally {
        if (loadRef.current === token) setLoading(false);
      }
    },
    [fail],
  );

  useEffect(() => {
    editingRef.current = editing !== null || editingTab !== null;
  }, [editing, editingTab]);

  // Carga inicial: abas, aba ativa gravada, e só então a lista dela. Se o backend
  // ainda não existe, a UI abre vazia com o erro visível em vez de ficar presa em
  // "carregando".
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, saved] = await Promise.all([listTabs(), getActiveTab()]);
        if (!alive) return;
        const ordered = [...list].sort(byCreatedAt);
        setTabs(ordered);
        // O backend já cai na primeira aba quando a gravada não existe mais; a
        // checagem aqui é para a tela nunca ficar apontando para o nada, mesmo
        // que essa garantia mude do outro lado.
        const current = ordered.some((item) => item.id === saved)
          ? saved
          : (ordered[0]?.id ?? null);
        setActiveTabId(current);
        if (current === null) {
          setLoading(false);
          return;
        }
        const carregadas = await loadTodosFor(current);
        if (!alive) return;
        // **Quem atualizou o app não é usuário de primeira viagem** — mas também
        // não tem a chave gravada, porque ela nasce nesta versão. Qualquer sinal
        // de uso anterior encerra o assunto: uma tarefa em disco, ou mais de uma
        // aba (ninguém termina a primeira execução com duas). Sem esta linha, a
        // atualização se apresentaria como instalação nova e explicaria o app a
        // quem já tem o hábito.
        //
        // A escrita é idempotente de propósito: `firstRun` não entra nas
        // dependências deste efeito — ele é a carga inicial e roda uma vez — e
        // gravar "já acrescentou" de novo não custa nada.
        if (ordered.length > 1 || (carregadas !== null && carregadas.length > 0)) {
          markTaskAdded();
          setFirstRun(false);
        }
      } catch (err) {
        if (!alive) return;
        fail(err, "error.load");
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fail, loadTodosFor]);

  // A rolagem da lista volta ao topo ao trocar de aba: manter o scroll de outra
  // lista mostra a aba nova numa posição que não é dela. O viewport é interno ao
  // ScrollArea do Radix, e é ele quem rola — não o elemento raiz.
  useEffect(() => {
    const viewport = listBoxRef.current?.closest<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) viewport.scrollTop = 0;
  }, [activeTabId]);

  // O ciclo do app é ⌃⌥T → digitar → Enter → ⌃⌥T. O `autoFocus` do campo só vale
  // na montagem, então a janela que voltava pelo atalho ou pelo tray chegava sem
  // cursor no campo e cobrava um clique no meio do fluxo.
  useEffect(() => {
    let alive = true;
    let unlisten: (() => void) | undefined;

    getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (!focused) return;
        // Edição inline em curso tem posse do foco — de tarefa ou de aba:
        // roubá-lo aqui fecharia o editor pelo blur, salvando no meio da
        // digitação.
        if (editingRef.current) return;
        draftRef.current?.focus();
      })
      .then((fn) => {
        // Se o componente desmontou antes de a assinatura ficar pronta, cancela
        // na hora em vez de guardar um listener órfão.
        if (alive) unlisten = fn;
        else fn();
      })
      .catch((err: unknown) => fail(err, "error.focus"));

    return () => {
      alive = false;
      unlisten?.();
    };
  }, [fail]);

  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // Escape em camadas. A janela não tem decoração de OS, então Escape é o único
  // caminho de teclado para fora dela — mas escondê-la com texto por enviar
  // perderia o que foi digitado, que é o pior desfecho possível aqui.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Há edição inline aberta: quem trata o Escape é o campo, e só ele.
      if (editing !== null || editingTab !== null) return;
      if (draft !== "") {
        setDraft("");
        return;
      }
      void hideWindow().catch((err: unknown) => fail(err, "error.hide"));
    };
    // Captura, e não bolha: num evento discreto o React processa o
    // `setEditingId(null)` do editor e reassina este efeito ANTES de o evento
    // nativo terminar de subir até o `window`. Na bolha, o handler já seria o
    // novo — com `editingId` nulo — e o Escape que só cancelava a edição
    // escondia a janela junto. Na captura ele roda antes de qualquer handler
    // do React, com o estado que valia quando a tecla foi apertada.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [editing, editingTab, draft, fail]);

  // `data-tauri-drag-region` sozinho não move a janela no macOS com
  // `decorations: false` + `transparent: true` (Adendo 1). O atributo fica como
  // fallback; quem de fato arrasta é isto.
  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement | null)?.closest(NO_DRAG)) return;
      void getCurrentWindow()
        .startDragging()
        .catch((err: unknown) => fail(err, "error.drag"));
    },
    [fail],
  );

  async function handleAdd() {
    const title = draft.trim();
    if (!title) return;
    // Sem aba ativa não há onde escrever. Só acontece se a carga inicial falhou,
    // e nesse caso o erro dela já está na tela.
    if (activeTabId === null) return;

    setNotice(null);
    setDraft("");
    // O id real vem do backend; até lá a linha existe com um id temporário.
    // Aleatório, e não `Date.now()`: dois adds no mesmo milissegundo colidiriam
    // e a resposta substituiria a linha errada.
    const optimistic: Todo = {
      id: `${OPTIMISTIC_PREFIX}${crypto.randomUUID()}`,
      title,
      done: false,
      created_at: Date.now(),
      tab_id: activeTabId,
    };
    setTodos((prev) => [...prev, optimistic]);

    try {
      const created = await addTodo(title, activeTabId);
      setTodos((prev) =>
        [...prev.map((item) => (item.id === optimistic.id ? created : item))].sort(
          byCreatedAt,
        ),
      );
      // **A passagem de bastão.** O estado vazio que acabou de ensinar as vias de
      // volta sai da tela exatamente agora, e o instante seguinte é o primeiro em
      // que a pessoa esconde a janela. A faixa assume a instrução por 6 segundos
      // para que ela não morra um gesto antes do momento que a justifica.
      //
      // Depois do `await`, e não antes: uma tarefa que o disco recusou não é a
      // primeira tarefa de ninguém, e o `catch` abaixo devolve a linha e o texto.
      if (firstRun) {
        markTaskAdded();
        setFirstRun(false);
        // `prev ?? …`, e não `setNotice(…)`: se um aviso chegou enquanto a escrita
        // acontecia — o `error.tabRemember` de uma troca de aba, por exemplo —, ele
        // vale mais que uma dica, e a faixa é uma só. A dica então se perde, e é
        // aceitável: o estado vazio acabou de dizer a mesma coisa com mais espaço.
        setNotice(
          (prev) =>
            prev ?? {
              kind: "hint",
              id: crypto.randomUUID(),
              text: t("onboarding.roundTrip", { shortcut: TOGGLE_SHORTCUT }),
            },
        );
      }
    } catch (err) {
      setTodos((prev) => prev.filter((item) => item.id !== optimistic.id));
      setDraft(title); // devolve o texto para não perder o que foi digitado
      fail(err, "error.add");
    }
  }

  // Os handlers de linha são `useCallback` e o `TodoRow` é `memo`: digitar no
  // campo de nova tarefa re-renderiza o App a cada tecla, e sem isso cada tecla
  // re-renderizava também todas as linhas da lista — trabalho O(n) por
  // caractere que numa lista longa vira latência de digitação. Com identidade
  // estável nos handlers, as teclas não tocam nas linhas; elas só re-renderizam
  // quando `todos` de fato muda.
  const handleToggle = useCallback(
    async (id: string) => {
      setNotice(null);
      const before = todos;
      // A linha muda de grupo já no clique e o FLIP a leva deslizando até o novo
      // lugar. Se o backend recusar, `before` a devolve — e a volta é animada pelo
      // mesmo mecanismo, sem nada a mais.
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
      );
      try {
        const updated = await toggleTodo(id);
        setTodos((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (err) {
        setTodos(before);
        fail(err, "error.toggle");
      }
    },
    [todos, fail],
  );

  /**
   * `restore_todos` devolve a lista completa DAQUELA aba (Esclarecimento 5.1) —
   * todas as tarefas de uma chamada pertencem à mesma aba, que é o caso dos dois
   * desfazeres que o comando atende. O filtro por `tab_id` fica como redundância
   * barata: cada tarefa já carrega a sua aba, e a tela nunca exibe tarefa de
   * outra por um retorno mais largo do que o esperado.
   */
  const applyRestored = useCallback((restored: Todo[], tabId: string) => {
    setTodos(restored.filter((item) => item.tab_id === tabId).sort(byCreatedAt));
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (activeTabId === null) return;
      setNotice(null);
      const before = todos;
      const removed = todos.find((item) => item.id === id);
      const tabId = activeTabId;
      setTodos((prev) => prev.filter((item) => item.id !== id));
      try {
        await deleteTodo(id);
        // Guarda o `Todo` inteiro, como estava: `restore_todos` devolve com o `id`
        // e o `created_at` originais, então a tarefa volta ao lugar dela na lista
        // em vez de reaparecer no fim como se fosse outra.
        if (removed) {
          offerUndo(t("undo.taskRemoved"), async () => {
            applyRestored(await restoreTodos([removed]), tabId);
          });
        }
      } catch (err) {
        setTodos(before);
        fail(err, "error.delete");
      }
    },
    [todos, activeTabId, offerUndo, applyRestored, fail],
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      setEditingId(null);
      setNotice(null);
      const before = todos;
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title } : item)),
      );
      try {
        // `rename_todo` não mexe em `created_at` nem em `done`, então a ordem da
        // lista não muda — só o texto.
        const updated = await renameTodo(id, title);
        setTodos((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (err) {
        setTodos(before);
        fail(err, "error.rename");
      }
    },
    [todos, fail],
  );

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  async function handleClearCompleted() {
    if (activeTabId === null) return;
    setNotice(null);
    const before = todos;
    const tabId = activeTabId;
    // Precisa ser capturado ANTES da chamada: depois dela as concluídas já não
    // estão em lugar nenhum, e é o `done: true` delas que o desfazer restaura.
    const removed = todos.filter((item) => item.done);
    setTodos((prev) => prev.filter((item) => !item.done));
    try {
      const remaining = await clearCompleted(tabId);
      setTodos([...remaining].sort(byCreatedAt));
      if (removed.length > 0) {
        offerUndo(t("undo.completedRemoved", { n: removed.length }), async () => {
          applyRestored(await restoreTodos(removed), tabId);
        });
      }
    } catch (err) {
      setTodos(before);
      fail(err, "error.clear");
    }
  }

  async function handleUndo(run: () => Promise<void>) {
    // O desfazer é tudo ou nada, e a segunda chamada do mesmo desfazer falharia
    // inteira porque os ids já teriam voltado. Daí o botão valer um clique só.
    setUndoing(true);
    try {
      await run();
      setNotice(null);
    } catch (err) {
      fail(err, "error.undo");
    }
  }

  function handleSelectTab(id: string) {
    if (id === activeTabId) {
      focusDraft();
      return;
    }
    setNotice(null);
    setEditingId(null);
    setEditingTabId(null);
    setActiveTabId(id);
    // A lista da aba anterior sai da tela na hora: deixá-la ali enquanto a nova
    // carrega mostraria tarefas que não são desta aba.
    setTodos([]);
    // Trocar de aba põe o foco no campo de nova tarefa, mesma razão do Adendo 4.
    focusDraft();
    void setActiveTab(id).catch((err: unknown) => fail(err, "error.tabRemember"));
    void loadTodosFor(id);
  }

  /**
   * Criar espera o backend em vez de pintar um chip otimista, e é o único gesto
   * de aba que faz isso: criar já entra em edição do nome, e renomear exige um id
   * que exista. Com um chip otimista, um Enter rápido chamaria `rename_tab` com
   * um id que o backend nunca viu.
   */
  async function handleCreateTab() {
    setNotice(null);
    setEditingId(null);
    try {
      const created = await createTab(nextTabName(tabs));
      setTabs((prev) => [...prev, created].sort(byCreatedAt));
      setActiveTabId(created.id);
      // Aba recém-criada nasce vazia: não há `list_todos` a fazer. O selo é
      // incrementado para invalidar uma carga da aba anterior ainda em voo.
      loadRef.current += 1;
      setTodos([]);
      setLoading(false);
      void setActiveTab(created.id).catch((err: unknown) =>
        fail(err, "error.tabRemember"),
      );
      // Nomear é o mesmo gesto de criar: sem diálogo, o campo já abre com o nome
      // padrão selecionado, pronto para ser sobrescrito.
      setEditingTabId(created.id);
    } catch (err) {
      fail(err, "error.tabCreate");
    }
  }

  async function handleRenameTab(id: string, name: string) {
    setEditingTabId(null);
    setNotice(null);
    const before = tabs;
    setTabs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item)),
    );
    focusDraft();
    try {
      const updated = await renameTab(id, name);
      setTabs((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setTabs(before);
      fail(err, "error.tabRename");
    }
  }

  function handleCancelTabEdit() {
    setEditingTabId(null);
    // O campo que tinha o foco acabou de sair da árvore; sem isto o foco cai no
    // body e a próxima tecla não vai para lugar nenhum.
    focusDraft();
  }

  async function handleCloseTab(id: string) {
    // O backend recusa fechar a última aba. A faixa nem mostra o `×` nesse caso;
    // esta linha é a rede de segurança para qualquer outro caminho.
    if (tabs.length <= 1) return;

    setNotice(null);
    setEditingTabId(null);
    const beforeTabs = tabs;
    const beforeTodos = todos;
    const beforeActive = activeTabId;
    const wasActive = id === activeTabId;
    const next = wasActive ? neighbourTabId(beforeTabs, id) : activeTabId;

    setTabs((prev) => prev.filter((item) => item.id !== id));
    if (wasActive) {
      setActiveTabId(next);
      setTodos([]);
    }

    try {
      // `close_tab` devolve o que apagou — é com isso que o desfazer repõe aba e
      // tarefas com os ids e `created_at` originais.
      const closed = await closeTab(id);
      if (wasActive && next !== null) {
        void setActiveTab(next).catch((err: unknown) =>
          fail(err, "error.tabRemember"),
        );
        void loadTodosFor(next);
        focusDraft();
      }
      offerUndo(closedTabText(closed), async () => {
        const restored = await restoreTab(closed.tab, closed.todos);
        setTabs([...restored].sort(byCreatedAt));
        // Só volta para a aba restaurada se era nela que se estava trabalhando:
        // aí o desfazer devolve a tela ao estado de antes. Fechando uma aba de
        // fundo, pular para ela seria o desfazer mexendo em mais do que desfez.
        if (!wasActive) return;
        loadRef.current += 1;
        setActiveTabId(closed.tab.id);
        setTodos([...closed.todos].sort(byCreatedAt));
        setLoading(false);
        void setActiveTab(closed.tab.id).catch((err: unknown) =>
          fail(err, "error.tabRemember"),
        );
        focusDraft();
      });
    } catch (err) {
      setTabs(beforeTabs);
      setActiveTabId(beforeActive);
      setTodos(beforeTodos);
      fail(err, "error.tabClose");
    }
  }

  return (
    // A janela é transparent e sem decoração: este Card É a superfície visível
    // do app — dele saem os cantos, a borda e o fundo. `gap-0 py-0` zeram o
    // espaçamento padrão do Card, que é largo demais para 360x480.
    <Card className="h-full gap-0 overflow-hidden rounded-xl border border-border py-0 shadow-lg">
      <header
        data-tauri-drag-region
        onMouseDown={startDrag}
        className="flex h-10 shrink-0 items-center gap-2 px-3"
      >
        <span
          data-tauri-drag-region
          className="text-body font-semibold tracking-tight"
        >
          Mini To-Do
        </span>
        <span
          data-tauri-drag-region
          aria-label={t("pending.count", { n: pending })}
          className="rounded-full bg-muted px-1.5 py-0.5 text-micro leading-none tabular-nums text-muted-foreground"
        >
          {pending}
        </span>
        {/* Todo o espaço livre daqui até o botão é área de arrasto. */}
        <div data-tauri-drag-region className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("window.close")}
          // A dica vive aqui porque é aqui que ela importa: a pessoa está
          // prestes a esconder a janela e precisa saber como trazê-la de volta.
          // O `aria-label` continua descrevendo só a ação.
          title={t("window.closeHint", { shortcut: TOGGLE_SHORTCUT })}
          onClick={() =>
            void hideWindow().catch((err: unknown) => fail(err, "error.hide"))
          }
        >
          <X />
        </Button>
      </header>

      <TabStrip
        tabs={tabs}
        activeTabId={activeTabId}
        editingTabId={editingTab}
        onSelect={handleSelectTab}
        onCreate={() => void handleCreateTab()}
        onClose={(id) => void handleCloseTab(id)}
        onStartEdit={setEditingTabId}
        onCancelEdit={handleCancelTabEdit}
        onRename={(id, name) => void handleRenameTab(id, name)}
      />

      {/* `py-2` e não só `pb-2`: o campo ganha banda própria, com 8px de ar em
          cima e embaixo. A barra de título e a faixa de abas ficam coladas de
          propósito — as duas dizem "onde estou" — e este respiro é o que separa
          o cromo da AÇÃO. Antes eram 3px entre o chip e o campo, e como os dois
          desenham anel de foco 2px para fora, os anéis chegavam a se sobrepor. */}
      <div className="shrink-0 px-3 py-2">
        <Input
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          placeholder={t("task.placeholder")}
          aria-label={t("task.new")}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          className="h-8 text-body"
        />
      </div>

      {notice !== null && (
        <div className="shrink-0 px-3 pb-2">
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={[
              "flex items-start gap-1 rounded-md px-2 py-1 text-xs",
              notice.kind === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            {/* Adendo 3 aceita que o erro deixe de ser copiável, desde que o
                texto continue inteiro no `title` — que é também o que salva a
                mensagem cortada pelo `line-clamp`. */}
            <p
              title={
                notice.kind === "error" && notice.detail !== ""
                  ? `${notice.text}\n\n${notice.detail}`
                  : notice.text
              }
              className="min-w-0 flex-1 wrap-anywhere line-clamp-3"
            >
              {notice.text}
            </p>
            {notice.kind === "undo" && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={undoing}
                onClick={() => void handleUndo(notice.run)}
                className="-my-0.5 shrink-0 text-xs"
              >
                {t("notice.undo")}
              </Button>
            )}
            <button
              type="button"
              aria-label={t("notice.dismiss")}
              onClick={() => setNotice(null)}
              // Este botão é escrito à mão (não é o `Button`), e por isso tinha
              // ficado sem anel de foco: opacidade sozinha não diz onde o foco
              // está. Mesmo alvo de 24px dos outros ícones.
              className="-my-0.5 -mr-1 flex size-6 shrink-0 items-center justify-center rounded opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div ref={listBoxRef} className="px-2 py-1.5">
          {loading ? (
            <p
              role="status"
              className="px-2 py-6 text-center text-xs text-muted-foreground"
            >
              {t("list.loading")}
            </p>
          ) : todos.length === 0 ? (
            // A lista vazia é o único lugar com espaço de sobra na janela: o bloco
            // aparece aqui e some assim que houver uma tarefa, sem custar altura
            // permanente. Quem escolhe entre os dois estados vazios é o
            // componente — ver `EmptyList`.
            <EmptyList firstRun={firstRun} />
          ) : (
            <ul ref={listRef} className="flex flex-col gap-0.5">
              {visible.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  pending={todo.id.startsWith(OPTIMISTIC_PREFIX)}
                  editing={editing === todo.id}
                  // Sem wrappers inline: uma arrow nova por render mudaria as
                  // props de todas as linhas e anularia o `memo` do TodoRow. A
                  // Promise que os handlers devolvem é descartada como o `void`
                  // descartava — os erros já são tratados dentro deles.
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onStartEdit={setEditingId}
                  onCancelEdit={handleCancelEdit}
                  onRename={handleRename}
                />
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <footer
        data-tauri-drag-region
        onMouseDown={startDrag}
        className="flex shrink-0 items-center justify-between gap-2 px-3 py-2"
      >
        {/* "0 pendentes" é a leitura mais fria possível de uma coisa boa. Mesma
            frase do tooltip do tray, para o app falar uma língua só. */}
        <span
          data-tauri-drag-region
          className="text-xs tabular-nums text-muted-foreground"
        >
          {allDone ? t("footer.allDone") : t("pending.count", { n: pending })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void handleClearCompleted()}
          disabled={completed === 0}
          className="text-xs"
        >
          {t("footer.clearCompleted")}
        </Button>
      </footer>
    </Card>
  );
}

export default App;
