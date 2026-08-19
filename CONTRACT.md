# Mini To-Do Flutuante — Contrato de Integração

App: Tauri v2 + React + TypeScript + Vite + Tailwind + shadcn/ui.
Objetivo: janela flutuante pequena, sempre no topo, sem decoração de OS, com uma lista de tarefas simples e rápida.

Diretório: `/Users/ruansilva/Documents/mini-todo`

## Áreas do projeto

| Área | Arquivos |
|---|---|
| Backend (Rust/Tauri) | `src-tauri/**`, `src-tauri/tauri.conf.json` |
| Frontend (React/shadcn) | `src/**`, `index.html`, `components.json`, `tailwind`/`postcss`, `package.json` (deps de UI) |

Regra: **os dois lados só se falam pelos comandos IPC** descritos abaixo. Mudança que atravessa essa fronteira entra neste contrato antes de entrar no código.

## Modelo de dados (fonte da verdade)

```ts
type Todo = {
  id: string;        // uuid v4
  title: string;
  done: boolean;
  created_at: number; // epoch millis
};
```

Rust equivalente (serde, snake_case, sem rename):

```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct Todo {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub created_at: i64,
}
```

## Comandos IPC (`invoke` de `@tauri-apps/api/core`)

Nomes exatos, snake_case, argumentos em camelCase no lado JS quando houver mais de uma palavra.

| Comando | Args (JS) | Retorno | Erro |
|---|---|---|---|
| `list_todos` | — | `Todo[]` | `string` |
| `add_todo` | `{ title: string }` | `Todo` (o criado) | `string` se `title` vazio/whitespace |
| `toggle_todo` | `{ id: string }` | `Todo` (estado novo) | `string` se id não existe |
| `delete_todo` | `{ id: string }` | `void` | `string` se id não existe |
| `clear_completed` | — | `Todo[]` (lista restante) | `string` |
| `hide_window` | — | `void` | `string` |
| `quit_app` | — | `void` | — |

- Ordenação retornada por `list_todos` e `clear_completed`: `created_at` crescente (mais antigo primeiro).
- Todos os comandos que podem falhar retornam `Result<T, String>` — o frontend trata a rejeição da Promise mostrando um toast/inline error, sem quebrar a UI.
- Persistência: arquivo JSON em `app_data_dir()/todos.json`, gravado a cada mutação. Estado em memória protegido por `Mutex` no `State` do Tauri. Se o arquivo não existir ou estiver corrompido, começa com lista vazia (não entra em pânico).

## Janela flutuante (`tauri.conf.json`)

- `width: 360`, `height: 480`, `resizable: false`
- `decorations: false`, `transparent: true`
- `alwaysOnTop: true`, `skipTaskbar: true`, `center: true`
- `title: "Mini To-Do"`
- O frontend desenha a própria barra de título com `data-tauri-drag-region` e um botão de fechar que chama `invoke("hide_window")`.
- `devUrl: "http://localhost:1420"`, `beforeDevCommand: "npm run dev"`, `beforeBuildCommand: "npm run build"`, `frontendDist: "../dist"`.

## Frontend — requisitos

- shadcn/ui obrigatório. Componentes mínimos: `button`, `input`, `checkbox`, `card`, `scroll-area`, `separator`.
- Layout: barra de título arrastável no topo (título + contador de pendentes + botão fechar) → input de nova tarefa → lista rolável → footer com "N pendentes" e "Limpar concluídas".
- Interações: `Enter` no input adiciona; checkbox alterna; hover mostra botão de remover; `Escape` esconde a janela (`hide_window`).
- Estado otimista com rollback em erro. Sem libs extras de estado — `useState`/`useEffect` bastam.
- Como a janela é `transparent`, o container raiz precisa de `rounded-xl`, borda e background próprios; `body` sem background opaco.
- Dark mode segue o sistema (`prefers-color-scheme`).

## Definição de pronto

- `npm run build` (tsc + vite) passa sem erros.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa sem erros.
- Nenhum `any` implícito, nenhum warning de import não usado.

---

# Adendo 1 — decisões de escopo (2026-08-18)

Escopo aprovado após o primeiro teste do app rodando (`npm run tauri dev`).

## Escopo extra já existente, agora oficial

- **System tray** (`montar_tray`, `alternar_janela`, `encerrar` em `lib.rs`): fica. É a
  única via de volta de uma janela sem decoração e fora da taskbar; sem ele,
  `hide_window`/`Escape` deixariam o app inalcançável. Clique esquerdo alterna,
  direito abre o menu (Mostrar/Esconder, Sair).
