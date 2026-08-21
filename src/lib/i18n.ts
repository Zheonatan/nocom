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
  // **"Esconder", e não "Fechar".** O nome acessível dizia "Fechar janela" num
  // botão que esconde, e para quem usa leitor de tela era o único botão
  // permanente da interface prometendo encerrar o app. Numa janela sem decoração,
  // fora da barra de tarefas, "fechei e não sei voltar" é o desfecho que este app
  // mais precisa evitar — o nome do gesto tem que ser o gesto.
  "window.hide": "Esconder janela",
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
  // Só para leitor de tela, e SÓ ela: o destaque da data escrita no título é
  // tinta (uma pílula em cinza), e tinta não é lida. A palavra entra entre
  // parênteses ao lado do trecho — "pagar boleto 20/08 (hoje)" —, que é como
  // alguém diria a mesma coisa em voz alta.
  "task.today": "hoje",

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

  // Plural porque remoções seguidas se juntam num desfazer só: a faixa é uma, e
  // sem o lote a segunda remoção matava o desfazer da primeira em silêncio.
  "undo.tasksRemoved": {
    one: "Tarefa removida.",
    other: "{n} tarefas removidas.",
  },
  "undo.completedRemoved": {
    one: "1 concluída removida.",
    other: "{n} concluídas removidas.",
  },
  "undo.tabClosed": 'Aba "{name}" fechada.',
  "undo.tabClosedWithTasks": {
    one: 'Aba "{name}" fechada. 1 tarefa volta com ela.',
    other: 'Aba "{name}" fechada. {n} tarefas voltam com ela.',
  },

  // --- painel do atalho global (Adendo 9) ---
  //
  // A combinação é escolha do usuário, e este é o único lugar do app onde existe
  // configuração. As frases falam de TECLAS e de o que acontece com elas — nunca de
  // "preferências" nem de "opções", que é vocabulário de painel de controle e não
  // do único gesto que este painel oferece.
  "shortcut.open": "Trocar o atalho",
  "shortcut.title": "Atalho para mostrar e esconder",
  "shortcut.explain": "Vale de qualquer aplicativo, com o To-Do em segundo plano.",
  // O rótulo do capturador em repouso e o da captura em curso. "Aperte as teclas" é
  // instrução, e não pergunta: o gesto é apertar a combinação que se quer usar.
  "shortcut.current": "Atalho",
  "shortcut.press": "Aperte as teclas…",
  // Nome acessível do capturador em repouso: um leitor de tela anunciando só "⌃⌥T"
  // não diria o que o botão faz.
  "shortcut.change": "Trocar o atalho (agora {shortcut})",
  // A regra única, e ela fica na tela antes de qualquer tentativa: uma tecla sem
  // modificador registrada globalmente sequestraria a digitação no sistema inteiro.
  //
  // Duas frases, uma por convenção de teclado — a mesma decisão de `tray.place*`, e
  // pelo mesmo motivo: "⌃, ⌥ ou ⌘" numa tela de Windows não nomeia tecla nenhuma. A
  // versão de fora do Mac não anuncia a tecla Windows de propósito: ela é aceita,
  // mas o sistema reserva quase tudo que a usa, e apontar para ela seria mandar o
  // usuário tentar o caminho que mais falha. Quem escolhe entre as duas é
  // `MODIFIER_RULE`, em `lib/shortcut.ts`.
  "shortcut.needsModifierMac": "Use ⌃, ⌥ ou ⌘ junto de outra tecla.",
  "shortcut.needsModifierOther": "Use Ctrl ou Alt junto de outra tecla.",
  "shortcut.saved": "Pronto: {shortcut} mostra e esconde a janela.",
  // O caso sutil, na mesma honestidade do `error.tabRemember`: valeu agora, e a
  // próxima abertura volta ao anterior.
  "shortcut.notRemembered":
    "{shortcut} vale agora, mas não será lembrado na próxima abertura.",
  // O backend registra a combinação nova ANTES de soltar a antiga, então a frase
  // pode dizer o que continua valendo — e não só o que falhou.
  "shortcut.taken":
    "Outro aplicativo já usa essa combinação. {shortcut} continua valendo.",
  // O app abriu e o sistema recusou a combinação: a janela não pode ensinar uma
  // tecla morta.
  "shortcut.inactive":
    "{shortcut} não está valendo — outro aplicativo tomou a combinação. Escolha outra.",
  // O custo do `⌘`, dito como aviso e não como proibição (Adendo 9): a escolha é do
  // usuário, e um atalho global vence o do aplicativo em foco.
  "shortcut.stealsCommand":
    "Combinações com ⌘ deixam de funcionar nos outros aplicativos.",
  "shortcut.stealsSuper":
    "Combinações com a tecla Windows podem ser reservadas pelo sistema.",
  "shortcut.reset": "Restaurar padrão",
  "shortcut.done": "Concluir",

  "tabs.label": "Abas",
  "tabs.new": "Nova aba",
  "tabs.newHint": "Nova aba ({shortcut})",
  // O nome inteiro da aba mais a tecla que salta até ela. Vive no `title` do chip
  // porque o chip trunca e o `title` já precisava existir; o atalho pega a carona
  // e deixa de ser invisível.
  "tabs.withShortcut": "{name} ({shortcut})",
  "tabs.close": 'Fechar aba "{name}"',
  "tabs.rename": "Renomear aba",
  "tabs.defaultName": "Lista {n}",

  // Toda mensagem de erro diz DUAS coisas: o que falhou e o que aconteceu com
  // os dados. "Não foi possível remover" sozinho deixa a pessoa sem saber se a
  // tarefa sumiu ou não — e o Princípio 5 do produto é justamente que falha
  // nunca pode ser indistinguível de perda de dados.
  "error.load": "Não foi possível carregar suas tarefas. Nada foi perdido.",
  // **O aviso que não se dispensa sozinho.** O app abriu com uma lista vazia
  // porque não entendeu o arquivo, e uma lista vazia é indistinguível de tudo
  // perdido. O arquivo antigo foi guardado ao lado e o caminho dele fica no
  // `title`. É o único aviso do app que espera ser lido.
  "error.rescued":
    "Não foi possível ler o arquivo das suas tarefas. Ele foi guardado inteiro ao lado e o app abriu com uma lista nova.",
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
  // A leitura do atalho falhou, então o painel não tem o que mostrar. O atalho em si
  // continua registrado no backend — o que não deu foi perguntar qual é.
  "error.shortcutRead":
    "Não foi possível ler o atalho. O painel não pode abrir agora.",
  "error.focus": "O cursor pode não ir para o campo ao abrir a janela.",
} satisfies Dict;

