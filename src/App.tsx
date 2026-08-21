import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EmptyList } from "@/components/EmptyList";
import { ShortcutSettings } from "@/components/ShortcutSettings";
import { TabStrip } from "@/components/TabStrip";
import { TodoRow } from "@/components/TodoRow";
import { useFlipRows } from "@/hooks/use-flip-rows";
import { t, type MessageKey } from "@/lib/i18n";
import { hasAddedTask, markTaskAdded } from "@/lib/onboarding";
import { DEFAULT_SHORTCUT_LABEL } from "@/lib/shortcut";
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
  getShortcut,
  getStartupRescue,
  hasModKey,
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
  TAB_SHORTCUT_LIMIT,
  TITLE_MAX_LENGTH,
  toggleTodo,
  type ClosedTab,
  type GlobalShortcut,
  type Tab,
  type Todo,
} from "@/lib/todos";

/** Uma linha só existe no backend depois que `add_todo` responde. */
const OPTIMISTIC_PREFIX = "optimistic-";

/** Erro e oferta de desfazer somem sozinhos no mesmo tempo. */
const NOTICE_TIMEOUT_MS = 6000;

/**
 * Quanto uma carga pode demorar antes de a lista admitir que está carregando.
 *
 * Ler a lista de uma aba é uma leitura de memória do outro lado do IPC: ela chega
 * em milissegundos, e o "Carregando…" aparecia e saía no mesmo piscar a CADA troca
 * de aba. Um aviso que ninguém consegue ler não informa nada — ele só faz a área
 * da lista tremer no caminho mais frequente depois do de acrescentar, que é
 * exatamente o que o DESIGN.md chama de latência com outro nome.
 *
 * Abaixo deste tempo a área fica em branco, e branco por 140ms se lê como
 * instantâneo. Acima, o texto aparece — porque aí há uma espera de verdade, e uma
 * espera sem explicação é pior que o tremor.
 */
const LOADING_DELAY_MS = 140;

/**
 * A partir de quantos caracteres restantes o campo passa a mostrar a conta.
 *
 * O `maxLength` do input trunca em silêncio: colar um parágrafo de 400 caracteres
 * punha 200 na tela sem nenhum sinal de que metade tinha ficado de fora. O contador
 * só existe nos últimos 20 — antes disso ele seria mobília, e a Regra do Custo de
 * Altura não deixa mobília ocupar o campo mais usado do app.
 */