- **`macOSPrivateApi: true`** no `tauri.conf.json`: fica. É o que faz a janela
  transparente sem fundo opaco no macOS.
- `quit_app` continua **sem wrapper no frontend**, de propósito: sair do app é
  gesto do tray, não da janela.

## Comando IPC novo

| Comando | Args (JS) | Retorno | Erro |
|---|---|---|---|
| `rename_todo` | `{ id: string, title: string }` | `Todo` (estado novo) | `string` se `id` não existe, ou se `title` for vazio/whitespace ou passar do limite |

- Mesmas regras de `add_todo` para o título: `trim()` antes de validar, rejeita vazio.
- `rename_todo` **não** altera `created_at` nem `done`, e não muda a posição na ordenação.

## Limite de título (novo, vale para `add_todo` e `rename_todo`)

- Título é `trim()`ado e limitado a **200 caracteres**. Acima disso o backend
  rejeita com mensagem legível.
- O frontend impõe `maxLength={200}` no input para que o usuário não chegue ao erro
  em uso normal — o erro do backend é a rede de segurança, não o caminho comum.
- **Nenhum título pode vazar dos limites da janela**, em nenhuma largura: sem barra
  de rolagem horizontal, sem texto cortado pela borda. Vale para título de uma
  palavra só, sem espaços, com 200 caracteres.

## Janela — arrastar e posição

- **A janela precisa ser arrastável pela barra de título desenhada pelo frontend.**
  Reportado como quebrado no teste de 2026-08-18. `data-tauri-drag-region` sozinho
  não está bastando; o caminho robusto é `getCurrentWindow().startDragging()` no
  `onMouseDown` da barra, ignorando cliques em botões e em campos de texto.
- **A posição da janela persiste entre execuções**: ao ser movida, a posição é
  gravada; na abertura, é restaurada em vez de `center: true`.
- A posição restaurada é **limitada à área visível do monitor atual**. Se o monitor
  de origem não existir mais, ou a posição cair fora da área visível, a janela volta
  ao centro. Uma janela sem decoração e fora da taskbar, restaurada fora da tela,
  seria irrecuperável.

## Definição de pronto (atualizada)

- `npm run build` passa sem erros.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa sem erros.
- `cargo test --manifest-path src-tauri/Cargo.toml` passa, com cobertura dos 8 comandos.
- Nenhum `any` implícito, nenhum import não usado.

---

# Adendo 2 — atalho global (2026-08-18)

Pedido do usuário: abrir e esconder o To-Do depressa, sem tirar a mão do teclado
e sem precisar caçar o ícone do tray.

## Combinação

**`Ctrl+Option+T`** (`⌃⌥T`). Escolhida por eliminação:

- `⌘Space` e `⌘⌥Space` são Spotlight e a busca do Finder.
- `⌃Space` e `⌃⌥Space` alternam fonte de entrada no macOS — um app que as roube
  quebra quem digita em dois idiomas.
- `⌘⇧T` reabre a última aba no Chrome, Safari e Firefox. Um atalho **global** vence
  o do app em foco, então sequestrá-lo tiraria uma função que o usuário usa o dia
  inteiro no navegador.
- `⌃⌥T` não é atalho de sistema no macOS, e o `T` casa com To-Do.

Constante única no código, com nome, para trocar em um lugar só.

## Comportamento

- Alterna: escondida → mostra e **dá foco**; visível → esconde. É a mesma
  `alternar_janela` do clique no tray, e não um segundo caminho paralelo.
- Vale com o app em segundo plano, que é a razão de ser de um atalho global.
- **Dispara uma vez por pressionada.** O plugin emite `Pressed` e `Released`; reagir
  aos dois alternaria duas vezes e a janela pareceria não responder.

## Falha de registro não derruba o app

Outro aplicativo pode já ter tomado a combinação. Se o registro falhar, o app
**sobe assim mesmo** — o tray continua sendo o caminho garantido. Falhar o setup
inteiro por causa de um atalho ocupado trocaria uma conveniência por um app que
não abre.

## Descobribilidade

Um atalho que ninguém lembra não serve. Ele aparece em dois lugares:

- **Tray** (backend): o item de menu "Mostrar/Esconder" exibe a combinação.
- **Janela** (frontend): dica discreta, sem competir com a lista.

