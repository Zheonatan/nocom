/**
 * Camada de idioma. Português e inglês fazem parte do produto (PRODUCT.md),
 * e a escolha é automática pelo locale do sistema — sem seletor.
 *
 * A razão de não haver seletor é a mesma do dark mode: a janela tem 360x480 e
 * um controle permanente custaria altura que pertence às tarefas. O SO já sabe
 * a língua do usuário; perguntar de novo seria cobrar uma configuração que
 * ninguém pediu.
 *
 * Sem biblioteca de i18n. Duas línguas, ~35 chaves e `Intl` no motor bastam;
 * uma dependência aqui pesaria mais que o problema que resolve.
 */

export type Locale = "pt-BR" | "en";

/**
 * Inglês é o fallback, não o português: o app é distribuído, e um sistema em
 * alemão ou japonês tem muito mais chance de ler inglês do que português.
 */
const FALLBACK: Locale = "en";

/**
 * Uma entrada é uma frase, ou um conjunto de frases por categoria de plural.
 *
 * As categorias são as do CLDR (`zero`, `one`, `two`, `few`, `many`, `other`) e
 * cada uma guarda a **frase inteira**, não só o sufixo. Em português a
 * concordância se espalha ("1 concluída removida" → "2 concluídas removidas"),
 * então montar a frase com sufixos condicionais quebra na segunda palavra. Só
 * `other` é obrigatório: é o destino de qualquer categoria que uma língua não
 * use.
 */
type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
type Entry = string | Plural;
type Dict = Record<string, Entry>;

/** Valores interpolados em `{chave}`. */
type Params = Record<string, string | number>;

/**
 * O português é o dicionário canônico — é a língua em que o app foi escrito e
 * pensado. `en` é tipado como `Record<Key, Entry>`, então **acrescentar uma
 * chave aqui sem traduzir lá quebra o build**. É a rede que impede a interface
 * de voltar a ser bilíngue pela metade.
 */
