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
 * O atalho do Adendo 2 escrito para os olhos do usuário, **na convenção do
 * sistema em que o app está rodando**.
 *
 * O macOS escreve modificadores como símbolos e todo menu do sistema faz assim;
 * Windows e Linux escrevem por extenso, e "⌃⌥T" numa tela de Windows não
 * significa nada. O backend já resolvia isto com `#[cfg]` (`ATALHO_VISIVEL` em
 * `lib.rs`) enquanto o frontend tinha o glifo fixo — então fora do Mac o menu do
 * tray dizia "Ctrl+Alt+T" e a janela dizia "⌃⌥T", para a mesma tecla.
 *
 * **As duas constantes precisam continuar de acordo.** Mudar o atalho é mexer
 * aqui e em `ATALHO_VISIVEL`, e a combinação real (`ATALHO_GLOBAL`) é sempre a
 * mesma nos três sistemas — muda só como ela é escrita.
 */
function isMac(): boolean {
  // Sniffing de user agent é aceitável aqui e só aqui: o app roda numa webview
  // que nós mesmos embarcamos, e o custo de errar é um glifo fora de convenção,
  // não uma função quebrada. `navigator.platform` está obsoleto e
  // `userAgentData` não existe no WebKit, que é justamente o motor do Mac.
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export const TOGGLE_SHORTCUT: string = isMac() ? "\u2303\u2325T" : "Ctrl+Alt+T";

/**
 * Onde o ícone da bandeja fica, escrito na convenção do sistema — a mesma
 * decisão do `TOGGLE_SHORTCUT`, e por isso o vizinho dele.
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
