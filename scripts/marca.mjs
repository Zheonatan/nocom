// Gera todo raster da marca do NoCom a partir da geometria de
// `assets/marca/nocom.svg`.
//
//   node scripts/marca.mjs                    grava os assets
//   node scripts/marca.mjs --contato f.png    grava tambem uma folha de conferencia
//
// Nao ha rasterizador de SVG na arvore de dependencias, e e melhor assim: um anel
// de fio fino reduzido de 1024 para 16px por downsample vira mingau cinza. Aqui
// cada tamanho e DESENHADO no seu proprio tamanho, com a espessura do traco
// recalculada para ele. E o que um desenhista de icone faz a mao, e a unica razao
// pela qual a marca continua legivel em 16px.
//
// Duas formas de campo, escolhidas por plataforma:
//   `quadrado` -- preto sangrando ate a borda. Windows, Linux, favicon, logo solto.
//   `mac`      -- a squircle do macOS. MEDIDA em icones do proprio sistema
//                 (Automator, Calculator, App Store, todos identicos): arte de
//                 824x824 num canvas de 1024 (80,47%) e superelipse de expoente
//                 5,07. Nao e chute nem `rx` de retangulo arredondado -- um arco
//                 simples se le como forma errada ao lado dos vizinhos no Dock.
//
// A folha de conferencia (`--contato`) e o que prova que o calibre por tamanho
// funcionou: ela amplia cada tamanho pequeno em blocos de pixel, nas duas formas
// mais a silhueta da bandeja. Quem mudar qualquer fracao aqui deveria olhar ela
// antes de comitar -- o defeito que este script existe para evitar (anel cinza em
// 16px) e invisivel no tamanho real e obvio ampliado.

import { deflateSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const MESTRE = 'assets/marca/nocom.svg'

// ---------------------------------------------------------------- geometria

/** Diametro externo do anel, em fracao do lado do campo. */
const ANEL = 0.62
/** Espessura do traco, em fracao do lado do campo. Da ~40:1 de diametro/traco. */
const TRACO = 1 / 64
/** Lado da arte no macOS, em fracao do canvas. Medido: 824/1024. */
const CAMPO_MAC = 824 / 1024
/** Expoente da superelipse do macOS. Medido por minimos quadrados no canto. */
const SQUIRCLE_N = 5.07

/**
 * Confere que `ANEL` e `TRACO` acima descrevem o mesmo anel que o SVG mestre.
 *
 * As fracoes estao declaradas duas vezes de proposito -- em fracao aqui, em pixels
 * la -- porque cada lado precisa da forma que ele usa: o SVG e o que vai para o
 * README e para quem pedir um logo, e este script precisa de razoes para reescalar.
 * O que nao pode existir e a DIVERGENCIA: o logo do README com uma proporcao e o
 * icone do Dock com outra e um defeito que ninguem nota, porque os dois nunca
 * aparecem lado a lado. Entao a duplicacao e verificada em vez de tolerada.
 */
function conferirMestre() {
  const svg = readFileSync(join(RAIZ, MESTRE), 'utf8')
  const num = (re, nome) => {
    const m = svg.match(re)
    if (!m) throw new Error(`${MESTRE}: nao achei ${nome}`)
    return Number(m[1])
  }
  const lado = num(/viewBox="0 0 (\d+(?:\.\d+)?) /, 'o viewBox')
  const traco = num(/stroke-width="(\d+(?:\.\d+)?)"/, 'o stroke-width do anel')
  const raio = num(/\br="(\d+(?:\.\d+)?)"/, 'o r do anel')

  // No SVG `r` e a linha de centro do traco; a fracao aqui e do diametro EXTERNO.
  const anelSvg = (2 * (raio + traco / 2)) / lado
  const tracoSvg = traco / lado
  const perto = (a, b) => Math.abs(a - b) < 1e-6
  if (!perto(anelSvg, ANEL) || !perto(tracoSvg, TRACO)) {
    throw new Error(
      `${MESTRE} divergiu deste script.\n` +
        `  anel:  SVG ${anelSvg.toFixed(6)}  script ${ANEL.toFixed(6)}\n` +
        `  traco: SVG ${tracoSvg.toFixed(6)}  script ${TRACO.toFixed(6)}\n` +
        `Alinhe os dois antes de gerar: para as fracoes atuais, o SVG de ${lado} de lado\n` +
        `pede stroke-width="${(TRACO * lado).toFixed(2)}" e r="${((ANEL * lado - TRACO * lado) / 2).toFixed(2)}".`,
    )
  }
}

/**
 * Resolve a geometria de um tamanho concreto, com o ajuste optico que os tamanhos
 * pequenos exigem.
 *
 * **Piso de 1px no traco.** Um traco de 0,4px nao e um fio fino: e um fio cinza.
 * O antialias reparte a tinta entre dois pixels e nenhum dos dois fica branco, e o
 * anel se dissolve exatamente no tamanho em que ele mais precisa ser visto (16px
 * na lista do Finder, 16px na barra de tarefas do Windows). Por isso o traco sobe
 * para 1px inteiro, e nesses tamanhos o anel fica proporcionalmente mais grosso
 * que em 1024. E de proposito -- icone pequeno pede traco mais pesado.
 *
 * **Grade de pixel ate 64px.** Ate ali o traco e o raio externo sao arredondados
 * para inteiro. Com o centro em `px/2` (borda de pixel, todo tamanho aqui e par),
 * raio inteiro poe as quatro pontas cardinais do anel cravadas na grade em vez de
 * esfumadas. Acima de 64px o antialias analitico ja resolve sozinho, e travar na
 * grade so introduziria erro de proporcao.
 */
export function geometria(px, forma) {
  let campo = forma === 'mac' ? px * CAMPO_MAC : px
  // Nos tamanhos minusculos a borda da arte do Mac cai no meio do pixel em toda a
  // volta, e o resultado e um halo cinza de um pixel em vez de um contorno. Meia
  // largura inteira poe as quatro laterais cravadas na grade. Custa 5 pontos
  // percentuais de area em 16px (75% em vez de 80,5%) e ganha uma borda nitida --
  // que e a troca certa, porque em 16px a forma do campo e quase tudo que se ve.
  if (forma === 'mac' && px <= 32) campo = 2 * Math.round(campo / 2)
  let raioExterno = (campo * ANEL) / 2
  let traco = Math.max(1, campo * TRACO)
  if (px <= 64) {
    traco = Math.max(1, Math.round(traco))
    raioExterno = Math.round(raioExterno)
  }
  return { campo, raioExterno, raioInterno: raioExterno - traco, traco }
}

// ------------------------------------------------------------------ desenho

/** Amostras por eixo dentro de um pixel de contorno. 16x16 = 256 por pixel. */
const N = 16

/**
 * Cobertura (0 a 1) para byte de canal sRGB, passando por LUZ LINEAR.
 *
 * Isto importa mais aqui que na maioria dos desenhos, e a razao e a espessura. Um
 * pixel meio coberto emite metade da luz, e meia luz e ~188 em sRGB, nao 128 --
 * gravar 128 e escrever 21% de luz onde deveriam estar 50%. Num anel de fio fino
 * quase todo pixel da curva e um pixel parcial, entao o erro nao fica nas beiradas:
 * ele encolhe o traco inteiro. Composicao linear e o que faz a espessura na tela
 * ser a espessura pedida em `TRACO`.
 */
function sRGB(cobertura) {
  const c = Math.min(1, Math.max(0, cobertura))
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(v * 255)
}
/** Folga que cobre a diagonal de um pixel: define "longe de qualquer contorno". */
const MARGEM = 1.5

/**
 * Desenha um tamanho e devolve RGBA cru.
 *
 * `alfa: 'silhueta'` descarta o campo preto e escreve o anel no canal alfa: e a
 * forma que a barra de menus do macOS exige (`icon_as_template`), onde o sistema
 * pinta a silhueta na cor certa de cada tema. Aqui ela serve so a folha de
 * conferencia -- o asset de verdade e desenhado em `src-tauri/src/marca.rs`, no
 * tamanho que o `tray-icon` pede.
 *
 * Amostragem 16x16 por pixel, com atalho para os pixels inteiramente dentro ou
 * inteiramente fora de qualquer contorno. O atalho e o que deixa 1024px rodar em
 * menos de um segundo sem baixar a qualidade onde ela importa.
 */
export function desenhar(px, forma, alfa = 'opaco') {
  const { raioExterno, raioInterno, campo } = geometria(px, forma)
  const meio = px / 2
  const a = campo / 2
  const rgba = Buffer.alloc(px * px * 4)
  const passo = 1 / N

  // Dentro da squircle `|u/a|^n + |v/a|^n <= 1`, em coordenadas relativas ao centro.
  const F = (u, v) => (Math.abs(u) / a) ** SQUIRCLE_N + (Math.abs(v) / a) ** SQUIRCLE_N
  const noCampo = (u, v) => forma !== 'mac' || F(u, v) <= 1
  /**
   * Distancia aproximada do ponto ao contorno da squircle, em pixels, negativa por
   * dentro: `(F - 1) / |grad F|`.
   *
   * Uma versao anterior usava distancia de Chebyshev para decidir onde amostrar, e
   * estava errada: na diagonal a fronteira da superelipse fica em `0,87 x a`, muito
   * dentro do limite de Chebyshev. Os pixels do canto eram declarados cheios sem
   * amostra nenhuma, e a squircle saia bojuda -- visivel a olho nu em 128px.
   */
  const distanciaCampo = (u, v) => {
    const au = Math.abs(u), av = Math.abs(v)
    if (au === 0 && av === 0) return -a
    const n = SQUIRCLE_N
    const gu = (n / a) * (au / a) ** (n - 1)
    const gv = (n / a) * (av / a) ** (n - 1)
    return (F(u, v) - 1) / (Math.hypot(gu, gv) || 1e-9)
  }

  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const dx = x + 0.5 - meio
      const dy = y + 0.5 - meio
      const d = Math.hypot(dx, dy)

      // O anel: um pixel esta longe do contorno se nao encosta nem no raio externo
      // nem no interno.
      let anel
      if (d > raioExterno + MARGEM || d < raioInterno - MARGEM ||
          (d < raioExterno - MARGEM && d > raioInterno + MARGEM)) {
        anel = d <= raioExterno && d >= raioInterno ? 1 : 0
      } else {
        let dentro = 0
        for (let sy = 0; sy < N; sy++) {
          for (let sx = 0; sx < N; sx++) {
            const dd = Math.hypot(dx - 0.5 + (sx + 0.5) * passo, dy - 0.5 + (sy + 0.5) * passo)
            if (dd <= raioExterno && dd >= raioInterno) dentro++
          }
        }
        anel = dentro / (N * N)
      }

      // O campo: no quadrado e tudo; na squircle so a borda da arte precisa de amostra.
      let cobertura = 1
      if (forma === 'mac') {
        const dist = distanciaCampo(dx, dy)
        if (dist < -MARGEM) cobertura = 1
        else if (dist > MARGEM) cobertura = 0
        else {
          let dentro = 0
          for (let sy = 0; sy < N; sy++) {
            for (let sx = 0; sx < N; sx++) {
              if (noCampo(dx - 0.5 + (sx + 0.5) * passo, dy - 0.5 + (sy + 0.5) * passo)) dentro++
            }
          }
          cobertura = dentro / (N * N)
        }
      }

      const i = (y * px + x) * 4
      if (alfa === 'silhueta') {
        rgba[i] = rgba[i + 1] = rgba[i + 2] = 255
        rgba[i + 3] = Math.round(anel * 255)
      } else {
        // O anel e branco puro sobre preto puro: a mistura vive no canal de cor, e
        // o alfa carrega so a forma do campo. `min` e o que impede o anel de vazar
        // para fora da squircle -- ele nao chega perto da borda, mas uma fracao
        // futura mais generosa chegaria, e um vazamento ali e invisivel em 1024 e
        // grotesco em 32.
        rgba[i] = rgba[i + 1] = rgba[i + 2] = sRGB(Math.min(anel, cobertura))
        // Alfa NAO passa por gama: o canal alfa do PNG e linear por definicao.
        rgba[i + 3] = Math.round(cobertura * 255)
      }
    }
  }
  return rgba
}

