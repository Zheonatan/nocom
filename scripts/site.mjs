#!/usr/bin/env node
/* Gera a landing page do NoCom -- `site/index.html` (pt-BR) e `site/en/index.html`.
 *
 * POR QUE UM GERADOR, E NAO DOIS ARQUIVOS A MAO. A pagina existe em duas linguas
 * e nao tem etapa de build: manter dois HTMLs em paralelo garante que um dia eles
 * divirjam e ninguem note. Aqui o portugues e o dicionario canonico e o ingles e
 * conferido contra ele -- chave faltando ou chave sobrando aborta a geracao, do
 * mesmo jeito que `src/lib/i18n.ts` quebra o build do app. E a mesma disciplina
 * de `scripts/marca.mjs`: um lugar com os numeros, e o resto derivado dele.
 *
 * O QUE ELE COPIA. As fontes vem de `node_modules` (auto-hospedadas: a pagina nao
 * faz uma unica requisicao de terceiro), a marca de `assets/marca` e os favicons de
 * `public`. Nada e baixado em tempo de build.
 *
 * O QUE ELE EMBUTE. O especime da janela -- o DOM montado do app, o CSS dele e as
 * cotas medidas -- vem de `assets/especime/`, gerado por `npm run vitrine`. Ele e
 * INLINE e nao copiado, porque entra numa shadow root declarativa: ver
 * `especime` abaixo e o cabecalho de `scripts/vitrine/captura.mjs`, que
 * explica por que a folha deixou de mostrar um PNG.
 *
 * COMO RODAR:
 *   node scripts/site.mjs           gera `site/`
 *   node scripts/site.mjs --check   falha se o que esta em disco divergir
 *
 * O `--check` e o que a CI roda antes de publicar: se alguem editar o HTML gerado
 * a mao, a publicacao para em vez de sobrescrever a edicao em silencio. */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ARQUIVO_IMPRESSAO,
  impressaoDaFonte,
} from "./vitrine/impressao.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const SAIDA = join(RAIZ, "site");

const CONFERIR = process.argv.includes("--check");

const URL_SITE = "https://zheonatan.github.io/nocom";
const REPO = "https://github.com/Zheonatan/nocom";
/* A versao sai do package.json, e nao de uma constante escrita aqui. O
   `publicar.mjs` sobe o numero em seis arquivos, mas NAO conhece este -- entao
   uma constante fixa fica para tras a cada release, e o sintoma e a landing
   page oferecendo o download de uma versao que nao e mais a atual. Sem erro
   nenhum na geracao, que e o que torna a coisa dificil de notar. */
const VERSAO = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).version;
const BAIXAR = REPO + "/releases/download/v" + VERSAO + "/";

/* ==========================================================================
   1. Os arquivos que a pagina serve junto
   ========================================================================== */

const COPIAS = [
  // Fontes auto-hospedadas. Latin basta: o portugues cabe inteiro nele.
  ["node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2", "fontes/archivo-latin-wght-normal.woff2"],
  ["node_modules/@fontsource-variable/azeret-mono/files/azeret-mono-latin-wght-normal.woff2", "fontes/azeret-mono-latin-wght-normal.woff2"],
  /* A voz de exibicao da folha: cantos chanfrados que leem como papel dobrado.
     Um peso so -- uma voz. */
  ["node_modules/@fontsource/chakra-petch/files/chakra-petch-latin-600-normal.woff2", "fontes/chakra-petch-latin-600-normal.woff2"],
  /* A QUARTA FAMILIA, e ela nao e escolha de gosto: e a tipografia do APP.
     Enquanto o especime era um PNG, a Geist viajava como pixel dentro dele. Agora
     que ele e DOM, a folha precisa da fonte de verdade -- sem ela o desenho da
     janela sai na fallback do sistema, com outras metricas, e deixa de ser fiel
     ao que a pessoa vai instalar. Os dois subconjuntos com `unicode-range`, como
     `src/index.css` declara: o navegador baixa so o que o texto pede. */
  ["node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2", "fontes/geist-latin-wght-normal.woff2"],
  ["node_modules/@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2", "fontes/geist-latin-ext-wght-normal.woff2"],
  // A marca e o card social que o Slack, o GitHub e o Twitter mostram.
  ["assets/marca/nocom.svg", "marca/nocom.svg"],
  ["assets/marca/card-social.png", "marca/card-social.png"],
  ["public/favicon-16.png", "favicon-16.png"],
  ["public/favicon-32.png", "favicon-32.png"],
];

/* ==========================================================================
   2. Dicionario. O portugues e canonico; o ingles e conferido contra ele.

   REGRA DE TEXTO DESTA PAGINA: cada frase precisa ajudar alguem a decidir
   instalar. Explicacao que serve a quem construiu o app, e nao a quem vai usar,
   mora no README -- nao aqui. A pagina perdeu de proposito a dissertacao sobre
   assinatura ad-hoc e quarentena do Homebrew, a nota sobre o conjunto de folhas
   que nao existe, o aviso de que 2 s nao e benchmark, o inventario de metricas
   ausentes, e as quatro negativas da regra de data. O passo continua; o ensaio
   tecnico foi embora.
   ========================================================================== */