## Definição de pronto (adicional)

- `cargo check` e `cargo test` continuam limpos.
- O atalho funciona com o app fora de foco, e uma pressionada = uma alternância.

---

# Adendo 3 — seleção de texto (2026-08-18)

Relato do usuário: "tem muitas áreas que não fazem sentido com texto selecionável.
apenas os itens dentro de inputs devem ter texto selecionável".

## Regra

- **Padrão da janela: nada é selecionável.** `user-select: none` na raiz.
- **Exceção única: campos de entrada.** `input` e `textarea` continuam com seleção
  normal — sem isso não há como corrigir o meio de uma palavra ao editar.
- Não é preferência estética: a janela é arrastada pela própria interface, e num
  app assim o gesto de arrastar e o de selecionar disputam o mesmo movimento do
  mouse. Selecionar "Mini To-Do" ao tentar mover a janela é a falha típica.
- O cursor segue a regra: `I-beam` só onde há seleção. Um cursor de texto sobre
  algo que não seleciona promete o que a interface não cumpre.

## Consequência aceita

A mensagem de erro deixa de ser copiável. O usuário pediu a regra sabendo disso;
o texto do erro continua inteiro no `title` do elemento.

---

# Adendo 4 — melhorias de uso (2026-08-18)

Pedido do usuário: "busque melhorias e implemente elas no app. quero simplicidade,
mas algo altamente utilizável, leve e satisfatório".

O norte é esse: **cada item abaixo tira um atrito do uso diário sem acrescentar
superfície nova de interface.** Nada que precise ser aprendido, nada que ocupe
altura permanente numa janela de 360x480.

## Desfazer remoção

Remover é o único gesto destrutivo do app, e o botão de remover aparece no hover
de uma linha de 20px numa janela pequena — errar a linha é fácil e hoje o erro é
definitivo. Um desfazer curto resolve sem caixa de confirmação, que cobraria um
clique em toda remoção certa para proteger das poucas erradas.

| Comando | Args (JS) | Retorno | Erro |
|---|---|---|---|
| `restore_todos` | `{ todos: Todo[] }` | `Todo[]` (lista completa, ordem canônica) | `string` |

- Restaura com o **`id` e o `created_at` originais**: a tarefa volta onde estava,
  e não no fim da lista. Recriar com `add_todo` daria id e carimbo novos, e a
  tarefa "desfeita" reapareceria no lugar errado — seria outro item, não o mesmo.
- Atende os dois desfazeres com um comando só: remoção de uma tarefa e
  "Limpar concluídas" (que apaga várias de uma vez).
- **Tudo ou nada**: se qualquer id já existir na lista, a chamada falha inteira e
  nada é aplicado. Restaurar pela metade deixaria a tela e o disco divergindo.
- Títulos passam pela mesma validação de `add_todo`.

## Contagem de pendentes no tray

O tooltip do ícone passa a mostrar quantas tarefas faltam, atualizado a cada
mutação. É a informação que o app existe para dar, disponível sem abrir a janela —
o ganho de um app de bandeja que hoje não é aproveitado.

## Ordem de exibição: concluídas no fim

Regra **de exibição, no frontend**. `list_todos` e `clear_completed` continuam
devolvendo `created_at` crescente, como sempre — o backend não muda.
Na tela: pendentes primeiro, concluídas depois, cada grupo por `created_at`.
O topo da lista é o que ainda exige ação; concluída que fica no meio empurra
trabalho para baixo da dobra numa janela que mostra poucas linhas.
A mudança de posição ao marcar precisa ser suave, não um salto.

## Foco no campo ao mostrar a janela

Mostrar a janela (⌃⌥T ou tray) põe o cursor no campo de nova tarefa. O ciclo
inteiro do app é ⌃⌥T → digitar → Enter → ⌃⌥T; um clique no campo no meio disso é
atrito puro. Só na exibição — não roube o foco de uma edição inline em curso.

## Peso

`shadcn` é uma **CLI**, não uma biblioteca de runtime, e está em `dependencies`.
Ferramentas de build no lugar errado do manifesto engordam a instalação sem
entrar no bundle. Corrigir sem quebrar `npx shadcn add`.

---

# Adendo 5 — abas (2026-08-18)

Pedido do usuário: "queremos implantar melhorias. a ideia é ser simples e leve.
temos que adicionar algo similar a abas. o usuário cria as abas, nomeia e pode
fechar elas."

