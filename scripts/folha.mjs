// Monta a folha de especificacao da marca: `assets/marca/especificacao.html`.
//
//   node scripts/folha.mjs                 grava o HTML autonomo no repositorio
//   node scripts/folha.mjs --saida f.html  grava em outro lugar
//   node scripts/folha.mjs --parcial       sem <!doctype>/<html>/<head>/<body>
//
// **Por que a folha e gerada e nao escrita a mao.** Ela mostra numeros (a tabela
// de calibre) e imagens (os rasters em tamanho real e ampliados) que sao a saida
// de `marca.mjs`. Uma folha escrita a mao empata com o desenho na primeira mudanca
// de fracao e depois mente com confianca -- que e pior que nao existir, porque
// alguem vai medir por ela. Aqui os dois vem da mesma funcao que gera os icones
// empacotados: divergir e impossivel, nao improvavel.
//
// **A silhueta da bandeja vem do Rust, nao de uma reimplementacao.** Ela e o unico
// pedaco da marca que nao mora em `marca.mjs`, e reescrever aquela aritmetica aqui
// criaria exatamente o risco de deriva que o resto do arquivo existe para eliminar.
// Entao este script roda o teste `grava_a_silhueta_para_conferencia` de
// `src-tauri/src/marca.rs` e le os bytes que ele produziu. Custa um `cargo test` e
// paga com a garantia de que a folha mostra o que a barra de menus vai receber.
//
// `--parcial` existe porque o Artifact do Claude embrulha o conteudo no proprio
// esqueleto de documento: publicar um arquivo com `<!doctype>` proprio aninharia
// duas tags `html`. Um gerador, duas saidas, nenhuma copia divergente.

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { desenhar, png, geometria } from './marca.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(nome)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}
const SAIDA = arg('--saida', 'assets/marca/especificacao.html')
const PARCIAL = process.argv.includes('--parcial')

// ----------------------------------------------------------------- espécimes

