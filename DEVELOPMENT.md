# Desenvolvimento

Como rodar, testar e publicar o NoCom. Este documento é em português, como os
demais documentos do projeto — o porquê está no
[`CONTRIBUTING.md`](CONTRIBUTING.md), que também diz o que um PR precisa para
entrar. *Like every project document, this one is in Portuguese; issues and PRs
in English are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md).*

## Rodando

Tauri v2 (Rust) + React 19 + TypeScript + Tailwind + shadcn/ui.

```sh
npm install
npm run tauri dev      # desenvolvimento
npm run tauri build    # instaladores para a plataforma atual
npm test               # testes do frontend (node --test, sem dependência extra)
cd src-tauri && cargo test   # testes do backend

npm run marca          # regera os ícones a partir de assets/marca/nocom.svg
npm run vitrine        # regera as fotos (assets/telas/) e o espécime (assets/especime/)
```

Os dois últimos existem para que nenhuma imagem do projeto seja um arquivo órfão:
mudou a interface, `npm run vitrine` refaz as fotos dos READMEs nos dois temas e
nas duas línguas, com dados de exemplo e a data de hoje calculada na hora — e
refaz também o **espécime** que a
[landing page](https://zheonatan.github.io/nocom) mostra, que não é foto
nenhuma: é o DOM montado do app, extraído com o CSS dele e com as regiões das
chamadas medidas, para a página desenhar a janela em vetor em vez de em pixel.
O raster fica porque o GitHub não renderiza mais que isso; a página, que pode,
deixou de usá-lo. O porquê está no cabeçalho de `scripts/vitrine/captura.mjs`.
Ele precisa de um navegador baseado em Chromium — se o seu não estiver no lugar
de sempre, aponte com `CHROME=/caminho/para/chrome npm run vitrine`. (Mexeu no
espécime, rode `npm run site` na sequência: a landing page embute o que a
vitrine gera, e o CI confere os dois com `npm run site -- --check`.)

**Pré-requisitos:** Node 22.18+ (o `npm test` usa o apagador de tipos nativo do
Node, sem transpilador), Rust estável e as
[dependências de sistema do Tauri](https://tauri.app/start/prerequisites/).
No Linux: `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
e `libxdo-dev`.

Documentos do projeto: [`PRODUCT.md`](PRODUCT.md) (o que o produto é e por quê),
[`CONTRACT.md`](CONTRACT.md) (comportamento normativo e fronteira IPC) e
[`DESIGN.md`](DESIGN.md) (decisões de interface). O que cada versão mudou está
no [`CHANGELOG.md`](CHANGELOG.md).

## Publicando uma versão

**É um comando:**

```sh
npm run publicar -- 0.5.0
```

Ele sobe o número nos sete arquivos que o citam (`package.json`, `Cargo.toml`,
`Cargo.lock`, `tauri.conf.json`, os links de download dos dois READMEs e os
exemplos deste documento — o IPC falso da vitrine lê a versão do `package.json`
em tempo de execução), comita, cria a tag `v0.5.0` e empurra. Se qualquer
arquivo tiver mudado de forma, ele para antes de comitar em vez de subir uma
versão pela metade — e ele se recusa a publicar uma versão sem seção no
[`CHANGELOG.md`](CHANGELOG.md), que é de onde saem as notas da release.
`--sem-push` para antes de empurrar, para conferir o commit.

Da tag em diante o [workflow](.github/workflows/release.yml) faz o resto sozinho:

| Workflow / job | O que faz |
| --- | --- |
| [`release.yml`](.github/workflows/release.yml) → `build` | Compila as quatro plataformas, cria a release com a seção do CHANGELOG no corpo, e sobe os instaladores mais o `latest.json` que o botão de atualizar consulta |
| [`gerenciadores.yml`](.github/workflows/gerenciadores.yml) → `homebrew` | Calcula os `sha256` dos DMGs e comita a versão nova no cask de [Zheonatan/homebrew-tap](https://github.com/Zheonatan/homebrew-tap) |
| [`gerenciadores.yml`](.github/workflows/gerenciadores.yml) → `winget` | Roda `wingetcreate update` e abre o PR do manifesto em [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) |

O `gerenciadores.yml` roda **só em tag** — um `workflow_dispatch` de teste no
`release.yml` não mexe no que os usuários instalam. E o PR do winget ainda passa
pela validação automática e pela revisão da Microsoft, então a versão nova
costuma aparecer no `winget install` algumas horas depois da release.

**Quando um dos dois falha, não precisa refazer a release.** O
`gerenciadores.yml` também aceita disparo manual pela aba Actions, pedindo só a
tag de uma release já publicada — ele relê os instaladores de lá. Serve para
token expirado, PR do winget recusado, rede caindo no meio, ou para conferir um
secret novo sem esperar a próxima versão. Repetir é seguro: reescrever o cask
com os mesmos valores não gera commit, e o `wingetcreate` não reabre PR de uma
versão que já entrou.

## Os secrets

**Três secrets do repositório sustentam isso**, além dos dois de assinatura logo
abaixo:

| Secret | Para quê | Escopo |
| --- | --- | --- |
| `TAP_TOKEN` | Comitar no tap, que é outro repositório e o `GITHUB_TOKEN` não alcança | Fine-grained, `contents: write`, só em `Zheonatan/homebrew-tap` |
| `WINGET_TOKEN` | Abrir o PR no winget-pkgs pelo fork da sua conta | Clássico, escopo `public_repo` |

**A primeira versão no winget é manual**, uma vez só: `wingetcreate update`
precisa que o pacote já exista. Com o `.exe` de uma release publicada:

```powershell
wingetcreate new https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_x64-setup.exe
```

Responda `Zheonatan.NoCom` como identificador — é o que o job procura. Da
segunda release em diante o CI cuida.

**A chave de assinatura das atualizações** é o que faz o app aceitar um pacote.
Gerada uma vez com `npm run tauri signer generate -- -w ~/.tauri/nocom.key`: a
metade pública vai em `plugins.updater.pubkey` no `tauri.conf.json`, e a privada
em dois secrets do repositório, `TAURI_SIGNING_PRIVATE_KEY` e
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

Guarde a privada fora da máquina. **Perdê-la significa que ninguém que já
instalou volta a atualizar de dentro do app** — trocar o `pubkey` obriga todo
mundo a reinstalar na mão uma última vez.
