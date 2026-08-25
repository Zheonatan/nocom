import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { t } from "@/lib/i18n";
import { isMac } from "@/lib/platform";
import type { Repeat } from "@/lib/recurrence";
import type { Reminder } from "@/lib/reminders";

// Os tipos nascem em `recurrence.ts` e em `reminders.ts` (que não podem importar
// daqui — ver o cabeçalho de lá) e são reexportados porque quem fala de `Todo`
// fala daqui.
export type { Repeat, Reminder };

// Helpers puros que moravam aqui e saíram para módulos que o `node --test`
// consegue carregar (o runner não resolve `@/`, e este arquivo puxa o
// `@tauri-apps/api`). Reexportados porque quem fala de `Todo` fala daqui —
// nenhum importador muda.
export { isMac, isLinux, hasModKey } from "@/lib/platform";
export { clampLength, lengthOf } from "@/lib/text";
export { nextTabName, neighbourTabId } from "@/lib/tabs";

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
 * `⌘W` / `Ctrl+W`, para os olhos: fecha a aba ativa (Adendo 13). O quarto
 * idioma de navegador da faixa — `⌘T`, `⌘1–9` e `Ctrl+Tab` já existiam, e este
 * é o que faltava. Fica descobrível no `title` do `×` da aba ativa.
 */
export const CLOSE_TAB_SHORTCUT: string = `${MOD_LABEL}W`;

/**
 * Quantas abas a faixa alcança por tecla. Nove porque `{MOD}0` não segue de `9`
 * em convenção nenhuma, e uma décima tecla sem nome seria um atalho que só quem
 * escreveu conhece. Da décima aba em diante o caminho é `Ctrl+Tab` ou o clique.
 */
export const TAB_SHORTCUT_LIMIT = 9;

/**
 * `⌘Z` / `Ctrl+Z`, para os olhos: o desfazer pelo teclado, que vale enquanto a
 * oferta está na faixa (Adendo 12). Vive no `title` do botão "Desfazer" — o
 * mesmo lugar onde os outros atalhos da janela ficam descobríveis.
 */
export const UNDO_SHORTCUT: string = `${MOD_LABEL}Z`;

/**
 * O mesmo modificador de comando na grafia do `aria-keyshortcuts` — a spec pede
 * nomes de tecla (`Meta`, `Control`), não os glifos do letreiro. O `title` era o
 * único canal dos atalhos de aba, e `title` é mouse-only: leitor de tela não o
 * anuncia como atalho, e o Adendo 12 fecha esse buraco por aqui.
 */
const ARIA_MOD: string = isMac() ? "Meta" : "Control";

/** `Meta+T` / `Control+T`, para o botão de nova aba. */
export const NEW_TAB_ARIA_SHORTCUT: string = `${ARIA_MOD}+T`;

/** `Meta+W` / `Control+W`, para o `×` da aba ativa — a grafia da ARIA. */
export const CLOSE_TAB_ARIA_SHORTCUT: string = `${ARIA_MOD}+W`;