const pt = {
  lang: "pt-BR",
  titulo: "NoCom — uma lista de tarefas que vive por cima do seu trabalho",
  descricao:
    "Uma lista de tarefas de 360 × 480 px que aparece com um atalho global, flutua por cima do que você está fazendo e guarda tudo num arquivo local. Sem conta, sem nuvem, sem telemetria. macOS, Windows e Linux, MIT.",
  pular: "Ir para a instalação",
  outra_lingua: "English",

  bt_campos: [
    ["versão", VERSAO],
    ["licença", "MIT"],
  ],
  assunto: "Uma lista de tarefas que vive por cima do seu trabalho.",
  assunto_sub:
    "Aparece com um atalho, some com <em>Escape</em>, e guarda tudo no seu computador. Sem conta, sem nuvem.",

  seletor_rotulo: "Sistema",
  aviso_movel:
    "O NoCom é um app de computador. Abra esta página no macOS, Windows ou Linux para instalar.",

  sistemas: [
    { chave: "macos", nome: "macOS" },
    { chave: "windows", nome: "Windows" },
    { chave: "linux", nome: "Linux" },
  ],

  especime_h2: "A janela",
  especime_alt:
    "A janela do NoCom: as abas Trabalho e Casa, um campo de nova tarefa e sete tarefas. Duas têm a data numa coluna à direita, a de hoje está destacada em vermelho, e a última está concluída e riscada.",
  cota_lembrar: "lembrar",
  cota_anotado: "anotado",
  legenda_titulo: "Escala 1:1",
  legenda:
    "é este o espaço que ela ocupa na sua tela, e ela só está lá quando você chama.",
  detalhe_rotulo: "Detalhe · 2:1",
  chamadas: {
    campo: {
      nome: "O campo",
      texto: "<code>⌃⌥T</code> mostra a janela e já põe o cursor aqui. A mão não sai do teclado.",
    },
    abas: {
      nome: "As abas",
      texto: "Contextos separados (projeto, casa, hoje), criados e nomeados no mesmo gesto.",
    },
    data: {
      nome: "A data",
      texto: "Escreva uma data no título e ela vai para a coluna da direita, vermelha no dia.",
    },
    concluida: {
      nome: "A concluída",
      texto: "Concluir risca, desbota e manda para o fim da lista. Nunca apaga.",
    },
    sair: {
      nome: "A saída",
      texto: "<code>Escape</code> esconde a janela. O atalho traz de volta, com a lista como estava.",
    },
  },
  botao_varredura: "Correr os 2 segundos",
  puxao_dica:
    "Experimente aqui mesmo: <code>⌃⌥T</code> esconde a janela e traz de volta.",
  puxao_botao_rotulo: "Dobrar ou desdobrar a janela (⌃⌥T)",

  instalar_h2: "Instalar",
  copiar: "copiar",
  copiado: "copiado",
  anuncio_copiado: "Comando copiado.",
  anuncio_falhou: "Não foi possível copiar. Selecione a linha e copie à mão.",
  anuncio_selecionado: "Comando selecionado. Copie com o atalho do seu sistema.",
  ver_nota: "Antes da primeira abertura:",
  nota_palavra: "nota",

  instalar: {
    macos: {
      via: "Homebrew (recomendado)",
      comandos: [
        "brew tap Zheonatan/tap",
        "brew trust --cask Zheonatan/tap/nocom",
        "brew install --cask nocom",
      ],
      alternativa:
        'Ou baixe o <code>.dmg</code>: <a href="' + BAIXAR + "NoCom_" + VERSAO + '_aarch64.dmg">Apple&nbsp;Silicon</a> · <a href="' + BAIXAR + "NoCom_" + VERSAO + '_x64.dmg">Intel</a>.',
      nota: "1",
    },
    windows: {
      via: "winget (recomendado)",
      comandos: ["winget install Zheonatan.NoCom"],
      alternativa:
        'Ou baixe o <a href="' + BAIXAR + "NoCom_" + VERSAO + '_x64-setup.exe">.exe</a>. Pelo <code>winget</code> não aparece aviso nenhum.',
      nota: "1",
    },
    linux: {
      via: "pacote direto",
      comandos: ["sudo dpkg -i NoCom_" + VERSAO + "_amd64.deb"],
      alternativa:
        'Baixe primeiro: <a href="' + BAIXAR + "NoCom_" + VERSAO + '_amd64.deb">.deb</a> · <a href="' + BAIXAR + "NoCom-" + VERSAO + '-1.x86_64.rpm">.rpm</a> · <a href="' + BAIXAR + "NoCom_" + VERSAO + '_amd64.AppImage">AppImage</a>.',
      nota: "—",
    },
  },

  calibre_h2: "Em números",
  calibre_th: ["característica", "valor", "observação"],
  calibre: [
    ["Preço", "0", "gratuito, e continua"],
    ["Contas", "0", "não há login"],
    ["Nuvem", "0", "nada sai do seu computador"],
    ["Telemetria", "0", "o app não fala com a rede"],
    ["Arquivo de dados", "1", "<code>todos.json</code>, no seu computador"],
    ["Janela", "360 × 480", "px, sempre por cima"],
    ["Sistemas", "3", "macOS, Windows, Linux"],
    ["Licença", "MIT", "código aberto"],
  ],

  notas_h2: "Notas",
  nota1_titulo: "Primeira abertura",
  nota1: {
    macos: {
      citacao:
        "Não foi possível abrir o “NoCom” — a Apple não consegue verificar se ele está livre de malware.",
      fonte: "o que o macOS mostra",
      corpo:
        "<strong>Nunca clique em “Mover para o Lixo”</strong> — esse botão apaga o app. O NoCom é assinado, mas com uma assinatura ad-hoc, sem certificado pago e sem notarização da Apple: o sistema bloqueia a primeira abertura. Versões anteriores dizem que o app “está danificado” — não está, e o comando é o mesmo. Para liberar:",
      comando: 'xattr -dr com.apple.quarantine "/Applications/NoCom.app"',
      depois: "Instalando pelo Homebrew, repita a cada <code>brew upgrade</code>.",
    },
    windows: {
      citacao: "O Windows protegeu seu PC.",
      fonte: "o que o SmartScreen mostra",
      corpo:
        "Clique em <strong>Mais informações</strong> e depois em <strong>Executar assim mesmo</strong>. O instalador ainda não é assinado; pelo <code>winget</code> o aviso não aparece.",
      comando: "",
      depois: "",
    },
    linux: {
      citacao: "",
      fonte: "",
      corpo: "No Linux não há aviso de sistema: o pacote instala e o app abre direto.",
      comando: "",
      depois: "",
    },
  },
  nota2_titulo: "O que ele não é",
  nota2:
    "Não é gerenciador de projetos: sem prazos, prioridades, subtarefas, etiquetas ou colaboração. É uma lista, e só.",
  nota3_titulo: "Onde ficam as suas tarefas",
  nota3:
    "Num arquivo <code>todos.json</code> no seu computador. Para apagar tudo, apague o arquivo.",

  carimbo_estado_titulo: "Estado do projeto",
  carimbo_estado:
    "Versão <strong>" + VERSAO + "</strong>, em uso diário. Ainda não assinado pela Apple nem pela Microsoft. Encontrou algo estranho? <a href=\"" + REPO + "/issues\">Abra uma issue</a>.",
  carimbo_apoiar_titulo: "Apoiar",
  carimbo_apoiar:
    "Gratuito, sem conta e sem telemetria, e continua assim. <a href=\"https://livepix.gg/zheo\">Pix no LivePix</a> ou <a href=\"https://ko-fi.com/zheos\">cartão no Ko-fi</a>.",
  carimbo_codigo_titulo: "Código",
  carimbo_codigo: "Código-fonte no <a href=\"" + REPO + "\">GitHub</a>, sob licença MIT.",
};

