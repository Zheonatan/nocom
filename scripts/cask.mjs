// Sobe a versão e os `sha256` do cask do Homebrew, preservando o resto do arquivo.
//
//   node scripts/cask.mjs --arquivo tap/Casks/nocom.rb \
//     --versao 0.4.0 --arm <sha256> --intel <sha256>
//
// Roda no CI, dentro do clone de `Zheonatan/homebrew-tap`, depois que a release
// já existe. Pode rodar à mão também, se algum dia o job falhar no meio.
//
// **Por que reescrever três campos, e não gerar o cask inteiro.** O `nocom.rb`
// tem comentários que explicam decisões que nenhum gerador saberia repetir: por
// que existe o `depends_on macos: :catalina`, por que o `zap` limpa também a
// pasta `com.minitodo.app` da época em que o app tinha outro nome. Um template
// apagaria isso a cada release, em silêncio. Aqui só mudam os três valores que
// mudam por versão — e se algum não for encontrado exatamente uma vez, o script
// para, porque um cask meio atualizado é pior que um cask velho: o `brew`
// baixaria a versão nova conferindo o hash da antiga e recusaria a instalação
// para todo mundo.

import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const opcao = (nome) => {
  const i = args.indexOf(`--${nome}`)
  return i === -1 ? null : args[i + 1]
}

const arquivo = opcao('arquivo')
const versao = opcao('versao')
const arm = opcao('arm')
const intel = opcao('intel')

function morrer(mensagem) {
  console.error(`\n  ✗ ${mensagem}\n`)
  process.exit(1)
}

if (!arquivo || !versao || !arm || !intel) {
  morrer('uso: node scripts/cask.mjs --arquivo <cask.rb> --versao X.Y.Z --arm <sha256> --intel <sha256>')
}
if (!/^\d+\.\d+\.\d+$/.test(versao)) morrer(`"${versao}" não é uma versão no formato X.Y.Z`)
for (const [nome, sha] of [['arm', arm], ['intel', intel]]) {
  if (!/^[0-9a-f]{64}$/.test(sha)) morrer(`o sha256 de ${nome} não parece um sha256: "${sha}"`)
}

const CAMPOS = [
  { nome: 'version', busca: /^(  version ")[^"]+(")/m, valor: versao },
  { nome: 'sha256 arm', busca: /^(  sha256 arm:\s+")[0-9a-f]+(")/m, valor: arm },
  { nome: 'sha256 intel', busca: /^(\s+intel: ")[0-9a-f]+(")/m, valor: intel },
]

let texto = readFileSync(arquivo, 'utf8')

for (const { nome, busca, valor } of CAMPOS) {
  const achados = texto.match(new RegExp(busca.source, 'gm'))?.length ?? 0
  if (achados !== 1) morrer(`esperava 1 campo "${nome}" em ${arquivo}, achei ${achados}`)
  texto = texto.replace(busca, `$1${valor}$2`)
}

writeFileSync(arquivo, texto)
console.log(`  ${arquivo} → ${versao}`)
