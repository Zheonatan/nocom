<div align="center">

# NoCom

**Uma lista de tarefas que vive por cima do seu trabalho.**

Aparece com um atalho de teclado, some com `Escape`, e guarda tudo no seu
computador. Sem conta, sem nuvem, sem sincronização.

[![Download](https://img.shields.io/github/v/release/Zheonatan/nocom?label=download&style=for-the-badge)](https://github.com/Zheonatan/nocom/releases/latest)

</div>

---

## O problema

Você está no meio de outra coisa — código, planilha, reunião — e lembra de uma
tarefa. Anotar não deveria custar trocar de aplicativo, esperar carregamento e
perder o fio da meada.

O NoCom existe para esse instante. O ciclo completo é:

```
⌃⌥T  →  digitar  →  Enter  →  ⌃⌥T
```

Dois segundos, a mão nunca sai do teclado.

## Baixar

### macOS — pelo Homebrew (recomendado)

```sh
brew tap Zheonatan/tap
brew install --cask nocom
```

Atualizar depois é só `brew upgrade --cask nocom`.

### Download direto

| Sistema | Arquivo |
| --- | --- |
| **macOS** (Apple Silicon) | [NoCom_0.2.0_aarch64.dmg](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom_0.2.0_aarch64.dmg) |
| **macOS** (Intel) | [NoCom_0.2.0_x64.dmg](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom_0.2.0_x64.dmg) |
| **Windows** | [NoCom_0.2.0_x64-setup.exe](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom_0.2.0_x64-setup.exe) |
| **Linux** (.deb) | [NoCom_0.2.0_amd64.deb](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom_0.2.0_amd64.deb) |
| **Linux** (.rpm) | [NoCom-0.2.0-1.x86_64.rpm](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom-0.2.0-1.x86_64.rpm) |
| **Linux** (AppImage) | [NoCom_0.2.0_amd64.AppImage](https://github.com/Zheonatan/nocom/releases/download/v0.2.0/NoCom_0.2.0_amd64.AppImage) |

Todas as versões estão sempre em [Releases](https://github.com/Zheonatan/nocom/releases).

### Primeira execução: o aviso do sistema

O app ainda **não é assinado digitalmente**, então seu sistema vai avisar que
não conhece o programa. É esperado, e acontece uma única vez.

<details>
<summary><b>macOS</b> — "não foi possível verificar o app"</summary>

Rode uma vez no Terminal:

```sh
xattr -dr com.apple.quarantine "/Applications/NoCom.app"
```

Depois disso ele abre normalmente, inclusive nas próximas atualizações.
</details>

<details>
<summary><b>Windows</b> — "o Windows protegeu seu PC"</summary>

Clique em **Mais informações** e depois em **Executar assim mesmo**.
</details>

## Usando

Abra o app uma vez. A partir daí ele fica em segundo plano, no ícone da bandeja.

| Ação | Como |
| --- | --- |
| Mostrar / esconder a janela | `⌃⌥T` no macOS, `Ctrl+Alt+T` no Windows e Linux |
| Esconder a janela | `Escape` |
| Criar tarefa | digite e `Enter` |
| Concluir tarefa | clique no círculo |
| Trazer de volta sem o teclado | clique no ícone da bandeja |
| Ver quantas faltam sem abrir | passe o mouse no ícone da bandeja |
| Trocar o atalho | engrenagem, dentro do app |

### Abas são contextos

Trabalho, casa, um projeto específico. Cada aba é uma lista separada, criada e
nomeada no mesmo gesto — sem diálogo, sem tela nova. A aba em que você estava
continua aberta na próxima vez.

### Nada se perde por acidente

Todo gesto destrutivo — remover tarefa, fechar aba, limpar concluídas — pode ser
desfeito na hora. Nunca há caixa de confirmação no caminho.

## O que ele não é

Um não-objetivo é tão parte do produto quanto uma funcionalidade. O NoCom
não tem prazos, prioridades, subtarefas, etiquetas, anexos, colaboração nem
sincronização. Ele não vai virar um gerenciador de projetos.

## Suas tarefas ficam com você

Tudo em um arquivo de texto simples no seu computador, que nunca sai dele:

| Sistema | Onde |
| --- | --- |
| macOS | `~/Library/Application Support/com.nocom.app/todos.json` |
| Windows | `%APPDATA%\com.nocom.app\todos.json` |
| Linux | `~/.local/share/com.nocom.app/todos.json` |

Sem telemetria, sem conta, sem requisição de rede. Para levar suas tarefas para
outra máquina, copie esse arquivo.

O idioma (português ou inglês) e o tema claro/escuro seguem o seu sistema — não
há seletor para nenhum dos dois.

## Para desenvolvedores

Tauri v2 (Rust) + React 19 + TypeScript + Tailwind + shadcn/ui.

```sh
npm install
npm run tauri dev      # desenvolvimento
npm run tauri build    # instaladores para a plataforma atual
```

**Pré-requisitos:** Node 22+, Rust estável e as
[dependências de sistema do Tauri](https://tauri.app/start/prerequisites/).
No Linux: `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
e `libxdo-dev`.

Documentos do projeto: [`PRODUCT.md`](PRODUCT.md) (o que o produto é e por quê),
[`CONTRACT.md`](CONTRACT.md) (comportamento normativo e fronteira IPC) e
[`DESIGN.md`](DESIGN.md) (decisões de interface).

Publicar uma versão: `git tag v0.3.0 && git push origin v0.3.0`. O
[workflow de build](.github/workflows) gera e publica os instaladores dos três
sistemas. Depois disso, atualize a versão e os `sha256` do cask em
[Zheonatan/homebrew-tap](https://github.com/Zheonatan/homebrew-tap).

## Vindo da versão 0.1.0?

O app se chamava **Mini To-Do** até a 0.1.0. O nome mudou para NoCom na 0.2.0, e
com ele a pasta onde as tarefas ficam guardadas.

**Suas tarefas, abas, atalho e posição de janela vêm junto** — a primeira
abertura da versão nova copia tudo da pasta antiga, sem apagar nada de lá. Se
algo parecer faltando, os arquivos originais continuam intactos em
`~/Library/Application Support/com.minitodo.app` (no Windows, `%APPDATA%`; no
Linux, `~/.local/share`).

Quem instalou pelo Homebrew como `mini-todo` troca em dois passos, nesta ordem:

```sh
brew uninstall --cask mini-todo
brew install --cask nocom
```

O `uninstall` só tira o app de `/Applications` — as tarefas não estão lá.

## Estado do projeto

Versão 0.2.0 — funcional e em uso, mas ainda não assinado pela Apple nem pela
Microsoft, e o ícone empacotado é provisório. Encontrou algo estranho?
[Abra uma issue](https://github.com/Zheonatan/nocom/issues).
