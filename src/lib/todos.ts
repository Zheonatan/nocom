import { invoke } from "@tauri-apps/api/core";
import { t } from "@/lib/i18n";

/**
 * Limite de título do contrato (Adendo 1). O backend valida de novo — aqui o
 * `maxLength` só evita que o usuário chegue ao erro em uso normal.
 */
export const TITLE_MAX_LENGTH = 200;

/**
 * Limite de nome de aba (Adendo 5). Bem menor que o do título de propósito: é
 * nome de chip numa faixa de 360px, não título de tarefa.
 */
export const TAB_NAME_MAX_LENGTH = 40;

/**
 * Se o app está rodando num Mac. Decide toda escrita de tecla da interface — o
 * macOS escreve modificadores como símbolos e todo menu do sistema faz assim,
 * enquanto Windows e Linux escrevem por extenso, e "⌃⌥T" numa tela de Windows não
 * significa nada.
 *
 * **O atalho global não passa mais por aqui.** A combinação é escolha do usuário
 * (Adendo 9) e quem escreve o rótulo dela é o backend, que também escreve o do
 * tray: duas escritas do mesmo dado divergiriam no primeiro atalho que não fosse o
 * padrão. O que sobrou aqui são os atalhos da janela em foco, que são constantes.
 */
export function isMac(): boolean {
  // Sniffing de user agent é aceitável aqui e só aqui: o app roda numa webview
  // que nós mesmos embarcamos, e o custo de errar é um glifo fora de convenção,
  // não uma função quebrada. `navigator.platform` está obsoleto e
  // `userAgentData` não existe no WebKit, que é justamente o motor do Mac.
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * O modificador de comando de aplicativo, escrito na convenção do sistema —
 * `⌘` no Mac, `Ctrl+` fora dele. Mesma decisão do `isMac` acima, mesmo lugar.
 *
 * Note que **não é o mesmo modificador do atalho global**: o padrão daquele é `⌃⌥`
 * nos três sistemas de propósito (Adendo 2), porque um atalho global vence o app em
 * foco e sequestrar `⌘` seria roubar teclas que o usuário usa o dia inteiro — e o
 * padrão é o que vale para quem nunca abriu o painel. Estes aqui valem só com a
 * janela em foco, então podem usar a tecla que cada sistema reserva justamente para
 * comandos de aplicativo, sem escolha nenhuma a fazer.
 */
const MOD_LABEL: string = isMac() ? "\u2318" : "Ctrl+";

/**
 * As teclas de aba, escritas para os olhos. São idiomas de navegador de propósito
 * — `⌘1`, `⌘T`, `Ctrl+Tab` — porque a faixa de abas é a coisa mais parecida com
 * abas de navegador que existe nesta janela, e um atalho que já se sabe não
 * precisa ser aprendido.
 */
export const NEW_TAB_SHORTCUT: string = `${MOD_LABEL}T`;

/** `⌘1`, `⌘2`, … — o salto direto para a n-ésima aba da faixa. */
export function tabShortcut(posicao: number): string {
  return `${MOD_LABEL}${posicao}`;
}

/**
 * Quantas abas a faixa alcança por tecla. Nove porque `{MOD}0` não segue de `9`
 * em convenção nenhuma, e uma décima tecla sem nome seria um atalho que só quem
 * escreveu conhece. Da décima aba em diante o caminho é `Ctrl+Tab` ou o clique.
 */
export const TAB_SHORTCUT_LIMIT = 9;

/**
 * O modificador de comando de aplicativo apertado, para os atalhos com a janela
 * em foco. `⌘` no Mac e `Ctrl` fora dele — a convenção de cada sistema, do lado
 * do teclado e não só do letreiro.
 *
 * Recusa a combinação com os DOIS apertados: `⌃⌘1` não é `⌘1`, e tratar como se
 * fosse tornaria imprevisível qualquer atalho de sistema que use as duas teclas.
 */
export function hasModKey(evento: {
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return isMac()
    ? evento.metaKey && !evento.ctrlKey
    : evento.ctrlKey && !evento.metaKey;
}

/**
 * Onde o ícone da bandeja fica, escrito na convenção do sistema — a mesma
 * decisão do `isMac`, e por isso o vizinho dele.
 *
 * O estado vazio da primeira execução aponta para o ícone como a segunda via de
 * volta, e apontar para o lugar errado da tela é pior que não apontar: no Mac o
 * ícone nasce na barra de menus, no alto; no Windows e no Linux, na área de
 * notificação, embaixo. Mandar um usuário de Windows olhar para o topo da tela
 * queimaria justamente a instrução que precisa funcionar de primeira.
 *
 * São dois baldes, não três, e é uma simplificação assumida: "área de
 * notificação" é o nome do Windows, e no Linux o lugar depende do ambiente de
 * trabalho. Entre um nome aproximado e nenhum, o aproximado ainda diz de que
 * lado da tela procurar.
 */
export const TRAY_PLACE: string = isMac()
  ? t("tray.placeMenuBar")
  : t("tray.placeNotificationArea");

/**
 * Espelha o struct `Todo` do Rust (serde, snake_case, sem rename).
 * Fonte da verdade: CONTRACT.md.
 */
export type Todo = {
  id: string;
  title: string;
  done: boolean;
  /** epoch millis */
  created_at: number;
  /** Adendo 5: toda tarefa pertence a exatamente uma aba existente. */
  tab_id: string;
};

/** Espelha o struct `Tab` do Rust. Uma aba é um escopo de lista (Adendo 5). */
export type Tab = {
  id: string;
  name: string;
  /** epoch millis */
  created_at: number;
};

/**
 * Espelha o struct `Descricao` de `atalho.rs` — o atalho global como ele está
 * agora (Adendo 9).
 *
 * `label` é o único texto de atalho que a interface mostra, e vem escrito do
 * backend de propósito: é ele quem também escreve o rótulo do item do tray, e duas
 * escritas do mesmo dado divergiriam no primeiro atalho que não fosse o padrão.
 */
export type GlobalShortcut = {
  /** Canônico (`control+alt+KeyT`). Serve para comparar e para reenviar; não é texto de tela. */
  accelerator: string;
  /** A combinação para os olhos, na convenção do sistema (`⌃⌥T`, `Ctrl+Alt+T`). */
  label: string;
  /** O padrão de fábrica, para o painel poder oferecer "restaurar" sem uma segunda cópia da constante. */
  default_accelerator: string;
  /** O sistema aceitou o registro? `false` significa que a combinação não faz nada. */
  active: boolean;
  /** A escolha chegou ao disco? `false` = vale nesta execução e não na próxima. */
  remembered: boolean;
};

/** O que `close_tab` devolve: exatamente o que apagou, para o desfazer repor. */
export type ClosedTab = {
  tab: Tab;
  todos: Todo[];
};

/**
 * Único ponto de contato com o backend. Todos os comandos que podem falhar
 * devolvem `Result<T, String>` no Rust, o que chega aqui como uma Promise
 * rejeitada — quem chama trata e faz rollback do estado otimista.
 */

export function listTodos(tabId: string): Promise<Todo[]> {
  return invoke<Todo[]>("list_todos", { tabId });
}

export function addTodo(title: string, tabId: string): Promise<Todo> {
  return invoke<Todo>("add_todo", { title, tabId });
}

export function renameTodo(id: string, title: string): Promise<Todo> {
  return invoke<Todo>("rename_todo", { id, title });
}

/**
 * Devolve tarefas removidas com `id` e `created_at` ORIGINAIS — a tarefa volta
 * onde estava, e não no fim da lista. Tudo ou nada: se qualquer id já existir, a
 * chamada falha inteira. Por isso o botão de desfazer só vale um clique.
 * A resposta já é a lista completa e ordenada; não precisa de `list_todos` depois.
 *
 * Adendo 5: o `tab_id` de cada tarefa precisa existir — restaurar para uma aba
 * já fechada criaria uma órfã, e o backend recusa.
 */
export function restoreTodos(todos: Todo[]): Promise<Todo[]> {
  return invoke<Todo[]>("restore_todos", { todos });
}

export function toggleTodo(id: string): Promise<Todo> {
  return invoke<Todo>("toggle_todo", { id });
}

export function deleteTodo(id: string): Promise<void> {
  return invoke<void>("delete_todo", { id });
}

export function clearCompleted(tabId: string): Promise<Todo[]> {
  return invoke<Todo[]>("clear_completed", { tabId });
}

export function listTabs(): Promise<Tab[]> {
  return invoke<Tab[]>("list_tabs");
}

export function createTab(name: string): Promise<Tab> {
  return invoke<Tab>("create_tab", { name });
}

export function renameTab(id: string, name: string): Promise<Tab> {
  return invoke<Tab>("rename_tab", { id, name });
}

/**
 * Devolve `{ tab, todos }` — o que foi apagado — porque fechar uma aba destrói
 * várias tarefas de uma vez, e o desfazer precisa do conteúdo para repor.
 * Recusado pelo backend quando é a última aba: o app ficaria sem lugar onde
 * escrever.
 */
export function closeTab(id: string): Promise<ClosedTab> {
  return invoke<ClosedTab>("close_tab", { id });
}

/**
 * Repõe aba e tarefas com ids e `created_at` originais, tudo ou nada. A resposta
 * já é a lista completa de abas na ordem canônica.
 */
export function restoreTab(tab: Tab, todos: Todo[]): Promise<Tab[]> {
  return invoke<Tab[]>("restore_tab", { tab, todos });
}

/** Persiste a aba ativa entre execuções (fica no `todos.json`). */
export function setActiveTab(id: string): Promise<void> {
  return invoke<void>("set_active_tab", { id });
}

export function getActiveTab(): Promise<string> {
  return invoke<string>("get_active_tab");
}

/**
 * Onde o `todos.json` ilegível da abertura foi guardado, ou `null` — que é a
 * resposta em toda abertura normal.
 *
 * Existe porque um arquivo que o backend não entende faz o app abrir com uma aba
 * vazia, e **uma lista vazia é indistinguível de uma lista perdida**. O arquivo
 * antigo é movido para o lado antes de qualquer gravação; isto é a metade que
 * conta o fato para a tela, que é o que o Princípio 5 exige.
 *
 * Devolve **caminho, não frase**: a mensagem é montada aqui, em `error.rescued`,
 * na língua da interface (Adendo 6).
 */
export function getStartupRescue(): Promise<string | null> {
  return invoke<string | null>("get_startup_rescue");
}

/**
 * O dia vem antes do mês no formato de data deste sistema?
 *
 * A janela precisa disto para achar no título de uma tarefa a data que é hoje
 * (Adendo 11). **A resposta vem do backend porque a webview não a tem:**
 * `navigator.language` é o idioma da interface e não a região, e o `Intl` escolhe
 * a ordem pela língua — as duas medições estão em `formato.rs` e no adendo. O que
 * o backend lê é o padrão de data curta do próprio sistema operacional.
 *
 * **Não rejeita.** Uma leitura que não dá certo cai em dia-primeiro no Rust, e
 * não há erro a mostrar: nada aconteceu com os dados e não há gesto do usuário
 * para repetir. Ainda assim a chamada é tratada com `catch` local em `App`, pelo
 * mesmo motivo que o atalho é — uma falha de IPC na abertura não pode derrubar as
 * leituras que trazem a lista para a tela.
 */
export function dateDayFirst(): Promise<boolean> {
  return invoke<boolean>("date_day_first");
}

/**
 * O atalho global como ele está agora. Chamado uma vez, na carga inicial, junto das
 * abas e das tarefas: as frases que ensinam a via de volta não podem aparecer na
 * tela antes de saber qual é a tecla.
 */
export function getShortcut(): Promise<GlobalShortcut> {
  return invoke<GlobalShortcut>("get_shortcut");
}

/**
 * Troca a combinação. Recebe o acelerador canônico (`control+alt+KeyT`) montado
 * pelo `event.code` da tecla apertada — ver `lib/shortcut.ts`.
 *
 * **Rejeita sem trocar nada**: o backend registra a nova antes de soltar a antiga,
 * então uma combinação que o sistema recusa (outro aplicativo já a tomou) deixa o
 * atalho anterior valendo. A resposta é o estado completo, inclusive `remembered`
 * — que é `false` no caso sutil de o atalho valer agora e não na próxima abertura.
 */
export function setShortcut(accelerator: string): Promise<GlobalShortcut> {
  return invoke<GlobalShortcut>("set_shortcut", { accelerator });
}

/**
 * Suspende (e devolve) o atalho global enquanto o painel captura teclas.
 *
 * **Um atalho global é consumido pelo sistema antes de chegar à webview**: com `⌃⌥T`
 * registrado, apertar `⌃⌥T` no capturador esconderia a janela em vez de escolher a
 * combinação — e reconfirmar a tecla que já vale é justamente o gesto de quem quer
 * testá-la. Enquanto o painel escuta, o registro sai da mão do sistema.
 *
 * Não rejeita por falha de registro: devolve o estado, e um `active: false` no
 * retorno é a combinação tendo sido tomada por outro aplicativo nesses segundos.
 * Durante a suspensão, o ícone da bandeja é a via de volta — como sempre foi.
 */
export function pauseShortcut(paused: boolean): Promise<GlobalShortcut> {
  return invoke<GlobalShortcut>("pause_shortcut", { paused });
}

export function hideWindow(): Promise<void> {
  return invoke<void>("hide_window");
}

// `quit_app` existe no backend e é acionado pelo item "Sair" do tray icon, do
// lado do Rust — não há wrapper aqui de propósito.

/**
 * O backend rejeita com `String`. Converte qualquer rejeição em texto legível
 * sem assumir o formato — evita mostrar "[object Object]" na UI.
 */
export function errorDetail(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "";
}

/**
 * Ordem canônica do contrato: created_at crescente (mais antigo primeiro).
 * Serve para `Todo` e para `Tab` — as duas ordens canônicas são a mesma regra.
 */
export function byCreatedAt(
  a: { created_at: number },
  b: { created_at: number },
): number {
  return a.created_at - b.created_at;
}

/**
 * Ordem de EXIBIÇÃO (Adendo 4): pendentes primeiro, concluídas depois, cada grupo
 * por `created_at`. É regra só da tela — o estado continua na ordem canônica, e o
 * backend nunca vê esta ordenação. Numa janela que mostra poucas linhas, uma
 * concluída no meio empurra trabalho para baixo da dobra.
 */
export function byDisplayOrder(a: Todo, b: Todo): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  return a.created_at - b.created_at;
}

/**
 * Nome padrão da aba nova (`Lista 2`, `Lista 3`, …). A primeira aba é a "Tarefas"
 * criada na migração, então a contagem começa em 2 naturalmente.
 *
 * Nome repetido é permitido pelo contrato, mas um nome PADRÃO repetido só cria
 * confusão — se `Lista 3` já existe, sobe para `Lista 4`. Continua sendo um
 * palpite descartável: o gesto de criar já entra em edição do nome.
 */
export function nextTabName(tabs: Tab[]): string {
  const taken = new Set(tabs.map((t) => t.name));
  // Piso em 2: a primeira aba é a "Tarefas" da migração, então "Lista 1" nunca é
  // o nome certo — nem no instante entre abrir a janela e a lista de abas chegar.
  let n = Math.max(2, tabs.length + 1);
  // A comparação usa o nome JÁ traduzido: quem roda em inglês tem "List 2" na
  // faixa, e é contra esses que a colisão precisa ser checada.
  while (taken.has(t("tabs.defaultName", { n }))) n += 1;
  return t("tabs.defaultName", { n });
}

/**
 * Qual aba fica ativa quando a atual é fechada (Esclarecimento 5.2): a VIZINHA —
 * a próxima na ordem canônica, ou a anterior se a fechada era a última da faixa.
 *
 * Não é a primeira restante: fechar a aba 4 de 5 e cair na aba 1 teleporta o
 * usuário para longe de onde ele estava. E a regra tem que ser exatamente a
 * mesma dos dois lados — o frontend troca a ativa de forma otimista e o backend
 * persiste; destinos diferentes fariam a tela piscar de uma aba para a outra
 * quando a resposta chegasse.
 *
 * Recebe a lista JÁ na ordem canônica (`created_at` crescente), que é como o
 * estado é mantido — "próxima" aqui é a próxima da faixa, na tela.
 */
export function neighbourTabId(tabs: Tab[], closingId: string): string | null {
  const index = tabs.findIndex((t) => t.id === closingId);
  if (index === -1) return null;
  const neighbour = tabs[index + 1] ?? tabs[index - 1];
  return neighbour?.id ?? null;
}
