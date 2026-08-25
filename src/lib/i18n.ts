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
  // A mesma frase com o atalho pendurado (Adendo 12): passada a faixa de 6
  // segundos, este é o único lugar permanente onde a combinação fica legível —
  // custo de altura zero numa região viva que já existia. Só aparece com a lista
  // em dia (o rodapé ocupado com contagem não precisa de mais texto) e só quando
  // o atalho vale — anunciar tecla morta é o que o Adendo 12 veio tirar.
  "footer.allDoneHint": "Tudo em dia — {shortcut} esconde",
  "footer.clearCompleted": "Limpar concluídas",

  "task.placeholder": "Nova tarefa…",
  "task.new": "Nova tarefa",
  "task.edit": "Editar tarefa",
  "task.remove": 'Remover "{title}"',
  // Colar além do limite era truncamento em silêncio: 400 caracteres viravam 200
  // e o resto sumia sem sinal (Adendo 12). Digitar no limite não avisa — o
  // contador dos últimos 20 já cobre esse caso; a faixa é só para o corte grande.
  "task.pasteTruncated":
    "O texto colado passava de {max} caracteres e foi cortado no limite.",
  // Só para leitor de tela, e SÓ ela: o destaque da data escrita no título é
  // tinta (uma pílula em cinza), e tinta não é lida. A palavra entra entre
  // parênteses ao lado do trecho — "pagar boleto 20/08 (hoje)" —, que é como
  // alguém diria a mesma coisa em voz alta.
  "task.today": "hoje",

  // --- menu de contexto (Adendo 13) ---
  //
  // As frases do menu falam do GESTO, não de metadado: "Repetir · Todo dia", e
  // nunca "Recorrência: diária" — vocabulário de formulário para um menu de dois
  // itens seria o mesmo erro que "preferências" no painel.
  "menu.moveTo": "Mover para",
  "menu.repeat": "Repetir",
  "menu.repeatNone": "Nunca",
  "menu.repeatDaily": "Todo dia",
  "menu.repeatWeekly": "Toda semana",
  "menu.repeatMonthly": "Todo mês",
  // O `title` do glifo de repetição na linha — a tinta sozinha não diz o período,
  // e o leitor de tela recebe a mesma frase por `aria-label`.
  "task.repeatsDaily": "Repete todo dia",
  "task.repeatsWeekly": "Repete toda semana",
  "task.repeatsMonthly": "Repete todo mês",

  // --- lembrete (Adendo 14) ---
  //
  // "Lembrar" e não "Notificação": o menu fala do gesto que o usuário pede, e não
  // do mecanismo do sistema operacional que o cumpre. É a mesma régua de "Repetir"
  // em vez de "Recorrência".
  //
  // Os três períodos são ditos em relação à DATA ("na data", "um dia antes"), e
  // nunca em horas ou em contagem de dias: a data está escrita ali no título, e a
  // frase que se lê ao lado dela é a que diz de que dia se trata sem obrigar
  // ninguém a fazer conta.
  "menu.remind": "Lembrar",
  "menu.remindNone": "Não lembrar",
  "menu.remindOnDate": "Na data",
  "menu.remindDayBefore": "Um dia antes",
  "menu.remindWeekBefore": "Uma semana antes",
  // O `title` do sino na linha, com a hora dentro: ela não aparece em nenhum
  // outro lugar da interface, e sem ela o usuário só descobre quando o aviso
  // chega. `{time}` vem formatado pelo `Intl` na convenção do sistema — 9h no
  // Brasil, 9:00 AM nos Estados Unidos.
  "task.remindsOnDate": "Avisa na data, às {time}",
  "task.remindsDayBefore": "Avisa um dia antes, às {time}",
  "task.remindsWeekBefore": "Avisa uma semana antes, às {time}",
  // O aviso já foi dado: o sino continua na linha (a escolha está lá), mas ele
  // não promete mais nada. Dizer "avisa" de um alarme que já tocou seria a
  // interface afirmando um futuro que não existe.
  "task.remindedAlready": "O aviso deste lembrete já foi dado",

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

  // --- as variantes do Linux (Adendo 12, segunda rodada) ---
  //
  // No Linux a bandeja pode simplesmente não existir (GNOME sem a extensão
  // AppIndicator), e a barra de tarefas é a via que o Adendo 12 garantiu
  // (`skipTaskbar: false` lá). Uma instrução em tinta apontando para um ícone
  // que não está na tela é pior que nenhuma — então as frases de volta do Linux
  // lideram com a barra de tarefas e citam a bandeja como segunda via.
  "empty.wayBackTrayLinux": "Ou pela janela na barra de tarefas — ou o ícone {place}.",
  "empty.wayBackTrayPrimaryLinux":
    "Traga a janela de volta pela barra de tarefas, ou pelo ícone {place}.",
  "empty.hintInactiveLinux":
    "O atalho não está valendo — volte pela barra de tarefas, e escolha outro na engrenagem.",

  // --- atalho morto (Adendo 12) ---
  //
  // Quando o sistema recusou a combinação (`active: false`), ensinar a tecla em
  // peso 500 seria ensinar uma tecla morta — e a pessoa que apertasse Escape
  // confiando nela cairia no pior desfecho do app. A hierarquia inverte: a via
  // em tinta passa a ser a bandeja, e a frase em névoa diz o que houve e aponta
  // a engrenagem, que é onde se escolhe outra.
  "empty.wayBackTrayPrimary":
    "Clique no ícone {place} para mostrar e esconder a janela.",
  "empty.shortcutTaken":
    "{shortcut} está ocupado por outro aplicativo. Escolha outro atalho na engrenagem, no topo da janela.",
  // A versão do estado vazio de quem já usou o app: uma frase só, com as duas
  // saídas — a via que funciona agora e o lugar onde se conserta a que não.
  "empty.hintInactive":
    "O atalho não está valendo — clique no ícone {place}, ou escolha outro na engrenagem.",

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
  // A mesma faixa quando o atalho não está valendo (Adendo 12): ensinar a tecla
  // morta aqui seria pior que não ensinar nada, e a bandeja é a via que existe.
  "onboarding.roundTripTray": "A janela volta pelo ícone {place}.",
  // No Linux, a barra de tarefas primeiro — a bandeja pode nem existir lá.
  "onboarding.roundTripTrayLinux":
    "A janela volta pela barra de tarefas ou pelo ícone {place}.",

  "notice.dismiss": "Dispensar aviso",
  "notice.undo": "Desfazer",
  // O botão que abre a frase crua do backend dentro da faixa de erro. Existia só
  // no `title`, que é mouse-only — leitor de tela e teclado não alcançavam nem o
  // caminho do arquivo resgatado, a informação mais importante que o app dá.
  "notice.details": "Detalhes",

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
  // Mover não destrói nada, mas ganha a mesma faixa: a tarefa sumiu da lista
  // que está na tela, e o desfazer é o mesmo comando na direção contrária.
  "undo.movedTo": 'Movida para "{name}".',

  // --- painel do atalho global (Adendo 9) ---
  //
  // A combinação é escolha do usuário, e este é o único lugar do app onde existe
  // configuração. As frases falam de TECLAS e de o que acontece com elas — nunca de
  // "preferências" nem de "opções", que é vocabulário de painel de controle e não
  // dos dois gestos concretos que este painel oferece.
  // **O rótulo da engrenagem.** Já foi "Trocar o atalho" (um assunto) e "Atalho e
  // versão" (dois); com o Adendo 13 o painel tem quatro — atalho, início com o
  // sistema, dados e versão — e enumerar parou de escalar. "Configurações" venceu
  // porque virou verdade: agora HÁ mais de uma configuração, e o nome genérico só
  // era proibido enquanto prometia mais do que a engrenagem entregava.
  "shortcut.open": "Configurações",
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

  // --- versão e atualização (Adendo 10) ---
  //
  // A verificação é a ÚNICA requisição de rede do app, e ela sai de um clique —
  // não há checagem na abertura nem temporizador. `update.explain` diz isso na
  // tela de propósito: o produto promete que nada sai desta máquina, e a promessa
  // vale mais dita no lugar onde ela poderia ser quebrada do que só no README.
  "update.title": "Versão",
  "update.current": "Você está na {version}.",
  "update.explain":
    "Verificar é a única vez que o app acessa a rede — e só quando você pede.",
  "update.check": "Verificar se há versão nova",
  "update.checking": "Verificando…",
  "update.upToDate": "Esta é a versão mais recente.",
  // Nomeia a versão que o botão vai instalar. O painel não pode dizer "0.3.0
  // disponível" e instalar outra coisa, e é por isso que o backend guarda o
  // resultado da verificação em vez de consultar de novo na instalação.
  "update.available": "A {version} já está disponível.",
  // "e reiniciar" está no rótulo porque é o que acontece, e acontece sem pedir
  // licença: a janela vai sumir. Prometer só "atualizar" faria a reinicialização
  // parecer um susto em vez de o passo final do gesto.
  "update.install": "Atualizar e reiniciar",
  "update.installing": "Baixando… o app reinicia sozinho quando terminar.",
  // A condição permanente do `.deb`/`.rpm` (Adendo 12): não é falha, é o formato
  // da instalação. Em névoa, não em vermelho — e o botão desliga junto, porque
  // oferecer nova tentativa do que nunca funciona é o convite errado.
  "update.noChannel":
    "Esta instalação atualiza pelo gerenciador de pacotes do sistema, não por aqui.",

  // --- início com o sistema (Adendo 13) ---
  //
  // A promessa do atalho global quebra em silêncio no primeiro reinício da
  // máquina se o processo não subir junto. É a segunda configuração do app, e
  // passa no teste do Adendo 9: uma decisão sobre a máquina do usuário que o app
  // não pode tomar sozinho.
  "autostart.title": "Início",
  "autostart.label": "Iniciar com o sistema",
  "autostart.explain":
    "Abre o NoCom sozinho quando você entra no computador — o atalho vale desde o começo.",

  // --- exportar e importar (Adendo 13) ---
  //
  // O caminho de levar tudo para outro computador sem nuvem. As frases dizem as
  // duas garantias que importam: exportar não tira nada daqui, e importar nunca
  // remove o que já existe.
  "data.title": "Seus dados",
  "data.explain":
    "Um arquivo local leva abas e tarefas para outro computador. Importar acrescenta; nunca remove.",
  "data.export": "Exportar…",
  "data.import": "Importar…",
  // O nome sugerido no diálogo de salvar. É texto do usuário como outro
  // qualquer: "tarefas" num sistema em inglês seria a única palavra da
  // interface fora do dicionário.
  "data.exportFileName": "nocom-tarefas.json",
  // O caminho completo do arquivo vai no `title` da linha de status, como todo
  // detalhe cru.
  "data.exported": "Tudo exportado.",
  // As duas metades compostas por `data.imported`: cada uma com o próprio plural,
  // porque "1 tarefas novas" não é frase.
  "data.imported": "Importado: {todos}, {tabs}.",
  "data.importedTodos": {
    zero: "nenhuma tarefa nova",
    one: "1 tarefa nova",
    other: "{n} tarefas novas",
  },
  "data.importedTabs": {
    zero: "nenhuma aba nova",
    one: "1 aba nova",
    other: "{n} abas novas",
  },
  "data.importedNothing": "Nada novo: tudo que está no arquivo já estava aqui.",

  "tabs.label": "Abas",
  "tabs.new": "Nova aba",
  "tabs.newHint": "Nova aba ({shortcut})",
  // O nome inteiro da aba mais a tecla que salta até ela. Vive no `title` do chip
  // porque o chip trunca e o `title` já precisava existir; o atalho pega a carona
  // e deixa de ser invisível.
  "tabs.withShortcut": "{name} ({shortcut})",
  "tabs.close": 'Fechar aba "{name}"',
  // O `×` da aba ATIVA anuncia o `⌘W` (Adendo 13): é ela que a tecla fecha, e o
  // `title` é onde os outros atalhos da faixa já moram.
  "tabs.closeHint": 'Fechar aba "{name}" ({shortcut})',
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
  "error.move": "Não foi possível mover. A tarefa continua onde estava.",
  "error.repeat": "Não foi possível trocar a repetição. Nada mudou.",
  "error.remind": "Não foi possível trocar o lembrete. Nada mudou.",
  // A volta da recorrência falhou: a rotina continua concluída, e a informação
  // de que nada se perdeu é a metade que importa.
  "error.revive": "Não foi possível repetir as tarefas do período. Nada foi perdido.",
  "error.autostartRead": "Não foi possível ler o início com o sistema.",
  "error.autostart": "Não foi possível trocar o início com o sistema. Nada mudou.",
  "error.export": "Não foi possível exportar. Seus dados continuam intactos aqui.",
  "error.import": "Não foi possível importar. Nada mudou nos seus dados.",
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
  // As duas metades de sempre: o que falhou e o que aconteceu com o app. Sem rede,
  // endpoint fora, ou `latest.json` sem entrada para esta plataforma (o caso do
  // `.deb` e do `.rpm`) chegam todos aqui, e em nenhum deles algo foi tocado.
  "error.updateCheck": "Não foi possível verificar. Nada mudou no app.",
  // A instalação valida a assinatura antes de escrever, então falhar aqui é falhar
  // ANTES de mexer no app — e é isso que a frase precisa dizer, porque "não foi
  // possível atualizar" sozinho deixa a pessoa sem saber se o app quebrou.
  "error.updateInstall":
    "Não foi possível atualizar. O app continua na {version}, intacto.",
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
  "footer.allDoneHint": "All clear — {shortcut} hides",
  "footer.clearCompleted": "Clear completed",

  "task.placeholder": "New task…",
  "task.new": "New task",
  "task.edit": "Edit task",
  "task.remove": 'Remove "{title}"',
  "task.pasteTruncated":
    "The pasted text went past {max} characters and was cut at the limit.",
  "task.today": "today",

  "menu.moveTo": "Move to",
  "menu.repeat": "Repeat",
  "menu.repeatNone": "Never",
  "menu.repeatDaily": "Every day",
  "menu.repeatWeekly": "Every week",
  "menu.repeatMonthly": "Every month",
  "task.repeatsDaily": "Repeats every day",
  "task.repeatsWeekly": "Repeats every week",
  "task.repeatsMonthly": "Repeats every month",
  "menu.remind": "Remind me",
  "menu.remindNone": "Don't remind",
  "menu.remindOnDate": "On the date",
  "menu.remindDayBefore": "A day before",
  "menu.remindWeekBefore": "A week before",
  "task.remindsOnDate": "Alerts on the date, at {time}",
  "task.remindsDayBefore": "Alerts a day before, at {time}",
  "task.remindsWeekBefore": "Alerts a week before, at {time}",
  "task.remindedAlready": "This reminder has already gone off",

  "list.loading": "Loading…",
  "empty.title": "Nothing here yet.",
  "empty.hint": "{shortcut} shows and hides the window.",

  "empty.firstRunAction": "Type your first task above and press Enter.",
  "empty.wayBackShortcut":
    "{shortcut} shows and hides the window, from any app.",
  "empty.wayBackTray": "Or click the icon {place}.",
  "empty.wayBackTrayLinux": "Or the window in the taskbar — or the icon {place}.",
  "empty.wayBackTrayPrimary":
    "Click the icon {place} to show and hide the window.",
  "empty.wayBackTrayPrimaryLinux":
    "Bring the window back from the taskbar, or the icon {place}.",
  "empty.hintInactiveLinux":
    "The shortcut isn't working — come back through the taskbar, and pick another in the gear.",
  "empty.shortcutTaken":
    "{shortcut} is taken by another app. Pick another shortcut in the gear, at the top of the window.",
  "empty.hintInactive":
    "The shortcut isn't working — click the icon {place}, or pick another in the gear.",

  "tray.placeMenuBar": "in the menu bar",
  "tray.placeNotificationArea": "in the notification area",

  "onboarding.roundTrip": "{shortcut} hides the window — and brings it back.",
  "onboarding.roundTripTray": "The window comes back from the icon {place}.",
  "onboarding.roundTripTrayLinux":
    "The window comes back from the taskbar or the icon {place}.",

  "notice.dismiss": "Dismiss notice",
  "notice.undo": "Undo",
  "notice.details": "Details",

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
  "undo.movedTo": 'Moved to "{name}".',

  "shortcut.open": "Settings",
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

  "update.title": "Version",
  "update.current": "You're on {version}.",
  "update.explain":
    "Checking is the only time the app touches the network — and only when you ask.",
  "update.check": "Check for a new version",
  "update.checking": "Checking…",
  "update.upToDate": "This is the latest version.",
  "update.available": "{version} is available.",
  "update.install": "Update and restart",
  "update.installing": "Downloading… the app restarts on its own when it's done.",
  "update.noChannel":
    "This install updates through your system's package manager, not from here.",

  "autostart.title": "Startup",
  "autostart.label": "Start with the system",
  "autostart.explain":
    "Opens NoCom on its own when you log in — the shortcut works from the start.",

  "data.title": "Your data",
  "data.explain":
    "One local file carries tabs and tasks to another computer. Importing adds; it never removes.",
  "data.export": "Export…",
  "data.import": "Import…",
  "data.exportFileName": "nocom-tasks.json",
  "data.exported": "Everything exported.",
  "data.imported": "Imported: {todos}, {tabs}.",
  "data.importedTodos": {
    zero: "no new tasks",
    one: "1 new task",
    other: "{n} new tasks",
  },
  "data.importedTabs": {
    zero: "no new tabs",
    one: "1 new tab",
    other: "{n} new tabs",
  },
  "data.importedNothing": "Nothing new: everything in the file was already here.",

  "tabs.label": "Tabs",
  "tabs.new": "New tab",
  "tabs.newHint": "New tab ({shortcut})",
  "tabs.withShortcut": "{name} ({shortcut})",
  "tabs.close": 'Close tab "{name}"',
  "tabs.closeHint": 'Close tab "{name}" ({shortcut})',
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
  "error.move": "Couldn't move it. The task stayed where it was.",
  "error.repeat": "Couldn't change the repeat. Nothing changed.",
  "error.remind": "Couldn't change the reminder. Nothing changed.",
  "error.revive": "Couldn't bring back this period's repeating tasks. Nothing was lost.",
  "error.autostartRead": "Couldn't read the start-with-system setting.",
  "error.autostart": "Couldn't change start with the system. Nothing changed.",
  "error.export": "Couldn't export. Your data here is intact.",
  "error.import": "Couldn't import. Nothing changed in your data.",
  "error.tabCreate": "Couldn't create the tab.",
  "error.tabRename": "Couldn't rename the tab. The previous name was kept.",
  "error.tabClose": "Couldn't close the tab. Nothing was removed.",
  "error.tabRemember": "The tab changed, but it won't be remembered next time.",
  "error.hide": "Couldn't hide the window. Use {shortcut} or the tray icon.",
  "error.drag": "Couldn't move the window.",
  "error.shortcutRead": "Couldn't read the shortcut. The panel can't open right now.",
  "error.focus": "The cursor may not land in the field when the window opens.",
  "error.updateCheck": "Couldn't check for updates. Nothing changed in the app.",
  "error.updateInstall":
    "Couldn't update. The app is still on {version}, intact.",
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