/** `Meta+1` / `Control+1`, … — o salto direto, na grafia da ARIA. */
export function tabAriaShortcut(posicao: number): string {
  return `${ARIA_MOD}+${posicao}`;
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
  /** Adendo 13: a recorrência escolhida no menu de contexto. `none` é o normal. */
  repeat: Repeat;
  /**
   * Quando foi concluída (epoch millis), ou null. Carimbado pelo backend no
   * toggle; é a base de cálculo do "volta a pendente" — ver `lib/recurrence.ts`.
   */
  done_at: number | null;
  /** Adendo 14: o lembrete escolhido no menu de contexto. `none` é o normal. */
  reminder: Reminder;
  /**
   * Quando avisar (epoch millis), ou null. Calculado AQUI — o calendário local
   * mora no frontend — e só guardado lá. `null` com `reminder` diferente de
   * `none` quer dizer que o alarme já disparou (ou já venceu sem chance de
   * disparar); a escolha fica para o menu poder mostrá-la.
   */
  remind_at: number | null;
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

/**
 * Espelha o struct `Disponivel` de `atualizacao.rs` — a versão que está lá fora,
 * quando existe uma mais nova que a instalada (Adendo 10).
 */
export type Update = {
  /** A versão publicada (`0.3.0`). É ela que o painel nomeia antes de instalar. */
  version: string;
};

/** O que `close_tab` devolve: exatamente o que apagou, para o desfazer repor. */
export type ClosedTab = {
  tab: Tab;
  todos: Todo[];
};

/** Espelha o struct `ContagemAba` (Adendo 13): pendentes de cada aba, para o chip. */
export type TabCount = {
  tab_id: string;
  pending: number;
};

/**
 * Espelha o struct `Importado` (Adendo 13): quantos ENTRARAM na importação. O
 * que já existia foi pulado por id, e nada foi removido — é com estes números
 * que o painel conta o desfecho.
 */
export type ImportSummary = {
  tabs: number;
  todos: number;
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

/**
 * Troca a recorrência (Adendo 13). O retorno é a tarefa como ficou — inclusive
 * o `done_at` que o backend carimba quando a tarefa já estava concluída sem
 * carimbo (concluída antes desta versão).
 */
export function setRepeat(id: string, repeat: Repeat): Promise<Todo> {
  return invoke<Todo>("set_repeat", { id, repeat });
}

/**
 * Arma, troca ou desarma o lembrete (Adendo 14). O retorno é a tarefa como ficou.
 *
 * **`remindAt` é calculado aqui, não lá.** O instante depende do calendário e do
 * fuso locais, que só a webview tem (a mesma razão de `lib/recurrence.ts`) — quem
 * o produz é `remindAt` de `lib/reminders.ts`, a partir da data que `soleDate` leu
 * do título. O backend guarda o número e compara com o relógio.
 *
 * **`none` não leva instante**, e o backend limpa o que houvesse: desmarcar é o
 * gesto de cancelar. No caminho contrário, um período **sem** instante é rejeitado
 * pelo backend — é bug de quem chamou, porque a interface só oferece o submenu
 * quando há data válida no título.
 */
export function setReminder(
  id: string,
  reminder: Reminder,
  remindAt: number | null,
): Promise<Todo> {
  return invoke<Todo>("set_reminder", { id, reminder, remindAt });
}

/**
 * Move a tarefa para outra aba (Adendo 13), preservando `created_at`: ela entra
 * na lista nova pela idade real. O desfazer é o mesmo comando na direção
 * contrária — mover de volta.
 */
export function moveTodo(id: string, tabId: string): Promise<Todo> {
  return invoke<Todo>("move_todo", { id, tabId });
}

/**
 * Toda tarefa com recorrência, de TODAS as abas (Adendo 13). Lida na carga e na
 * meia-noite; quem decide o que venceu é `lib/recurrence.ts`, e quem executa é
 * `reviveTodos`.
 */
export function listRecurring(): Promise<Todo[]> {
  return invoke<Todo[]>("list_recurring");
}

/**
 * Devolve a pendente as tarefas cujo período venceu. Tudo-ou-nada como
 * `restore_todos`; **não chame com lote vazio** — o backend rejeita, porque um
 * lote vazio aqui é bug de quem calculou (o chamador checa antes).
 */
export function reviveTodos(ids: string[]): Promise<Todo[]> {
  return invoke<Todo[]>("revive_todos", { ids });
}

/**
 * Pendentes por aba (Adendo 13), para o `title` do chip. Releitura barata: uma
 * varredura em memória do outro lado do IPC.
 */
export function listPendingCounts(): Promise<TabCount[]> {
  return invoke<TabCount[]>("list_pending_counts");
}

/**
 * Grava o estado inteiro no caminho escolhido no diálogo de salvar (Adendo 13).
 * O arquivo é um `todos.json` válido por construção — é o que a outra máquina
 * importa.
 */
export function exportData(path: string): Promise<void> {
  return invoke<void>("export_data", { path });
}

/**
 * Importa um arquivo exportado (ou um `todos.json` de qualquer versão),
 * MESCLANDO: id que já existe é pulado, e nenhum caminho daqui remove nada. O
 * retorno diz quantos entraram.
 */
export function importData(path: string): Promise<ImportSummary> {
  return invoke<ImportSummary>("import_data", { path });
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

/**
 * A versão instalada, como ela está no `tauri.conf.json` e embutida no binário.
 *
 * Vem do `@tauri-apps/api/app` e não de um comando nosso: é o único dado desta
 * fronteira que o Tauri já expõe, e `core:default` (que a capability da janela já
 * concede) cobre a leitura. Um comando próprio seria uma terceira cópia do mesmo
 * número — a quarta contando o `Cargo.toml`.
 */
export function currentVersion(): Promise<string> {
  return getVersion();
}

/**
 * Pergunta ao GitHub se existe versão mais nova. `null` é a resposta boa: o app já
 * está na última.
 *
 * **É a única requisição de rede do app, e ela só sai de um clique** — não há
 * checagem na abertura nem temporizador (Adendo 10). O resultado fica guardado no
 * backend para que `installUpdate` instale exatamente a versão nomeada aqui.
 *
 * Rejeita quando a pergunta não pôde ser feita: sem rede, endpoint fora, ou
 * `latest.json` sem entrada para esta plataforma — que é o caso do `.deb` e do
 * `.rpm`, onde o updater não atua. Em todos eles nada mudou no disco.
 */
export function checkUpdate(): Promise<Update | null> {
  return invoke<Update | null>("check_update");
}

/**
 * Baixa a versão verificada, valida a assinatura, substitui o app e reinicia.
 *
 * **Não resolve no caminho de sucesso**: o processo é trocado dentro da chamada, e
 * o que o usuário vê é a janela sumir e voltar já na versão nova. Por isso quem
 * chama não tem estado de "pronto" para desenhar — só o de espera, e o de falha.
 *
 * Uma rejeição aqui não deixa meio app instalado: o pacote é baixado inteiro e a
 * assinatura conferida antes de qualquer escrita no lugar do app.
 */
export function installUpdate(): Promise<void> {
  return invoke<void>("install_update");
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

// `nextTabName` e `neighbourTabId` moram em `lib/tabs.ts` (reexportados no topo).
