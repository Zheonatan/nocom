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
import { useToday } from "@/hooks/use-today";
import { soleDate } from "@/lib/dates";
import { t, type MessageKey } from "@/lib/i18n";
import { hasAddedTask, markTaskAdded } from "@/lib/onboarding";
import { dueIds } from "@/lib/recurrence";
import { remindAt, sameDate, stillAhead } from "@/lib/reminders";
import { DEFAULT_SHORTCUT_LABEL } from "@/lib/shortcut";
import {
  addTodo,
  byCreatedAt,
  byDisplayOrder,
  clampLength,
  clearCompleted,
  closeTab,
  createTab,
  dateDayFirst,
  deleteTodo,
  errorDetail,
  getActiveTab,
  getShortcut,
  getStartupRescue,
  hasModKey,
  hideWindow,
  isLinux,
  lengthOf,
  listPendingCounts,
  listRecurring,
  listTabs,
  listTodos,
  moveTodo,
  neighbourTabId,
  nextTabName,
  renameTab,
  renameTodo,
  restoreTab,
  restoreTodos,
  reviveTodos,
  setActiveTab,
  setRepeat,
  setReminder,
  TAB_SHORTCUT_LIMIT,
  TITLE_MAX_LENGTH,
  toggleTodo,
  TRAY_PLACE,
  UNDO_SHORTCUT,
  type ClosedTab,
  type GlobalShortcut,
  type Reminder,
  type Repeat,
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

/**
 * O conteúdo da faixa de aviso. Componente próprio por uma razão só: o botão
 * "Detalhes" precisa de estado, e a faixa remonta por `key` a cada aviso novo —
 * o que zera o estado de graça, sem efeito de sincronização.
 *
 * **O detalhe cru do erro deixou de viver só no `title` (Adendo 12).** O `title`
 * é mouse-only: leitor de tela não o anuncia e teclado não o alcança — e é nele
 * que mora o caminho do arquivo resgatado, a informação mais importante que o
 * app dá. O botão abre a frase crua dentro da própria faixa, que cresce pelo
 * mesmo `grid-rows` de sempre. O `title` continua, como leitura de relance.
 */
function NoticeMessage({
  notice,
  undoing,
  onUndo,
  onDismiss,
}: {
  notice: Notice;
  undoing: boolean;
  onUndo: (run: () => Promise<void>) => void;
  onDismiss: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const detail = notice.kind === "error" ? notice.detail : "";

  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      className={[
        "rounded-md px-2 py-1 text-xs",
        notice.kind === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      <div className="flex items-start gap-1">
        {/* O `title` segue valendo como atalho de mouse; o botão abaixo é o
            caminho que funciona para todo mundo. */}
        <p
          title={detail !== "" ? `${notice.text}\n\n${detail}` : notice.text}
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
            // O atalho fica descobrível onde os outros ficam: no `title` do
            // controle que ele aciona.
            title={UNDO_SHORTCUT}
            onClick={() => onUndo(notice.run)}
            className="-my-0.5 shrink-0 text-xs"
          >
            {t("notice.undo")}
          </Button>
        )}
        {detail !== "" && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={detailOpen}
            onClick={() => setDetailOpen((aberto) => !aberto)}
            className="-my-0.5 shrink-0 text-xs"
          >
            {t("notice.details")}
          </Button>
        )}
        <button
          type="button"
          aria-label={t("notice.dismiss")}
          onClick={onDismiss}
          // Este botão é escrito à mão (não é o `Button`), e por isso tinha
          // ficado sem anel de foco: opacidade sozinha não diz onde o foco
          // está. Mesmo alvo de 24px dos outros ícones — e, com 24px, o
          // mesmo raio de 8px que o `icon-xs` do `Button` resolve.
          className="-my-0.5 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" />
        </button>
      </div>
      {/* `line-clamp-4` é só visual: o texto inteiro está no DOM para o leitor
          de tela, e continua no `title` para o mouse. Um erro de várias linhas
          não pode comer a lista — a faixa cresce, mas com teto. */}
      {detailOpen && (
        <p title={detail} className="mt-1 wrap-anywhere line-clamp-4 text-micro">
          {detail}
        </p>
      )}
    </div>
  );
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
   * Pendentes por aba (Adendo 13), para o `title` do chip. Vazio até a primeira
   * leitura chegar — o chip mostra só o nome nesse meio-tempo, que é o que ele
   * sempre mostrou. Recalculado do backend depois de cada mudança de lista ou de
   * abas: a releitura é uma varredura em memória do outro lado do IPC, e derivar
   * localmente erraria justamente nos gestos que tocam outras abas (mover,
   * importar, reativar recorrentes).
   */
  const [counts, setCounts] = useState<Record<string, number>>({});
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
   * O dia vem antes do mês no formato deste sistema? Decide como o título de uma
   * tarefa é lido em busca da data de hoje (Adendo 11).
   *
   * **O valor inicial é o fallback de falha, e não um estado passageiro.** A
   * leitura sai no mesmo `Promise.all` das abas e é aplicada **antes** de as
   * tarefas carregarem, então o primeiro render que tem tarefa na tela já tem a
   * ordem certa: não existe quadro em que a lista apareça com o palpite. Quem
   * depende deste `true` é só o caminho em que o IPC falhou — e ali ele é o mesmo
   * dia-primeiro que o backend usa, pela mesma razão assimétrica (Adendo 11): sob
   * dia-primeiro um `08/20` procura o mês 20 e não casa com nada, então o erro
   * cala em vez de afirmar.
   */
  const [dayFirst, setDayFirst] = useState(true);
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
  // O mesmo remédio para as contagens por aba (Adendo 13): só a leitura mais
  // recente escreve no estado.
  const countsSeal = useRef(0);
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
   * O painel estava aberto no render anterior. Serve a uma coisa só: reconhecer o
   * instante em que ele **fecha**, para devolver o cursor ao campo.
   *
   * `settingsRef` acima não serve para isto: ele é escrito no render, então quando
   * um efeito roda ele já vale o valor novo. Este é escrito dentro do efeito, e é
   * o que sobra do render anterior.
   */
  const settingsWasOpen = useRef(false);
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
  /**
   * O que o "Limpar concluídas" de fato removeria: concluídas SEM recorrência —
   * a mesma régua do backend (Adendo 13), senão o botão acende para um gesto
   * que não faz nada. Uma recorrente concluída não conta: ela fica, esperando o
   * período.
   */
  const clearable = todos.reduce(
    (n, item) => (item.done && item.repeat === "none" ? n + 1 : n),
    0,
  );
  const allDone = todos.length > 0 && pending === 0;

  // O estado fica sempre na ordem canônica do contrato; a ordem de exibição é
  // aplicada só aqui, na borda da renderização.
  const visible = useMemo(() => [...todos].sort(byDisplayOrder), [todos]);

  // O dia de hoje, para a linha achar no título a data que é hoje. Um só para a
  // lista inteira, e ele vira sozinho na meia-noite — o app fica semanas aberto
  // na bandeja (ver `useToday`).
  const today = useToday();

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
  /**
   * A combinação está de fato valendo? `false` = o sistema recusou o registro, e
   * nenhuma superfície pode ensiná-la como se funcionasse (Adendo 12). Enquanto a
   * leitura não chegou (`shortcut === null`), o palpite é `true`: o único caminho
   * até aqui sem leitura é uma falha de IPC, e avisar "atalho morto" por causa de
   * uma leitura que falhou seria alarme sem fato.
   */
  const shortcutActive = shortcut?.active ?? true;

  // Memoizada porque este componente re-renderiza a cada tecla digitada no
  // campo, e a assinatura só muda quando `visible` muda — reconstruir a string
  // O(n) por tecla é trabalho que o próprio hook existe para evitar.
  const flipSignature = useMemo(
    () => visible.map((item) => `${item.id}:${item.done ? 1 : 0}`).join(),
    [visible],
  );
  const carryOver = useFlipRows(listRef, flipSignature);

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
   * Põe o foco no checkbox da n-ésima linha da lista, presa aos limites dela.
   * Devolve se conseguiu — quem chama usa isso para decidir se engole a tecla.
   *
   * O checkbox, e não a linha: ele já é uma parada de tabulação, já responde ao
   * espaço para alternar, e a `li` inteira teria que ganhar `tabindex` só para
   * receber um foco que ela não usa para nada.
   *
   * (Vive aqui em cima, antes dos handlers de mutação, porque `handleDelete`
   * também o usa — uma `const` de useCallback não existe antes da linha dela.)
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
        const [list, saved, rescue, combinacao, diaPrimeiro] = await Promise.all([
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
          // Junto das outras pelo mesmo motivo, e com o mesmo `catch` local: a
          // ordem de dia e mês é a menos importante das cinco leituras — errá-la
          // custa um destaque que não acende, e não uma tarefa que não aparece.
          // `null` aqui significa "fica com o palpite inicial".
          dateDayFirst().catch(() => null),
        ]);
        if (!alive) return;
        if (combinacao !== null) setShortcut(combinacao);
        if (diaPrimeiro !== null) setDayFirst(diaPrimeiro);
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

  /**
   * Fechar o painel do atalho devolve o cursor ao campo — por qualquer saída.
   *
   * O painel tem três, e só uma delas devolvia: o botão "Concluir". Pela engrenagem
   * e pelo `Escape`, o `ShortcutSettings` desmontava com o foco no capturador, o
   * foco caía no `body`, e as teclas seguintes não iam para lugar nenhum. Num app
   * cujo ciclo é `⌃⌥T → digitar → Enter`, uma tela que sai deixando o teclado sem
   * destino quebra o gesto seguinte, e não o gesto que a fechou.
   *
   * Aqui, e não em cada handler, pela mesma razão que devolve o atalho suspenso na
   * limpeza do efeito em `ShortcutSettings`: quem cuida disso é o **instante de
   * fechar**, então vale para as saídas que ainda não existem. Depois da desmontagem
   * de propósito — o foco só pode ir para o campo depois que o capturador saiu da
   * árvore, ou o `body` o receberia em seguida.
   */
  useEffect(() => {
    if (settingsWasOpen.current && !settingsOpen) focusDraft();
    settingsWasOpen.current = settingsOpen;
  }, [settingsOpen, focusDraft]);

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

  // A contagem por aba acompanha a lista e as abas. Sem `fail` no catch, de
  // propósito: a contagem é carona no `title` do chip, e uma leitura que falhou
  // custa um tooltip sem número — avisar em vermelho por isso seria alarme sem
  // dado perdido. O selo é o mesmo remédio do `loadRef`: duas mutações seguidas
  // põem duas leituras em voo, e só a mais recente pode escrever — a resposta
  // dela é a única garantida de vir de depois da última mutação.
  useEffect(() => {
    const token = (countsSeal.current += 1);
    void listPendingCounts()
      .then((lista) => {
        if (countsSeal.current !== token) return;
        const mapa: Record<string, number> = {};
        for (const item of lista) mapa[item.tab_id] = item.pending;
        setCounts(mapa);
      })
      .catch(() => {});
  }, [todos, tabs]);

  /**
   * A volta das recorrentes (Adendo 13): lê todas as recorrentes, calcula quais
   * venceram o período (`lib/recurrence.ts` — o calendário local é daqui) e
   * manda o backend devolvê-las a pendente. As reativadas que estão na aba da
   * tela trocam no lugar, e o FLIP as leva do grupo de concluídas de volta ao de
   * pendentes — a mesma animação de desmarcar.
   *
   * Roda na montagem (o app pode ter passado dias fechado) e a cada virada de
   * dia do `useToday` — que também dispara no foco depois de uma suspensão, que
   * é exatamente quando um timer de meia-noite chega atrasado.
   */
  const runRecurrence = useCallback(async () => {
    try {
      const recorrentes = await listRecurring();
      const vencidas = dueIds(recorrentes, Date.now());
      // Lote vazio não liga o IPC: o backend o trata como bug de quem chamou.
      if (vencidas.length === 0) return;
      await reviveTodos(vencidas);
      // Relê a lista da aba ativa em vez de remendar o estado: na abertura, a
      // carga inicial pode estar em voo com uma leitura de ANTES do revive, e
      // um remendo local seria sobrescrito por ela. `loadTodosFor` incrementa o
      // selo, então qualquer leitura velha em voo é invalidada de graça.
      if (activeTabRef.current !== null) {
        void loadTodosFor(activeTabRef.current);
      }
    } catch (err) {
      fail(err, "error.revive");
    }
  }, [fail, loadTodosFor]);

  useEffect(() => {
    void runRecurrence();
    // `today` é a dependência de verdade: o efeito re-roda quando o dia vira.
  }, [today, runRecurrence]);

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
      // O menu de contexto aberto é a camada mais de fora (Adendo 13): o Escape
      // fecha o MENU (o Radix cuida disso), nunca a janela por baixo dele. A
      // consulta ao DOM em vez de estado próprio é deliberada: o menu é do
      // Radix, e espelhar o aberto/fechado dele em estado do App criaria a
      // segunda cópia que dessincroniza. Só roda no Escape, então não é custo.
      if (document.querySelector('[data-slot="context-menu-content"]')) return;
      // O painel do atalho é a camada de fora: com ele aberto, o Escape fecha o
      // painel e não a janela. Esconder a janela por baixo de um painel aberto
      // devolveria a pessoa, no próximo atalho, a uma tela de configuração que ela
      // já tinha terminado.
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      // Lido do DOM (o campo é controlado, o valor espelha o estado) para o
      // `draft` ficar FORA das dependências: com ele lá, este listener era
      // removido e reassinado a cada tecla digitada — o padrão que o listener
      // de foco já evita com `editingRef`.
      if ((draftRef.current?.value ?? "") !== "") {
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
  }, [editing, editingTab, fail, settingsOpen]);

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
      repeat: "none",
      done_at: null,
      reminder: "none",
      remind_at: null,
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
        //
        // Com o atalho morto, a dica ensina a bandeja (Adendo 12): esta faixa
        // existe para a instrução de volta atravessar o instante em que o estado
        // vazio some, e atravessar com uma tecla que não faz nada seria pior que
        // não atravessar.
        setNotice(
          (prev) =>
            prev ?? {
              kind: "hint",
              id: crypto.randomUUID(),
              text: shortcutActive
                ? t("onboarding.roundTrip", { shortcut: shortcutLabel })
                : t(
                    isLinux()
                      ? "onboarding.roundTripTrayLinux"
                      : "onboarding.roundTripTray",
                    { place: TRAY_PLACE },
                  ),
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

  /**
   * O esqueleto de TODA mutação otimista de tarefa: guardar a lista e a aba em
   * que o gesto começou, aplicar o palpite na tela, esperar o disco — e, no
   * erro, devolver a lista SÓ se a tela ainda for daquela aba (a guarda do
   * Adendo 8) antes de nomear a falha.
   *
   * Existe porque o padrão estava copiado em seis handlers, e foi numa das
   * cópias que a guarda ficou de fora (o `applyRestored` do desfazer). O que
   * varia mora em `run`: a chamada IPC, a escrita confirmada — que continua
   * responsável pela PRÓPRIA guarda, porque cada uma escreve uma coisa — e a
   * oferta de desfazer.
   */
  const mutateTodos = useCallback(
    async (opts: {
      errorKey: MessageKey;
      optimistic: (prev: Todo[]) => Todo[];
      run: () => Promise<void>;
    }) => {
      setNotice(null);
      const before = todos;
      const tabId = activeTabId;
      setTodos(opts.optimistic);
      try {
        await opts.run();
      } catch (err) {
        // `before` é a lista DESTA aba. Repô-la depois de o usuário ter trocado
        // de aba encheria a tela da outra com tarefas que não são dela — e faria
        // isso no caminho de erro, que é justamente onde o app promete que a
        // tela continua contando a verdade.
        if (activeTabRef.current === tabId) setTodos(before);
        fail(err, opts.errorKey);
      }
    },
    [todos, activeTabId, fail],
  );

  /**
   * A escrita confirmada das mutações de UMA linha: troca a tarefa pelo estado
   * que o backend devolveu. Dispensa guarda de aba: se a tela já é de outra
   * aba, o `map` não encontra o id e nada muda.
   */
  const applyUpdated = useCallback((updated: Todo) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  // Os handlers de linha são `useCallback` e o `TodoRow` é `memo`: digitar no
  // campo de nova tarefa re-renderiza o App a cada tecla, e sem isso cada tecla
  // re-renderizava também todas as linhas da lista — trabalho O(n) por
  // caractere que numa lista longa vira latência de digitação. Com identidade
  // estável nos handlers, as teclas não tocam nas linhas; elas só re-renderizam
  // quando `todos` de fato muda.
  const handleToggle = useCallback(
    (id: string) =>
      mutateTodos({
        errorKey: "error.toggle",
        // A linha muda de grupo já no clique e o FLIP a leva deslizando até o
        // novo lugar. Se o backend recusar, o rollback a devolve — e a volta é
        // animada pelo mesmo mecanismo, sem nada a mais.
        optimistic: (prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item,
          ),
        run: async () => applyUpdated(await toggleTodo(id)),
      }),
    [mutateTodos, applyUpdated],
  );

  /**
   * `restore_todos` devolve a lista completa DAQUELA aba (Esclarecimento 5.1) —
   * todas as tarefas de uma chamada pertencem à mesma aba, que é o caso dos dois
   * desfazeres que o comando atende. O filtro por `tab_id` fica como redundância
   * barata: cada tarefa já carrega a sua aba, e a tela nunca exibe tarefa de
   * outra por um retorno mais largo do que o esperado.
   */
  const applyRestored = useCallback((restored: Todo[], tabId: string) => {
    // A guarda de aba do Adendo 8, que vale para TODA escrita depois de um
    // `await`: clicar em "Desfazer" e trocar de aba com o `restore_todos` em
    // voo poria a lista da aba antiga na tela da nova. O disco já restaurou —
    // a lista certa aparece quando o usuário voltar àquela aba.
    if (activeTabRef.current !== tabId) return;
    setTodos(restored.filter((item) => item.tab_id === tabId).sort(byCreatedAt));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (activeTabId === null) return;
      const removed = todos.find((item) => item.id === id);
      const tabId = activeTabId;
      // **O foco não pode morrer com a linha.** O Enter no `×` (Adendo 7 deu
      // tecla ao gesto) removia a linha DEBAIXO do foco: ele caía no `body` e a
      // tecla seguinte não ia a lugar nenhum. Se o foco estava na linha
      // removida, ele desce para a vizinha — `focusRowAt` clampa, então remover
      // a última foca a que virou última — ou volta ao campo se a lista
      // esvaziou. Lido AQUI, antes do palpite otimista tirar a linha do DOM; o
      // rAF corre depois do re-render, quando ela já saiu.
      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[data-todo-id]") ?? [],
      );
      const focused =
        document.activeElement?.closest<HTMLElement>("[data-todo-id]") ?? null;
      const focusIndex =
        focused !== null && focused.dataset.todoId === id
          ? rows.indexOf(focused)
          : -1;
      if (focusIndex !== -1) {
        requestAnimationFrame(() => {
          if (!focusRowAt(focusIndex)) focusDraft();
        });
      }
      return mutateTodos({
        errorKey: "error.delete",
        optimistic: (prev) => prev.filter((item) => item.id !== id),
        run: async () => {
          await deleteTodo(id);
          // Guarda o `Todo` inteiro, como estava: `restore_todos` devolve com o
          // `id` e o `created_at` originais, então a tarefa volta ao lugar dela
          // na lista em vez de reaparecer no fim como se fosse outra.
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
        },
      });
    },
    [todos, activeTabId, mutateTodos, offerUndo, applyRestored, focusRowAt, focusDraft],
  );

  /**
   * O alarme que este período pediria, dada a data escrita neste título — ou
   * `null` quando o título não tem uma data única e ainda por vir.
   *
   * **É a única conta de "quando avisar" do app** (Adendo 14), e por isso ela
   * mora num lugar só: os dois caminhos que armam um lembrete — escolher no menu
   * e renomear a tarefa — passam por aqui. Duas contas do mesmo número em
   * arquivos diferentes divergem na primeira que alguém esquecer de mudar.
   */
  const alarmeDe = useCallback(
    (title: string, reminder: Exclude<Reminder, "none">): number | null => {
      const data = soleDate(title, today, dayFirst);
      if (data === null || !stillAhead(data, Date.now())) return null;
      return remindAt(data, reminder);
    },
    [today, dayFirst],
  );

  /**
   * O lembrete segue a data do título (Adendo 14). Renomear "pagar boleto 20/08"
   * para "pagar boleto 21/08" move o aviso junto; apagar a data do título
   * cancela o lembrete, em vez de deixar um sino que avisa de um dia que não
   * está mais escrito em lugar nenhum.
   *
   * **Só age quando a DATA muda, e a condição é correção e não economia.** Um
   * lembrete que já disparou tem `remind_at` nulo; recalcular por causa de um
   * acento corrigido no mesmo dia o rearmaria para um instante já passado, e o
   * vigia do backend tocaria o mesmo aviso uma segunda vez no tique seguinte.
   *
   * Silencioso na falha, de propósito: o renomear em si deu certo e já está na
   * tela, e o que ficou para trás é o ajuste de um metadado. Levantar a faixa
   * vermelha aqui diria "não foi possível renomear" sobre uma renomeação que
   * aconteceu — que é pior que o sino apontando para o dia antigo.
   */
  const seguirDataDoTitulo = useCallback(
    async (renomeada: Todo, tituloAnterior: string) => {
      if (renomeada.reminder === "none") return;
      const antes = soleDate(tituloAnterior, today, dayFirst);
      const depois = soleDate(renomeada.title, today, dayFirst);
      if (sameDate(antes, depois)) return;
      const alarme = alarmeDe(renomeada.title, renomeada.reminder);
      try {
        applyUpdated(
          alarme === null
            ? await setReminder(renomeada.id, "none", null)
            : await setReminder(renomeada.id, renomeada.reminder, alarme),
        );
      } catch {
        // Ver o cabeçalho: o renomear já está gravado, e não há gesto do usuário
        // a repetir.
      }
    },
    [today, dayFirst, alarmeDe, applyUpdated],
  );

  const handleRename = useCallback(
    (id: string, title: string) => {
      setEditingId(null);
      // Capturado ANTES da chamada: depois dela o título antigo já não está em
      // lugar nenhum, e é a data DELE que decide se o lembrete precisa se mexer.
      const tituloAnterior = todos.find((item) => item.id === id)?.title ?? "";
      return mutateTodos({
        errorKey: "error.rename",
        optimistic: (prev) =>
          prev.map((item) => (item.id === id ? { ...item, title } : item)),
        // `rename_todo` não mexe em `created_at` nem em `done`, então a ordem da
        // lista não muda — só o texto.
        run: async () => {
          const renomeada = await renameTodo(id, title);
          applyUpdated(renomeada);
          await seguirDataDoTitulo(renomeada, tituloAnterior);
        },
      });
    },
    [todos, mutateTodos, applyUpdated, seguirDataDoTitulo],
  );

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  /**
   * Mover para outra aba (Adendo 13). A linha sai da tela no gesto — ela não
   * pertence mais a esta lista — e a faixa oferece o desfazer, que é o mesmo
   * comando na direção contrária. Mover não destrói nada, mas some da vista, e
   * sumir sem via de volta de um clique é o que a faixa existe para não deixar.
   */
  const handleMove = useCallback(
    (id: string, destinoId: string) => {
      if (activeTabId === null) return;
      const origem = activeTabId;
      return mutateTodos({
        errorKey: "error.move",
        optimistic: (prev) => prev.filter((item) => item.id !== id),
        run: async () => {
          const movida = await moveTodo(id, destinoId);
          const destino = tabs.find((tab) => tab.id === destinoId);
          offerUndo(
            t("undo.movedTo", { name: destino?.name ?? "" }),
            async () => {
              const volta = await moveTodo(movida.id, origem);
              // Só reentra na tela se a tela ainda for a lista de onde ela saiu.
              if (activeTabRef.current === origem) {
                setTodos((prev) =>
                  [...prev.filter((item) => item.id !== volta.id), volta].sort(
                    byCreatedAt,
                  ),
                );
              }
            },
          );
        },
      });
    },
    [activeTabId, mutateTodos, tabs, offerUndo],
  );

  /**
   * Trocar a recorrência (Adendo 13). Otimista como o toggle: o glifo aparece no
   * clique, e a resposta do backend traz o que só ele sabe — o `done_at`
   * carimbado quando a tarefa já estava concluída sem carimbo.
   */
  const handleSetRepeat = useCallback(
    (id: string, repeat: Repeat) =>
      mutateTodos({
        errorKey: "error.repeat",
        optimistic: (prev) =>
          prev.map((item) => (item.id === id ? { ...item, repeat } : item)),
        run: async () => applyUpdated(await setRepeat(id, repeat)),
      }),
    [mutateTodos, applyUpdated],
  );

  /**
   * Armar, trocar ou desarmar o lembrete (Adendo 14). Otimista como o toggle: o
   * sino aparece no clique, e o `remind_at` que a linha desenha é o mesmo número
   * que vai para o backend — não há nada que só ele saiba aqui.
   *
   * **A conta de "quando" acontece antes do IPC**, e é ela que decide se há
   * chamada: um período escolhido sobre um título sem data válida não é um erro a
   * mostrar, é um gesto que a interface não deveria ter oferecido (o submenu
   * desabilita os três períodos exatamente nesse caso). O caminho existe para a
   * janela estreita entre abrir o menu e clicar com a meia-noite no meio — e sair
   * sem fazer nada é o desfecho certo, porque nada aconteceu.
   */
  const handleSetReminder = useCallback(
    (id: string, reminder: Reminder) => {
      const alvo = todos.find((item) => item.id === id);
      if (alvo === undefined) return;
      const alarme = reminder === "none" ? null : alarmeDe(alvo.title, reminder);
      if (reminder !== "none" && alarme === null) return;
      return mutateTodos({
        errorKey: "error.remind",
        optimistic: (prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, reminder, remind_at: alarme } : item,
          ),
        run: async () => applyUpdated(await setReminder(id, reminder, alarme)),
      });
    },
    [todos, alarmeDe, mutateTodos, applyUpdated],
  );

  /**
   * Depois de uma importação (Adendo 13): abas e lista podem ter mudado por
   * baixo do painel aberto, então as duas são relidas do backend — a mesma
   * verdade que a carga inicial lê. As contagens seguem sozinhas, pelo efeito
   * que observa `todos` e `tabs`.
   */
  const handleImported = useCallback(async () => {
    try {
      const list = await listTabs();
      setTabs([...list].sort(byCreatedAt));
      if (activeTabRef.current !== null) void loadTodosFor(activeTabRef.current);
    } catch (err) {
      fail(err, "error.load");
    }
  }, [loadTodosFor, fail]);

  function handleClearCompleted() {
    if (activeTabId === null) return;
    const tabId = activeTabId;
    // Precisa ser capturado ANTES da chamada: depois dela as concluídas já não
    // estão em lugar nenhum, e é o `done: true` delas que o desfazer restaura.
    //
    // **A mesma régua do backend (Adendo 13): recorrente concluída não sai.**
    // Sem o filtro, a tela removia a recorrente que o backend mantém (ela
    // piscava de volta na resposta), e o desfazer tentava restaurar um id que
    // ainda existe — o que reprovaria o lote INTEIRO, matando o desfazer das
    // que de fato saíram.
    const removed = todos.filter((item) => item.done && item.repeat === "none");
    // O mesmo resgate de foco do `handleDelete`, para o outro jeito de remover
    // pelo teclado: limpar tudo o que era limpável DESABILITA o próprio botão,
    // e um botão desabilitado solta o foco no `body`. Aqui não há linha vizinha
    // a herdar — o destino natural é o campo, que é para onde o ciclo volta.
    requestAnimationFrame(() => {
      if (document.activeElement === document.body) focusDraft();
    });
    return mutateTodos({
      errorKey: "error.clear",
      optimistic: (prev) =>
        prev.filter((item) => !item.done || item.repeat !== "none"),
      run: async () => {
        const remaining = await clearCompleted(tabId);
        // **A gravação em disco dá tempo de o usuário trocar de aba.** Sem esta
        // guarda, `remaining` — que é a lista da aba ANTERIOR — era escrita na
        // tela da aba nova, e no caminho de sucesso, sem erro nenhum a que culpar.
        if (activeTabRef.current === tabId) {
          setTodos([...remaining].sort(byCreatedAt));
        }
        if (removed.length > 0) {
          offerUndo(t("undo.completedRemoved", { n: removed.length }), async () => {
            applyRestored(await restoreTodos(removed), tabId);
          });
        }
      },
    });
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
    } finally {
      // Também no erro: sem isto o `undoing` ficava preso em `true` até a
      // próxima oferta — inócuo hoje porque o `fail` troca o aviso, mas é o
      // tipo de estado torto de que um refactor futuro tropeça.
      setUndoing(false);
    }
  }

  /**
   * `⌘Z`/`Ctrl+Z` aciona o desfazer enquanto a oferta está na faixa (Adendo 12).
   *
   * Quem apaga pelo teclado (foco no `×`, Enter) tinha que ⇧Tab até o botão da
   * faixa dentro de 6 segundos — o único gesto do app sem caminho de teclado à
   * altura do de mouse. A tecla só vale com a oferta viva: fora desses segundos,
   * `⌘Z` num campo volta a ser o desfazer de texto do próprio campo, que é o que
   * qualquer um espera dele.
   *
   * `handleUndo` é função do render (identidade nova a cada tecla digitada) e fica
   * fora das dependências pela mesma razão documentada no efeito das teclas de
   * aba: ela só lê `setNotice`/`fail`, que são estáveis. O que o efeito lê de
   * verdade — o aviso, as edições, o painel — está na lista.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (notice === null || notice.kind !== "undo" || undoing) return;
      // Edição inline e painel têm posse do teclado, como nos outros efeitos.
      if (editing !== null || editingTab !== null || settingsOpen) return;
      // Menu de contexto aberto: o teclado é dele (Adendo 13).
      if (document.querySelector('[data-slot="context-menu-content"]')) return;
      if (!hasModKey(e) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      void handleUndo(notice.run);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint não vigia este arquivo (ver o efeito das teclas de aba); a condição
    // que sustenta a omissão de `handleUndo` está no comentário acima.
  }, [notice, undoing, editing, editingTab, settingsOpen]);

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
      // Menu de contexto aberto: `⌘W` fecharia uma aba e `⌘1` trocaria de tela
      // por baixo do menu — teclado é dele enquanto ele está de pé (Adendo 13).
      if (document.querySelector('[data-slot="context-menu-content"]')) return;

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

      // `⌘W` fecha a aba ativa (Adendo 13) — o quarto idioma de navegador da
      // faixa. Com uma aba só, a tecla é ENGOLIDA e não faz nada: deixá-la
      // passar entregaria o `close_window` do menu padrão do macOS, e "⌘W sumiu
      // com a janela" é o desfecho que o Adendo 8 fechou. O desfazer de fechar
      // aba já existia e é o que paga o risco do gesto.
      if (e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (tabs.length > 1 && activeTabId !== null) {
          void handleCloseTab(activeTabId);
        }
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
    // **As dependências abaixo são incompletas de propósito, e isto é o aviso.**
    //
    // `handleSelectTab`, `handleCreateTab` e `handleCloseTab` são funções do render
    // e mudam de identidade a cada tecla digitada no campo; reassinar por isso seria
    // trabalho por caractere no caminho mais frequente do app. Elas são estáveis no
    // comportamento e leem o estado que o efeito já traz nas dependências.
    //
    // A condição que sustenta a omissão: as três só leem `tabs`, `activeTabId` e
    // `todos` (o `handleCloseTab` guarda a lista para o rollback), que ESTÃO na
    // lista. Se alguma delas passar a ler outro estado, ele precisa entrar aqui —
    // ou o efeito vai agir sobre um valor velho.
    //
    // Aqui havia um `eslint-disable-next-line react-hooks/exhaustive-deps`, e ele era
    // inerte: o projeto não tem ESLint configurado (nem Prettier — a árvore de
    // dependências é enxuta por decisão, a mesma que dispensou biblioteca de i18n).
    // Uma diretiva que aponta para uma ferramenta ausente promete uma verificação que
    // ninguém faz, e o que ela guardava de útil era o motivo, que agora está escrito.
  }, [tabs, activeTabId, todos, editing, editingTab, settingsOpen]);

  /**
   * Quantos caracteres ainda cabem no campo. Ver `DRAFT_COUNTER_AT`.
   *
   * Pontos de código, e não `draft.length` (Adendo 12): a régua é a mesma do
   * `chars().count()` do backend, então um emoji conta 1 — antes contava 2 e o
   * contador mentia exatamente para quem colava o texto mais denso.
   */
  const draftLeft = TITLE_MAX_LENGTH - lengthOf(draft);

  return (
    // A janela é transparent e sem decoração: este Card É a superfície visível
    // do app — dele saem os cantos, a borda e o fundo. `gap-0 py-0` zeram o
    // espaçamento padrão do Card, que é largo demais para 360x480.
    //
    // **`ring-0` e nenhuma sombra, porque nada desenhado para FORA daqui existe.**
    // O `#root` mede exatamente os 360x480 da janela e tem `overflow: hidden` (ver
    // `index.css`), e este cartão o preenche inteiro: qualquer `box-shadow` outset
    // — a sombra `lg` que estava aqui, o `ring-1` que o primitivo `Card` traz — é
    // recortado por completo antes de chegar à tela. Não eram efeitos discretos,
    // eram efeitos inexistentes, e o DESIGN.md os descrevia como se estivessem
    // valendo.
    //
    // Quem separa a janela da área de trabalho é o sistema operacional, a partir do
    // alfa: a sombra do macOS e o DWM no Windows. No Linux depende do compositor, e
    // é lá que a borda de 1px abaixo é a única separação garantida — o motivo de ela
    // não poder sumir. Uma sombra de verdade aqui exigiria a janela ser maior que o
    // cartão, o que custaria os 360x480 que são o orçamento inteiro do layout.
    <Card className="h-full gap-0 overflow-hidden rounded-xl border border-border py-0 ring-0">
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
        counts={counts}
        activeTabId={activeTabId}
        editingTabId={editingTab}
        // A mesma regra do `inert` do campo, dois blocos abaixo: com o painel
        // aberto a lista não está na tela, e agir sobre abas ali dispararia undo
        // e aviso sobre conteúdo invisível.
        inert={settingsOpen}
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
      {/* `inert` com o painel do atalho aberto. A Regra da Vista que Troca em Vez de
          Empilhar diz que a vista aberta é a camada de fora do teclado, e só metade
          disso estava valendo: as teclas de aba eram desligadas, mas este campo
          continuava alcançável por `Tab` — dava para acrescentar uma tarefa numa
          lista que não está na tela, e só o contador mudava.

          `inert` na banda e não `disabled` no campo: um campo desabilitado ganharia
          `opacity-50` e viraria uma mancha apagada no topo da janela toda vez que o
          painel abrisse. O `inert` tira da tabulação e da árvore de acessibilidade
          sem pintar nada — é o mesmo recurso que a faixa de aviso usa quando está
          fechada. A banda não tem região de arrasto, então nada de mover a janela se
          perde aqui. */}
      <div inert={settingsOpen} className="relative shrink-0 px-3 py-2">
        <Input
          ref={draftRef}
          value={draft}
          // O corte mora aqui, e não num `maxLength` (Adendo 12): o atributo
          // conta unidades UTF-16 e o contrato conta pontos de código — um emoji
          // valia 2 e o campo parava antes do limite. Colar além do limite avisa
          // na faixa (`cut > 1` = foi colagem; digitar no limite corta 1 por
          // tecla, e o contador dos últimos 20 já cobre esse caso). A dica não
          // atropela erro nem desfazer: a faixa é uma só e eles valem mais.
          onChange={(e) => {
            // No meio de composição (IME), cortar remove o trecho provisório
            // debaixo dos dedos; o corte espera o `onCompositionEnd`.
            if ((e.nativeEvent as InputEvent).isComposing) {
              setDraft(e.target.value);
              return;
            }
            const { text, cut } = clampLength(e.target.value, TITLE_MAX_LENGTH);
            setDraft(text);
            if (cut > 1) {
              setNotice((prev) =>
                prev !== null && prev.kind !== "hint"
                  ? prev
                  : {
                      kind: "hint",
                      id: crypto.randomUUID(),
                      text: t("task.pasteTruncated", { max: TITLE_MAX_LENGTH }),
                    },
              );
            }
          }}
          onCompositionEnd={(e) => {
            const { text } = clampLength(e.currentTarget.value, TITLE_MAX_LENGTH);
            setDraft(text);
          }}
          onKeyDown={(e) => {
            // Confirmar uma conversão de IME dispara um Enter com `isComposing`
            // — que fecha a composição, não a tarefa. Sem a guarda, o título
            // entra pela metade; e as setas, que percorrem os candidatos do IME,
            // saltariam para a lista no meio da palavra.
            if (e.nativeEvent.isComposing) return;
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
          // Um título em árabe ou hebraico renderiza na direção dele, em vez de
          // embaralhar pontuação e números na direção da interface.
          dir="auto"
          autoFocus
          className={[
            "h-8 text-body",
            // O recuo à direita só existe quando o contador existe: fora dos
            // últimos 20 caracteres o campo é o de sempre.
            draftLeft <= DRAFT_COUNTER_AT ? "pr-8" : "",
          ].join(" ")}
        />
        {/* O contador aparece nos últimos 20 e chega a zero exatamente quando o
            campo para de aceitar — agora contando pontos de código, a mesma
            régua do corte no `onChange` e do backend (Adendo 12).

            `aria-hidden`: um número solto ao lado do campo seria informação sem
            unidade para leitor de tela; o corte grande (colar) é anunciado pela
            faixa, que é `role="status"`. `pointer-events-none` para o contador
            não roubar o clique que põe o cursor no fim do texto. */}
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
              // `key` no id: um aviso novo remonta a região viva — é o remonte
              // que faz o leitor de tela anunciar de novo mesmo com texto
              // idêntico, e é ele que zera o estado do "Detalhes".
              <NoticeMessage
                key={shownNotice.id}
                notice={shownNotice}
                undoing={undoing}
                onUndo={(run) => void handleUndo(run)}
                onDismiss={() => setNotice(null)}
              />
            )}
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        {/* `px-1` (4px), e não `px-2`: somado ao `px-2` da linha, o quadrado do
            checkbox cai a **12px** da borda do cartão, na mesma vertical do "NoCom",
            da borda do campo e do contador do rodapé — a Goteira de 12px valendo
            também para a lista. Com 8px aqui o checkbox nascia a 16px e a lista
            começava com um degrau de 4px contra todas as faixas de cromo.

            O que NÃO muda é a folga dentro da linha: os 8px do `px-2` dela continuam
            sendo a distância entre o conteúdo e a beirada do realce de hover, e é por
            isso que o `after:-left-2` do checkbox continua chegando exatamente à
            beirada desse realce. A lista inteira andou 4px; a linha, por dentro,
            está igual. */}
        <div ref={listBoxRef} className="px-1 py-1.5">
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
              // A importação muda abas e lista por baixo do painel aberto; isto
              // relê as duas do backend (Adendo 13).
              onImported={() => void handleImported()}
              // Só fecha. O cursor volta para o campo no efeito que observa
              // `settingsOpen` cair — as três saídas do painel passam por lá.
              onClose={() => setSettingsOpen(false)}
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
            <EmptyList
              firstRun={firstRun}
              shortcut={shortcutLabel}
              // Com o atalho morto, o estado vazio inverte a hierarquia e ensina
              // a bandeja (Adendo 12) — nunca uma tecla que não faz nada.
              shortcutActive={shortcutActive}
            />
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
                  // Para o "Mover para" do menu de contexto (Adendo 13). O
                  // estado `tabs` só muda em mutação de aba, então o `memo`
                  // continua barrando as teclas digitadas no campo.
                  tabs={tabs}
                  // O mesmo dia para todas as linhas, e ele vira sozinho à
                  // meia-noite — ver `useToday`. String, então o `memo` da linha
                  // continua valendo: muda uma vez por dia.
                  today={today}
                  // A ordem de dia e mês do sistema, lida uma vez na abertura.
                  // Booleano, e some do caminho do `memo` pelo mesmo motivo que o
                  // dia: muda no máximo uma vez por execução.
                  dayFirst={dayFirst}
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
                  onMove={handleMove}
                  onSetRepeat={handleSetRepeat}
                  onSetReminder={handleSetReminder}
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
          // `min-w-0 truncate`: com o atalho pendurado na frase (abaixo), o pior
          // caso — "Tudo em dia — Ctrl+Alt+Space esconde" em pt, no Linux —
          // encosta na largura que o botão ao lado deixa. A Regra do Texto que
          // Não Vaza pede truncamento declarado com o texto inteiro no `title`;
          // o leitor de tela recebe a frase completa de qualquer forma.
          title={allDone && shortcutActive ? t("footer.allDoneHint", { shortcut: shortcutLabel }) : undefined}
          className="min-w-0 truncate text-xs tabular-nums text-muted-foreground"
        >
          {/* Em dia, o rodapé pendura o atalho na frase (Adendo 12): é o único
              lugar permanente onde a combinação fica legível depois que a faixa
              dos 6 segundos passou, e custa zero de altura numa região viva que
              já existia. Nunca com o atalho morto — seria anunciá-lo como vivo. */}
          {allDone
            ? shortcutActive
              ? t("footer.allDoneHint", { shortcut: shortcutLabel })
              : t("footer.allDone")
            : t("pending.count", { n: pending })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void handleClearCompleted()}
          // Desabilitado também com o painel aberto, pela mesma razão do `inert` no
          // campo: limpar concluídas com a lista fora da tela apagaria linhas que
          // ninguém está vendo. Aqui é `disabled` e não `inert` no rodapé inteiro,
          // porque o rodapé é região de arrasto da janela e carrega a região viva do
          // contador — `inert` levaria as duas junto, e mover a janela deixaria de
          // funcionar por metade da tela enquanto o painel estivesse aberto.
          disabled={clearable === 0 || settingsOpen}
          className="text-xs"
        >
          {t("footer.clearCompleted")}
        </Button>
      </footer>
    </Card>
  );
}

export default App;