const en = {
  lang: "en",
  titulo: "NoCom — a to-do list that lives on top of your work",
  descricao:
    "A 360 × 480 px to-do list that appears with a global shortcut, floats above whatever you are doing, and keeps everything in a local file. No account, no cloud, no telemetry. macOS, Windows and Linux, MIT.",
  pular: "Skip to install",
  outra_lingua: "Português",

  bt_campos: [
    ["version", VERSAO],
    ["licence", "MIT"],
  ],
  assunto: "A to-do list that lives on top of your work.",
  assunto_sub:
    "Appears with a shortcut, disappears with <em>Escape</em>, and keeps everything on your own machine. No account, no cloud.",

  seletor_rotulo: "System",
  aviso_movel:
    "NoCom is a desktop app. Open this page on macOS, Windows or Linux to install it.",

  sistemas: [
    { chave: "macos", nome: "macOS" },
    { chave: "windows", nome: "Windows" },
    { chave: "linux", nome: "Linux" },
  ],

  especime_h2: "The window",
  especime_alt:
    "The NoCom window: the tabs Work and Home, a new-task field and seven tasks. Two carry a date in a right-hand column, today's is highlighted in red, and the last one is done and struck through.",
  cota_lembrar: "remember",
  cota_anotado: "written",
  legenda_titulo: "Scale 1:1",
  legenda:
    "this is the room it takes on your screen, and it is only there when you call it.",
  detalhe_rotulo: "Detail · 2:1",
  chamadas: {
    campo: {
      nome: "The field",
      texto: "<code>⌃⌥T</code> shows the window and puts the cursor here. Your hand never leaves the keyboard.",
    },
    abas: {
      nome: "The tabs",
      texto: "Separate contexts (project, home, today), created and named in the same gesture.",
    },
    data: {
      nome: "The date",
      texto: "Type a date in the title and it moves to the right-hand column, red on the day.",
    },
    concluida: {
      nome: "The done one",
      texto: "Done strikes through, fades, and moves to the end of the list. It never deletes.",
    },
    sair: {
      nome: "The way out",
      texto: "<code>Escape</code> hides the window. The shortcut brings it back, list untouched.",
    },
  },
  botao_varredura: "Run the 2 seconds",
  puxao_dica:
    "Try it right here: <code>⌃⌥T</code> hides the window and brings it back.",
  puxao_botao_rotulo: "Fold or unfold the window (⌃⌥T)",

  instalar_h2: "Install",
  copiar: "copy",
  copiado: "copied",
  anuncio_copiado: "Command copied.",
  anuncio_falhou: "Could not copy. Select the line and copy it by hand.",
  anuncio_selecionado: "Command selected. Copy it with your system shortcut.",
  ver_nota: "Before you open it the first time:",
  nota_palavra: "note",

  instalar: {
    macos: {
      via: "Homebrew (recommended)",
      comandos: [
        "brew tap Zheonatan/tap",
        "brew trust --cask Zheonatan/tap/nocom",
        "brew install --cask nocom",
      ],
      alternativa:
        'Or download the <code>.dmg</code>: <a href="' + BAIXAR + "NoCom_" + VERSAO + '_aarch64.dmg">Apple&nbsp;Silicon</a> · <a href="' + BAIXAR + "NoCom_" + VERSAO + '_x64.dmg">Intel</a>.',
      nota: "1",
    },
    windows: {
      via: "winget (recommended)",
      comandos: ["winget install Zheonatan.NoCom"],
      alternativa:
        'Or download the <a href="' + BAIXAR + "NoCom_" + VERSAO + '_x64-setup.exe">.exe</a>. Through <code>winget</code> there is no warning at all.',
      nota: "1",
    },
    linux: {
      via: "direct package",
      comandos: ["sudo dpkg -i NoCom_" + VERSAO + "_amd64.deb"],
      alternativa:
        'Download it first: <a href="' + BAIXAR + "NoCom_" + VERSAO + '_amd64.deb">.deb</a> · <a href="' + BAIXAR + "NoCom-" + VERSAO + '-1.x86_64.rpm">.rpm</a> · <a href="' + BAIXAR + "NoCom_" + VERSAO + '_amd64.AppImage">AppImage</a>.',
      nota: "—",
    },
  },

  calibre_h2: "In numbers",
  calibre_th: ["property", "value", "note"],
  calibre: [
    ["Price", "0", "free, and staying that way"],
    ["Accounts", "0", "there is no login"],
    ["Cloud", "0", "nothing leaves your machine"],
    ["Telemetry", "0", "the app never talks to the network"],
    ["Data files", "1", "<code>todos.json</code>, on your machine"],
    ["Window", "360 × 480", "px, always on top"],
    ["Systems", "3", "macOS, Windows, Linux"],
    ["Licence", "MIT", "open source"],
  ],

  notas_h2: "Notes",
  nota1_titulo: "First launch",
  nota1: {
    macos: {
      citacao:
        "“NoCom” can't be opened because Apple cannot check it for malicious software.",
      fonte: "what macOS shows",
      corpo:
        "<strong>Never click “Move to Trash”</strong> — that button deletes the app. NoCom is signed, but with an ad-hoc signature: no paid certificate, no notarisation by Apple, so the system blocks the first launch. Earlier versions say the app “is damaged” — it isn't, and the command is the same. To clear the flag:",
      comando: 'xattr -dr com.apple.quarantine "/Applications/NoCom.app"',
      depois: "Installing through Homebrew, repeat after every <code>brew upgrade</code>.",
    },
    windows: {
      citacao: "Windows protected your PC.",
      fonte: "what SmartScreen shows",
      corpo:
        "Click <strong>More info</strong> and then <strong>Run anyway</strong>. The installer is not signed yet; through <code>winget</code> the warning never appears.",
      comando: "",
      depois: "",
    },
    linux: {
      citacao: "",
      fonte: "",
      corpo: "On Linux there is no system warning: the package installs and the app opens straight away.",
      comando: "",
      depois: "",
    },
  },
  nota2_titulo: "What it is not",
  nota2:
    "Not a project manager: no due dates, priorities, subtasks, labels or collaboration. It is a list, and that is all.",
  nota3_titulo: "Where your tasks live",
  nota3:
    "In a <code>todos.json</code> file on your machine. To delete everything, delete the file.",

  carimbo_estado_titulo: "Project status",
  carimbo_estado:
    "Version <strong>" + VERSAO + "</strong>, in daily use. Not signed by Apple or Microsoft yet. Found something odd? <a href=\"" + REPO + "/issues\">Open an issue</a>.",
  carimbo_apoiar_titulo: "Support",
  carimbo_apoiar:
    "Free, no account, no telemetry, and staying that way. <a href=\"https://livepix.gg/zheo\">Pix via LivePix</a> or <a href=\"https://ko-fi.com/zheos\">card via Ko-fi</a>.",
  carimbo_codigo_titulo: "Code",
  carimbo_codigo: "Source on <a href=\"" + REPO + "\">GitHub</a>, under the MIT licence.",
};

/* O ingles e tipado contra o portugues: chave faltando ou sobrando aborta. */
function conferirDicionario(canonico, traducao, caminho = "") {
  for (const chave of Object.keys(canonico)) {
    const onde = caminho ? caminho + "." + chave : chave;
    if (!(chave in traducao)) {
      throw new Error("dicionário en: falta a chave `" + onde + "`");
    }
    const a = canonico[chave];
    const b = traducao[chave];
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) throw new Error("dicionário en: `" + onde + "` deveria ser lista");
      if (a.length !== b.length) {
        throw new Error(
          "dicionário en: `" + onde + "` tem " + b.length + " itens e o português tem " + a.length
        );
      }
      a.forEach((item, i) => {
        if (item && typeof item === "object") conferirDicionario(item, b[i], onde + "[" + i + "]");
      });
      continue;
    }
    if (a && typeof a === "object") {
      conferirDicionario(a, b, onde);
      continue;
    }
    if (typeof b !== "string") {
      throw new Error("dicionário en: `" + onde + "` deveria ser texto");
    }
  }
  for (const chave of Object.keys(traducao)) {
    if (!(chave in canonico)) {
      const onde = caminho ? caminho + "." + chave : chave;
      throw new Error("dicionário en: chave `" + onde + "` não existe no português");
    }
  }
}