Uma aba é um **escopo de lista**: cada aba tem as suas tarefas, e a janela mostra
uma aba por vez. O norte do Adendo 4 continua valendo — a faixa de abas não pode
custar altura numa janela de 360x480 nem exigir aprendizado.

## Modelo de dados

```ts
type Tab = {
  id: string;         // uuid v4
  name: string;
  created_at: number; // epoch millis
};

type Todo = {
  id: string;
  title: string;
  done: boolean;
  created_at: number;
  tab_id: string;     // NOVO — a qual aba a tarefa pertence
};
```

Rust equivalente (serde, snake_case, sem rename), `tab_id: String`.

## Invariantes

- **Sempre existe pelo menos uma aba.** Fechar a última é recusado pelo backend, e
  o frontend nem oferece o gesto quando só há uma. Sem isso, o app fica sem lugar
  onde escrever e a tela sem estado válido.
- Nome: `trim()`, rejeita vazio/whitespace, limite de **40 caracteres**. É nome de
  chip numa faixa de 360px, não título de tarefa.
- **Nomes repetidos são permitidos.** O `id` é que distingue; recusar duplicata
  criaria um caminho de erro sem ganho real.
- Ordem canônica de `Tab`: `created_at` crescente. Sem reordenação por arrasto —
  seria superfície nova para um ganho que não foi pedido.
- Toda tarefa pertence a exatamente uma aba existente. Não há tarefa órfã.

## Migração do `todos.json` existente

O arquivo em disco hoje é uma lista de `Todo` **sem** `tab_id`, e há usuários com
dados reais nele (o app roda). Na leitura:

- Formato antigo reconhecido → cria uma aba padrão **"Tarefas"** e atribui todas as
  tarefas existentes a ela. Ids e `created_at` das tarefas são preservados.
- Arquivo inexistente ou corrompido → começa com a aba "Tarefas" vazia, sem pânico
  (mesma regra do contrato original).
- **Nenhum caminho pode apagar tarefa antiga.** Perder a lista de quem já usa o app
  é a única falha inaceitável deste adendo.

## Comandos IPC novos

| Comando | Args (JS) | Retorno | Erro |
|---|---|---|---|
| `list_tabs` | — | `Tab[]` (`created_at` crescente) | `string` |
| `create_tab` | `{ name: string }` | `Tab` (a criada) | `string` se nome vazio/whitespace ou acima de 40 |
| `rename_tab` | `{ id, name }` | `Tab` (estado novo) | `string` se `id` não existe ou nome inválido |
| `close_tab` | `{ id }` | `{ tab: Tab, todos: Todo[] }` — o que foi removido | `string` se `id` não existe **ou se for a última aba** |
| `restore_tab` | `{ tab: Tab, todos: Todo[] }` | `Tab[]` (lista completa, ordem canônica) | `string` |
| `set_active_tab` | `{ id }` | `void` | `string` se `id` não existe |
| `get_active_tab` | — | `string` (id da aba ativa) | `string` |

- `close_tab` **devolve o que apagou** porque fechar uma aba destrói várias tarefas
  de uma vez — é o gesto mais destrutivo do app. Segue a decisão do Adendo 4:
  desfazer curto em vez de caixa de confirmação.
- `restore_tab` repõe aba e tarefas com **ids e `created_at` originais**, e é
  **tudo ou nada**: se o id da aba ou de qualquer tarefa já existir, falha inteira
  sem aplicar nada.
- `set_active_tab` persiste a aba ativa entre execuções. Fica em `todos.json`,
  junto do estado que ele já guarda — não é posição de janela, que mora em
  `janela.json`. Se a aba ativa gravada não existir mais na abertura, cai na
  primeira aba em vez de falhar.

## Comandos existentes que passam a ser por aba

Mudança **quebrando** a assinatura: backend e frontend precisam entrar juntos.

| Comando | Args (JS) | Retorno |
|---|---|---|
| `list_todos` | `{ tabId: string }` | `Todo[]` da aba, `created_at` crescente |
| `add_todo` | `{ title: string, tabId: string }` | `Todo` (com `tab_id` preenchido) |
| `clear_completed` | `{ tabId: string }` | `Todo[]` restantes **da aba** |