// --------------------------------------------------------------------- PNG

const TABELA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** PNG RGBA de 8 bits, sem filtro por linha (o conteudo e liso; deflate resolve). */
export function png(w, h, rgba) {
  const linha = w * 4
  const cru = Buffer.alloc((linha + 1) * h)
  for (let y = 0; y < h; y++) {
    cru[y * (linha + 1)] = 0
    rgba.copy(cru, y * (linha + 1) + 1, y * linha, (y + 1) * linha)
  }
  const pedaco = (tipo, dados) => {
    const b = Buffer.alloc(12 + dados.length)
    b.writeUInt32BE(dados.length, 0)
    b.write(tipo, 4, 'latin1')
    dados.copy(b, 8)
    b.writeInt32BE(crc32(b.subarray(4, 8 + dados.length)) | 0, 8 + dados.length)
    return b
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(cru, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

/**
 * ICO com as entradas em PNG, que e o que o Windows le desde o Vista e o que a
 * propria CLI do Tauri escreve. Varios tamanhos num arquivo deixam o Windows
 * ESCOLHER o raster ja calibrado para o tamanho que ele vai mostrar, em vez de
 * reduzir o de 256 e desmanchar o fio do anel.
 */
function ico(entradas) {
  const cab = Buffer.alloc(6 + 16 * entradas.length)
  cab.writeUInt16LE(0, 0) // reservado
  cab.writeUInt16LE(1, 2) // tipo: icone
  cab.writeUInt16LE(entradas.length, 4)
  let deslocamento = cab.length
  entradas.forEach(({ px, dados }, i) => {
    const p = 6 + 16 * i
    cab[p] = px >= 256 ? 0 : px // 0 quer dizer 256 neste campo de um byte
    cab[p + 1] = px >= 256 ? 0 : px
    cab.writeUInt16LE(1, p + 4) // planos
    cab.writeUInt16LE(32, p + 6) // bits por pixel
    cab.writeUInt32LE(dados.length, p + 8)
    cab.writeUInt32LE(deslocamento, p + 12)
    deslocamento += dados.length
  })
  return Buffer.concat([cab, ...entradas.map((e) => e.dados)])
}

// ------------------------------------------------------------------ execucao

const quadrado = (px) => png(px, px, desenhar(px, 'quadrado'))
const mac = (px) => png(px, px, desenhar(px, 'mac'))

const escritos = []
function escrever(caminho, buf) {
  const abs = join(RAIZ, caminho)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, buf)
  escritos.push(`  ${caminho.padEnd(42)} ${(buf.length / 1024).toFixed(1)} kB`)
}


// **A conferencia roda sempre; a escrita, so como entrada.** `scripts/folha.mjs`
// importa `desenhar`, `png` e `geometria` daqui para montar a folha de
// especificacao com os rasters de verdade. Sem esta guarda, gerar a folha
// reescreveria os 19 icones de carona, sem ninguem ter pedido. Ja a divergencia
// entre este script e o SVG mestre interessa a quem importa tambem: a folha
// mostraria uma proporcao e o README, outra.
conferirMestre()
if (import.meta.main) gerarAssets()

function gerarAssets() {
  const ICONES = 'src-tauri/icons'

  // PNGs do bundle e das lojas: campo quadrado, que e a convencao fora do Mac.
  // `32x32.png` e o primeiro `.png` da lista de `bundle.icon`, e por isso e ele
  // que o Tauri embute como `default_window_icon` -- o mesmo raster que vira o
  // icone da bandeja no Linux. Ele e calibrado para 32px, entao a bandeja recebe
  // um desenho feito para o tamanho dela, e nao uma reducao de 1024.
  escrever(`${ICONES}/32x32.png`, quadrado(32))
  escrever(`${ICONES}/128x128.png`, quadrado(128))
  escrever(`${ICONES}/128x128@2x.png`, quadrado(256))
  escrever(`${ICONES}/icon.png`, quadrado(1024))
  for (const px of [30, 44, 71, 89, 107, 142, 150, 284, 310]) {
    escrever(`${ICONES}/Square${px}x${px}Logo.png`, quadrado(px))
  }
  escrever(`${ICONES}/StoreLogo.png`, quadrado(50))

  escrever(
    `${ICONES}/icon.ico`,
    ico([16, 24, 32, 48, 64, 128, 256].map((px) => ({ px, dados: quadrado(px) }))),
  )

  // `.icns`: campo em squircle, montado pelo `iconutil` do proprio macOS.
  if (process.platform === 'darwin') {
    const iconset = join(RAIZ, ICONES, 'nocom.iconset')
    rmSync(iconset, { recursive: true, force: true })
    mkdirSync(iconset, { recursive: true })
    // Nomes exigidos pelo `iconutil`; `@2x` de um tamanho e o dobro em pixels, e
    // varios pares caem no mesmo raster.
    const cache = new Map()
    for (const [nome, px] of [
      ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
      ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
      ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
      ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
      ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
    ]) {
      if (!cache.has(px)) cache.set(px, mac(px))
      writeFileSync(join(iconset, nome), cache.get(px))
    }
    execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(RAIZ, ICONES, 'icon.icns')])
    rmSync(iconset, { recursive: true, force: true })
    escritos.push(`  ${`${ICONES}/icon.icns`.padEnd(42)} via iconutil`)
  } else {
    console.warn(
      'AVISO: `iconutil` so existe no macOS. `icon.icns` NAO foi regerado -- o arquivo\n' +
        '       versionado continua valendo. Rode este script num Mac ao mudar a geometria.',
    )
  }

  // Favicon do servidor de desenvolvimento, em dois tamanhos: o navegador
  // rasteriza SVG sem calibrar espessura, e em 16px o fio de 0,25px desapareceria.
  escrever('public/favicon-16.png', quadrado(16))
  escrever('public/favicon-32.png', quadrado(32))

  console.log(escritos.join('\n'))

  const alvo = process.argv.indexOf('--contato')
  if (alvo !== -1 && process.argv[alvo + 1]) {
    const TAMANHOS = [16, 24, 32, 48, 64, 128]
    const CELULA = 192
    const AR = 16
    const w = TAMANHOS.length * CELULA + AR * (TAMANHOS.length + 1)
    const h = 3 * CELULA + AR * 4
    const folha = Buffer.alloc(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      folha[i * 4] = folha[i * 4 + 1] = folha[i * 4 + 2] = 128 // cinza medio: mostra
      folha[i * 4 + 3] = 255 //                                   tanto o preto quanto
    } //                                                          a silhueta branca
    const colar = (rgba, px, ox, oy) => {
      const z = Math.max(1, Math.floor(CELULA / px))
      for (let y = 0; y < px * z; y++) {
        for (let x = 0; x < px * z; x++) {
          const s = (Math.floor(y / z) * px + Math.floor(x / z)) * 4
          const d = ((oy + y) * w + ox + x) * 4
          const a = rgba[s + 3] / 255
          for (let c = 0; c < 3; c++) folha[d + c] = Math.round(rgba[s + c] * a + 128 * (1 - a))
        }
      }
    }
    TAMANHOS.forEach((px, i) => {
      const ox = AR + i * (CELULA + AR)
      colar(desenhar(px, 'quadrado'), px, ox, AR)
      colar(desenhar(px, 'mac'), px, ox, AR * 2 + CELULA)
      colar(desenhar(px, 'quadrado', 'silhueta'), px, ox, AR * 3 + CELULA * 2)
    })
    writeFileSync(process.argv[alvo + 1], png(w, h, folha))
    console.log(`\ncontato (quadrado / mac / silhueta): ${process.argv[alvo + 1]}`)
  }

  console.log('\ngeometria por tamanho (campo / diametro externo / traco, em px):')
  for (const px of [16, 24, 32, 48, 64, 128, 256, 1024]) {
    const f = (g) =>
      `${g.campo.toFixed(1)} / ${(g.raioExterno * 2).toFixed(1)} / ${g.traco.toFixed(2)}`
    console.log(
      `  ${String(px).padStart(4)}px   quadrado ${f(geometria(px, 'quadrado')).padEnd(24)}` +
        `mac ${f(geometria(px, 'mac'))}`,
    )
  }
}
