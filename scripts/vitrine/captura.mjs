// Posa a interface real do app e grava as DUAS formas em que ela é publicada:
//
//   assets/telas/janela-{clara,escura}[-en].png   quatro PNGs, um par por README
//   assets/especime/janela-{pt-BR,en}.html   o DOM montado, para a folha de cotas
//   assets/especime/janela.css               o CSS do app, purgado ao espécime
//   assets/especime/janela.propriedades.css  os @property do Tailwind, para o <head>
//   assets/especime/cotas.json               as regiões das chamadas, MEDIDAS
//   assets/especime/fonte.txt                a impressão do `src/` que foi retratado
//
//   npm run vitrine                 grava tudo
//   npm run vitrine -- --saida /tmp grava os PNGs em outro diretório
//
// Sobe o servidor de desenvolvimento do Vite, abre `index.html` daqui ao lado (a
// interface real do app com o IPC falso de `stub.js`) e derruba tudo. Nenhuma
// dependência nova: o Vite já é devDependency e o Node 22 tem `fetch` e
// `WebSocket` globais, que é tudo que o DevTools Protocol pede.
//
// **Por que um navegador de cabeça vazia, e não um print do app de verdade.**
// Print à mão traz as tarefas reais de quem tirou, sai no tamanho e no tema da
// máquina dele, e não se repete igual duas vezes. Aqui o mesmo comando produz o
// mesmo resultado em qualquer máquina, com dados de exemplo escolhidos.
//
// **Por que não `chrome --screenshot`.** Aquele atira no evento `load`, antes de
// o React montar, e grava uma folha branca. Além disso o tema viria do sistema de
// quem rodou; aqui `prefers-color-scheme` é emulado pelo protocolo, que é o
// mecanismo de verdade, e não uma segunda cópia dos tokens escuros.
//
// ---------------------------------------------------------------------------
// POR QUE DUAS FORMAS, E NÃO SÓ O PNG
// ---------------------------------------------------------------------------
//
// Raster é o único formato que o README pode mostrar: o GitHub renderiza Markdown
// com uma allowlist de HTML e não executa nada. Lá o PNG fica, e a 2x.
//
// A folha de cotas não tem essa limitação, e pagava caro por fingir que tinha.
// Três defeitos, todos do formato e nenhum do desenho:
//
//   1. O detalhe da folha amplia 2:1. Num raster 2x isso gasta exatamente toda a
//      resolução que existe — um pixel de imagem por pixel de tela — e o espécime
//      virava o objeto mais borrado de uma página feita de fio de 1px.
//   2. O destaque de "hoje" congelava no dia da captura. A folha publicada marcou
//      ANTEONTEM em vermelho enquanto a chamada 3 prometia "vermelha no dia".
//   3. As cinco regiões das chamadas eram coordenadas escritas à mão contra o
//      CONTEÚDO do raster, com um comentário em `site.mjs` avisando que regerar a
//      captura pedia reconferir tudo à mão.
//
// Extrair o DOM em vez de pixels resolve os três de uma vez, e não por engenho:
// o espécime volta a ser o que o app é. Ele é nítido em qualquer ampliação porque
// é texto, segue o tema do visitante pelo mesmo `prefers-color-scheme` que o app
// segue (e não por um `<picture>` com dois arquivos), a data é reescrita no
// navegador de quem visita, e as regiões são medidas do DOM real — nunca podem
// divergir do que está desenhado.
//
// **A ponte é Shadow DOM declarativo**, e a escolha não é de gosto: o CSS do app é
// Tailwind v4, que emite `:root,:host` justamente para funcionar dentro de uma
// shadow root. O CSS entra verbatim, sem reescrever um seletor, e o isolamento
// vale nos dois sentidos — o reset `*` do app não vaza para a folha, e a folha não
// pinta dentro do espécime.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ARQUIVO_IMPRESSAO, impressaoDaFonte } from './impressao.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Tamanho da janela, como declarado em `src-tauri/tauri.conf.json`. */
const JANELA = { largura: 360, altura: 480 }
/**
 * Folga em volta da janela, em cada lado. A sombra que `index.html` declara ao
 * lado sangra alguns pixels para fora dos 360x480; sem folga a captura corta a
 * sombra num quadrado, que é exatamente o defeito que o fundo transparente existe
 * para evitar.
 *
 * A sombra mora lá e não no app de propósito: ela é moldura do sistema, e no app
 * seria recortada pelo `overflow: hidden` do `#root`. Ver o comentário dela.
 */