`toggle_todo`, `delete_todo`, `rename_todo` e `restore_todos` **não mudam de
assinatura**: agem por `id` de tarefa, e a tarefa já carrega a sua aba.
`restore_todos` passa a exigir que o `tab_id` de cada tarefa restaurada exista —
restaurar para uma aba já fechada seria criar uma órfã.

## Tray

O tooltip conta **pendentes de todas as abas somadas**, não só da aba ativa. É o
trabalho que resta no app inteiro, e é o que se quer saber sem abrir a janela.
O texto continua o do Adendo 2/4 (singular, plural, zero sem "0").

## Frontend — faixa de abas

- Uma **linha só**, logo abaixo da barra de título, altura de ~28px. Rola na
  horizontal quando não cabe, **sem barra de rolagem visível e sem nunca gerar
  rolagem horizontal na janela** (a regra de não vazar do Adendo 1 vale aqui).
- Cada aba é um chip compacto com o nome; a ativa é destacada. Nome longo trunca
  com reticências e ganha `title` com o nome inteiro. Um nome de 40 caracteres sem
  espaço nenhum não pode empurrar a faixa nem cortar o "+".
- **Criar**: botão "+" no fim da faixa. Cria já com nome padrão (`Lista 2`,
  `Lista 3`, …) **e entra direto em edição do nome, com o texto selecionado.**
  Nomear é o mesmo gesto de criar — sem diálogo, sem uma tela a mais.
- **Renomear**: duplo clique no nome da aba abre a edição inline. `Enter` confirma,
  `Escape` cancela, blur confirma — o mesmo comportamento que a edição inline de
  tarefa já tem, e não um segundo padrão de edição.
- **Fechar**: `×` na aba ativa (e no hover das outras). **Escondido quando só há
  uma aba.** Fechar mostra o desfazer que já existe, com `restore_tab`; o texto diz
  quantas tarefas voltam.
- Trocar de aba troca a lista e **põe o foco no campo de nova tarefa** — mesma
  razão do Adendo 4.
- A rolagem da lista volta ao topo ao trocar de aba: manter o scroll de outra lista
  mostra a aba nova numa posição que não é dela.
- Seleção de texto continua desligada (Adendo 3); a exceção segue sendo só o input
  — inclusive o de renomear aba.
- Estado otimista com rollback, como no resto do app. Sem lib de estado nova.

## Definição de pronto (atualizada)

- `npm run build` passa sem erros.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa sem erros.
- `cargo test --manifest-path src-tauri/Cargo.toml` passa, cobrindo: os comandos
  novos, a **migração do formato antigo**, a recusa de fechar a última aba, o
  tudo-ou-nada de `restore_tab` e a contagem do tray somando abas.
- Nenhum `any` implícito, nenhum import não usado.
- A 360px de largura, com 6 abas de nome longo, não há rolagem horizontal na janela
  nem texto cortado pela borda.

## Esclarecimento 5.1 — `restore_todos` com abas

Levantado do lado do frontend: o contrato dizia "lista completa" sem dizer de qual
escopo, e com abas isso passou a ter duas leituras.

- **Todas as tarefas de uma chamada de `restore_todos` pertencem à mesma aba.** Os dois
  desfazeres que o comando atende — remover uma tarefa e "Limpar concluídas" — acontecem
  dentro de uma aba só. Se os `tab_id` divergirem, a chamada falha inteira, junto com as
  outras regras de tudo-ou-nada.
- **O retorno é a lista completa DAQUELA aba**, em `created_at` crescente — o mesmo escopo
  que `list_todos` agora devolve. Devolver todas as abas obrigaria a tela a filtrar um
  payload que ela não pediu, e o resto do contrato já é por aba.
- O filtro por `tab_id` que o frontend aplicou continua correto e vira redundância barata.

## Esclarecimento 5.2 — qual aba fica ativa ao fechar a ativa

Levantado do lado do backend: fechar a aba ativa deixaria `active_tab` apontando para
um id que não existe mais, e o adendo não dizia para onde ir.

**Regra: vai para a aba VIZINHA** — a próxima na ordem canônica (`created_at` crescente),
ou a anterior se a fechada era a última da faixa.

Não é a primeira restante. Fechar a aba 4 de 5 e ser jogado na aba 1 teleporta o usuário
para longe de onde ele estava; a vizinha mantém o lugar, e é o que qualquer barra de abas
faz. O custo é o mesmo um ponto de código.

- **Os dois lados implementam esta mesma regra.** O frontend troca a ativa de forma otimista
  e o backend persiste; se cada um escolher um destino diferente, a tela pisca de uma aba
  para outra quando a resposta chega.