const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`
const raster = (px, forma) => uri(png(px, px, desenhar(px, forma)))

/**
 * A silhueta da bandeja, pintada nas duas tintas que o macOS usa, a partir dos
 * bytes que `src-tauri/src/marca.rs` gravou.
 */
function silhuetaDoRust() {
  const pgm = join(tmpdir(), `nocom-folha-${process.pid}.pgm`)
  try {
    execFileSync('cargo', ['test', 'grava_a_silhueta', '--', '--ignored'], {
      cwd: join(RAIZ, 'src-tauri'),
      env: { ...process.env, NOCOM_MARCA_PGM: pgm },
      stdio: 'pipe',
    })
  } catch (erro) {
    throw new Error(
      'nao consegui rodar `cargo test` para obter a silhueta da bandeja.\n' +
        'A folha mostra o desenho REAL de src-tauri/src/marca.rs, e nao uma\n' +
        'reimplementacao dele — sem cargo nao ha o que mostrar.\n\n' +
        String(erro.stderr || erro.message).trim(),
    )
  }
  const buf = readFileSync(pgm)
  rmSync(pgm, { force: true })
  // Cabecalho PGM binario: "P5\n<w> <h>\n<max>\n". Tres quebras de linha.
  const n1 = buf.indexOf(10)
  const n2 = buf.indexOf(10, n1 + 1)
  const dim = buf.toString('latin1', n1 + 1, n2).trim().split(/\s+/).map(Number)
  const alfa = buf.subarray(buf.indexOf(10, n2 + 1) + 1)
  const [w, h] = dim
  if (alfa.length !== w * h) {
    throw new Error(`PGM com ${alfa.length} bytes para ${w}x${h} — cabecalho inesperado`)
  }
  const pintar = (tinta) => {
    const rgba = Buffer.alloc(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = tinta
      rgba[i * 4 + 3] = alfa[i]
    }
    return uri(png(w, h, rgba))
  }
  return { lado: w, preta: pintar(0), branca: pintar(255) }
}

const bandeja = silhuetaDoRust()

// -------------------------------------------------------------------- tabela

const QUAD = [16, 24, 32, 48, 64, 128, 256]
const MAC = [16, 32, 64, 128, 256, 512]
const CALIBRE = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

/** O traco subiu pelo piso de 1px? E o que a coluna em azul da tabela marca. */
const noPiso = (g) => g.traco > g.campo / 64 + 1e-9

const celula = (px, forma) =>
  `<figure class="spec"><img src="${raster(px, forma)}" width="${px}" height="${px}" alt=""><figcaption>${px}</figcaption></figure>`

const ampliada = (px, forma) =>
  `<figure class="zoom"><img src="${raster(px, forma)}" alt="" style="width:${px * 8}px;height:${px * 8}px"><figcaption>${px} px <span>&times;8</span></figcaption></figure>`

const linhas = CALIBRE.map((px) => {
  const q = geometria(px, 'quadrado')
  const m = geometria(px, 'mac')
  const cel = (g) =>
    `<td class="${noPiso(g) ? 'piso' : ''}">${g.traco.toFixed(2)}${
      noPiso(g) ? '<abbr title="o traço ideal seria mais fino que 1px, e abaixo de 1px o fio vira cinza">&nbsp;↑</abbr>' : ''
    }</td>`
  return `<tr>
        <th scope="row">${px}</th>
        <td>${q.campo.toFixed(0)}</td><td>${(q.raioExterno * 2).toFixed(1)}</td>${cel(q)}
        <td>${m.campo.toFixed(0)}</td><td>${(m.raioExterno * 2).toFixed(1)}</td>${cel(m)}
      </tr>`
}).join('\n')

// ---------------------------------------------------------------------- html

const CABECA = `<title>Anel NoCom</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Spectral:ital,wght@0,400;0,500;1,400&family=Azeret+Mono:wght@400;500&display=swap">
<style>
  /* Paleta de película de desenho técnico: cinza com viés frio, e um único azul
     de cota. Preto e branco puros ficam RESERVADOS aos espécimes — a folha não
     pode competir com a marca que ela documenta. */
  :root {
    --pelicula: #e8ebee;
    --prancha: #f6f7f9;
    --tinta: #161a1f;
    --tinta-fraca: #5c6672;
    --fio: #c9cfd6;
    --fio-forte: #adb6c0;
    --cota: #1f6f9c;
    --cota-fraca: #1f6f9c26;
    --barra-clara: #f2f2f2;
    --barra-escura: #1c1c1e;
    --serif: "Spectral", Georgia, "Times New Roman", serif;
    --grot: "Archivo", "Helvetica Neue", Arial, sans-serif;
    --mono: "Azeret Mono", ui-monospace, "SF Mono", Menlo, monospace;
  }
  /* Os tokens são redefinidos nos três estados de tema (sistema, claro explícito,
     escuro explícito) e nunca dentro de um componente: uma cor cuja única
     definição vive atrás de [data-theme] não existe no estado sem marcação. */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --pelicula: #15181c;
      --prancha: #1d2126;
      --tinta: #e6e9ec;
      --tinta-fraca: #909aa5;
      --fio: #2e343b;
      --fio-forte: #414951;
      --cota: #6bbde8;
      --cota-fraca: #6bbde826;
    }
  }
  :root[data-theme="dark"] {
    --pelicula: #15181c;
    --prancha: #1d2126;
    --tinta: #e6e9ec;
    --tinta-fraca: #909aa5;
    --fio: #2e343b;
    --fio-forte: #414951;
    --cota: #6bbde8;
    --cota-fraca: #6bbde826;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--pelicula);
    color: var(--tinta);
    font-family: var(--serif);
    font-size: 16px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  .folha { max-width: 1080px; margin: 0 auto; padding: clamp(28px, 5vw, 72px) clamp(20px, 4vw, 56px) 96px; }

  /* Bloco de título, como o canto de uma prancha de desenho. */
  .titulo {
    display: grid; grid-template-columns: auto 1fr; gap: clamp(20px, 4vw, 40px);
    align-items: end; padding-bottom: 28px; border-bottom: 2px solid var(--tinta);
  }
  .titulo img { display: block; width: 128px; height: 128px; }
  h1 {
    font-family: var(--grot); font-weight: 700; font-size: clamp(38px, 7vw, 68px);
    letter-spacing: -0.035em; line-height: 0.95; margin: 0 0 10px; text-wrap: balance;
  }
  .resumo { font-size: 1.0625rem; margin: 0; max-width: 46ch; color: var(--tinta-fraca); }
  .resumo em { color: var(--tinta); font-style: italic; }

  /* As frações, como cotas. */
  .fracoes { display: flex; flex-wrap: wrap; gap: 0; margin: 36px 0 0; border-top: 1px solid var(--fio); }
  .fracao { flex: 1 1 220px; padding: 18px 22px 18px 0; border-bottom: 1px solid var(--fio); }
  .fracao b { display: block; font-family: var(--mono); font-weight: 500; font-size: 1.5rem; color: var(--cota); letter-spacing: -0.02em; }
  .fracao span { display: block; font-family: var(--grot); font-size: 0.7rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: var(--tinta-fraca); margin-top: 4px; }
  .fracao p { margin: 8px 0 0; font-size: 0.9375rem; color: var(--tinta-fraca); max-width: 34ch; }

  h2 { font-family: var(--grot); font-weight: 600; font-size: clamp(22px, 3vw, 30px); letter-spacing: -0.025em; margin: 72px 0 6px; text-wrap: balance; }
  h2 + .sub { margin: 0 0 26px; color: var(--tinta-fraca); max-width: 62ch; font-size: 1rem; }
  h3 { font-family: var(--grot); font-weight: 600; font-size: 0.75rem; letter-spacing: 0.13em; text-transform: uppercase; color: var(--tinta-fraca); margin: 30px 0 12px; }
  p { max-width: 64ch; }
  .miudo { font-size: 0.9375rem; color: var(--tinta-fraca); }
  p code, li code, td code { font-family: var(--mono); font-size: 0.85em; background: var(--cota-fraca); padding: 1px 4px; border-radius: 2px; }

  /* Pranchas de espécime. */
  .prancha { background: var(--prancha); border: 1px solid var(--fio); padding: 26px 24px 20px; overflow-x: auto; }
  .fila { display: flex; align-items: flex-end; gap: 26px; min-height: 60px; }
  figure { margin: 0; }
  .spec img, .zoom img { display: block; }
  figcaption {
    font-family: var(--mono); font-size: 0.6875rem; color: var(--tinta-fraca);
    margin-top: 10px; padding-top: 6px; border-top: 1px solid var(--fio-forte);
    font-variant-numeric: tabular-nums;
  }
  .zoom img { image-rendering: pixelated; border: 1px solid var(--fio-forte); }
  .zoom figcaption span { color: var(--cota); }
  .dois { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }

  /* Barra de menus simulada. NÃO segue o tema da página: ela mostra os dois temas
     do macOS, que é justamente o que está sendo documentado. */
  .barra { display: flex; align-items: center; justify-content: flex-end; gap: 18px; height: 26px; padding: 0 12px; font-family: var(--grot); font-size: 12px; }
  .barra.clara { background: var(--barra-clara); color: #1c1c1e; border: 1px solid var(--fio-forte); }
  .barra.escura { background: var(--barra-escura); color: #f2f2f2; border: 1px solid var(--fio-forte); }
  .barra img { display: block; width: 18px; height: 18px; }
  .barra time { font-variant-numeric: tabular-nums; }
  .legenda { font-family: var(--mono); font-size: 0.6875rem; color: var(--tinta-fraca); margin-top: 8px; }

  /* Tabela de calibre. */
  .rolo { overflow-x: auto; border: 1px solid var(--fio); background: var(--prancha); }
  table { border-collapse: collapse; width: 100%; min-width: 560px; font-family: var(--mono); font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
  caption { text-align: left; padding: 14px 16px 0; font-family: var(--serif); font-size: 0.9375rem; color: var(--tinta-fraca); }
  th, td { padding: 7px 12px; text-align: right; border-bottom: 1px solid var(--fio); }
  thead th { font-weight: 500; font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--tinta-fraca); border-bottom: 1px solid var(--fio-forte); }
  thead .grupo th { border-bottom: 0; padding-bottom: 0; color: var(--cota); letter-spacing: 0.13em; }
  tbody th { text-align: left; font-weight: 500; }
  tbody tr:last-child td, tbody tr:last-child th { border-bottom: 0; }
  td.piso { color: var(--cota); font-weight: 500; }
  abbr { text-decoration: none; cursor: help; }

  ul.arquivos { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--fio); }
  ul.arquivos li { display: grid; grid-template-columns: minmax(210px, auto) 1fr; gap: 4px 22px; padding: 11px 0; border-bottom: 1px solid var(--fio); align-items: baseline; }
  ul.arquivos code { font-family: var(--mono); font-size: 0.8125rem; background: none; padding: 0; color: var(--tinta); }
  ul.arquivos span { color: var(--tinta-fraca); font-size: 0.9375rem; }

  .nota { border-left: 2px solid var(--cota); padding: 2px 0 2px 18px; margin: 26px 0 0; color: var(--tinta-fraca); }
  .nota b { color: var(--tinta); font-weight: 500; }

  a { color: var(--cota); text-underline-offset: 3px; }
  a:focus-visible, abbr:focus-visible { outline: 2px solid var(--cota); outline-offset: 2px; }

  @media (max-width: 620px) {
    .titulo { grid-template-columns: 1fr; align-items: start; }
    .titulo img { width: 88px; height: 88px; }
  }
</style>`

const CORPO = `<div class="folha">
  <header class="titulo">
    <img src="${raster(256, 'mac')}" alt="A marca: um anel branco de fio fino num campo preto.">
    <div>
      <h1>Anel</h1>
      <p class="resumo">A marca do NoCom é <em>um anel branco de fio fino num campo preto</em>. Sem logotipo escrito, sem monograma, sem check. O nome já está na barra de título, no tooltip da bandeja e no README — a marca não o repete.</p>
    </div>
  </header>

  <div class="fracoes">
    <div class="fracao">
      <b>0,62</b><span>diâmetro ÷ campo</span>
      <p>Fio fino precisa de circunferência para ter peso. Círculo pequeno com traço fino é timidez duas vezes.</p>
    </div>
    <div class="fracao">
      <b>1 ⁄ 64</b><span>traço ÷ campo</span>
      <p>Dá cerca de 40:1 de diâmetro por traço. É o que “bem fino” significa em número.</p>
    </div>
    <div class="fracao">
      <b>5,07</b><span>expoente da squircle</span>
      <p>Medido em ícones do próprio macOS, não estimado. Arte de 824 num canvas de 1024.</p>
    </div>
  </div>

  <h2>O campo tem duas formas, uma por plataforma</h2>
  <p class="sub">Um ícone é sempre visto em companhia. No Dock, o vizinho define o que parece certo; na barra de tarefas do Windows, outro vizinho define outra coisa.</p>
  <div class="dois">
    <div>
      <div class="prancha"><div class="fila"><figure class="spec"><img src="${raster(256, 'mac')}" width="128" height="128" alt=""><figcaption>macOS · .icns</figcaption></figure></div></div>
      <p class="miudo">A squircle do sistema, com os cantos vazados e o respiro que o macOS espera. Não é um retângulo de canto arredondado: um arco de raio constante se lê como forma errada ao lado dos vizinhos.</p>
    </div>
    <div>
      <div class="prancha"><div class="fila"><figure class="spec"><img src="${raster(256, 'quadrado')}" width="128" height="128" alt=""><figcaption>Windows · Linux · favicon</figcaption></figure></div></div>
      <p class="miudo">O preto sangra até a borda, sem respiro e sem arredondamento — a convenção desses sistemas, que aplicam o próprio respiro por fora.</p>
    </div>
  </div>

  <h2>Cada tamanho é desenhado, nunca reduzido</h2>
  <p class="sub">A fração <code>campo ÷ 64</code> dá 16px em 1024 e <b>0,25px em 16</b>. E 0,25px não é um fio fino: é um fio cinza, porque o antialias reparte a tinta entre dois pixels e nenhum dos dois fica branco. Abaixo, os rasters que o app empacota — em tamanho real.</p>
  <div class="prancha">
    <h3 style="margin-top:0">Campo quadrado, 1:1</h3>
    <div class="fila">${QUAD.map((px) => celula(px, 'quadrado')).join('')}</div>
    <h3>Squircle do macOS, 1:1</h3>
    <div class="fila">${MAC.map((px) => celula(px, 'mac')).join('')}</div>
  </div>

  <h3>Ampliados oito vezes, onde o calibre se vê</h3>
  <div class="prancha">
    <div class="fila">${[16, 24, 32].map((px) => ampliada(px, 'quadrado')).join('')}${[16, 32].map((px) => ampliada(px, 'mac')).join('')}</div>
  </div>
  <p class="nota"><b>O traço sobe para 1px inteiro nos tamanhos pequenos</b>, e por isso o anel fica proporcionalmente mais grosso que em 1024. É deliberado: ícone pequeno pede traço mais pesado, e a alternativa não é um anel mais fino — é nenhum anel.</p>

  <h2>A tabela de calibre</h2>
  <div class="rolo">
    <table>
      <caption>Medidas em pixels. Em azul, os tamanhos onde o piso de 1px entrou em ação.</caption>
      <thead>
        <tr class="grupo"><th></th><th colspan="3">Quadrado</th><th colspan="3">macOS</th></tr>
        <tr><th scope="col">Canvas</th><th scope="col">Campo</th><th scope="col">Ø ext.</th><th scope="col">Traço</th><th scope="col">Campo</th><th scope="col">Ø ext.</th><th scope="col">Traço</th></tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>
  </div>

  <h2>Na barra de menus, ícone é silhueta</h2>
  <p class="sub"><code>icon_as_template(true)</code> descarta a cor e usa só o canal alfa, para o sistema pintar a forma na tinta certa de cada tema. O alfa do ícone do app é o campo inteiro, opaco de ponta a ponta — usá-lo ali mostraria um <b>retângulo cheio</b>, com o anel sumido dentro dele. Então a bandeja do Mac recebe o anel sozinho.</p>
  <div class="dois">
    <div>
      <div class="barra clara"><img src="${bandeja.preta}" alt=""><time>10:24</time></div>
      <p class="legenda">tema claro · o sistema pinta de preto</p>
    </div>
    <div>
      <div class="barra escura"><img src="${bandeja.branca}" alt=""><time>10:24</time></div>
      <p class="legenda">tema escuro · o sistema pinta de branco</p>
    </div>
  </div>
  <div class="prancha" style="margin-top:20px">
    <div class="fila">
      <figure class="zoom"><img src="${bandeja.preta}" alt="" style="width:${bandeja.lado * 8}px;height:${bandeja.lado * 8}px"><figcaption>${bandeja.lado} px <span>&times;8</span> · fonte @2x dos 18 pt</figcaption></figure>
      <div>
        <p class="miudo" style="margin:0 0 12px">O <code>tray-icon</code> fixa a altura do <code>NSImage</code> em <b>18 pontos</b>. Um fonte de ${bandeja.lado}px é exatamente @2x disso, então em tela Retina cada pixel do desenho cai num pixel físico.</p>
        <p class="miudo" style="margin:0">O traço aqui é <b>1,5 pt</b>, e não os 40:1 do ícone do app — nessa razão ele mediria 0,75px e viraria borrão. 1,5 pt é a espessura dos ícones que a Apple põe nessa barra, que é a vizinhança contra a qual este desenho é julgado.</p>
      </div>
    </div>
  </div>
  <p class="nota">Windows e Linux continuam com o ícone do app na bandeja: lá o sistema desenha com as cores do arquivo, e o campo preto é justamente o que dá contraste próprio ao anel branco numa barra que pode ser clara ou escura.</p>

  <h2>Onde a marca mora</h2>
  <ul class="arquivos">
    <li><code>assets/marca/nocom.svg</code><span>Geometria canônica. O logo solto, e o que vai para o README.</span></li>
    <li><code>scripts/marca.mjs</code><span>Desenha todo raster empacotado. <code>npm run marca</code>. Confere o SVG mestre antes de gerar e falha se as frações divergirem.</span></li>
    <li><code>scripts/folha.mjs</code><span>Gera esta folha. <code>npm run marca:folha</code>. Os números e as imagens saem do mesmo desenho que os ícones — esta página não pode divergir deles.</span></li>
    <li><code>src-tauri/src/marca.rs</code><span>O anel da barra de menus do macOS, desenhado em vez de empacotado, com quatro testes sobre a geometria. A silhueta acima é a saída dele.</span></li>
    <li><code>src-tauri/icons/</code><span>19 arquivos: os PNGs do bundle, os nove quadrados de loja do Windows, o <code>.ico</code> com sete rasters e o <code>.icns</code> com dez.</span></li>
    <li><code>public/favicon-16.png</code><span>Mais o de 32. Dois PNGs e não o SVG, porque o navegador rasteriza vetor sem calibrar espessura.</span></li>
  </ul>
</div>`

const doc = PARCIAL
  ? `${CABECA}\n\n${CORPO}\n`
  : `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${CABECA}
</head>
<body>
${CORPO}
</body>
</html>
`

const abs = SAIDA.startsWith('/') ? SAIDA : join(RAIZ, SAIDA)
mkdirSync(dirname(abs), { recursive: true })
writeFileSync(abs, doc)
console.log(
  `${SAIDA}  ${(doc.length / 1024).toFixed(0)} kB  ` +
    `${(doc.match(/data:image\/png/g) || []).length} imagens embutidas` +
    `${PARCIAL ? '  (parcial, sem esqueleto)' : ''}`,
)
