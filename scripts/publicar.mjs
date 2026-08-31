// Publica uma versão: sobe o número em todo lugar que o cita, comita, cria a tag
// e empurra. O resto acontece sozinho no CI.
//
//   npm run publicar -- 0.4.0             sobe, comita, cria a tag e empurra
//   npm run publicar -- 0.4.0 --sem-push  para antes de empurrar, para conferir
//
// **Por que um script, e não `git tag && git push`.** O número da versão vive em
// seis arquivos: `package.json`, `Cargo.toml`, `Cargo.lock`, `tauri.conf.json`
// e os seis links de download dos dois READMEs. Esquecer um não quebra o build —
// quebra em silêncio, semanas depois: o README oferecendo um arquivo que a
// release nova não tem. Aqui ou todos sobem, ou o comando falha sem tocar em
// nada.
//
// **Cada arquivo tem sua própria regra de busca, de propósito.** Trocar todo
// `0.3.0` do `Cargo.lock` acertaria duas dependências que por acaso estão nessa
// versão; no `Cargo.toml`, um `version = "..."` de dependência. Então cada
// arquivo declara ONDE a versão dele mora, e quantas vezes ela deve aparecer —
// se a contagem não bater, o arquivo mudou de forma e o script para em vez de
// adivinhar.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Onde a versão mora. `vezes` é a contagem exata esperada; `null` significa "uma ou mais". */
function regras(antiga) {
  const solta = new RegExp(escapar(antiga), 'g')
  return [
    {
      arquivo: 'package.json',
      // Só a versão do pacote raiz: a de dependência mora dentro de "dependencies".
      busca: /^(  "version": ")[^"]+(")/m,
      vezes: 1,
    },
    {
      arquivo: 'src-tauri/tauri.conf.json',
      busca: /^(  "version": ")[^"]+(")/m,
      vezes: 1,
    },
    {
      arquivo: 'src-tauri/Cargo.toml',
      // Só a de `[package]`: as de dependência são inline, depois de `= {`.
      busca: /^(version = ")[^"]+(")/m,
      vezes: 1,
    },
    {
      arquivo: 'src-tauri/Cargo.lock',
      // Ancorada no bloco do próprio pacote. Sem a âncora acertaria dependências.
      busca: /(\[\[package\]\]\nname = "nocom"\nversion = ")[^"]+(")/,
      vezes: 1,
    },
    {
      arquivo: 'README.md',
      // Aqui a versão é sempre a do NoCom: os seis links de download (duas vezes
      // por linha, no texto e na URL) e a linha do estado do projeto.
      busca: solta,
      vezes: null,
    },
    {
      // A tradução carrega os mesmos links de download, então envelhece igual.
      arquivo: 'README.en.md',
      busca: solta,
      vezes: null,
    },
    // **A vitrine e a landing page não entram aqui, e não é esquecimento.**
    // `scripts/vitrine/stub.js` e `scripts/site.mjs` leem a versão do
    // `package.json` em tempo de execução, então não há número para trocar —
    // e uma regra para eles falharia com "não achei a versão", que é o que
    // acontecia quando a única menção restante no `stub.js` era um número
    // dentro de um comentário.
  ]
}

/** Arquivos onde NENHUMA menção à versão antiga pode sobrar depois da troca. */
const SEM_SOBRA = ['package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml', 'README.md', 'README.en.md']

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function git(...args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8' }).trim()
}

function morrer(mensagem) {
  console.error(`\n  ✗ ${mensagem}\n`)
  process.exit(1)
}

// ------------------------------------------------------------------ entrada

const args = process.argv.slice(2)
const semPush = args.includes('--sem-push')
const nova = args.find((a) => !a.startsWith('--'))

if (!nova) morrer('uso: npm run publicar -- 0.4.0 [--sem-push]')
if (!/^\d+\.\d+\.\d+$/.test(nova)) morrer(`"${nova}" não é uma versão no formato X.Y.Z`)

const antiga = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version
if (antiga === nova) morrer(`o projeto já está na ${nova}`)

// ------------------------------------------------- o repositório está pronto?

// A tag é o gatilho de tudo que vem depois, e ela aponta para UM commit. Se a
// árvore está suja, o que for publicado não é o que está no disco de quem rodou.
if (git('status', '--porcelain')) morrer('há mudanças não comitadas — comite ou guarde antes de publicar')

const ramo = git('rev-parse', '--abbrev-ref', 'HEAD')
if (ramo !== 'main') morrer(`você está em "${ramo}", e a release sai da main`)

const tag = `v${nova}`
if (git('tag', '--list', tag)) morrer(`a tag ${tag} já existe`)

// A release nasce com as notas do CHANGELOG.md: o workflow copia a seção da
// versão para o corpo dela. Sem a seção escrita, a release sairia com um corpo
// genérico — então o esquecimento para aqui, antes de tocar em qualquer arquivo.
if (!new RegExp(`^## ${escapar(nova)} `, 'm').test(readFileSync(join(RAIZ, 'CHANGELOG.md'), 'utf8'))) {
  morrer(`o CHANGELOG.md não tem a seção "## ${nova} — <data>" — escreva as notas da versão antes de publicar`)
}

// ------------------------------------------------------------------- a troca

const escritas = []

for (const { arquivo, busca, vezes } of regras(antiga)) {
  const caminho = join(RAIZ, arquivo)
  const texto = readFileSync(caminho, 'utf8')

  const achados = busca.global ? (texto.match(busca) ?? []).length : busca.test(texto) ? 1 : 0
  busca.lastIndex = 0

  if (achados === 0) morrer(`não achei a versão em ${arquivo} — o arquivo mudou de forma?`)
  if (vezes !== null && achados !== vezes) {
    morrer(`esperava ${vezes} menção(ões) à versão em ${arquivo}, achei ${achados}`)
  }

  const novo = busca.global ? texto.replaceAll(busca, nova) : texto.replace(busca, `$1${nova}$2`)
  escritas.push({ arquivo, caminho, novo, achados })
}

// Só grava depois que TODOS passaram: uma regra que falha no meio deixaria a
// árvore com metade dos arquivos numa versão e metade na outra.
for (const { caminho, novo } of escritas) writeFileSync(caminho, novo)

for (const { arquivo } of escritas.filter((e) => SEM_SOBRA.includes(e.arquivo))) {
  if (readFileSync(join(RAIZ, arquivo), 'utf8').includes(antiga)) {
    morrer(`${arquivo} ainda menciona a ${antiga} depois da troca — confira à mão (nada foi comitado)`)
  }
}

for (const { arquivo, achados } of escritas) console.log(`  ${arquivo} — ${achados}×`)
console.log(`\n  ${antiga} → ${nova}`)

// ------------------------------------------------------------ commit e tag

git('add', ...escritas.map((e) => e.arquivo))
git('commit', '-m', `Publica a ${nova}`)
git('tag', '-a', tag, '-m', `NoCom ${nova}`)

if (semPush) {
  console.log(`\n  Commit e tag ${tag} criados. Para publicar de verdade:\n`)
  console.log(`      git push origin main ${tag}\n`)
  console.log(`  Para desfazer:\n`)
  console.log(`      git tag -d ${tag} && git reset --hard HEAD~1\n`)
  process.exit(0)
}

git('push', 'origin', 'main', tag)

console.log(`\n  ✓ ${tag} publicada.\n`)
console.log('  O CI agora gera os instaladores, sobe a release, atualiza o cask')
console.log('  do Homebrew e abre o PR do winget:\n')
console.log('      https://github.com/Zheonatan/nocom/actions\n')