- O backend garante o invariante de toda forma: se `active_tab` gravado não existir na
  abertura, cai na primeira aba (isso continua como estava — é rede de segurança de arquivo
  velho, não o caminho de fechar).
- `restore_tab` **não** mexe na aba ativa. Quem decide voltar para a aba restaurada é o
  frontend, e só quando ela era a ativa no momento de fechar.

## Esclarecimento 5.3 — `restore_todos` com lote vazio

Levantado do lado do backend como consequência do 5.1: a aba do retorno passou a vir das
tarefas do lote, então um lote **vazio** não tem aba de onde tirar a lista, e o comando
voltaria lista vazia onde antes voltava a lista completa.

**Regra: lote vazio é `Err`**, com mensagem legível. Não é no-op silencioso.

Um no-op que devolve lista vazia **parece sucesso e esvazia a tela** — a lista da aba
desaparece sem nada ter sido apagado no disco, e o usuário vê o app perder as tarefas dele.
É o pior desfecho possível: falha silenciosa, indistinguível de perda de dados, e o app
inteiro já foi escrito para nunca fazer isso. `Err` é a mesma decisão que o resto do
comando já toma para entrada inconsistente: falha inteira, nada escrito, e o frontend
trata a rejeição com o rollback que ele já tem.

- Desfazer de zero tarefa não é um gesto que a interface oferece; um lote vazio chegando
  ao backend é bug de quem chamou, e bug deve fazer barulho, não limpar a tela.
- Nada é gravado no caminho de erro — a validação vem antes de qualquer escrita, como no
  resto do tudo-ou-nada.
- `restore_tab` não é afetado: ele sempre carrega uma aba, e uma aba sem tarefa é legítima.
- Frontend: continue tratando lote vazio como no-op **do seu lado**, sem chamar o backend.
  A rejeição é rede de segurança, não caminho comum — a mesma relação que o limite de 200
  caracteres já tem com o `maxLength` do input.

---

# Adendo 6 — idioma e convenção de teclado (2026-08-18)

Decisão de produto registrada no `PRODUCT.md`: o app é **para distribuir**, roda em
**macOS, Windows e Linux**, e fala **português e inglês**. Três coisas que o contrato
até aqui assumiu sem dizer — ele foi escrito para um usuário em português num Mac.

## O defeito que abriu este adendo

O backend já escrevia o atalho na convenção de cada sistema:

```rust
#[cfg(target_os = "macos")]      const ATALHO_VISIVEL: &str = "⌃⌥T";
#[cfg(not(target_os = "macos"))] const ATALHO_VISIVEL: &str = "Ctrl+Alt+T";
```

O frontend tinha o glifo fixo. Fora do Mac, o menu do tray dizia **"Ctrl+Alt+T"** e a
janela dizia **"⌃⌥T"**, para a mesma tecla — e nos dois lugares onde a dica aparece, que
existem justamente para tornar a janela recuperável para quem acabou de instalar o app.

**Regra: a combinação real é a mesma nos três sistemas; só a forma escrita muda.**
`ATALHO_GLOBAL` (`Control+Option+T`) não se altera. `ATALHO_VISIVEL` no Rust e
`TOGGLE_SHORTCUT` no TypeScript são a mesma decisão em dois lados e **precisam continuar
de acordo** — mudar o atalho é mexer nos dois.

A detecção no frontend é por `navigator.userAgent`. Sniffing de user agent é aceitável
aqui e só aqui: a webview é embarcada por nós, e o custo de errar é um glifo fora de
convenção, não uma função quebrada. `navigator.platform` está obsoleto e
`userAgentData` não existe no WebKit — que é justamente o motor do Mac.

## Idioma

- **Dois idiomas: `pt-BR` e `en`.** Escolhidos automaticamente pelo locale do sistema,
  percorrendo `navigator.languages` na ordem de preferência e parando no primeiro que o
  app fala. Um sistema em `["de-DE", "pt-BR", "en"]` recebe português: a segunda
  preferência do usuário é melhor que um palpite nosso.
- **Fallback é o inglês**, não o português: um sistema em japonês tem muito mais chance
  de ler inglês.
- **Sem seletor de idioma.** Mesma razão do dark mode não ter toggle: a janela tem
  360x480 e um controle permanente custaria altura que pertence às tarefas. O SO já sabe
  a língua do usuário.
