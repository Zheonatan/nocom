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
 * faz uma unica requisicao de terceiro), as capturas de `assets/telas`, a marca de
 * `assets/marca` e os favicons de `public`. Nada e baixado em tempo de build.
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

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const SAIDA = join(RAIZ, "site");

const CONFERIR = process.argv.includes("--check");

const URL_SITE = "https://zheonatan.github.io/nocom";
const REPO = "https://github.com/Zheonatan/nocom";
const VERSAO = "0.3.0";
const BAIXAR = REPO + "/releases/download/v" + VERSAO + "/";

/* ==========================================================================
   1. Os arquivos que a pagina serve junto
   ========================================================================== */

const COPIAS = [
  // Fontes auto-hospedadas. Latin basta: o portugues cabe inteiro nele.
  ["node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2", "fontes/archivo-latin-wght-normal.woff2"],
  ["node_modules/@fontsource-variable/azeret-mono/files/azeret-mono-latin-wght-normal.woff2", "fontes/azeret-mono-latin-wght-normal.woff2"],
  ["node_modules/@fontsource/spectral/files/spectral-latin-400-normal.woff2", "fontes/spectral-latin-400-normal.woff2"],
  ["node_modules/@fontsource/spectral/files/spectral-latin-400-italic.woff2", "fontes/spectral-latin-400-italic.woff2"],
  ["node_modules/@fontsource/spectral/files/spectral-latin-500-normal.woff2", "fontes/spectral-latin-500-normal.woff2"],
  // As duas capturas reais da janela, uma por tema. 840x1080, fundo transparente.
  ["assets/telas/janela-escura.png", "telas/janela-escura.png"],
  ["assets/telas/janela-clara.png", "telas/janela-clara.png"],
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
      citacao: "“NoCom” está danificado e não pode ser aberto. Você deve movê-lo para o Lixo.",
      fonte: "o que o macOS mostra",
      corpo:
        "Clique em <strong>Cancelar</strong> — nunca em “Mover para o Lixo”. O app não está danificado: ele ainda não é assinado pela Apple. Para liberar:",
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
    "The NoCom window: the tabs Trabalho and Casa, a new-task field and seven tasks. Two carry a date in a right-hand column, today's is highlighted in red, and the last one is done and struck through.",
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
      citacao: "“NoCom” is damaged and can't be opened. You should move it to the Trash.",
      fonte: "what macOS shows",
      corpo:
        "Click <strong>Cancel</strong> — never “Move to Trash”. The app is not damaged: it is not signed by Apple yet. To clear the flag:",
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
   coordenadas 2x da imagem. Mexer numa coordenada aqui move as cinco coisas
   juntas; e por isso que elas nao podem divergir.

   A ORDEM E A DA HISTORIA, e nao a espacial: atalho, aba, data, concluir, esconder.
   Numero de chamada em desenho segue a sequencia de uso, nao a de cima para baixo.

   AS REGIOES DEPENDEM DO CONTEUDO DA CAPTURA, e nao so do tamanho dela.
   `conferirCaptura` pega mudanca de dimensao; nao pega mudanca de lista. Se a
   captura for regerada com outras tarefas, outra ordem, ou uma data de largura
   diferente, estes retangulos precisam ser reconferidos a mao -- e a copy nao pode
   citar o que esta escrito nela, porque a captura carrega o "hoje" do dia em que
   foi tirada e envelhece sozinha.

   PALCO LARGO -- 600 x 520. A imagem de 840x1080 entra a 420x540 na posicao
   (100, 0) e carrega 30px CSS de margem transparente em cada lado, entao a JANELA
   ocupa (130, 30) a (490, 510). `conferirCaptura` transforma essa dependencia em
   teste: se a captura mudar de recuo, o realce aponta para o lugar errado e nada
   quebra sozinho.

   PALCO ESTREITO -- 360 x 480, com viewBox proprio, e a margem transparente
   recortada nos dois eixos: a janela ocupa 0..360 x 0..480 do palco. Ali nao ha
   goteira para balao nenhum, entao o estreito fica so com o realce, e a lista de
   chamadas e o unico controle. */

const JANELA = { esq: 130, topo: 30 };

const CHAMADAS = [
  /* `regiao` realca a funcionalidade inteira. `detalhe`, quando existe, e o pedaco
     que cabe ampliado 2:1 na vidraca de 560px -- o campo tem 336px de largura e a
     2:1 daria 672, entao o detalhe mostra a parte que interessa. Realcar so o
     pedaco recortado fazia o retangulo cobrir meio campo, o que parece defeito. */
  { chave: "campo", regiao: [12, 76, 336, 32], detalhe: [12, 76, 256, 32], lado: "esq" },
  /* A faixa inteira, e nao so os dois chips: a copy diz "criados e nomeados no
     mesmo gesto", e o "+" que cria ficava fora do realce. */
  { chave: "abas", regiao: [12, 41, 336, 26], detalhe: [12, 41, 240, 26], lado: "esq" },
  /* Medido no palco ampliado 2x: o chip ocupa 268..316, e nao 288..342. */
  { chave: "data", regiao: [266, 175, 52, 23], lado: "dir" },
  /* Encurtado para encostar no fim do titulo riscado, em vez de parar num ponto
     arbitrario 32px depois dele. */
  { chave: "concluida", regiao: [12, 377, 216, 28], lado: "esq" },
  /* Centrado no glifo (333,5 / 22,5) e no tamanho do botao, que tem 24px. */
  { chave: "sair", regiao: [321, 10, 25, 25], lado: "dir" },
];

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

function chamadasLargas() {
  const realces = CHAMADAS.map(
    (c) =>
      `            <rect class="realce" data-realce="${c.chave}" x="${JANELA.esq + c.regiao[0]}" y="${
        JANELA.topo + c.regiao[1]
      }" width="${c.regiao[2]}" height="${c.regiao[3]}" />`
  ).join("\n");

  return `          <svg class="cotas cotas-largas" viewBox="0 0 600 520" width="600" height="520" aria-hidden="true">
${CHAMADAS.map(balao).join("\n")}
${realces}
          </svg>`;
}

function chamadasEstreitas() {
  const realces = CHAMADAS.map(
    (c) =>
      `            <rect class="realce" data-realce="${c.chave}" x="${c.regiao[0]}" y="${c.regiao[1]}" width="${c.regiao[2]}" height="${c.regiao[3]}" />`
  ).join("\n");

  return `          <svg class="cotas cotas-estreitas" viewBox="0 0 360 480" width="360" height="480" aria-hidden="true">
${realces}
          </svg>`;
}

function listaDeChamadas(d) {
  return CHAMADAS.map((c, i) => {
    const texto = d.chamadas[c.chave];
    return `          <li>
            <button type="button" data-chamada="${c.chave}"
                    data-regiao="${(c.detalhe || c.regiao).join(",")}"
                    aria-pressed="${i === 0 ? "true" : "false"}">
              <span class="chamada-num">${i + 1}</span>
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
   4. O template
   ========================================================================== */

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
                    aria-label="${d.copiar}: ${linha}">
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
<link rel="stylesheet" href="${base}folha.css">
<script>document.documentElement.className = "js";</script>
</head>
<body>
<!--
IMPECCABLE DIRECTION CONTRACT · seed 0108210e
THESIS: Nada e afirmado, tudo e medido. A folha recusa o heroi escuro com brilho
difuso e a captura flutuando em moldura arredondada.
OWN-WORLD: Pelicula cinza-fria, prancha um tom acima, fio de 1px, zero sombra e
zero canto arredondado. Uma matiz so, o vermelho do proprio app, reservada as
cotas. Archivo em versalete tracked, Spectral no corpo, Azeret Mono em toda
medida. Sem manchete de secao: a folha tem rotulo de zona.
STORY: A visitante escolhe o sistema no topo, ve a janela medida em 1:1, e instala
com o comando do sistema dela -- sem ler uma linha que sirva a outro sistema.
FIRST VIEWPORT: Bloco de titulo com a marca no seu campo preto e a linha de
assunto a direita; o seletor de sistema logo abaixo; e uma prancha de duas zonas,
especime de 360x480 cotado a esquerda e a instalacao (a acao primaria) a direita.
FORM: Folha de cotas, candidato 4 da lista aterrada, registro safer, seed 0108210e.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->
<a class="pular" href="#instalar">${d.pular}</a>
<div id="aviso-vivo" class="aviso-vivo" role="status" aria-live="polite"></div>

<div class="folha">

  <header class="bloco-titulo">
    <div class="bt-identidade">
      <!-- A marca sangra no proprio campo preto: o compromisso e um anel branco
           de fio fino num campo preto, com o diametro a 0,62 do campo e o traco a
           campo/64. As fracoes sao as de assets/marca/nocom.svg. -->
      <svg class="bt-marca" viewBox="0 0 1024 1024" role="img" aria-label="NoCom">
        <rect width="1024" height="1024" fill="#000000"/>
        <circle cx="512" cy="512" r="309.44" fill="none" stroke="#ffffff" stroke-width="16"/>
      </svg>
      <h1>NoCom</h1>
    </div>
    <div class="bt-assunto">
      <p class="assunto">${d.assunto}</p>
      <p class="assunto-sub">${d.assunto_sub}</p>
      <nav class="idioma"><a href="${linkOutraLingua}" hreflang="${
    d.lang === "pt-BR" ? "en" : "pt-BR"
  }">${d.outra_lingua}</a></nav>
    </div>
    <dl class="bt-campos">
${d.bt_campos
  .map(([rotulo, valor]) => `      <div><dt>${rotulo}</dt><dd>${valor}</dd></div>`)
  .join("\n")}
    </dl>
  </header>

  <!-- O seletor de sistema usa role=group com aria-pressed, e nao um tablist:
       a pagina nao cumpre a navegacao por setas que um tablist promete, e anunciar
       semantica que a interface nao cumpre e o que o DESIGN.md do app proibe. -->
  <div class="seletor" role="group" aria-label="${d.seletor_rotulo}">
    <span class="seletor-rotulo">${d.seletor_rotulo}</span>
    <div class="seletor-botoes">
${d.sistemas
  .map(
    (s) =>
      `      <button type="button" data-escolha="${s.chave}" aria-pressed="false">${s.nome}</button>`
  )
  .join("\n")}
    </div>
  </div>

  <p class="aviso-movel" id="aviso-movel" hidden>${d.aviso_movel}</p>

  <div class="prancha especime-prancha">
    <div class="especime-grade">

      <section class="coluna-palco desenha-alvo" aria-labelledby="h-especime">
        <h2 id="h-especime">${d.especime_h2}</h2>
        <div class="palco-caixa">
          <div class="palco">
            <picture>
              <source media="(prefers-color-scheme: dark)" srcset="${base}telas/janela-escura.png">
              <img class="tela" src="${base}telas/janela-clara.png" width="420" height="540"
                   alt="${d.especime_alt}">
            </picture>
${chamadasLargas()}
${chamadasEstreitas()}
          </div>
        </div>
        <p class="legenda-palco">
          <b>${d.legenda_titulo}</b> ${d.legenda}
        </p>

        <!-- As chamadas sao os controles: escolher uma realca a regiao na janela
             acima e move o detalhe ampliado abaixo. Sem JavaScript elas continuam
             legiveis como lista numerada, e o detalhe desaparece em vez de ficar
             parado numa regiao que ninguem escolheu. -->
        <ol class="chamadas">
${listaDeChamadas(d)}
        </ol>

        <!-- A frase da chamada escolhida. Marcada aria-hidden porque ela ja e
             anunciada pelo proprio botao: um estado, uma voz. -->
        <p class="chamada-explicacao" aria-hidden="true"></p>

        <figure class="detalhe" aria-hidden="true">
          <figcaption>${d.detalhe_rotulo}</figcaption>
          <div class="detalhe-vidro"></div>
        </figure>

        <div class="ciclo">
${cotaCiclo(d)}
          <button type="button" class="botao-varredura">${d.botao_varredura}</button>
        </div>
      </section>

      <div class="coluna-instalar">
        <section id="instalar" aria-labelledby="h-instalar">
          <h2 id="h-instalar">${d.instalar_h2}</h2>
          <ol class="instalacoes">
${instalacoes}
          </ol>
        </section>

        <section class="zona-numeros" aria-labelledby="h-calibre">
          <h2 id="h-calibre">${d.calibre_h2}</h2>
          <div class="rolo">
            <table>
              <thead>
                <tr>
${d.calibre_th.map((t) => `                  <th scope="col">${t}</th>`).join("\n")}
                </tr>
              </thead>
              <tbody>
${calibre}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </div>
  </div>

  <section class="zona" aria-labelledby="h-notas">
    <h2 id="h-notas">${d.notas_h2}</h2>
    <ol class="lista-notas">
      <li id="nota-1" class="nota-por-sistema">
        <div class="nota-num">${d.nota_palavra} 1</div>
        <div class="nota-corpo">
          <h3>${d.nota1_titulo}</h3>
${avisos}
        </div>
      </li>
      <li id="nota-2">
        <div class="nota-num">${d.nota_palavra} 2</div>
        <div class="nota-corpo">
          <h3>${d.nota2_titulo}</h3>
          <p>${d.nota2}</p>
        </div>
      </li>
      <li id="nota-3">
        <div class="nota-num">${d.nota_palavra} 3</div>
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

/* A GEOMETRIA DAS COTAS DEPENDE DA CAPTURA, e essa dependencia e invisivel.
 *
 * O palco largo posiciona a imagem em (100, 0) a 420x540 e crava o realce das
 * chamadas em (130, 30)-(490, 510), que e a janela: a captura tem 840x1080 (2x) com
 * 30px CSS de margem transparente em cada lado. Se `scripts/vitrine/captura.mjs` mudar esse
 * recuo, as cotas apontam para o lugar errado e NADA quebra -- a folha so passa a
 * mentir. Este teste transforma isso em falha de build.
 *
 * O tamanho e lido do IHDR do PNG (largura e altura em big-endian nos bytes 16 a
 * 23), sem dependencia nenhuma. */
function conferirCaptura(caminho) {
  const cabecalho = readFileSync(caminho).subarray(0, 24);
  const largura = cabecalho.readUInt32BE(16);
  const altura = cabecalho.readUInt32BE(20);
  if (largura !== 840 || altura !== 1080) {
    console.error(
      "A captura " + caminho + " tem " + largura + "x" + altura + ", e não 840x1080.\n" +
        "O realce das chamadas está cravado nessa geometria (janela de 720x960 centrada,\n" +
        "30px CSS de margem transparente por lado). Se a captura mudou de recuo, acerte as\n" +
        "coordenadas em `JANELA`/`CHAMADAS` e o `.palco` no CSS antes de publicar."
    );
    process.exit(1);
  }
}

conferirDicionario(pt, en);

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
    if (destino.startsWith("telas/")) conferirCaptura(de);
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