/* ==========================================================================
   3. As chamadas de detalhe
   ==========================================================================

   O desenho anotava TAMANHO e passou a anotar FUNCAO. Ninguem instala um app de
   tarefas porque a janela tem 360 x 480 -- as cotas mediam a coisa que menos
   importa. O dispositivo que substitui e nativo do mesmo mundo: a chamada de
   detalhe, o balao numerado que aponta uma parte, nomeia, e a mostra ampliada numa
   escala declarada. Os numeros nao desapareceram: foram para a tabela, que e onde
   medida pertence.

   UMA LISTA, E TODO O RESTO DERIVADO DELA. `regiao` esta em px da JANELA (360x480,
   canto superior esquerdo dela). Dessa unica fonte saem: o retangulo de realce no
   palco largo (soma 130, 30), o do palco estreito (soma 0, 0), a posicao do balao,
   a linha de chamada, e o recorte 2:1 do detalhe -- que o JavaScript calcula em
   coordenadas do proprio especime. Mexer numa coordenada aqui move as cinco coisas
   juntas; e por isso que elas nao podem divergir.

   A ORDEM E A DA HISTORIA, e nao a espacial: atalho, aba, data, concluir, esconder.
   Numero de chamada em desenho segue a sequencia de uso, nao a de cima para baixo.

   AS REGIOES SAO MEDIDAS, E NAO ESCRITAS. Ate a 0.4.0 elas eram cinco retangulos
   digitados a olho sobre o PNG, e este comentario avisava, por escrito, que regerar
   a captura pedia reconferir os cinco a mao -- sem nada quebrar se ninguem
   reconferisse: a folha so passava a apontar para o lugar errado. Agora
   `npm run vitrine` mede cada regiao no DOM real (por SELETOR, ver `CHAMADAS` em
   `scripts/vitrine/captura.mjs`) e grava `assets/especime/cotas.json`. O que sobra
   aqui e a decisao de composicao que nenhuma medicao toma: de que LADO o balao
   fica, e se o detalhe mostra um pedaco menor que a regiao realcada.

   E elas sao POR LINGUA: o titulo riscado da concluida tem 180px em portugues e
   164px em ingles, e o realce encosta no fim do risco nas duas.

   PALCO LARGO -- 600 x 520. O especime tem exatamente 360x480 (sem margem: ele
   nao e mais um raster com folga para sombra) e entra na posicao (130, 30), entao a
   JANELA ocupa (130, 30) a (490, 510) -- as mesmas coordenadas de antes, para a
   geometria dos baloes nao precisar de uma segunda revisao.

   PALCO ESTREITO -- 360 x 480, com viewBox proprio: o especime entra em (0, 0) e
   ocupa o palco inteiro. Ali nao ha goteira para balao nenhum, entao o estreito
   fica so com o realce, e a lista de chamadas e o unico controle. */

const JANELA = { esq: 130, topo: 30 };

const COTAS = JSON.parse(readFileSync(join(RAIZ, "assets", "especime", "cotas.json"), "utf8"));

/* O CSS do app, purgado ao que o especime usa. Lido uma vez: ele e o mesmo nas
   duas linguas -- `npm run vitrine` purga contra os dois DOMs de proposito. */
const ESPECIME_CSS = readFileSync(join(RAIZ, "assets", "especime", "janela.css"), "utf8").trim();

/* Os `@property` do Tailwind, que vao para o `<head>` e nao para dentro do
   especime. O motivo esta no comentario do `<style>` que os recebe. */
const ESPECIME_PROPRIEDADES = readFileSync(
  join(RAIZ, "assets", "especime", "janela.propriedades.css"),
  "utf8"
).trim();

/* ==========================================================================
   O ESPECIME: A JANELA DE VERDADE, E NAO UMA FOTO DELA
   ==========================================================================

   O que entra na pagina e o DOM montado do app dentro de uma SHADOW ROOT
   DECLARATIVA. Nenhum JavaScript participa: o parser do navegador ve
   `<template shadowrootmode="open">` e prende a shadow root ali, com o CSS do app
   dentro dela.

   POR QUE SHADOW ROOT, e nao um `<div>` com o CSS reescrito. O CSS do app e
   Tailwind v4, que emite `:root,:host` justamente para funcionar dentro de uma
   shadow root -- ele entra verbatim, sem reescrever um seletor, sem parser de CSS
   e sem risco de errar um. E o isolamento vale nos DOIS sentidos: o reset `*` do
   app nao vaza para a folha (ele reescreveria a pagina inteira), e a tipografia da
   folha nao vaza para dentro da janela.

   POR QUE O CSS VAI INLINE, e nao num arquivo com `<link>`. Uma folha ligada de
   dentro da shadow root nao bloqueia a pintura do documento: o especime apareceria
   sem estilo por um instante, na primeira dobra, que e o pior lugar da pagina para
   um lampejo. 24 kB (5 kB comprimidos) e o preco de nao ter esse lampejo -- e ainda
   assim o conjunto pesa menos que o PNG que ele substituiu.

   O TEMA E O DO VISITANTE, PELO MESMO MECANISMO DO APP. `@media
   (prefers-color-scheme: dark)` e do documento e atravessa a shadow root, entao a
   janela troca de tema como o app troca no sistema. Foi assim que os dois PNGs e o
   `<picture>` que escolhia entre eles sairam da pagina.

   ACESSIBILIDADE: `role="img"` com uma etiqueta so. Sem isso, o leitor de tela
   leria as sete tarefas, os dois nomes de aba e cinco botoes de remover -- o
   especime e um DESENHO da janela, e se anuncia como um. `inert` faria o mesmo pelo
   foco, mas apagaria tambem o `aria-label`, deixando o desenho sem nome: quem
   cuida do foco e o `tabindex="-1"` que a extracao poe em cada controle. */
function especime(d, lang) {
  const marcacao = readFileSync(
    join(RAIZ, "assets", "especime", "janela-" + lang + ".html"),
    "utf8"
  ).trim();
  /* `data-ordem` diz a `folha.js` como escrever a data que ele reescreve no
     navegador: dia antes de mes em portugues, mes antes de dia em ingles -- a
     mesma ordem que `stub.js` usou para montar o especime. */
  return `          <div class="especime" role="img" aria-label="${d.especime_alt}"
               data-ordem="${lang === "en" ? "mes" : "dia"}">
            <template shadowrootmode="open">
              <style>${ESPECIME_CSS}</style>
              ${marcacao}
            </template>
            <!-- O DESENHO NAO RENDERIZADO, para o navegador que nao prende shadow
                 root declarativa. O template acima e inerte nele, e sem isto a
                 primeira dobra teria uma caixa vazia de 360x480 onde vive o
                 argumento inteiro da pagina.

                 Ele nao custa uma requisicao nem uma condicao: um shadow host SEM
                 <slot> nao renderiza os filhos de luz, entao quem prende a shadow
                 root nunca ve esta linha, e quem nao prende ve so ela. E a mesma
                 descricao que o aria-label ja carrega -- uma fonte de texto, nao
                 duas.

                 Shadow DOM declarativa e baseline desde o inicio de 2024 (Chrome e
                 Safari em 2023, Firefox 123). A exposicao e pequena; a falha, se
                 acontecesse, seria no pior lugar. -->
            <p class="especime-ausente">${d.especime_alt}</p>
          </div>`;
}

const CHAMADAS = [
  /* `detalhe`, quando existe, e o pedaco que cabe ampliado 2:1 na vidraca de
     560px -- o campo tem 334px de largura e a 2:1 daria 668, entao o detalhe
     mostra a parte que interessa. Realcar so o pedaco recortado fazia o retangulo
     cobrir meio campo, o que parece defeito. */
  { chave: "campo", detalhe: [13, 77, 256, 32], lado: "esq" },
  { chave: "abas", detalhe: [13, 41, 240, 28], lado: "esq" },
  { chave: "data", lado: "dir" },
  { chave: "concluida", lado: "esq" },
  { chave: "sair", lado: "dir" },
];