const FOLGA = 30
/** Retina. O README mostra a imagem em 420px de largura, então 2x é o nítido. */
const ESCALA = 2

const TEMAS = [
  { css: 'light', arquivo: 'janela-clara.png' },
  { css: 'dark', arquivo: 'janela-escura.png' },
]

/**
 * As línguas — do espécime da folha e das fotos. A folha tem duas páginas e
 * cada uma mostra a janela na língua dela; e desde que o README principal é o
 * inglês (com o português em README.pt-BR.md), as fotos também saem nas duas:
 * o app segue o idioma do sistema, e um README inglês com a janela em
 * português anunciaria um app que, para aquele leitor, ele não é. O par
 * inglês ganha o sufixo `-en` no nome do arquivo.
 */
const IDIOMAS = ['pt-BR', 'en']

/**
 * As cinco chamadas da folha, por SELETOR — a mudança que apaga uma classe
 * inteira de defeito.
 *
 * Antes, cada região era um retângulo escrito à mão em `scripts/site.mjs`, medido
 * a olho sobre o PNG. O arquivo dizia, por escrito, que regerar a captura com
 * outra lista pedia reconferir os cinco à mão — e nada quebrava se ninguém
 * reconferisse: a folha só passava a apontar para o lugar errado.
 *
 * Agora a fonte é o DOM. O seletor nomeia a FUNÇÃO, o navegador mede a caixa, e
 * as coordenadas nascem do mesmo elemento que está desenhado ali. Se um seletor
 * deixar de casar — porque o componente mudou —, a extração falha em voz alta em
 * vez de gravar uma cota errada.
 *
 * Três formas de medir, e cada uma existe por um caso concreto:
 *
 *   `seletor`  a caixa do elemento.
 *   `uniao`    a caixa que cobre vários. A faixa de abas são os chips MAIS o "+"
 *              que cria: a copy diz "criados e nomeados no mesmo gesto", e medir
 *              o contêiner deles levaria o realce até a borda do cartão, que se lê
 *              como defeito.
 *   `texto`    a caixa da TINTA, por um `Range` sobre o conteúdo. O título da
 *              concluída é `flex-1` e a caixa dele vai até o `×`, então medir o
 *              elemento desenharia o realce 60px depois do fim do risco.
 */
const CHAMADAS = [
  { chave: 'campo', seletor: 'input[data-slot="input"]' },
  { chave: 'abas', uniao: ['[role="group"][aria-label]', 'button[aria-keyshortcuts="Meta+T"]'] },
  // A pílula de hoje, que é a única que acende em vermelho.
  { chave: 'data', seletor: 'mark[data-especime-hoje]' },
  // A concluída: o título riscado, que é onde o risco se lê.
  { chave: 'concluida', seletor: 'li[data-todo-id="7"] span[id^="todo-title"]', texto: true },
  // O botão que esconde a janela — o último do cabeçalho, em qualquer língua.
  { chave: 'sair', seletor: 'header button:last-of-type' },
]

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(nome)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}
const SAIDA = arg('--saida', join(RAIZ, 'assets', 'telas'))
const SAIDA_ESPECIME = join(RAIZ, 'assets', 'especime')
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

// ------------------------------------------------------------------- o Chrome

/**
 * Onde procurar o binário. `CHROME=/caminho/para/chrome npm run vitrine` tem a
 * palavra final.
 *
 * A lista é a mesma ressalva que `scripts/marca.mjs` carrega para o `iconutil`:
 * este script depende de uma ferramenta que não vem com o projeto. A diferença é
 * que aqui a falta dela é recuperável em qualquer sistema, com a variável acima.
 */
const CANDIDATOS = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
}

function acharChrome() {
  if (process.env.CHROME) {
    if (!existsSync(process.env.CHROME)) {
      throw new Error(`CHROME=${process.env.CHROME} não existe.`)
    }
    return process.env.CHROME
  }
  const achado = (CANDIDATOS[process.platform] ?? []).find((c) => existsSync(c))
  if (!achado) {
    throw new Error(
      'Não achei um navegador baseado em Chromium.\n' +
        'Aponte um com a variável de ambiente CHROME, por exemplo:\n' +
        '  CHROME=/usr/bin/chromium npm run vitrine',
    )
  }
  return achado
}