const pt = {
  "window.close": "Fechar janela",
  "window.closeHint": "Esconder — {shortcut} traz de volta",

  "pending.count": {
    // O CLDR trata `0` como `one` em português (`i = 0..1`), o que daria
    // "0 pendente". Ninguém escreve isso: a categoria `zero` existe aqui para
    // sobrepor a regra da biblioteca quando o resultado dela não é o que um
    // falante escreveria.
    zero: "0 pendentes",
    one: "1 pendente",
    other: "{n} pendentes",
  },
  "footer.allDone": "Tudo em dia",
  "footer.clearCompleted": "Limpar concluídas",

  "task.placeholder": "Nova tarefa…",
  "task.new": "Nova tarefa",
  "task.edit": "Editar tarefa",
  "task.remove": 'Remover "{title}"',

  "list.loading": "Carregando…",
  // Estado vazio de quem JÁ usou o app: limpou a lista, ou acabou de criar uma
  // aba. Não ensina a acrescentar — quem chegou aqui já acrescentou antes, e
  // repetir a instrução seria explicar o óbvio a quem não pediu. O que fica é o
  // atalho, porque a via de volta é a única coisa que continua valendo a pena
  // repetir: é ela que se perde quando a janela se esconde.
  "empty.title": "Nada por aqui.",
  "empty.hint": "{shortcut} mostra e esconde a janela.",

  // --- primeira execução ---
  //
  // Quem instalou o app não leu nada sobre ele. A lista vazia da primeira vez é
  // o único momento em que existe espaço de sobra na janela, e é onde a volta
  // precisa ser ensinada — porque ela deixa de caber na tela exatamente uma
  // tarefa depois, quando o estado vazio dá lugar à lista.
  //
  // A ordem das três frases é a ordem da importância, e não a do uso: a de cima
  // é a que menos precisa ser dita (o cursor já está piscando no campo), e a do
  // meio é a que decide se o app sobrevive ao primeiro Escape.
  "empty.firstRunAction": "Escreva a primeira tarefa acima e aperte Enter.",
  // "Mostra e esconde" é a MESMA construção do `empty.hint` de propósito: os dois
  // estados vazios falam do mesmo mecanismo, e dizê-lo com dois verbos diferentes
  // faria parecer que são duas coisas. "De qualquer aplicativo" é o que não pode
  // sair: é a palavra que faz a pessoa experimentar o atalho de dentro do editor,
  // que é o único lugar onde o app prova para que serve.
  "empty.wayBackShortcut":
    "{shortcut} mostra e esconde a janela, de qualquer aplicativo.",
  "empty.wayBackTray": "Ou clique no ícone {place}.",

  // Onde o ícone da bandeja fica, na palavra que cada sistema usa para o lugar.
  // "Barra de menus" no Mac e "área de notificação" fora dele: apontar para a
  // região errada da tela é pior que não apontar para nenhuma. Quem escolhe
  // entre as duas é `TRAY_PLACE`, em `lib/todos.ts`, junto do `TOGGLE_SHORTCUT`
  // — os dois são a mesma decisão (escrever um mecanismo do sistema na
  // convenção do sistema) e ficam no mesmo lugar.
  "tray.placeMenuBar": "na barra de menus",
  "tray.placeNotificationArea": "na área de notificação",

  // A faixa que aparece UMA vez, quando a primeira tarefa entra na lista.
  //
  // Ela existe porque o estado vazio — que acabou de ensinar a volta — some
  // nesse mesmo instante, e o instante seguinte é justamente o que a pessoa
  // esconde a janela pela primeira vez. Sem esta faixa, a instrução morre um
  // gesto antes do momento para o qual ela foi escrita.
  //
  // Diz só o atalho, e não as duas vias: a faixa se dispensa em 6 segundos e
  // divide espaço com erro e desfazer. Uma frase que se lê de relance vale mais
  // aqui que duas completas que não se leem.
  "onboarding.roundTrip": "{shortcut} esconde a janela — e traz de volta.",

  "notice.dismiss": "Dispensar aviso",
  "notice.undo": "Desfazer",

  "undo.taskRemoved": "Tarefa removida.",
  "undo.completedRemoved": {
    one: "1 concluída removida.",
    other: "{n} concluídas removidas.",
  },
  "undo.tabClosed": 'Aba "{name}" fechada.',
  "undo.tabClosedWithTasks": {
    one: 'Aba "{name}" fechada. 1 tarefa volta com ela.',
    other: 'Aba "{name}" fechada. {n} tarefas voltam com ela.',
  },

  "tabs.label": "Abas",
  "tabs.new": "Nova aba",
  "tabs.close": 'Fechar aba "{name}"',
  "tabs.rename": "Renomear aba",
  "tabs.defaultName": "Lista {n}",

  // Toda mensagem de erro diz DUAS coisas: o que falhou e o que aconteceu com
  // os dados. "Não foi possível remover" sozinho deixa a pessoa sem saber se a
  // tarefa sumiu ou não — e o Princípio 5 do produto é justamente que falha
  // nunca pode ser indistinguível de perda de dados.
  "error.load": "Não foi possível carregar suas tarefas. Nada foi perdido.",
  "error.add": "Não foi possível adicionar. O texto voltou para o campo.",
  "error.toggle": "Não foi possível marcar a tarefa. Nada mudou.",
  "error.rename": "Não foi possível renomear. O título anterior foi mantido.",
  "error.delete": "Não foi possível remover. A tarefa continua na lista.",
  "error.clear": "Não foi possível limpar as concluídas. Nada foi removido.",
  "error.undo": "Não foi possível desfazer. Nada foi alterado.",
  "error.tabCreate": "Não foi possível criar a aba.",
  "error.tabRename":
    "Não foi possível renomear a aba. O nome anterior foi mantido.",
  "error.tabClose": "Não foi possível fechar a aba. Nada foi removido.",
  "error.tabRemember":
    "A aba mudou, mas não será lembrada na próxima abertura.",
  "error.hide":
    "Não foi possível esconder a janela. Use {shortcut} ou o ícone na bandeja.",
  "error.drag": "Não foi possível mover a janela.",
  "error.focus": "O cursor pode não ir para o campo ao abrir a janela.",
} satisfies Dict;

export type MessageKey = keyof typeof pt;