/* As chamadas desta lingua, com a regiao medida acoplada. */
function chamadasDe(lang) {
  const medidas = COTAS[lang];
  if (!medidas) {
    console.error(
      "assets/especime/cotas.json não tem a língua `" + lang + "`.\n" +
        "Rode `npm run vitrine` para regerar o espécime e as cotas."
    );
    process.exit(1);
  }
  return CHAMADAS.map((c) => {
    if (!medidas[c.chave]) {
      console.error(
        "assets/especime/cotas.json não tem a chamada `" + c.chave + "` em " + lang + ".\n" +
          "Acerte `CHAMADAS` em scripts/vitrine/captura.mjs e rode `npm run vitrine`."
      );
      process.exit(1);
    }
    return { ...c, regiao: medidas[c.chave] };
  });
}

function balao(chamada, i) {
  const [x, y, largura, altura] = chamada.regiao;
  const meio = JANELA.topo + y + altura / 2;
  const esquerda = chamada.lado === "esq";

  /* O balao fica na goteira; a linha sai dele e para onde a seta comeca; a seta
     APONTA PARA a regiao e sua ponta assenta 2px antes da aresta -- nunca por cima
     do conteudo que ela aponta. A ponta e a base saem da aresta, e nao de um
     deslocamento fixo, para os dois lados espelharem de verdade. */
  const tagX = esquerda ? 92 : 512;
  const aresta = esquerda ? JANELA.esq + x : JANELA.esq + x + largura;
  const ponta = esquerda ? aresta - 2 : aresta + 2;
  const base = esquerda ? ponta - 9 : ponta + 9;
  const daLinha = esquerda ? tagX + 24 : tagX - 4;

  return `            <g class="chamada" data-chamada="${chamada.chave}">
              <rect class="balao" x="${tagX}" y="${meio - 10}" width="20" height="20" />
              <text class="balao-num" x="${tagX + 10}" y="${meio + 4}" text-anchor="middle">${i + 1}</text>
              <path class="linha traco" d="M${daLinha},${meio} H${base}" />
              <polygon class="seta" points="${ponta},${meio} ${base},${meio - 3.5} ${base},${meio + 3.5}" />
            </g>`;
}

function chamadasLargas(chamadas) {
  const realces = chamadas.map(
    (c) =>
      `            <rect class="realce" data-realce="${c.chave}" x="${JANELA.esq + c.regiao[0]}" y="${
        JANELA.topo + c.regiao[1]
      }" width="${c.regiao[2]}" height="${c.regiao[3]}" />`
  ).join("\n");

  return `          <svg class="cotas cotas-largas" viewBox="0 0 600 520" width="600" height="520" aria-hidden="true">
${chamadas.map(balao).join("\n")}
${realces}
          </svg>`;
}

function chamadasEstreitas(chamadas) {
  const realces = chamadas.map(
    (c) =>
      `            <rect class="realce" data-realce="${c.chave}" x="${c.regiao[0]}" y="${c.regiao[1]}" width="${c.regiao[2]}" height="${c.regiao[3]}" />`
  ).join("\n");

  return `          <svg class="cotas cotas-estreitas" viewBox="0 0 360 480" width="360" height="480" aria-hidden="true">
${realces}
          </svg>`;
}

function listaDeChamadas(d, chamadas) {
  return chamadas.map((c, i) => {
    const texto = d.chamadas[c.chave];
    return `          <li>
            <button type="button" data-chamada="${c.chave}"
                    data-regiao="${(c.detalhe || c.regiao).join(",")}"
                    aria-pressed="${i === 0 ? "true" : "false"}">
              <span class="chamada-num"><span>${i + 1}</span></span>
              <span class="chamada-nome">${texto.nome}</span>
              <span class="chamada-texto">${texto.texto}</span>
            </button>
          </li>`;
  }).join("\n");
}

/* O ciclo mede o GESTO e nao a janela, entao ele sai do palco e ganha diagrama
   proprio.

   O SVG carrega SO linha, seta e traco. Nenhum texto: ele escala com a coluna, e
   texto escalado fura o piso de 11px no telefone. O numeral e os rotulos sao HTML.

   O numeral fica ACIMA de uma linha inteira, no fluxo normal -- a colocacao
   classica do desenho tecnico, e resolve um defeito real: uma placa opaca no meio
   da linha tapava o unico trecho em que a varredura de 2 s e a unica tinta.

   O bloco todo e `aria-hidden`: a leitura anunciada e a frase da legenda logo
   acima. Um estado, uma voz. A varredura tem 458 unidades (1 a 459), que e o
   `stroke-dasharray` declarado no CSS. */
function cotaCiclo(d) {
  return `        <div class="ciclo-diagrama" aria-hidden="true">
          <span class="ciclo-numeral">2 s</span>
          <svg viewBox="0 0 460 34" width="460" height="34">
            <path class="extensao" d="M1,2 V32" />
            <path class="extensao" d="M459,2 V32" />
            <path class="varredura" d="M1,17 H459" />
            <path class="linha traco" d="M1,17 H459" />
            <polygon class="seta" points="1,17 10,13.5 10,20.5" />
            <polygon class="seta" points="459,17 450,13.5 450,20.5" />
          </svg>
          <p class="ciclo-rotulos">
            <span>${d.cota_lembrar}</span>
            <span>${d.cota_anotado}</span>
          </p>
        </div>`;
}

/* ==========================================================================
   3b. O leque de implantacao
   ==========================================================================

   O palco largo ganhou um FUNDO: o leque de facetas que abre do pacote ate a
   janela -- a folha Miura se desdobrando. Ele e calculado aqui (o gerador roda
   em node, e coordenada calculada nao diverge de coordenada copiada) e desenhado
   em coordenadas do PROPRIO PALCO (600x520), com `overflow: visible` no CSS
   para as facetas longas sangrarem acima e a direita, como papel que nao coube
   na prancha.

   A GEOMETRIA. Origem no centro do pacote (84, 498), abaixo e a esquerda da
   janela -- a regiao que as chamadas nao usam. Doze facetas entre -100 e -6 graus
   (as primeiras inclinam um pouco alem da vertical, para o leque preencher o vao
   entre as colunas), raios alternando longo/curto: a silhueta externa vira o
   zigue-zague da dobra.
   Cada faceta carrega `--i` (a ordem na abertura) e `--fecha` (quantos graus ela
   roda para deitar sobre a ultima espoca, fechada no pacote): o CSS anima a
   abertura uma vez, e o JavaScript dobra e desdobra com o proprio atalho do app.

   O PACOTE e desenhado no mesmo SVG para nunca sair do lugar da origem. Ele e a
   unica tinta vermelha do palco alem do realce: o fecho do leque, com a marca em
   branco e o atalho por extenso embaixo. */

/* Raio longo em 600: o bastante para a borda em zigue-zague contornar a janela
   por cima e pela direita, e nao tanto que a sangria alcance o topo da pagina
   (o palco fica a ~116px do fio do cabecalho, e 600 - 498 = 102 de sangria). */
const LEQUE = { ox: 84, oy: 498, n: 12, a0: -100, a1: -6, rLongo: 600, rCurto: 520 };