- **O idioma não muda enquanto o app roda.** Trocar o idioma do sistema com o app aberto
  custa um reinício — é raro o bastante para não valer um provider e um re-render.
- `document.documentElement.lang` passa a ser definido em tempo de execução, antes do
  primeiro render. Não é cosmético: é o que faz o leitor de tela não ler inglês com
  pronúncia de português.
- **Sem biblioteca de i18n.** Duas línguas, ~35 chaves e o `Intl` do motor bastam.

## O dicionário

Fica em `src/lib/i18n.ts`. O português é o dicionário canônico e o inglês é tipado
contra ele (`Record<MessageKey, Entry>`), então **acrescentar uma chave sem traduzir
quebra o build** — é a rede que impede a interface de voltar a ser bilíngue pela metade.

Plural usa `Intl.PluralRules` e cada categoria guarda a **frase inteira**, não um sufixo:
em português a concordância se espalha ("1 concluída removida" → "3 concluídas
removidas"), e montar por sufixo quebra na segunda palavra. Uma língua com `few`/`many`
(russo, polonês) passa a ser mudança de dados, não de código.

Exceção deliberada: o CLDR classifica `0` como `one` em português (`i = 0..1`), o que
daria "0 pendente". A categoria `zero` existe no dicionário para sobrepor a biblioteca
quando o resultado dela não é o que um falante escreveria.

**"Mini To-Do" não é traduzido** — é nome, não texto.

## Mensagens de erro passam a ser do frontend

Até aqui a janela exibia a frase crua do `Result<T, String>` do backend. Isso tinha três
problemas de uma vez: a frase fala de ids e de caminhos de arquivo, sai sempre em
português mesmo com a interface em inglês, e **não responde a única pergunta que importa
na hora do erro — se alguma coisa se perdeu**.

**Regra: a mensagem na tela é escolhida pela operação que falhou, e diz o que aconteceu
com os dados.** "Não foi possível remover. A tarefa continua na lista." É o Princípio 5
do produto (falha nunca pode ser indistinguível de perda de dados) aplicado à copy.

- **O contrato IPC não muda.** Nenhum comando muda de assinatura; os erros continuam
  sendo `Result<T, String>` com a mesma frase. O que mudou é quem escreve o que o usuário
  lê.
- **O texto cru não é jogado fora:** vai para o `title` do aviso, junto da nossa
  mensagem, que é onde o Adendo 3 já estabeleceu que o texto inteiro continua alcançável.
  Um erro de disco cheio continua diagnosticável.
- Toda falha do frontend passa a nomear a operação (`error.add`, `error.tabClose`,
  `error.tabRemember`, …). O caso mais sutil é `set_active_tab` falhando: a aba já trocou
  na tela e só a persistência falhou, então a mensagem diz exatamente isso — "a aba
  mudou, mas não será lembrada na próxima abertura" — em vez de sugerir que a troca não
  aconteceu.

## Fora do escopo, de propósito

**O tray continua em português.** O tooltip ("3 tarefas pendentes") e o menu
("Mostrar/Esconder", "Sair") são strings do Rust e não foram traduzidos nesta rodada.
Num sistema em inglês o app fica **inconsistente**: janela em inglês, bandeja em
português. É dívida conhecida e registrada, não descuido — e é o próximo passo natural
deste adendo, porque o tray é a via de volta principal do app.

## Definição de pronto (atualizada)

- `npm run build` passa sem erros.
- `cargo check` e `cargo test` continuam limpos (98 testes).
- A interface não tem nenhuma string de usuário fora do dicionário.
- Acrescentar chave em um idioma e não no outro **falha o build**.
- Nos dois idiomas, a 360px de largura: nenhuma rolagem horizontal, nenhum texto cortado
  pela borda — inclusive com título de 200 caracteres sem espaço, seis abas de nome longo
  e a dica escrita na forma longa do Windows (`Ctrl+Alt+T`).

---

# Adendo 7 — piso de acessibilidade (2026-08-18)

Origem: `/impeccable audit`, que mediu o app pela primeira vez em vez de inspecioná-lo.
Nota 15/20, com os achados concentrados em acessibilidade. Nada aqui atravessa a fronteira
IPC — é tudo frontend — mas são decisões duráveis que trabalho futuro não deve desfazer,
e a razão de o audit as ter encontrado é que nada as registrava.

## Contraste é medido, não estimado

Todo par de cor do app é verificado por cálculo a partir dos tokens OKLCH, nos **dois
temas**. O tema escuro já passava em tudo; o claro tinha três falhas. Valores movidos:

| Token | Antes | Agora | Por quê |
|---|---|---|---|
| `--muted-foreground` (claro) | `0.556` | `0.544` | pílula do contador e aviso de desfazer, sobre `muted`, ficavam em 4.34:1 |
| `--destructive` (claro) | `0.577` | `0.529` | a mensagem de erro é `destructive` sobre `destructive/10` — o fundo escurece junto, e ficava em 3.99:1 |
| `--ring` (claro / escuro) | `0.708` / `0.556` | `0.48` / `0.72` | nenhum indicador de foco alcançava 3:1 |

O teto também importa: o anel de foco fica em ~6.5:1, **bem abaixo** dos 17.9:1 do checkbox
marcado. Foco precisa ser visto sem gritar mais alto que o gesto de concluir, que é o único
preenchimento sólido do sistema.

## Dois cinzas de traço, não um

Token novo: **`--control-border`** (`0.643` claro, `0.545` escuro), usado na borda do
checkbox e do campo de texto. `--border` continua no separador e na moldura da janela.

Parecem a mesma coisa e não são. A moldura só divide; a borda do checkbox é a **única
informação** de que existe ali algo que responde — um checkbox desmarcado é só a sua
borda. O preset tratava as duas como um token só, em 1.26:1: praticamente invisível sobre
branco. Linha decorativa pode ser discreta; linha que identifica controle responde por
WCAG 1.4.11 e precisa de 3:1.

## Um indicador de foco, sólido, em todo controle

Era "borda trocada + halo difuso de 3px a 50%", o padrão do preset. Dois sinais fracos, e
nenhum dos dois alcançava 3:1 — e chip de aba, `×` de fechar aba e `×` de dispensar aviso
não tinham anel nenhum, só mudança de opacidade.

**Agora: anel sólido de 2px em `--ring`, igual em todos os controles.** Opacidade sozinha
nunca conta como indicador de foco.

Preservar o halo era possível, mas exigia empurrar `--ring` para quase-preto (a borda
sólida do mesmo token iria a 15:1) — o foco viraria o elemento mais forte da interface.

## Alvo mínimo de 24×24

O chip de aba media **24px de desenho e respondia em 16px**: 4px mortos em cima e embaixo,
onde clicar na borda visível da aba não fazia nada. O `×` de fechar aba tinha 16×16.

**Piso: 24×24 CSS px em todo controle** (WCAG 2.2, SC 2.5.8). O que cresce é a área de
clique, não o desenho — o `×` continua com ícone de 12px. A regra do app sempre foi que o
alvo é maior que o desenho (o checkbox tem 16px de desenho e 44×40 de alvo); a faixa de
abas era a única inversão.

## Renomear deixa de ser gesto exclusivo de mouse

Abrir a edição inline existia só no duplo clique. **`F2` passa a abrir também**, na tarefa
e na aba — é o duplo clique do teclado, e o mesmo gesto nos dois lugares.

Na tarefa o handler fica **na linha**, não no título: assim funciona com o foco no checkbox
ou no botão de remover — as duas paradas de tabulação que a linha já tem — sem acrescentar
uma terceira. Na aba não pode ser `Enter`, que já troca de aba.

Correção junto: o campo de edição **abria sem seleção nenhuma**, apesar de o contrato
prometer o texto selecionado. O `select()` vinha de um `onFocus` que se perdia no remonte
do StrictMode; passou para um efeito de montagem. Importa mais ao criar aba, cujo nome
padrão é palpite para ser sobrescrito digitando.

## Peso

Só os subconjuntos **latinos** da Geist são empacotados. O entrypoint do `@fontsource`
declarava também cirílico, cirílico estendido e vietnamita: ~31KB de woff2 para alfabetos
que o produto não fala. O `unicode-range` evita o download no navegador, mas o Tauri
empacota `dist/` inteiro no binário. De 76KB para 46KB.

## Definição de pronto (adicional)

- Contraste calculado dos tokens passa nos dois temas: **4.5:1** para texto, **3:1** para
  indicador de foco e para borda que identifica controle.
- Todo controle tem alvo efetivo de **24×24** no mínimo.
- Todo gesto disponível no mouse tem caminho de teclado.
- Nenhum controle sinaliza foco só por opacidade.
