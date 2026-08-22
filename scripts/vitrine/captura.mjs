// Gera as fotos da interface que o README mostra: `assets/telas/janela-clara.png`
// e `janela-escura.png`.
//
//   npm run vitrine                 grava as duas fotos
//   npm run vitrine -- --saida /tmp grava em outro diretório
//
// Sobe o servidor de desenvolvimento do Vite, abre `index.html` daqui ao lado (a
// interface real do app com o IPC falso de `stub.js`), captura um PNG por tema e
// derruba tudo. Nenhuma dependência nova: o Vite já é devDependency e o Node 22
// tem `fetch` e `WebSocket` globais, que é tudo que o DevTools Protocol pede.
//
// **Por que um navegador de cabeça vazia, e não um print do app de verdade.**
// Print à mão traz as tarefas reais de quem tirou, sai no tamanho e no tema da
// máquina dele, e não se repete igual duas vezes. Aqui o mesmo comando produz o
// mesmo par de imagens em qualquer máquina, com dados de exemplo escolhidos, nos
// dois temas, com fundo transparente e em 2x. O que se perde é a moldura do
// sistema (sombra e transparência da janela do Tauri) — e é pouco, porque a
// janela do NoCom desenha os próprios cantos e a própria borda.
//
// **Por que não `chrome --screenshot`.** Aquele atira no evento `load`, antes de
// o React montar, e grava uma folha branca. Além disso o tema viria do sistema de
// quem rodou; aqui `prefers-color-scheme` é emulado pelo protocolo, que é o
// mecanismo de verdade, e não uma segunda cópia dos tokens escuros.

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Tamanho da janela, como declarado em `src-tauri/tauri.conf.json`. */
const JANELA = { largura: 360, altura: 480 }
/**
 * Folga em volta da janela, em cada lado. A borda arredondada e a `shadow-lg` do
 * cartão raiz sangram alguns pixels para fora dos 360x480; sem folga a captura
 * corta a sombra num quadrado, que é exatamente o defeito que o fundo
 * transparente existe para evitar.
 */
const FOLGA = 30
/** Retina. O README mostra a imagem em 420px de largura, então 2x é o nítido. */
const ESCALA = 2

const TEMAS = [
  { css: 'light', arquivo: 'janela-clara.png' },
  { css: 'dark', arquivo: 'janela-escura.png' },
]

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(nome)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}
const SAIDA = arg('--saida', join(RAIZ, 'assets', 'telas'))
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
 * Espera a página estar realmente pronta para a foto, e devolve o texto dela.
 *
 * Três condições, e nenhuma delas é um `sleep` chutado:
 *   1. o React montou (o rodapé com "Limpar concluídas" está na tela);
 *   2. as fontes assentaram (`document.fonts.ready`) — a Geist é variável e
 *      carregada por `@fontsource`, e capturar antes disso grava a fallback do
 *      sistema, com métricas diferentes;
 *   3. a animação de entrada das linhas terminou (a única espera por tempo, e
 *      curta).
 */
async function esperarPronta(aba) {
  for (let i = 0; i < 100; i++) {
    const pronta = await aba.avaliar(
      `(async () => { await document.fonts.ready;
         return document.body.innerText.includes('Limpar concluídas') })()`,
    )
    if (pronta) {
      await dormir(400)
      return aba.avaliar('document.body.innerText')
    }
    await dormir(100)
  }
  throw new Error('a interface não terminou de montar em 10s')
}

async function capturar(base, servidorUrl, tema) {
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
    await aba.cmd('Page.navigate', { url: `${servidorUrl}/scripts/vitrine/index.html` })
    await carregou
    const texto = await esperarPronta(aba)

    // **A conferência que justifica a data calculada em `stub.js`.** O app marca
    // a data de hoje com `(hoje)` no texto acessível da pílula, no mesmo lugar em
    // que pinta o vermelho. Se isto não estiver na tela, a foto sairia com todas
    // as pílulas cinzas — sem erro nenhum, e ninguém notaria até alguém comparar
    // a imagem com o parágrafo do README que promete o destaque.
    if (!texto.includes('(hoje)')) {
      throw new Error(
        'a pílula de hoje não acendeu — a foto sairia sem o destaque vermelho.\n' +
          'Confira o cálculo de `HOJE` em scripts/vitrine/stub.js contra ' +
          '`date_day_first` e src/lib/dates.ts.',
      )
    }

    const { data } = await aba.cmd('Page.captureScreenshot', { format: 'png', fromSurface: true })
    const bytes = Buffer.from(data, 'base64')
    mkdirSync(SAIDA, { recursive: true })
    const caminho = join(SAIDA, tema.arquivo)
    writeFileSync(caminho, bytes)
    return `  ${tema.arquivo.padEnd(20)} ${(JANELA.largura + 2 * FOLGA) * ESCALA}x${(JANELA.altura + 2 * FOLGA) * ESCALA}  ${(bytes.length / 1024).toFixed(1)} kB`
  } finally {
    await aba.fechar()
  }
}

// ------------------------------------------------------------------ execução

const { createServer } = await import('vite')
// `logLevel: 'warn'` para o banner do Vite não se misturar à saída deste script.
// A porta é 0: o SO escolhe uma livre, como no Chrome acima e pelo mesmo motivo.
const servidor = await createServer({ root: RAIZ, logLevel: 'warn', server: { port: 0 } })
await servidor.listen()
const { port } = servidor.httpServer.address()
const servidorUrl = `http://localhost:${port}`

let chrome
try {
  chrome = await subirChrome()
  const linhas = []
  for (const tema of TEMAS) {
    linhas.push(await capturar(chrome.base, servidorUrl, tema))
  }
  console.log(`${SAIDA}:`)
  console.log(linhas.join('\n'))
} finally {
  await chrome?.encerrar()
  await servidor.close()
}