/**
 * Sobe o Chrome de cabeça vazia e devolve o endereço do DevTools.
 *
 * A porta é 0 — o Chrome escolhe uma livre e escreve em `DevToolsActivePort`
 * dentro do perfil. Ler o arquivo é mais chato que fixar 9222, e é o certo: uma
 * porta fixa colide com qualquer outro Chrome depurável que já esteja aberto na
 * máquina, e o sintoma seria este script conversando com o navegador errado.
 */
async function subirChrome() {
  const perfil = join(tmpdir(), `nocom-vitrine-${process.pid}`)
  rmSync(perfil, { recursive: true, force: true })
  mkdirSync(perfil, { recursive: true })
  const proc = spawn(
    acharChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--remote-debugging-port=0',
      `--user-data-dir=${perfil}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const arquivoPorta = join(perfil, 'DevToolsActivePort')
  for (let i = 0; i < 100; i++) {
    if (existsSync(arquivoPorta)) {
      const [porta] = readFileSync(arquivoPorta, 'utf8').split('\n')
      if (porta) {
        return {
          base: `http://127.0.0.1:${porta}`,
          // **Esperar o processo sair antes de apagar o perfil.** O Chrome ainda
          // está gravando cache e locks quando o `kill` retorna, e um `rm`
          // imediato falha com ENOTEMPTY — o script morria no fim, DEPOIS de já
          // ter gravado as fotos, o que é o pior momento para falhar.
          encerrar: async () => {
            const saiu = new Promise((res) => proc.once('exit', res))
            proc.kill()
            await Promise.race([saiu, dormir(3000)])
            rmSync(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
          },
        }
      }
    }
    await dormir(100)
  }
  proc.kill()
  throw new Error('O Chrome subiu mas não anunciou a porta do DevTools em 10s.')
}

/**
 * Uma aba nova, com uma sessão de protocolo própria.
 *
 * **Uma aba por tema, e não uma reaproveitada para os dois.** Navegar duas vezes
 * na mesma sessão derrubou o navegador de forma reproduzível durante o
 * desenvolvimento deste script — a segunda captura ficava pendurada para sempre.
 * Uma aba por tema custa alguns milissegundos e não tem esse problema.
 */