export type MessageKey = keyof typeof pt;

const en: Record<MessageKey, Entry> = {
  "window.hide": "Hide window",
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
  "task.today": "today",

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

  "undo.tasksRemoved": {
    one: "Task removed.",
    other: "{n} tasks removed.",
  },
  "undo.completedRemoved": {
    one: "1 completed task removed.",
    other: "{n} completed tasks removed.",
  },
  "undo.tabClosed": 'Tab "{name}" closed.',
  "undo.tabClosedWithTasks": {
    one: 'Tab "{name}" closed. 1 task comes back with it.',
    other: 'Tab "{name}" closed. {n} tasks come back with it.',
  },

  "shortcut.open": "Change the shortcut",
  "shortcut.title": "Shortcut to show and hide",
  "shortcut.explain": "Works from any app, with the To-Do in the background.",
  "shortcut.current": "Shortcut",
  "shortcut.press": "Press the keys…",
  "shortcut.change": "Change the shortcut (now {shortcut})",
  "shortcut.needsModifierMac": "Use ⌃, ⌥ or ⌘ along with another key.",
  "shortcut.needsModifierOther": "Use Ctrl or Alt along with another key.",
  "shortcut.saved": "Done: {shortcut} shows and hides the window.",
  "shortcut.notRemembered":
    "{shortcut} works now, but it won't be remembered next time.",
  "shortcut.taken":
    "Another app already uses that combination. {shortcut} still works.",
  "shortcut.inactive":
    "{shortcut} isn't working — another app took the combination. Pick another one.",
  "shortcut.stealsCommand":
    "Combinations with ⌘ stop working inside other apps.",
  "shortcut.stealsSuper":
    "Combinations with the Windows key may be reserved by the system.",
  "shortcut.reset": "Restore default",
  "shortcut.done": "Done",

  "tabs.label": "Tabs",
  "tabs.new": "New tab",
  "tabs.newHint": "New tab ({shortcut})",
  "tabs.withShortcut": "{name} ({shortcut})",
  "tabs.close": 'Close tab "{name}"',
  "tabs.rename": "Rename tab",
  "tabs.defaultName": "List {n}",

  "error.load": "Couldn't load your tasks. Nothing was lost.",
  "error.rescued":
    "Couldn't read your task file. It was kept intact alongside, and the app opened with a fresh list.",
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
  "error.shortcutRead": "Couldn't read the shortcut. The panel can't open right now.",
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