const en: Record<MessageKey, Entry> = {
  "window.close": "Close window",
  "window.closeHint": "Hide — {shortcut} brings it back",

  "pending.count": {
    one: "1 pending",
    other: "{n} pending",
  },
  "footer.allDone": "All clear",
  "footer.clearCompleted": "Clear completed",

  "task.placeholder": "New task…",
  "task.new": "New task",
  "task.edit": "Edit task",
  "task.remove": 'Remove "{title}"',

  "list.loading": "Loading…",
  "empty.title": "Nothing here yet.",
  "empty.hint": "{shortcut} shows and hides the window.",

  "empty.firstRunAction": "Type your first task above and press Enter.",
  "empty.wayBackShortcut":
    "{shortcut} shows and hides the window, from any app.",
  "empty.wayBackTray": "Or click the icon {place}.",

  "tray.placeMenuBar": "in the menu bar",
  "tray.placeNotificationArea": "in the notification area",

  "onboarding.roundTrip": "{shortcut} hides the window — and brings it back.",

  "notice.dismiss": "Dismiss notice",
  "notice.undo": "Undo",

  "undo.taskRemoved": "Task removed.",
  "undo.completedRemoved": {
    one: "1 completed task removed.",
    other: "{n} completed tasks removed.",
  },
  "undo.tabClosed": 'Tab "{name}" closed.',
  "undo.tabClosedWithTasks": {
    one: 'Tab "{name}" closed. 1 task comes back with it.',
    other: 'Tab "{name}" closed. {n} tasks come back with it.',
  },

  "tabs.label": "Tabs",
  "tabs.new": "New tab",
  "tabs.close": 'Close tab "{name}"',
  "tabs.rename": "Rename tab",
  "tabs.defaultName": "List {n}",

  "error.load": "Couldn't load your tasks. Nothing was lost.",
  "error.add": "Couldn't add the task. Your text is back in the field.",
  "error.toggle": "Couldn't update the task. Nothing changed.",
  "error.rename": "Couldn't rename it. The previous title was kept.",
  "error.delete": "Couldn't remove it. The task is still in the list.",
  "error.clear": "Couldn't clear completed tasks. Nothing was removed.",
  "error.undo": "Couldn't undo. Nothing changed.",
  "error.tabCreate": "Couldn't create the tab.",
  "error.tabRename": "Couldn't rename the tab. The previous name was kept.",
  "error.tabClose": "Couldn't close the tab. Nothing was removed.",
  "error.tabRemember": "The tab changed, but it won't be remembered next time.",
  "error.hide": "Couldn't hide the window. Use {shortcut} or the tray icon.",
  "error.drag": "Couldn't move the window.",
  "error.focus": "The cursor may not land in the field when the window opens.",
};

const DICTS: Record<Locale, Record<MessageKey, Entry>> = { "pt-BR": pt, en };

/**
 * Percorre a lista de idiomas do sistema **na ordem de preferência** e fica no
 * primeiro que o app fala. Alguém com `["de-DE", "pt-BR", "en"]` recebe
 * português, e não o fallback: a segunda opção dele é melhor que o palpite.
 */
export function detectLocale(
  tags: readonly string[] = navigator.languages?.length
    ? navigator.languages
    : [navigator.language],
): Locale {
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const lower = tag.toLowerCase();
    if (lower === "pt" || lower.startsWith("pt-")) return "pt-BR";
    if (lower === "en" || lower.startsWith("en-")) return "en";
  }
  return FALLBACK;
}

/**
 * Resolvido uma vez, na carga do módulo. O idioma não muda enquanto o app roda:
 * trocar o idioma do SO com o app aberto é raro o bastante para custar um
 * reinício, e um valor constante dispensa contexto, provider e re-render.
 */
export const locale: Locale = detectLocale();

const plurals = new Intl.PluralRules(locale);

function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (bruto, chave: string) => {
    const valor = params[chave];
    // Placeholder sem valor fica visível de propósito: some no texto é um bug
    // que passa despercebido; "{n}" na tela é um bug que alguém reporta.
    return valor === undefined ? bruto : String(valor);
  });
}

/**
 * Traduz uma chave. Com `params.n` presente e a entrada sendo plural, escolhe a
 * categoria pelo `Intl.PluralRules` do idioma ativo — o que faz uma língua com
 * `few`/`many` (russo, polonês) ser uma mudança de dados, não de código.
 */
export function t(key: MessageKey, params?: Params): string {
  const entry = DICTS[locale][key];
  if (typeof entry === "string") return interpolate(entry, params);

  const n = params?.n;
  if (typeof n !== "number") return interpolate(entry.other, params);

  // `zero` é uma sobreposição explícita do autor, aplicada antes da biblioteca:
  // ver o comentário em `pending.count`.
  const categoria = n === 0 && entry.zero !== undefined ? "zero" : plurals.select(n);
  return interpolate(entry[categoria] ?? entry.other, params);
}

/**
 * Aplica o idioma ao documento. Não é cosmético: sem isto o VoiceOver lê texto
 * em inglês com pronúncia de português (ou o contrário), que é o motivo de o
 * `index.html` já vir com `lang` desde o começo. A diferença é que agora o
 * valor não pode ser fixo no HTML — ele depende do sistema.
 */
export function applyDocumentLocale(): void {
  document.documentElement.lang = locale;
}