async function abrirAba(base) {
  const alvo = await (await fetch(`${base}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(alvo.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = () => rej(new Error('não consegui falar com a aba do Chrome'))
  })

  let id = 0
  const pendentes = new Map()
  const eventos = new Map()
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id !== undefined) {
      const p = pendentes.get(msg.id)
      pendentes.delete(msg.id)
      msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result)
    } else if (eventos.has(msg.method)) {
      eventos.get(msg.method)()
      eventos.delete(msg.method)
    }
  }
  const cmd = (method, params = {}) =>
    new Promise((res, rej) => {
      const meu = ++id
      pendentes.set(meu, { res, rej })
      ws.send(JSON.stringify({ id: meu, method, params }))
    })
  const esperarEvento = (method) => new Promise((res) => eventos.set(method, res))
  const avaliar = async (expressao) => {
    const r = await cmd('Runtime.evaluate', {
      expression: expressao,
      returnByValue: true,
      awaitPromise: true,
    })
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    }
    return r.result.value
  }
  const fechar = async () => {
    ws.close()
    await fetch(`${base}/json/close/${alvo.id}`).catch(() => {})
  }
  return { cmd, esperarEvento, avaliar, fechar }
}

// ------------------------------------------------------------------- captura

/**
 * Espera a página estar realmente pronta para posar.
 *
 * Três condições, e nenhuma delas é um `sleep` chutado:
 *   1. o React montou as sete linhas (a última, `todo-id="7"`, é a concluída);
 *   2. as fontes assentaram (`document.fonts.ready`) — a Geist é variável e
 *      carregada por `@fontsource`, e posar antes disso grava a fallback do
 *      sistema, com métricas diferentes;
 *   3. a animação de entrada das linhas terminou (a única espera por tempo, e
 *      curta).
 *
 * **A prova de montagem é ESTRUTURAL, e não uma frase.** Ela era
 * `innerText.includes('Limpar concluídas')`, que só existe em português — o
 * espécime inglês esperaria os 10s inteiros e morreria dizendo que a interface
 * não montou, quando ela tinha montado na primeira tentativa.
 */
async function esperarPronta(aba) {
  for (let i = 0; i < 100; i++) {
    const pronta = await aba.avaliar(
      `(async () => { await document.fonts.ready;
         return !!document.querySelector('#root li[data-todo-id="7"]') })()`,
    )
    if (pronta) {
      await dormir(400)
      return
    }
    await dormir(100)
  }
  throw new Error('a interface não terminou de montar em 10s')
}

/**
 * **A conferência que justifica a data calculada em `stub.js`.** Só a data de HOJE
 * recebe `bg-today` (ver `DatePill` em `src/components/TodoRow.tsx`), no mesmo
 * lugar em que pinta o vermelho. Se ela não estiver na tela, o espécime sairia com
 * todas as pílulas cinzas — sem erro nenhum, e ninguém notaria até alguém comparar
 * o desenho com a chamada 3, que promete "vermelha no dia".
 *
 * **A prova é a CLASSE, e não o texto "(hoje)"** — aquele também é traduzido, e
 * conferi-lo em inglês procuraria uma palavra que nunca está lá.
 */
async function conferirHoje(aba, contexto) {
  if (!(await aba.avaliar(`!!document.querySelector('#root mark.bg-today')`))) {
    throw new Error(
      `a pílula de hoje não acendeu em ${contexto} — o espécime sairia sem o ` +
        'destaque vermelho.\nConfira o cálculo de `HOJE` em scripts/vitrine/stub.js ' +
        'contra `date_day_first` e src/lib/dates.ts.',
    )
  }
}

async function capturar(base, servidorUrl, tema, idioma) {
  const arquivo = idioma === 'pt-BR' ? tema.arquivo : tema.arquivo.replace('.png', `-${idioma}.png`)
  const aba = await abrirAba(base)
  try {
    await aba.cmd('Page.enable')
    await aba.cmd('Runtime.enable')
    await aba.cmd('Emulation.setDeviceMetricsOverride', {
      width: JANELA.largura + 2 * FOLGA,
      height: JANELA.altura + 2 * FOLGA,
      deviceScaleFactor: ESCALA,
      mobile: false,
    })
    // Fundo transparente: o canto arredondado da janela fica com alfa, e o mesmo
    // PNG assenta no README claro e no escuro sem um retângulo em volta.
    await aba.cmd('Emulation.setDefaultBackgroundColorOverride', {
      color: { r: 0, g: 0, b: 0, a: 0 },
    })
    await aba.cmd('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: tema.css }],
    })

    const carregou = aba.esperarEvento('Page.loadEventFired')
    await aba.cmd('Page.navigate', {
      url: `${servidorUrl}/scripts/vitrine/index.html?lang=${encodeURIComponent(idioma)}`,
    })
    await carregou
    await esperarPronta(aba)
    await conferirHoje(aba, arquivo)

    const { data } = await aba.cmd('Page.captureScreenshot', { format: 'png', fromSurface: true })
    const bytes = Buffer.from(data, 'base64')
    mkdirSync(SAIDA, { recursive: true })
    const caminho = join(SAIDA, arquivo)
    writeFileSync(caminho, bytes)
    return `  ${arquivo.padEnd(23)} ${(JANELA.largura + 2 * FOLGA) * ESCALA}x${(JANELA.altura + 2 * FOLGA) * ESCALA}  ${(bytes.length / 1024).toFixed(1)} kB`
  } finally {
    await aba.fechar()
  }
}

// ------------------------------------------------------------------ espécime

/**
 * O trecho que roda DENTRO da página. Devolve o DOM montado, as cotas medidas e o
 * CSS do app reduzido ao que o espécime usa.
 *
 * Ele é uma string porque atravessa o DevTools Protocol; `JSON.parse` na entrada é
 * o que deixa os argumentos passarem sem escapar nada à mão.
 */
const EXTRAIR_NA_PAGINA = (chamadas, marcacaoAnterior) => `(() => {
  const CHAMADAS = ${JSON.stringify(chamadas)};
  const ANTERIOR = ${JSON.stringify(marcacaoAnterior)};
  const raiz = document.querySelector('#root');
  const cartao = raiz.firstElementChild;

  /* ------------------------------------------------------------- 1. as marcas
     A pílula de hoje e a futura ganham um atributo próprio. É o contrato com
     \`site/folha.js\`, que reescreve as duas datas no navegador de quem visita —
     sem isso o espécime voltaria a envelhecer, que é metade do motivo de ele ter
     deixado de ser raster. \`bg-today\` é a classe que o \`DatePill\` põe só na
     data de hoje, no mesmo lugar em que pinta o vermelho. */
  const hoje = cartao.querySelector('mark.bg-today');
  if (hoje) hoje.setAttribute('data-especime-hoje', '');
  for (const m of cartao.querySelectorAll('mark[id^="todo-date"]')) {
    if (m !== hoje) m.setAttribute('data-especime-futuro', '');
  }

  /* -------------------------------------------------------------- 2. as cotas
     Medidas do DOM real, relativas ao canto do cartão. */
  const base = cartao.getBoundingClientRect();
  const relativa = (r) => [
    Math.round(r.left - base.left),
    Math.round(r.top - base.top),
    Math.round(r.width),
    Math.round(r.height),
  ];
  const cotas = {};
  const faltou = (chave, sel) => ({ erro: 'o seletor da chamada "' + chave + '" não casou: ' + sel });
  for (const c of CHAMADAS) {
    if (c.uniao) {
      let esq = Infinity, topo = Infinity, dir = -Infinity, baixo = -Infinity;
      for (const sel of c.uniao) {
        const el = cartao.querySelector(sel);
        if (!el) return faltou(c.chave, sel);
        const r = el.getBoundingClientRect();
        esq = Math.min(esq, r.left); topo = Math.min(topo, r.top);
        dir = Math.max(dir, r.right); baixo = Math.max(baixo, r.bottom);
      }
      cotas[c.chave] = relativa({ left: esq, top: topo, width: dir - esq, height: baixo - topo });
      continue;
    }
    const el = cartao.querySelector(c.seletor);
    if (!el) return faltou(c.chave, c.seletor);
    if (c.texto) {
      const faixa = document.createRange();
      faixa.selectNodeContents(el);
      cotas[c.chave] = relativa(faixa.getBoundingClientRect());
      continue;
    }
    cotas[c.chave] = relativa(el.getBoundingClientRect());
  }

  /* ------------------------------------------------------- 3. tornar inerte
     O espécime é um desenho, não um app. Nada aqui pode receber foco, abrir
     tooltip nem virar uma segunda parada de Tab entre a chamada e o botão de
     instalar.

     **\`tabindex="-1"\` e \`readonly\`, e não \`disabled\` nem \`inert\`.**
     \`disabled\` acionaria \`disabled:opacity-50\` do shadcn e desbotaria o campo,
     mudando o que o desenho mostra; \`inert\` some com a subárvore da árvore de
     acessibilidade INCLUSIVE o \`aria-label\` do host, deixando o espécime sem nome
     nenhum. O que resolve a acessibilidade é o \`role="img"\` do host, que já poda
     os filhos e deixa uma etiqueta só. */
  for (const el of cartao.querySelectorAll('a, button, input, select, textarea, [tabindex]')) {
    el.setAttribute('tabindex', '-1');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.setAttribute('readonly', '');
  }
  /* \`title\` é tooltip de um desenho que não recebe ponteiro, e
     \`data-tauri-drag-region\` é instrução para uma janela que não existe aqui. */
  for (const el of cartao.querySelectorAll('[title]')) el.removeAttribute('title');
  for (const el of cartao.querySelectorAll('[data-tauri-drag-region]')) {
    el.removeAttribute('data-tauri-drag-region');
  }

  const marcacao = cartao.outerHTML;

  /* ---------------------------------------------------------- 4. purgar o CSS
     O bundle do app carrega toda classe que existe em \`src/\` — o painel da
     engrenagem, o menu de contexto, o estado vazio, a faixa de atualização. O
     espécime mostra a janela em repouso, e só ela.

     **Quem decide o que fica é o navegador, e não uma heurística de string.**
     Cada regra é testada com \`matches\`/\`querySelector\` contra o DOM extraído; o
     motor de seletores é o mesmo que vai aplicá-las. Só há duas concessões:

       - Pseudo-classes de ESTADO (\`:hover\`, \`:focus-visible\`, \`::placeholder\`)
         nunca casam num DOM parado, então a regra é testada uma segunda vez sem
         elas. O espécime tem um \`::placeholder\` visível — é o texto do campo.
       - Seletor que o \`matches\` recusa (o corte acima pode deixar um \`:not()\`
         vazio) FICA. Falhar para o lado de manter custa alguns bytes; falhar para
         o lado de cortar apaga estilo do desenho, calado.

     As duas línguas são testadas juntas: a marcação da anterior entra numa raiz
     solta, porque um utilitário de largura pode existir só numa delas. */
  const solto = document.createElement('div');
  if (ANTERIOR) solto.innerHTML = ANTERIOR;
  const raizes = [cartao, ...solto.children];

  const ESTADOS = /::?(?:hover|focus|focus-visible|focus-within|active|visited|target|disabled|enabled|checked|indeterminate|read-only|placeholder-shown|autofill|placeholder|selection|backdrop|marker|first-line|first-letter|file-selector-button|-webkit-[\\w-]+|-moz-[\\w-]+)\\b/g;

  const casa = (sel) => raizes.some((r) => (r.matches && r.matches(sel)) || r.querySelector(sel));
  const usado = (sel) => {
    /* \`:root\` e \`:host\` carregam os tokens e o registro de propriedades do
       Tailwind. Nenhum dos dois casa com um elemento, e sem eles o espécime perde
       a paleta inteira. */
    if (/:root|:host/.test(sel)) return true;
    try { if (casa(sel)) return true } catch { return true }
    const limpo = sel.replace(ESTADOS, '');
    if (limpo === sel) return false;
    try { return casa(limpo) } catch { return true }
  };

  /* **\`:root\` PRECISA GANHAR UM GEMEO \`:host\`, e este é o único remendo de seletor
     que a extração faz.**

     O Tailwind v4 escreve o próprio bloco de tema como \`:root, :host\` — é o que faz
     o CSS dele funcionar dentro de uma shadow root sem tradução. Mas os tokens do
     shadcn deste projeto são escritos à mão em \`src/index.css\` como \`:root\` puro
     (linha 316, e o bloco escuro na 362), e dentro de uma shadow root \`:root\` não
     casa NADA: não existe elemento raiz numa árvore de sombra.

     O sintoma foi exatamente este, e é instrutivo: a Geist carregava (ela vem do
     bloco do Tailwind, que tem \`:host\`), \`.bg-card\` existia, e ainda assim o cartão
     saía transparente — \`--card\` não estava definida em lugar nenhum que o cartão
     pudesse ver.

     O remendo não pode quebrar nada: dentro de uma shadow root \`:root\` é inerte,
     então acrescentar um gêmeo só ADICIONA casamento. E ele é feito por parte da
     lista de seletores, e não por \`replace\` na string toda, para não tocar num
     \`:root\` que apareça dentro de \`:where()\` ou \`:not()\`. */
  const comHost = (sel) => {
    if (!sel.includes(':root')) return sel;
    const partes = sel.split(',').map((p) => p.trim());
    const extras = partes.filter((p) => /^:root\\b/.test(p)).map((p) => p.replace(/^:root\\b/, ':host'));
    return extras.length ? [...partes, ...extras].join(', ') : sel;
  };

  const CONDICIONAIS = new Set(['CSSMediaRule', 'CSSSupportsRule', 'CSSLayerBlockRule', 'CSSContainerRule']);
  const regra = (r) => {
    const tipo = r.constructor.name;
    if (tipo === 'CSSStyleRule') {
      if (!usado(r.selectorText)) return '';
      const sel = comHost(r.selectorText);
      return sel === r.selectorText ? r.cssText : sel + '{' + r.style.cssText + '}';
    }
    if (CONDICIONAIS.has(tipo)) {
      const dentro = [...r.cssRules].map(regra).filter(Boolean).join('');
      if (!dentro) return '';
      /* \`conditionText\` cobre @media/@supports/@container; @layer usa \`name\`. */
      const cabeca = r.cssText.slice(0, r.cssText.indexOf('{'));
      return cabeca + '{' + dentro + '}';
    }
    /* O @font-face do app aponta para caminhos do servidor de desenvolvimento do
       Vite, que não existem no site publicado. A folha declara a Geist com os
       arquivos dela, em \`folha.css\`: @font-face é do documento, e o documento
       alcança a shadow root. */
    if (tipo === 'CSSFontFaceRule') return '';
    /* **@property SAI DAQUI, e este é o remendo menos óbvio de todo o espécime.**

       \`@property\` é do DOCUMENTO. Dentro de uma shadow root ele é simplesmente
       ignorado — e o Tailwind v4 registra por ali cada uma das suas ~50 variáveis
       \`--tw-*\`, com o \`initial-value\` de que elas dependem.

       O sintoma foi este, e levou um tempo para ser lido: o campo de nova tarefa
       aparecia SEM BORDA. A classe \`.border\` estava no CSS e no elemento, e a
       computada dizia \`0px none\`. Motivo: \`.border\` declara
       \`border-style: var(--tw-border-style)\`, \`--tw-border-style\` não estava
       registrada, e um \`var()\` sem valor invalida a declaração inteira. Sombra,
       \`ring\` e translate quebrariam pelo mesmo caminho.

       (O Tailwind tem um plano B — o bloco \`@layer properties\` com \`*\` — mas ele
       está atrás de um \`@supports\` que detecta Safari e Firefox. No Chromium ele é
       falso de propósito, porque lá \`@property\` deveria bastar. É por isso que a
       falta aparece num navegador e não no outro.)

       Então elas voltam separadas, e \`scripts/site.mjs\` as põe no \`<head>\` da
       folha. Registrar \`--tw-*\` no documento não pinta nada: \`@property\` só declara
       nome, sintaxe e valor inicial, e nenhuma regra da folha lê essas variáveis. */
    if (tipo === 'CSSPropertyRule') { propriedades.push(r.cssText); return ''; }
    /* @keyframes e o resto ficam: são poucos bytes e o custo de adivinhar qual
       animação o espécime usa é maior que o de mantê-los. */
    return r.cssText;
  };

  const propriedades = [];

  /* **A moldura da vitrine não entra.** O \`<style data-vitrine-moldura>\` do
     \`index.html\` ao lado simula a sombra que o SISTEMA desenha em volta da janela;
     ela existe para o PNG, onde não há moldura nenhuma, e não é interface do app.
     No espécime ela seria duas vezes errada: o seletor \`html body #root\` não casa
     nada dentro de uma shadow root, e a folha de cotas é um mundo declaradamente
     sem sombra — quem separa o espécime da película é o fio de 1px do cartão, que
     é o mesmo que o app desenha. */
  let css = '';
  for (const folha of document.styleSheets) {
    if (folha.ownerNode && folha.ownerNode.hasAttribute('data-vitrine-moldura')) continue;
    try { css += [...folha.cssRules].map(regra).filter(Boolean).join('') } catch (e) { /* de outra origem */ }
  }

  return {
    marcacao,
    css,
    propriedades: propriedades.join(''),
    cotas,
    caixa: [Math.round(base.width), Math.round(base.height)],
  };
})()`

/**
 * Extrai o espécime de uma língua. Devolve a marcação, para a língua seguinte
 * purgar o CSS contra as duas.
 */
async function extrair(base, servidorUrl, idioma, marcacaoAnterior) {
  const aba = await abrirAba(base)
  try {
    await aba.cmd('Page.enable')
    await aba.cmd('Runtime.enable')
    /* O espécime é medido em px CSS, então a escala é 1: o que importa aqui é a
       geometria do layout, e não a densidade de pixel que o raster precisava.
       A altura é a da janela — a lista rola dentro dela, e é a rolagem que decide
       quantas linhas aparecem. */
    await aba.cmd('Emulation.setDeviceMetricsOverride', {
      width: JANELA.largura,
      height: JANELA.altura,
      deviceScaleFactor: 1,
      mobile: false,
    })

    const carregou = aba.esperarEvento('Page.loadEventFired')
    await aba.cmd('Page.navigate', {
      url: `${servidorUrl}/scripts/vitrine/index.html?lang=${encodeURIComponent(idioma)}`,
    })
    await carregou
    await esperarPronta(aba)
    await conferirHoje(aba, `janela-${idioma}.html`)

    const r = await aba.avaliar(EXTRAIR_NA_PAGINA(CHAMADAS, marcacaoAnterior))
    if (r.erro) throw new Error(r.erro)

    /* A janela tem UM tamanho, e o espécime da folha é anunciado em "escala 1:1".
       Se o cartão não medir exatamente o que o `tauri.conf.json` declara, a legenda
       passa a mentir e nada quebra sozinho. */
    if (r.caixa[0] !== JANELA.largura || r.caixa[1] !== JANELA.altura) {
      throw new Error(
        `o cartão mediu ${r.caixa[0]}x${r.caixa[1]}, e não ${JANELA.largura}x${JANELA.altura}.\n` +
          'A folha anuncia "escala 1:1" e as cotas são medidas nesse quadro.',
      )
    }
    return r
  } finally {
    await aba.fechar()
  }
}

// ------------------------------------------------------------------ execução

const { createServer } = await import('vite')
// `logLevel: 'warn'` para o banner do Vite não se misturar à saída deste script.
//
// **A porta tem que ser livre, e `port: 0` sozinho não garantia isso.** O
// `vite.config.ts` declara `strictPort: true` — o Tauri exige porta fixa em
// desenvolvimento — e essa opção vinha junto na fusão com a config do arquivo.
// O Vite não trata `0` como "escolha uma": ele cai na porta padrão (5173) e, com
// `strictPort`, morre se ela estiver ocupada. Bastava qualquer outro projeto com
// um `vite` de pé na máquina para a vitrine não subir, com um erro que não fala
// de vitrine nenhuma ("Port 5173 is already in use").
//
// `strictPort: false` devolve ao Vite a busca pela próxima porta livre, e a
// porta REAL é lida logo abaixo de `httpServer.address()` — que é o que este
// script sempre fez, e o que torna a escolha dele irrelevante para o resto.
const servidor = await createServer({
  root: RAIZ,
  logLevel: 'warn',
  server: { port: 0, strictPort: false },
})
await servidor.listen()
const { port } = servidor.httpServer.address()
const servidorUrl = `http://localhost:${port}`

const kB = (n) => `${(n / 1024).toFixed(1)} kB`

let chrome
try {
  chrome = await subirChrome()

  const linhas = []
  for (const idioma of IDIOMAS) {
    for (const tema of TEMAS) {
      linhas.push(await capturar(chrome.base, servidorUrl, tema, idioma))
    }
  }
  console.log(`${SAIDA}:`)
  console.log(linhas.join('\n'))

  /* O espécime da folha. A ordem importa: cada língua recebe a marcação da
     anterior para o purgo do CSS ver as duas, e por isso o CSS gravado é o da
     ÚLTIMA volta — a única que viu todas. */
  mkdirSync(SAIDA_ESPECIME, { recursive: true })
  const doEspecime = []
  const cotas = {}
  let anterior = null
  let css = ''
  let propriedades = ''
  for (const idioma of IDIOMAS) {
    const r = await extrair(chrome.base, servidorUrl, idioma, anterior)
    anterior = r.marcacao
    css = r.css
    propriedades = r.propriedades
    cotas[idioma] = r.cotas
    const arquivo = `janela-${idioma}.html`
    writeFileSync(join(SAIDA_ESPECIME, arquivo), `${r.marcacao}\n`)
    doEspecime.push(`  ${arquivo.padEnd(22)} ${kB(r.marcacao.length)}`)
  }

  /* Uma última rede: um `url()` sobrevivente aponta para o servidor de
     desenvolvimento, que não existe no site publicado — e o sintoma seria uma
     fonte ou imagem faltando só em produção. */
  const sobrou = css.match(/url\((?!["']?data:)[^)]*\)/)
  if (sobrou) {
    throw new Error(
      `o CSS extraído ainda referencia ${sobrou[0]}, que é um caminho do Vite.\n` +
        'Declare o arquivo em site/folha.css, como a Geist, ou descarte a regra em ' +
        'EXTRAIR_NA_PAGINA.',
    )
  }

  /* Sem os @property, o espécime perde borda, sombra e `ring` no Chromium sem um
     erro sequer. Se algum dia o Tailwind parar de registrar nada, isto avisa em vez
     de publicar um desenho quebrado. */
  if (!propriedades.includes('--tw-border-style')) {
    throw new Error(
      'a extração não achou os @property do Tailwind (--tw-border-style entre eles).\n' +
        'Sem eles o espécime sai sem borda no Chromium: `border-style:' +
        ' var(--tw-border-style)` fica sem valor.',
    )
  }

  writeFileSync(join(SAIDA_ESPECIME, 'janela.css'), `${css}\n`)
  writeFileSync(join(SAIDA_ESPECIME, 'janela.propriedades.css'), `${propriedades}\n`)
  writeFileSync(join(SAIDA_ESPECIME, 'cotas.json'), `${JSON.stringify(cotas, null, 2)}\n`)
  /* A impressão do `src/` que este espécime retrata. `scripts/site.mjs` a confere
     antes de gerar a folha; o porquê está em `impressao.mjs`. */
  writeFileSync(join(SAIDA_ESPECIME, ARQUIVO_IMPRESSAO), `${impressaoDaFonte(RAIZ)}\n`)
  doEspecime.push(`  ${'janela.css'.padEnd(22)} ${kB(css.length)}`)
  doEspecime.push(`  ${'janela.propriedades.css'.padEnd(22)} ${kB(propriedades.length)}`)
  doEspecime.push(`  ${'cotas.json'.padEnd(22)} ${Object.keys(cotas[IDIOMAS[0]]).length} chamadas medidas`)
  doEspecime.push(`  ${ARQUIVO_IMPRESSAO.padEnd(22)} ${impressaoDaFonte(RAIZ)}`)
  console.log(`${SAIDA_ESPECIME}:`)
  console.log(doEspecime.join('\n'))
} finally {
  await chrome?.encerrar()
  await servidor.close()
}