function leque() {
  const { ox, oy, n, a0, a1, rLongo, rCurto } = LEQUE;
  const rad = (g) => (g * Math.PI) / 180;
  const ponto = (a, r) => [ox + r * Math.cos(rad(a)), oy + r * Math.sin(rad(a))];
  const arred = (v) => Math.round(v * 10) / 10;

  const espocas = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    espocas.push({ a, p: ponto(a, i % 2 ? rCurto : rLongo) });
  }

  const facetas = espocas.slice(0, -1).map((e, i) => {
    const prox = espocas[i + 1];
    const pontos = [[ox, oy], e.p, prox.p]
      .map(([x, y]) => arred(x) + "," + arred(y))
      .join(" ");
    /* `--fecha` deita a faceta sobre a espoca final; a abertura e o caminho
       inverso. `--i` conta a partir da ULTIMA (a mais deitada abre primeiro,
       como um leque de verdade abre a partir do fecho). */
    const fecha = arred(a1 - e.a);
    /* `--mix` e a luz da faceta: a alternancia montanha/vale da o salto, e o
       angulo escurece devagar rumo a horizontal -- cada face pega a luz do
       proprio plano, em vez de duas tintas chapadas se revezando. */
    const mix = Math.round((i % 2 ? 68 : 16) + 18 * (i / (n - 1)));
    return `      <polygon class="faceta" style="--i:${n - 1 - i};--fecha:${fecha}deg;--mix:${mix}%" points="${pontos}" />`;
  }).join("\n");

  /* Ids de vinco nas facetas que ficam a mostra: acima da janela (espocas
     ingremes, alem do topo do palco) e a direita dela (espocas deitadas, alem
     da aresta). Sao gramatica da forma, nao conteudo: iguais nas duas linguas. */
  const ids = [
    { a: espocas[1].a, r: 560, id: "V-02" },
    { a: espocas[3].a, r: 575, id: "M-05" },
    { a: espocas[5].a, r: 596, id: "V-11" },
    { a: espocas[10].a, r: 560, id: "M-08" },
  ].map(({ a, r, id }) => {
    const [x, y] = ponto(a, r);
    return `      <text class="vinco-id-leque" x="${arred(x)}" y="${arred(y)}">${id}</text>`;
  }).join("\n");

  /* A borda em zigue-zague: a silhueta externa da folha, num traco continuo.
     E ela que faz as pontas soltas lerem como UMA folha dobrada, mesmo com o
     meio do leque escondido atras da janela. */
  const borda = espocas
    .map(({ p: [x, y] }) => arred(x) + "," + arred(y))
    .join(" ");

  return `          <svg class="leque" viewBox="0 0 600 520" width="600" height="520" aria-hidden="true">
    <g class="leque-facetas">
${facetas}
    </g>
    <polyline class="leque-borda" points="${borda}" />
    <g class="leque-ids">
${ids}
    </g>
    <g class="pacote" transform="rotate(-8 ${ox} ${oy})">
      <rect class="pacote-campo" x="${ox - 27}" y="${oy - 27}" width="54" height="54" />
      <circle class="pacote-anel" cx="${ox}" cy="${oy}" r="16.7" />
    </g>
    <text class="pacote-atalho" x="${ox}" y="${oy + 45}" text-anchor="middle">⌃⌥T</text>
  </svg>`;
}

/* ==========================================================================
   4. O template
   ========================================================================== */

/* Texto que entra em ATRIBUTO precisa escapar as proprias aspas: o comando do
   xattr carrega `"` e, cru, terminava o aria-label no meio -- HTML invalido e
   um rotulo truncado no leitor de tela. */