const DRAFT_COUNTER_AT = 20;

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
  | {
      kind: "error";
      id: string;
      text: string;
      detail: string;
      /**
       * O aviso não se dispensa sozinho, e espera o `×`.
       *
       * Exceção de um caso só: o app abriu com uma lista vazia porque não entendeu
       * o arquivo em disco. Todo outro aviso daqui fala de um gesto que a pessoa
       * acabou de fazer e cujo desfecho ela está vendo; este fala de uma coisa que
       * aconteceu antes de a janela existir, e diz onde a lista antiga foi
       * guardada. Seis segundos para um aviso que ninguém estava esperando é a
       * mesma coisa que não avisar.
       */
      sticky?: boolean;
    }
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
  /**
   * O último aviso que a faixa mostrou — inclusive depois de `notice` virar
   * null.
   *
   * A faixa é a única coisa que muda o layout da janela SOZINHA: ela aparece
   * tirando ~28px de altura da lista e, seis segundos depois, devolve os 28px
   * sem ninguém ter tocado em nada. Por isso ela cresce e encolhe em vez de
   * piscar — e para poder encolher, o texto tem que continuar montado enquanto
   * ela encolhe. `notice` diz se está aberta; isto diz o que ela mostra.
   */
  const [shownNotice, setShownNotice] = useState<Notice | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [loading, setLoading] = useState(true);
  /**
   * Se a carga em curso já passou de `LOADING_DELAY_MS` e merece dizer que está
   * carregando. Separado de `loading` de propósito: quem decide se há uma carga é
   * o IPC, e quem decide se ela é longa o bastante para virar texto na tela é o
   * relógio.
   */
  const [loadingVisible, setLoadingVisible] = useState(false);
  /**
   * Se a janela está na frente. Governa só uma coisa: o relógio de 6 segundos do
   * aviso. Ele corria com a janela escondida, então apagar uma tarefa e apertar
   * `⌃⌥T` gastava a janela inteira de desfazer com ninguém olhando — o gesto de
   * volta existia e expirava fora da vista.
   */
  const [windowFocused, setWindowFocused] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  /**
   * Se esta pessoa ainda não acrescentou nenhuma tarefa nesta máquina. Governa
   * qual dos dois estados vazios a lista mostra e se a faixa de boas-vindas
   * ainda tem uma aparição pela frente. Lido uma vez, na montagem: o valor muda
   * por gesto do usuário, nunca por conta própria.
   */
  const [firstRun, setFirstRun] = useState(() => !hasAddedTask());
  /**
   * O atalho global como ele está agora (Adendo 9). `null` só existe entre a
   * montagem e a resposta da carga inicial — e a lista está em "Carregando…" nesse
   * intervalo, então nenhuma das três frases que ensinam a via de volta chega à tela
   * antes de saber qual é a tecla.
   */
  const [shortcut, setShortcut] = useState<GlobalShortcut | null>(null);
  /**
   * Se o painel do atalho está ocupando a área da lista.
   *
   * Não é uma camada por cima: o app não tem modal nem popover, e a área da lista é
   * o único lugar com espaço para uma segunda vista sem gastar altura permanente
   * (Regra do Custo de Altura). Enquanto ele está aberto, a lista não está na tela —
   * e é por isso que as teclas de aba ficam desligadas ali embaixo.
   */
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  /**
   * A aba que está na tela AGORA, legível de dentro de um `await`.
   *
   * O selo acima protege as cargas; as mutações estavam sem nada equivalente, e
   * toda uma classe de defeito saía disso: `clear_completed` grava em disco, o
   * usuário clica noutra aba enquanto isso, a resposta chega e o `setTodos` punha
   * as tarefas da aba anterior na lista da aba nova. **Sem erro nenhum, no caminho
   * de sucesso.** Os rollbacks tinham a mesma falha, com um agravante: mostravam a
   * lista de outra aba justamente no momento em que o app promete que nada se
   * perdeu.
   *
   * Escrito no render, e não num efeito: um efeito só roda depois do commit, e a
   * continuação de uma Promise pode chegar antes dele. Aqui o valor é o do render
   * corrente sempre.
   */
  const activeTabRef = useRef<string | null>(null);
  activeTabRef.current = activeTabId;
  /**
   * O aviso que está na faixa, legível de dentro de um `await`. Serve a uma coisa
   * só: saber se o desfazer que está na tela ainda é o do lote de remoções em
   * curso — ver `handleDelete`.
   */
  const noticeRef = useRef<Notice | null>(null);
  /**
   * O rótulo do atalho, legível de dentro de `fail` sem entrar nas dependências
   * dele.
   *
   * `fail` é `useCallback([])` e é dependência de quase todo efeito do app,
   * inclusive da carga inicial. Se ele trocasse de identidade quando o atalho
   * chegasse do backend, a carga inicial rodaria **duas vezes** — o que é caro no
   * caminho mais crítico do app por causa de um texto de mensagem de erro.
   *
   * Escrito no render, como `activeTabRef`: a continuação de uma Promise pode chegar
   * antes de um efeito rodar.
   */
  const shortcutRef = useRef(DEFAULT_SHORTCUT_LABEL);
  /**
   * O painel aberto, legível de dentro do listener de foco de janela — que é
   * assinado uma vez e não pode reassinar a cada abertura do painel.
   */
  const settingsRef = useRef(false);
  settingsRef.current = settingsOpen;
  /**
   * As tarefas que o desfazer atual repõe, e o aviso a que ele pertence.
   *
   * **A faixa é uma só, e remoções são o gesto destrutivo que se repete.** Apagar
   * duas tarefas seguidas trocava o aviso da primeira pelo da segunda, e o
   * desfazer da primeira morria em silêncio — o usuário tinha o gesto de volta
   * oferecido e tirado sem ter feito nada. Juntando as remoções da mesma aba num
   * lote enquanto o aviso segue na tela, o desfazer repõe as duas: `restore_todos`
   * já recebe um array, e o tudo-ou-nada dele vale igual para uma ou para cinco.
   */
  const removedBatch = useRef<{
    tabId: string;
    items: Todo[];
    noticeId: string;
  } | null>(null);
  /**
   * A tarefa que precisa estar visível no próximo quadro.
   *
   * O viewport da lista cabe oito linhas. Com mais que isso, a tarefa nova nascia
   * abaixo da dobra e o Enter — o gesto mais frequente do app — ficava **sem
   * nenhuma confirmação na tela**: só o contador mudava, num canto que ninguém
   * está olhando enquanto digita.
   */
  const revealRef = useRef<string | null>(null);

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

  // Ajuste de estado durante o render, e não num efeito: o efeito só rodaria
  // DEPOIS de a faixa já ter sido pintada aberta e com o texto dentro, e a
  // altura pularia de 0 para 28px sem transição nenhuma. Aqui o React repete o
  // render antes de tocar no DOM, então o navegador vê `0fr → 1fr` com o
  // conteúdo já no lugar, que é exatamente o que ele sabe interpolar. Todo aviso
  // nasce com `id` novo, então a comparação por identidade nunca dá falso.
  if (notice !== null && notice !== shownNotice) setShownNotice(notice);
  noticeRef.current = notice;
  /**
   * A combinação escrita para os olhos. Vem do backend, que também escreve o rótulo
   * do menu do tray: duas escritas do mesmo dado divergiriam no primeiro atalho que
   * não fosse o padrão. Até a resposta chegar, é o padrão — ver
   * `DEFAULT_SHORTCUT_LABEL`.
   */
  const shortcutLabel = shortcut?.label ?? DEFAULT_SHORTCUT_LABEL;
  shortcutRef.current = shortcutLabel;

  const carryOver = useFlipRows(
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
      text: t(key, { shortcut: shortcutRef.current }),
      detail: errorDetail(err),
    });
  }, []);

  /**
   * Devolve o `id` do aviso que criou. Quem precisa dele é o lote de remoções: ele
   * só junta a próxima tarefa se o desfazer na tela ainda for o dele.
   */
  const offerUndo = useCallback((text: string, run: () => Promise<void>) => {
    const id = crypto.randomUUID();
    setUndoing(false);
    setNotice({ kind: "undo", id, text, run });
    return id;
  }, []);

  const focusDraft = useCallback(() => {
    draftRef.current?.focus();
  }, []);

  /**
   * Abre e fecha o painel do atalho — e, se a leitura da carga inicial tiver
   * falhado, tenta de novo aqui.
   *
   * Sem a segunda tentativa, uma falha de IPC na abertura deixaria a engrenagem
   * clicando **sem fazer nada** pelo resto da execução: o painel não tem como se
   * desenhar sem saber qual é a combinação atual. Botão que não responde é o defeito
   * que ninguém reporta como defeito.
   */
  const handleToggleSettings = useCallback(() => {
    setSettingsOpen((aberto) => !aberto);
    if (shortcut !== null) return;
    void getShortcut()
      .then(setShortcut)
      .catch((err: unknown) => {
        setSettingsOpen(false);
        fail(err, "error.shortcutRead");
      });
  }, [shortcut, fail]);

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
        const [list, saved, rescue, combinacao] = await Promise.all([
          listTabs(),
          getActiveTab(),
          getStartupRescue(),
          // Junto das abas de propósito, e não num efeito próprio: as frases que
          // ensinam a via de volta aparecem com a lista, e uma que aparecesse antes
          // do atalho mostraria a tecla certa só no segundo quadro.
          //
          // **`catch` local, e não no `Promise.all`:** o atalho é a menos importante
          // das quatro leituras, e uma falha nele não pode derrubar as três que
          // trazem a lista do usuário para a tela. Sem isto, um erro aqui viraria
          // "não foi possível carregar suas tarefas" com as tarefas intactas no
          // disco. O painel tem a segunda chance dele em `handleToggleSettings`.
          getShortcut().catch(() => null),
        ]);
        if (!alive) return;
        if (combinacao !== null) setShortcut(combinacao);
        // **Antes de qualquer outra coisa na faixa.** Se o backend não entendeu o
        // arquivo, o app está abrindo com uma lista vazia que não é a do usuário —
        // e uma lista vazia calada é indistinguível de tudo perdido, que é
        // exatamente o que o Princípio 5 do produto proíbe. O caminho do arquivo
        // guardado vai no `detail`, que a faixa põe no `title`.
        if (rescue !== null && rescue !== "") {
          setNotice({
            kind: "error",
            id: crypto.randomUUID(),
            text: t("error.rescued"),
            detail: rescue,
            sticky: true,
          });
        }
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
        // O relógio do aviso conta só com a janela na frente — ver o efeito de
        // auto-dispensa. Fora do `if` abaixo de propósito: perder o foco também é
        // informação, e é justamente ela que pausa a contagem.
        setWindowFocused(focused);
        if (!focused) return;
        // Edição inline em curso tem posse do foco — de tarefa ou de aba:
        // roubá-lo aqui fecharia o editor pelo blur, salvando no meio da
        // digitação.
        if (editingRef.current) return;
        // O painel do atalho tem a mesma posse: o capturador de teclas perde a
        // captura no `blur`, e mandar o cursor para o campo de nova tarefa ao voltar
        // o foco cancelaria a combinação que a pessoa estava apertando.
        if (settingsRef.current) return;
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

  // Auto-dispensa do aviso, com duas condições que não estavam aqui.
  //
  // **`sticky` não conta o tempo.** O aviso de arquivo ilegível fala de algo que
  // aconteceu antes de a janela existir; ele espera o `×`.
  //
  // **A contagem só corre com a janela na frente.** O ciclo do app é esconder e
  // voltar dezenas de vezes por dia, e os 6 segundos rodavam com a janela
  // escondida: apagar uma tarefa e apertar `⌃⌥T` gastava a janela inteira de
  // desfazer sem ninguém olhando. Voltar ao foco reinicia a contagem, e é o
  // desfecho certo — o aviso ainda não foi lido.
  useEffect(() => {
    if (notice === null || (notice.kind === "error" && notice.sticky)) return;
    if (!windowFocused) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [notice, windowFocused]);

  // "Carregando…" só entra em cena se a carga durar. Ver `LOADING_DELAY_MS`.
  useEffect(() => {
    if (!loading) {
      setLoadingVisible(false);
      return;
    }
    const timer = setTimeout(() => setLoadingVisible(true), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  /**
   * Traz à vista a tarefa que acabou de entrar.
   *
   * Efeito de LAYOUT, e não efeito comum: ele roda antes da pintura, então a linha
   * nova nunca é vista fora da vista — não há um quadro em que a lista pareça não
   * ter mudado. `block: "nearest"` é o mínimo necessário: uma linha que já está
   * visível não move a rolagem nenhum pixel.
   *
   * Sem `behavior: "smooth"` de propósito. O DESIGN.md reserva movimento para o
   * que se mexe sozinho, e uma rolagem animada no caminho de acrescentar seria
   * exatamente a latência com outro nome que a Regra do Movimento que se Paga
   * proíbe. A linha ainda CHEGA (a animação `arrive`); o que é seco é a rolagem.
   */
  useLayoutEffect(() => {
    const id = revealRef.current;
    if (id === null) return;
    revealRef.current = null;
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-todo-id="${CSS.escape(id)}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [visible]);

  // Escape em camadas. A janela não tem decoração de OS, então Escape é o único
  // caminho de teclado para fora dela — mas escondê-la com texto por enviar
  // perderia o que foi digitado, que é o pior desfecho possível aqui.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Há edição inline aberta: quem trata o Escape é o campo, e só ele.
      if (editing !== null || editingTab !== null) return;
      // O painel do atalho é a camada de fora: com ele aberto, o Escape fecha o
      // painel e não a janela. Esconder a janela por baixo de um painel aberto
      // devolveria a pessoa, no próximo atalho, a uma tela de configuração que ela
      // já tinha terminado.
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
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
  }, [editing, editingTab, draft, fail, settingsOpen]);

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
    const tabId = activeTabId;

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
      tab_id: tabId,
    };
    // A linha nasce abaixo da dobra numa lista longa; o efeito de layout logo
    // abaixo a traz à vista no mesmo quadro em que ela aparece.
    revealRef.current = optimistic.id;
    setTodos((prev) => [...prev, optimistic]);

    try {
      const created = await addTodo(title, activeTabId);
      // A resposta chegou e a tela já é de outra aba: a tarefa está gravada na aba
      // certa, e é lá que ela vai aparecer. Escrever aqui poria uma linha da aba
      // anterior na lista da aba atual.
      if (activeTabRef.current !== tabId) return;
      // A linha já está na tela e já chegou; o que muda agora é só o id dela.
      // Sem passar a posição adiante, o FLIP veria a otimista sumir e uma linha
      // nova nascer, e a chegada tocaria DUAS vezes em poucos milissegundos —
      // no gesto mais frequente do app. Antes do `setTodos` de propósito: é
      // escrita síncrona em ref, e o efeito de layout deste render precisa ler
      // o mapa já corrigido.
      carryOver(optimistic.id, created.id);
      revealRef.current = created.id;
      setTodos((prev) => {
        // **A linha otimista pode ter sido varrida por uma carga.** Digitar e dar
        // Enter enquanto um `list_todos` está em voo — na abertura do app, ou logo
        // depois de trocar de aba — faz a resposta da carga sobrescrever a lista, e
        // com ela a linha que estava na tela. O `map` então não achava id nenhum,
        // não repunha nada, e a tarefa ficava **gravada no disco e invisível** até
        // sair e voltar da aba: o usuário viu a tarefa aparecer e desaparecer.
        //
        // Cobrir o caso é uma checagem: se nem a otimista nem a definitiva estão
        // na lista, a definitiva entra. (Ela pode já estar ali se a carga chegou
        // DEPOIS da gravação e trouxe a tarefa nova junto.)
        if (prev.some((item) => item.id === created.id)) return prev;
        const trocada = prev.some((item) => item.id === optimistic.id);
        const proxima = trocada
          ? prev.map((item) => (item.id === optimistic.id ? created : item))
          : [...prev, created];
        return [...proxima].sort(byCreatedAt);
      });
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
              text: t("onboarding.roundTrip", { shortcut: shortcutLabel }),
            },
        );
      }
    } catch (err) {
      // A linha otimista sai de onde ela estiver — mesmo se a tela já for de outra
      // aba, porque ela pertence a esta e não pode ficar pendurada em lugar nenhum.
      setTodos((prev) => prev.filter((item) => item.id !== optimistic.id));
      // O texto só volta ao campo se ele ainda for o campo da mesma aba: devolver
      // numa aba diferente ofereceria a tarefa recusada para o lugar errado.
      if (activeTabRef.current === tabId) {
        setDraft(title); // devolve o texto para não perder o que foi digitado
      }
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
      const tabId = activeTabId;
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
        // `before` é a lista DESTA aba. Repô-la depois de o usuário ter trocado de
        // aba encheria a tela da outra com tarefas que não são dela — e faria isso
        // no caminho de erro, que é justamente onde o app promete que a tela
        // continua contando a verdade.
        if (activeTabRef.current === tabId) setTodos(before);
        fail(err, "error.toggle");
      }
    },
    [todos, activeTabId, fail],
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
        if (!removed) return;

        // **Remoções seguidas viram um desfazer só.** O lote anterior continua
        // valendo se for da mesma aba E se o aviso dele ainda estiver na faixa —
        // as duas condições, porque um aviso que já saiu (por tempo, por `×`, por
        // outro gesto) não é mais uma oferta que o usuário possa contar. Sem isto,
        // a segunda remoção substituía o aviso da primeira e o desfazer dela
        // desaparecia sem nenhum sinal.
        const anterior = removedBatch.current;
        const atual = noticeRef.current;
        const continua =
          anterior !== null &&
          anterior.tabId === tabId &&
          atual !== null &&
          atual.kind === "undo" &&
          atual.id === anterior.noticeId;
        const items = continua ? [...anterior.items, removed] : [removed];
        const noticeId = offerUndo(
          t("undo.tasksRemoved", { n: items.length }),
          // O lote inteiro numa chamada: `restore_todos` é tudo-ou-nada, então as
          // duas voltam juntas ou nenhuma volta — que é o desfecho certo para um
          // desfazer de um clique só.
          async () => {
            applyRestored(await restoreTodos(items), tabId);
          },
        );
        removedBatch.current = { tabId, items, noticeId };
      } catch (err) {
        if (activeTabRef.current === tabId) setTodos(before);
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
      const tabId = activeTabId;
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title } : item)),
      );
      try {
        // `rename_todo` não mexe em `created_at` nem em `done`, então a ordem da
        // lista não muda — só o texto.
        const updated = await renameTodo(id, title);
        setTodos((prev) => prev.map((item) => (item.id === id ? updated : item)));
      } catch (err) {
        if (activeTabRef.current === tabId) setTodos(before);
        fail(err, "error.rename");
      }
    },
    [todos, activeTabId, fail],
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
      // **A gravação em disco dá tempo de o usuário trocar de aba.** Sem esta
      // guarda, `remaining` — que é a lista da aba ANTERIOR — era escrita na tela
      // da aba nova, e no caminho de sucesso, sem erro nenhum a que culpar.
      if (activeTabRef.current === tabId) {
        setTodos([...remaining].sort(byCreatedAt));
      }
      if (removed.length > 0) {
        offerUndo(t("undo.completedRemoved", { n: removed.length }), async () => {
          applyRestored(await restoreTodos(removed), tabId);
        });
      }
    } catch (err) {
      if (activeTabRef.current === tabId) setTodos(before);
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

  /**
   * Põe o foco no checkbox da n-ésima linha da lista, presa aos limites dela.
   * Devolve se conseguiu — quem chama usa isso para decidir se engole a tecla.
   *
   * O checkbox, e não a linha: ele já é uma parada de tabulação, já responde ao
   * espaço para alternar, e a `li` inteira teria que ganhar `tabindex` só para
   * receber um foco que ela não usa para nada.
   */
  const focusRowAt = useCallback((index: number): boolean => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-todo-id]");
    if (rows === undefined || rows.length === 0) return false;
    const alvo = rows[Math.min(Math.max(index, 0), rows.length - 1)];
    const box = alvo?.querySelector<HTMLElement>('[data-slot="checkbox"]');
    if (!box) return false;
    box.focus();
    return true;
  }, []);

  /**
   * Setas percorrem a lista.
   *
   * **Sem isto, alcançar a décima tarefa pelo teclado custava vinte Tab** — cada
   * linha tem duas paradas (o checkbox e o `×`), e o Tab passa por todas. Numa
   * janela cujo ciclo é `⌃⌥T → digitar → Enter → ⌃⌥T`, tirar a mão do teclado para
   * marcar uma tarefa é o atrito mais caro que sobrou.
   *
   * O Tab continua fazendo o que sempre fez: isto acrescenta um caminho, não troca
   * o padrão por um `tabindex` móvel que mudaria o comportamento de quem já usa o
   * app. `↑` na primeira linha sai da lista de volta para o campo, que é de onde
   * `↓` trouxe — o caminho é reversível inteiro.
   *
   * Delegado na `ul` e não no `TodoRow`: uma prop nova em cada linha custaria o
   * `memo` que existe para as teclas digitadas no campo não re-renderizarem a
   * lista.
   */
  const handleListKeys = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const target = e.target as HTMLElement | null;
      // Edição inline aberta: as setas são do cursor dentro do campo.
      if (target?.closest("input, textarea")) return;
      const row = target?.closest<HTMLElement>("[data-todo-id]");
      if (!row) return;

      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[data-todo-id]") ?? [],
      );
      const atual = rows.indexOf(row);
      if (atual === -1) return;

      e.preventDefault();
      if (e.key === "ArrowUp" && atual === 0) {
        // O topo da lista devolve ao campo de nova tarefa, e não fica preso.
        focusDraft();
        return;
      }
      focusRowAt(atual + (e.key === "ArrowDown" ? 1 : -1));
    },
    [focusDraft, focusRowAt],
  );

  /**
   * As teclas de aba, com a janela em foco.
   *
   * Trocar de aba era, na prática, gesto de mouse: do campo de nova tarefa até o
   * primeiro chip são vários `⇧Tab`, passando pelo `+` e pelo `×` de cada aba no
   * caminho. O DESIGN.md manda dar caminho de teclado a todo gesto que existe no
   * mouse, e este não tinha.
   *
   * **As combinações são idiomas de navegador de propósito** — `{MOD}1..9`,
   * `{MOD}T`, `Ctrl+Tab` — porque esta faixa é a coisa mais parecida com abas de
   * navegador que existe na janela, e um atalho que já se sabe não precisa ser
   * ensinado (Princípio 3: nada exige aprendizado). Eles ficam descobríveis no
   * `title` do chip e do `+`, que já existiam por causa do truncamento.
   *
   * Não são atalhos globais: valem só com a janela em foco, então podem usar `⌘` —
   * a tecla que cada sistema reserva para comandos de aplicativo — sem cair na
   * proibição do Adendo 2, que fala de sequestrar teclas pelo sistema inteiro.
   *
   * **Nada roda com edição inline aberta.** Saltar de aba no meio de um nome sendo
   * digitado salvaria pelo blur e trocaria a tela no mesmo gesto.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editing !== null || editingTab !== null) return;
      // Com o painel do atalho aberto a faixa de abas continua na tela, mas a lista
      // não: `⌘T` criaria uma aba e `⌘1` trocaria de aba por baixo de um painel de
      // configuração — e as duas coisas enquanto a pessoa está dizendo qual
      // combinação quer. O painel também para a propagação enquanto captura; isto é
      // a outra metade, para os instantes em que ele está aberto e não capturando.
      if (settingsOpen) return;
      if (tabs.length === 0) return;

      // `Ctrl+Tab` antes do bloco do modificador: no Windows e no Linux `Ctrl` É o
      // modificador de comando, e sem esta ordem a mesma tecla cairia nos dois.
      if (e.key === "Tab" && e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const atual = tabs.findIndex((item) => item.id === activeTabId);
        const passo = e.shiftKey ? -1 : 1;
        // Circular: da última para a primeira. É o que qualquer faixa de abas faz,
        // e prender nas pontas obrigaria a contar quantas voltas faltam.
        const proxima = (atual + passo + tabs.length) % tabs.length;
        const alvo = tabs[proxima];
        if (alvo !== undefined && alvo.id !== activeTabId) handleSelectTab(alvo.id);
        return;
      }

      // `!altKey` não é zelo: se o registro do atalho global falhar, `⌃⌥T` chega
      // aqui como um evento normal, e no Windows ele passaria por "modificador de
      // comando + T" — criando uma aba a cada tentativa de mostrar a janela.
      if (!hasModKey(e) || e.altKey) return;

      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        void handleCreateTab();
        return;
      }

      // `1`–`9`: salto direto. Da décima aba em diante o caminho é `Ctrl+Tab`, e é
      // por isso que só as nove primeiras anunciam a tecla no `title` do chip.
      if (e.key >= "1" && e.key <= "9") {
        const posicao = Number(e.key);
        if (posicao > TAB_SHORTCUT_LIMIT) return;
        const alvo = tabs[posicao - 1];
        if (alvo === undefined) return;
        e.preventDefault();
        handleSelectTab(alvo.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `handleSelectTab` e `handleCreateTab` são funções do render e mudam de
    // identidade a cada tecla digitada no campo; reassinar por isso seria trabalho
    // por caractere. Elas são estáveis no comportamento e leem o estado que o
    // efeito já traz nas dependências abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId, editing, editingTab, settingsOpen]);

  /** Quantos caracteres ainda cabem no campo. Ver `DRAFT_COUNTER_AT`. */
  const draftLeft = TITLE_MAX_LENGTH - draft.length;

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
          NoCom
        </span>
        {/* `aria-hidden`, e não um `aria-label` num `span`: a ARIA não permite nome
            acessível em elemento genérico, e o que várias tecnologias assistivas
            faziam com isto era ler "3", sem unidade nenhuma. O número é a leitura
            RÁPIDA, para o olho; a leitura por extenso e anunciada é a do rodapé,
            que diz a mesma coisa em palavras e agora é região viva. Um estado, uma
            voz. */}
        <span
          data-tauri-drag-region
          aria-hidden="true"
          className="rounded-full bg-muted px-1.5 py-0.5 text-micro leading-none tabular-nums text-muted-foreground"
        >
          {pending}
        </span>
        {/* Todo o espaço livre daqui até os botões é área de arrasto. */}
        <div data-tauri-drag-region className="flex-1" />
        {/* **O único controle de configuração do app**, e ele existe por um motivo
            só: um atalho global disputa teclas com o sistema inteiro do usuário, e
            quem sabe o que já está ocupado na máquina dele é ele (Adendo 9). Fica no
            cabeçalho, ao lado do botão de esconder, porque é o mesmo assunto — as
            duas teclas que fazem a janela ir e voltar.

            `aria-expanded` porque ele é um alternador de vista, e não um botão que
            leva para outro lugar: o leitor de tela precisa dizer se o painel está
            aberto. O `ghost` do `Button` já pinta `muted` nesse estado. */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("shortcut.open")}
          aria-expanded={settingsOpen}
          title={t("shortcut.open")}
          onClick={handleToggleSettings}
        >
          <Settings />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          // "Esconder janela", e não "Fechar": era o único botão permanente da
          // interface, e para quem usa leitor de tela ele prometia encerrar um app
          // que na verdade só desaparece — numa janela sem decoração e fora da
          // barra de tarefas, "fechei e não sei voltar" é o pior desfecho que
          // existe aqui. O `title` abaixo continua ensinando a via de volta.
          aria-label={t("window.hide")}
          // A dica vive aqui porque é aqui que ela importa: a pessoa está
          // prestes a esconder a janela e precisa saber como trazê-la de volta.
          // O `aria-label` continua descrevendo só a ação.
          title={t("window.closeHint", { shortcut: shortcutLabel })}
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
      <div className="relative shrink-0 px-3 py-2">
        <Input
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
              return;
            }
            // `↓` entra na lista. É a metade de cima do caminho de teclado que
            // `handleListKeys` completa: digitar, Enter, `↓`, espaço — o ciclo do
            // app inteiro sem sair do teclado. Num campo de uma linha a seta não
            // tinha o que fazer com o cursor, então nada é tirado de ninguém.
            if (e.key === "ArrowDown" && focusRowAt(0)) e.preventDefault();
          }}
          placeholder={t("task.placeholder")}
          aria-label={t("task.new")}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          className={[
            "h-8 text-body",
            // O recuo à direita só existe quando o contador existe: fora dos
            // últimos 20 caracteres o campo é o de sempre.
            draftLeft <= DRAFT_COUNTER_AT ? "pr-8" : "",
          ].join(" ")}
        />
        {/* **O `maxLength` truncava em silêncio.** Colar um parágrafo punha 200
            caracteres no campo e jogava o resto fora sem nenhum sinal — o usuário
            só descobria lendo a tarefa depois. O contador aparece nos últimos 20 e
            chega a zero exatamente quando o campo para de aceitar, que é a única
            coisa que precisava ser dita.

            `aria-hidden`: o `maxLength` do input já é anunciado por leitor de tela,
            e um número solto ao lado do campo seria a mesma informação dita duas
            vezes, uma delas sem unidade. `pointer-events-none` para o contador não
            roubar o clique que põe o cursor no fim do texto. */}
        {draftLeft <= DRAFT_COUNTER_AT && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-micro tabular-nums text-muted-foreground"
          >
            {draftLeft}
          </span>
        )}
      </div>

      {/* A faixa está SEMPRE montada, mesmo antes do primeiro aviso, e é isso
          que faz a altura poder ser animada: um elemento que nasce já aberto
          nasce sem transição. Fechada, ela mede exatamente 0 — o `px-3 pb-2` foi
          para dentro do `overflow-hidden`, senão o recuo sobreviveria ao colapso
          e a lista ficaria com 8px de sobra permanentes, que é a altura que a
          Regra do Custo de Altura não deixa ninguém gastar à toa.

          `grid-rows-[0fr] → [1fr]` e não uma altura fixa: a mensagem de erro vai
          de uma a três linhas (`line-clamp-3`), então a altura de destino só o
          navegador sabe.

          `inert` fechada: o conteúdo continua no DOM para poder encolher, e sem
          isto o botão de desfazer de um aviso que já saiu da tela continuaria na
          ordem de tabulação e na árvore de acessibilidade. */}
      <div
        data-open={notice !== null ? "true" : undefined}
        inert={notice === null}
        className={[
          "grid shrink-0 grid-rows-[0fr] opacity-0 ease-settle",
          // 200ms para entrar, 150ms para sair: a duração é sempre a do estado
          // para o qual se vai, e sair mais rápido do que entrar é o que faz a
          // saída não parecer hesitação.
          "transition-[grid-template-rows,opacity] duration-150",
          "data-open:grid-rows-[1fr] data-open:opacity-100 data-open:duration-200",
          // `prefers-reduced-motion`: a altura passa a trocar seca e só a
          // opacidade atravessa. O deslocamento da lista é o que incomoda; o
          // aviso de que algo apareceu continua sendo informação.
          "motion-reduce:transition-opacity",
        ].join(" ")}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-3 pb-2">
            {shownNotice !== null && (
              <div
                // `key` no id: um aviso novo remonta a região viva, e é o
                // remonte que faz o leitor de tela anunciar de novo mesmo quando
                // o texto é idêntico ao do aviso anterior.
                key={shownNotice.id}
                role={shownNotice.kind === "error" ? "alert" : "status"}
                className={[
                  "flex items-start gap-1 rounded-md px-2 py-1 text-xs",
                  shownNotice.kind === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {/* Adendo 3 aceita que o erro deixe de ser copiável, desde que o
                    texto continue inteiro no `title` — que é também o que salva a
                    mensagem cortada pelo `line-clamp`. */}
                <p
                  title={
                    shownNotice.kind === "error" && shownNotice.detail !== ""
                      ? `${shownNotice.text}\n\n${shownNotice.detail}`
                      : shownNotice.text
                  }
                  className="min-w-0 flex-1 wrap-anywhere line-clamp-3"
                >
                  {shownNotice.text}
                </p>
                {shownNotice.kind === "undo" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={undoing}
                    onClick={() => void handleUndo(shownNotice.run)}
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
            )}
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div ref={listBoxRef} className="px-2 py-1.5">
          {settingsOpen && shortcut === null ? (
            // Aberto antes de a combinação chegar (a leitura da carga inicial falhou
            // e está sendo refeita): desenhar o painel sem saber qual é a tecla atual
            // mostraria um campo vazio no lugar dela.
            <p
              role="status"
              className="px-2 py-6 text-center text-xs text-muted-foreground"
            >
              {t("list.loading")}
            </p>
          ) : settingsOpen && shortcut !== null ? (
            // O painel ocupa o lugar da lista, como os estados vazios.
            <ShortcutSettings
              shortcut={shortcut}
              onChange={setShortcut}
              onClose={() => {
                setSettingsOpen(false);
                // O cursor volta para o campo: fechar o painel é voltar ao ciclo do
                // app (digitar, Enter), e cobrar um clique no caminho seria o mesmo
                // atrito que o `onFocusChanged` existe para tirar.
                focusDraft();
              }}
            />
          ) : loading ? (
            // Carga curta não diz nada: a área fica em branco por 140ms, que se lê
            // como instantâneo, e o texto só entra se houver espera de verdade. Ver
            // `LOADING_DELAY_MS`. O estado vazio NÃO serve de espera — ele diria
            // "Nada por aqui" sobre uma lista que está a caminho.
            loadingVisible && (
              <p
                role="status"
                className="px-2 py-6 text-center text-xs text-muted-foreground"
              >
                {t("list.loading")}
              </p>
            )
          ) : todos.length === 0 ? (
            // A lista vazia é o único lugar com espaço de sobra na janela: o bloco
            // aparece aqui e some assim que houver uma tarefa, sem custar altura
            // permanente. Quem escolhe entre os dois estados vazios é o
            // componente — ver `EmptyList`.
            <EmptyList firstRun={firstRun} shortcut={shortcutLabel} />
          ) : (
            <ul
              ref={listRef}
              onKeyDown={handleListKeys}
              className="flex flex-col gap-0.5"
            >
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
        {/* Região viva, e é a única do app que fala do ESTADO da lista em vez de
            um aviso passageiro. Marcar, acrescentar e limpar não têm confirmação
            sonora nenhuma; aqui elas ganham uma, na frase por extenso que o app já
            mostrava. `polite` para não cortar o que estiver sendo lido. */}
        <span
          data-tauri-drag-region
          role="status"
          aria-live="polite"
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