const plurals: Record<Locale, Intl.PluralRules> = {
  "pt-BR": new Intl.PluralRules("pt-BR"),
  en: new Intl.PluralRules("en"),
};

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
 * Traduz uma chave num idioma dado. É o `t` de baixo com o idioma por
 * parâmetro, e existe separado por uma razão só: os testes precisam ver as
 * DUAS línguas — a sobreposição do `zero` e a concordância do plural são
 * regras escritas à mão, por idioma —, e `t` está preso ao locale detectado
 * na carga do módulo, que muda de máquina para máquina.
 */
export function translate(
  idioma: Locale,
  key: MessageKey,
  params?: Params,
): string {
  const entry = DICTS[idioma][key];
  if (typeof entry === "string") return interpolate(entry, params);

  const n = params?.n;
  if (typeof n !== "number") return interpolate(entry.other, params);

  // `zero` é uma sobreposição explícita do autor, aplicada antes da biblioteca:
  // ver o comentário em `pending.count`.
  const categoria =
    n === 0 && entry.zero !== undefined ? "zero" : plurals[idioma].select(n);
  return interpolate(entry[categoria] ?? entry.other, params);
}

/**
 * Traduz uma chave. Com `params.n` presente e a entrada sendo plural, escolhe a
 * categoria pelo `Intl.PluralRules` do idioma ativo — o que faz uma língua com
 * `few`/`many` (russo, polonês) ser uma mudança de dados, não de código.
 */
export function t(key: MessageKey, params?: Params): string {
  return translate(locale, key, params);
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