function escaparAtributo(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function comando(id, linhas, d) {
  return linhas
    .map((linha, i) => {
      const alvo = id + "-" + i;
      return `          <div class="comando">
            <code id="${alvo}">${linha}</code>
            <button type="button" class="copiar" data-para="${alvo}"
                    data-anuncio="${d.anuncio_copiado}"
                    data-anuncio-falhou="${d.anuncio_falhou}"
                    data-anuncio-selecionado="${d.anuncio_selecionado}"
                    aria-label="${escaparAtributo(d.copiar + ": " + linha)}">
              <svg class="marca-copiar" viewBox="0 0 12 12" aria-hidden="true" fill="none"
                   stroke="currentColor" stroke-width="1">
                <rect x="0.5" y="2.5" width="7" height="9" />
                <path d="M3.5 2.5V0.5h8v9h-2" />
              </svg>
              <span class="marca-copiar">${d.copiar}</span>
              <svg class="marca-copiado" viewBox="0 0 12 12" aria-hidden="true" fill="none"
                   stroke="currentColor" stroke-width="1.4">
                <path d="M1 6.5 4.5 10 11 2.5" />
              </svg>
              <span class="marca-copiado">${d.copiado}</span>
            </button>
          </div>`;
    })
    .join("\n");
}

function pagina(d, { base, canonico, linkOutraLingua }) {
  const chamadas = chamadasDe(d.lang);
  const calibre = d.calibre
    .map(
      ([carac, valor, obs]) => `            <tr>
              <th scope="row">${carac}</th>
              <td class="valor">${valor}</td>
              <td class="obs">${obs}</td>
            </tr>`
    )
    .join("\n");

  /* Um bloco de instalacao por sistema, e o seletor mostra um de cada vez. Sem
     JavaScript os tres ficam visiveis -- que e a pagina anterior, e ela
     funcionava; quem desaparece nesse caso e o seletor. */
  const instalacoes = d.sistemas
    .map((sistema) => {
      const bloco = d.instalar[sistema.chave];
      return `        <li data-sistema="${sistema.chave}">
          <div class="instalar-cabeca">
            <span class="sistema-nome">${sistema.nome}</span>
            <span class="via">${bloco.via}</span>
          </div>
${comando("cmd-" + sistema.chave, bloco.comandos, d)}
          <p class="alternativa">${bloco.alternativa}</p>
${
  bloco.nota === "—"
    ? ""
    : `          <p class="ref-nota">${d.ver_nota} <a href="#nota-1">${d.nota_palavra} ${bloco.nota}</a>.</p>\n`
}        </li>`;
    })
    .join("\n");

  /* O aviso do sistema tambem segue o seletor: quem esta no Windows nao precisa
     ler a frase que o macOS mostra. O Linux nao tem aviso, e por isso a nota 1
     inteira desaparece quando ele e o escolhido. */
  const avisos = Object.keys(d.nota1)
    .map((chave) => {
      const n = d.nota1[chave];
      return `          <div data-sistema="${chave}">
${
        n.citacao
          ? `            <blockquote class="sistema">
              ${n.citacao}
              <cite>${n.fonte}</cite>
            </blockquote>\n`
          : ""
      }            <p>${n.corpo}</p>
${n.comando ? comando("cmd-liberar-" + chave, [n.comando], d) + "\n" : ""}${
        n.depois ? `            <p class="depois-do-comando">${n.depois}</p>\n` : ""
      }          </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="${d.lang}" class="sem-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${d.titulo}</title>
<meta name="description" content="${d.descricao}">
<link rel="canonical" href="${canonico}">
<link rel="alternate" hreflang="pt-BR" href="${URL_SITE}/">
<link rel="alternate" hreflang="en" href="${URL_SITE}/en/">
<link rel="alternate" hreflang="x-default" href="${URL_SITE}/">
<link rel="icon" href="${base}favicon-32.png" sizes="32x32">
<link rel="icon" href="${base}favicon-16.png" sizes="16x16">
<meta property="og:type" content="website">
<meta property="og:title" content="${d.titulo}">
<meta property="og:description" content="${d.descricao}">
<meta property="og:url" content="${canonico}">
<meta property="og:image" content="${URL_SITE}/marca/card-social.png">
<meta name="twitter:card" content="summary_large_image">
<!-- As fontes sao pre-carregadas do proprio dominio: a pagina nao faz uma unica
     requisicao de terceiro, e nao ha "preconnect" para lugar nenhum. -->
<link rel="preload" href="${base}fontes/archivo-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}fontes/azeret-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}fontes/chakra-petch-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}folha.css">
<!-- OS @property DO TAILWIND, E ELES PRECISAM ESTAR AQUI E NAO NO ESPECIME.
     A regra @property e do DOCUMENTO: dentro de uma shadow root ela e ignorada. O
     Tailwind v4 registra ali cada --tw-* com o initial-value de que as utilidades
     dependem, e sem esse registro "border-style: var(--tw-border-style)" fica sem
     valor -- o campo do especime aparecia literalmente sem borda no Chromium, sem
     um erro no console. Registrar estes nomes no documento nao pinta nada: nenhuma
     regra da folha le uma variavel --tw-*. -->
<style>${ESPECIME_PROPRIEDADES}</style>
<script>document.documentElement.className = "js";</script>
</head>
<body>
<!--
IMPECCABLE DIRECTION CONTRACT · seed 9139ab9b
THESIS: O app abre num puxao, e a pagina e a folha Miura que o prova: um pacote
de bolso que se desdobra na janela inteira. Recusa o heroi de SaaS com screenshot
emoldurado e grade de features -- e recusa polir a folha de cotas anterior.
OWN-WORLD: Folha branca fosca sobre campo de vincos em paralelogramo; facetas e
vincos em cinzas croma-0, montanha mais forte que vale; UMA matiz, o vermelho
destructive do app, no pacote, na acao primaria e no realce. Chakra Petch caps no
display, Archivo no corpo, Azeret Mono em id de vinco, medida e comando. Paineis
com canto chanfrado a 60 graus, botoes em paralelogramo com seta.
STORY: A visitante ve a janela real implantada de um pacote vermelho marcado
⌃⌥T, entende que o app abre num gesto, testa o atalho na propria pagina, e
instala com o comando do sistema dela.
FIRST VIEWPORT: Duas colunas: a esquerda a manchete em display, o subtitulo, o
botao vermelho INSTALAR e o seletor de sistema; a direita o palco -- o leque de
facetas cinzas abrindo do pacote ate a janela de 360x480 em escala 1:1. A
interacao-assinatura: ⌃⌥T dobra e desdobra a janela na pagina, uma vez por gesto.
FORM: O Pacote Miura, desafiante competitivo do catalogo
(paper-folds-pleats-deployable-miura-orbit-sheet), vencedor da rodada; seed 9139ab9b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
<a class="pular" href="#instalar">${d.pular}</a>
<div id="aviso-vivo" class="aviso-vivo" role="status" aria-live="polite"></div>

<div class="folha">

  <header class="topo">
    <div class="topo-marca">
      <!-- A marca sangra no proprio campo preto: o compromisso e um anel branco
           de fio fino num campo preto, com o diametro a 0,62 do campo e o traco a
           campo/64. As fracoes sao as de assets/marca/nocom.svg. -->
      <svg class="bt-marca" viewBox="0 0 1024 1024" role="img" aria-label="NoCom">
        <rect width="1024" height="1024" fill="#000000"/>
        <circle cx="512" cy="512" r="309.44" fill="none" stroke="#ffffff" stroke-width="16"/>
      </svg>
      <h1>NoCom</h1>
    </div>
    <dl class="topo-campos">
${d.bt_campos
  .map(([rotulo, valor]) => `      <div><dt>${rotulo}</dt><dd>${valor}</dd></div>`)
  .join("\n")}
    </dl>
    <nav class="idioma"><a href="${linkOutraLingua}" hreflang="${
    d.lang === "pt-BR" ? "en" : "pt-BR"
  }">${d.outra_lingua}</a></nav>
  </header>

  <!-- A PRIMEIRA DOBRA: o argumento a esquerda, a implantacao a direita. A
       manchete e um <p> com id porque a hierarquia de headings e a mesma de
       antes (h1 NoCom, h2 por secao) e a manchete e assunto, nao secao. -->
  <section class="dobra-abre" aria-labelledby="h-assunto">
    <div class="argumento">
      <p class="manchete" id="h-assunto">${d.assunto}</p>
      <p class="assunto-sub">${d.assunto_sub}</p>
      <p class="acao">
        <a class="botao-implantar" href="#instalar"><span>${d.instalar_h2}</span><svg viewBox="0 0 18 10" width="18" height="10" aria-hidden="true"><path d="M0 5h15M11 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>
      </p>

      <!-- O seletor de sistema usa role=group com aria-pressed, e nao um tablist:
           a pagina nao cumpre a navegacao por setas que um tablist promete, e
           anunciar semantica que a interface nao cumpre e o que o DESIGN.md do
           app proibe. -->
      <div class="seletor" role="group" aria-label="${d.seletor_rotulo}">
        <span class="seletor-rotulo">${d.seletor_rotulo}</span>
        <div class="seletor-botoes">
${d.sistemas
  .map(
    (s) =>
      `          <button type="button" data-escolha="${s.chave}" aria-pressed="false"><span>${s.nome}</span></button>`
  )
  .join("\n")}
        </div>
      </div>

      <p class="aviso-movel" id="aviso-movel" hidden>${d.aviso_movel}</p>
    </div>

    <div class="implantacao">
      <!-- A marca compacta do pacote, so para telas estreitas: o leque nao
           cabe la, mas a origem do gesto continua contada. -->
      <p class="pacote-movel" aria-hidden="true">
        <svg viewBox="0 0 34 34" width="34" height="34">
          <rect class="pacote-campo" x="2" y="2" width="30" height="30" />
          <circle class="pacote-anel" cx="17" cy="17" r="9.3" />
        </svg>
        <span>⌃⌥T</span>
      </p>
      <div class="palco-caixa">
        <div class="palco desenha-alvo">
${leque()}
          <div class="janela-viva">
${especime(d, d.lang)}
${chamadasLargas(chamadas)}
${chamadasEstreitas(chamadas)}
          </div>
          <!-- O controle de verdade do pacote: o desenho vive num SVG
               aria-hidden, entao quem recebe foco, teclado e leitor de tela e
               este botao invisivel por cima dele. -->
          <button type="button" class="pacote-botao" aria-pressed="false" aria-label="${escaparAtributo(d.puxao_botao_rotulo)}"></button>
        </div>
      </div>
      <p class="legenda-palco">
        <b>${d.legenda_titulo}</b> ${d.legenda}
      </p>
      <p class="puxao-dica">${d.puxao_dica}</p>
    </div>
  </section>

  <section class="prancha prancha-janela" aria-labelledby="h-especime">
    <h2 id="h-especime"><span class="vinco-id" aria-hidden="true">M-01</span>${d.especime_h2}</h2>
    <div class="janela-grade">

      <!-- As chamadas sao os controles: escolher uma realca a regiao na janela
           da primeira dobra e move o detalhe ampliado ao lado. Sem JavaScript
           elas continuam legiveis como lista numerada, e o detalhe desaparece em
           vez de ficar parado numa regiao que ninguem escolheu. -->
      <ol class="chamadas">
${listaDeChamadas(d, chamadas)}
      </ol>

      <div class="janela-lado">
        <!-- O detalhe amplia 2:1 uma REGIAO DO ESPECIME, e a vidraca chega
             vazia: folha.js clona o especime aqui dentro e o escala. Ela e
             aria-hidden porque a chamada escolhida ja se anuncia pelo proprio
             botao (um estado, uma voz), e ja era so-com-JavaScript antes disto
             (ver .sem-js .detalhe no CSS), entao o clone nao tira nada de
             ninguem. Clonar em vez de embutir um segundo especime economiza os
             28 kB de marcacao que a duplicata custaria. -->
        <figure class="detalhe" aria-hidden="true">
          <figcaption>${d.detalhe_rotulo}</figcaption>
          <div class="detalhe-vidro"></div>
        </figure>

        <div class="ciclo desenha-alvo">
${cotaCiclo(d)}
          <button type="button" class="botao-varredura"><span>${d.botao_varredura}</span></button>
        </div>
      </div>

    </div>
  </section>

  <div class="par-pranchas">
    <section id="instalar" class="prancha prancha-instalar" aria-labelledby="h-instalar">
      <h2 id="h-instalar"><span class="vinco-id" aria-hidden="true">M-02</span>${d.instalar_h2}</h2>
      <ol class="instalacoes">
${instalacoes}
      </ol>
    </section>

    <section class="prancha prancha-numeros" aria-labelledby="h-calibre">
      <h2 id="h-calibre"><span class="vinco-id" aria-hidden="true">M-03</span>${d.calibre_h2}</h2>
      <div class="rolo">
        <table>
          <thead>
            <tr>
${d.calibre_th.map((t) => `              <th scope="col">${t}</th>`).join("\n")}
            </tr>
          </thead>
          <tbody>
${calibre}
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <section class="prancha prancha-notas" aria-labelledby="h-notas">
    <h2 id="h-notas"><span class="vinco-id" aria-hidden="true">M-04</span>${d.notas_h2}</h2>
    <ol class="lista-notas">
      <li id="nota-1" class="nota-por-sistema">
        <div class="nota-num"><span>${d.nota_palavra} 1</span></div>
        <div class="nota-corpo">
          <h3>${d.nota1_titulo}</h3>
${avisos}
        </div>
      </li>
      <li id="nota-2">
        <div class="nota-num"><span>${d.nota_palavra} 2</span></div>
        <div class="nota-corpo">
          <h3>${d.nota2_titulo}</h3>
          <p>${d.nota2}</p>
        </div>
      </li>
      <li id="nota-3">
        <div class="nota-num"><span>${d.nota_palavra} 3</span></div>
        <div class="nota-corpo">
          <h3>${d.nota3_titulo}</h3>
          <p>${d.nota3}</p>
        </div>
      </li>
    </ol>
  </section>

  <footer class="carimbo">
    <div>
      <h3>${d.carimbo_estado_titulo}</h3>
      <p>${d.carimbo_estado}</p>
    </div>
    <div>
      <h3>${d.carimbo_apoiar_titulo}</h3>
      <p>${d.carimbo_apoiar}</p>
    </div>
    <div>
      <h3>${d.carimbo_codigo_titulo}</h3>
      <p>${d.carimbo_codigo}</p>
    </div>
  </footer>

</div>

<script src="${base}folha.js" defer></script>
</body>
</html>
`;
}

/* ==========================================================================
   5. Escrever (ou conferir)
   ========================================================================== */

const divergentes = [];

function entregar(caminhoRelativo, conteudo) {
  const destino = join(SAIDA, caminhoRelativo);
  mkdirSync(dirname(destino), { recursive: true });

  if (CONFERIR) {
    const atual = existsSync(destino) ? readFileSync(destino, "utf8") : null;
    if (atual !== conteudo) divergentes.push(caminhoRelativo);
    return;
  }
  writeFileSync(destino, conteudo);
  console.log("  site/" + caminhoRelativo);
}

/* O ESPECIME PRECISA ESTAR NO AR, E ATUAL.
 *
 * Ele nao e um arquivo copiado: e embutido na pagina, entao `--check` nao pega a
 * falta dele como pega a de um raster ausente. E ele tem uma data dentro -- o
 * numero que `stub.js` escreveu no dia da extracao. `folha.js` reescreve esse
 * numero no navegador de quem visita, e e por isso que o especime nao envelhece
 * mais; ainda assim, um especime de meses atras carrega a interface de meses atras.
 *
 * Este teste cobre as duas coisas: os arquivos existem, e nenhum deles e mais
 * antigo que o codigo do app que eles retratam. Antes ele era `conferirCaptura`, e
 * conferia a DIMENSAO do PNG (840x1080) porque as cotas eram coordenadas escritas
 * a mao contra aquela geometria. As cotas agora sao medidas, e essa classe de erro
 * deixou de existir -- o que sobrou para conferir e a frescura. */
const ESPECIME_ARQUIVOS = [
  "cotas.json", "janela.css", "janela.propriedades.css",
  "janela-pt-BR.html", "janela-en.html", ARQUIVO_IMPRESSAO,
];

function conferirEspecime() {
  const dir = join(RAIZ, "assets", "especime");
  const faltando = ESPECIME_ARQUIVOS.filter((a) => !existsSync(join(dir, a)));
  if (faltando.length) {
    console.error(
      "assets/especime/ está incompleto: falta " + faltando.join(", ") + ".\n" +
        "Rode `npm run vitrine` para extrair o espécime da janela."
    );
    process.exit(1);
  }

  /* A fonte da verdade e o codigo da interface: `src/` e o que o especime retrata.
     A impressao gravada na extracao responde a pergunta certa -- nao "o que e mais
     novo", mas "este especime foi extraido DESTE codigo". Ver `impressao.mjs`: a
     primeira versao disto comparava `mtime` e era uma moeda ao ar na CI, que e
     exatamente onde `site.yml` publica a pagina. */
  const gravada = readFileSync(join(dir, ARQUIVO_IMPRESSAO), "utf8").trim();
  const agora = impressaoDaFonte(RAIZ);
  if (gravada !== agora) {
    console.error(
      "assets/especime/ nao retrata o src/ atual: o desenho da janela na folha nao e\n" +
        "a janela que o codigo monta hoje (" + gravada + " != " + agora + ").\n" +
        "Rode `npm run vitrine` antes de publicar."
    );
    process.exit(1);
  }
}

conferirDicionario(pt, en);
conferirEspecime();

const html = {
  "index.html": pagina(pt, {
    base: "",
    canonico: URL_SITE + "/",
    linkOutraLingua: "en/",
  }),
  "en/index.html": pagina(en, {
    base: "../",
    canonico: URL_SITE + "/en/",
    linkOutraLingua: "../",
  }),
};

if (!CONFERIR) console.log("Gerando site/:");

for (const [caminho, conteudo] of Object.entries(html)) entregar(caminho, conteudo);

if (!CONFERIR) {
  for (const [origem, destino] of COPIAS) {
    const de = join(RAIZ, origem);
    if (!existsSync(de)) {
      console.error("faltando: " + origem);
      process.exit(1);
    }
    const para = join(SAIDA, destino);
    mkdirSync(dirname(para), { recursive: true });
    copyFileSync(de, para);
    console.log("  site/" + destino);
  }
  // `.nojekyll`: sem ele o GitHub Pages roda o Jekyll e ignora nomes com underscore.
  entregar(".nojekyll", "");
  console.log("Pronto.");
} else if (divergentes.length) {
  console.error(
    "site/ está fora de sincronia com scripts/site.mjs:\n" +
      divergentes.map((c) => "  site/" + c).join("\n") +
      "\n\nRode `node scripts/site.mjs` e faça commit do resultado."
  );
  process.exit(1);
} else {
  console.log("site/ está em sincronia com scripts/site.mjs.");
}
