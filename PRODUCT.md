# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

<!-- Aplicativo de desktop em Tauri v2: a interface inteira é uma webview
     (React + TypeScript + Tailwind + shadcn/ui), não uma UI nativa por SO.
     Não é iOS, Android nem adaptive. Ver `## Capabilities and Constraints`
     para as restrições que o alvo desktop impõe. -->

## Users

Qualquer pessoa que precise anotar uma tarefa **sem sair do que está fazendo** —
público aberto, produto para distribuir, não ferramenta interna.

A situação de uso é sempre a mesma: a pessoa está no meio de outro trabalho (código,
planilha, reunião, navegador), lembra de algo, e precisa registrar em segundos sem
trocar de aplicativo, sem esperar carregamento e sem perder o contexto de onde estava.
O ciclo completo é `⌃⌥T → digitar → Enter → ⌃⌥T`.

Consequências de ser um produto distribuído, e não um utilitário pessoal:

- Nenhum conhecimento prévio pode ser exigido. Quem baixa o app não leu o `CONTRACT.md`.
- O atalho global e o tray precisam ser **descobríveis dentro da interface** — uma janela
  sem decoração, fora da taskbar e escondida por `Escape` é irrecuperável para quem não
  sabe como trazê-la de volta. O Adendo 2 já trata descobribilidade como requisito, não
  como enfeite; distribuir eleva isso a condição de existência.
- Primeira execução, estado vazio e recuperação de erro são caminhos reais de usuário,
  não casos de borda.

## Product Purpose

Uma lista de tarefas que vive **flutuando por cima do trabalho real**, alcançável por
atalho global, que abre instantaneamente e guarda tudo em um arquivo local.

Sucesso é medido pelo atrito que **não** existe: se registrar uma tarefa custa mais que
alguns segundos e um atalho, o app falhou no que existe para fazer. A pessoa não deve
precisar pensar no aplicativo — só na tarefa.

Não-objetivos explícitos, herdados de todo o `CONTRACT.md`: não é gerenciador de projetos,
não tem prazos, prioridades, subtarefas, etiquetas, colaboração nem sincronização.

## Positioning

Contra Lembretes, Notas ou um post-it na tela, a aposta é a soma de quatro coisas — nenhuma
sozinha é diferencial, e é a combinação que um concorrente vizinho não copia sem virar
outro produto:

1. **Ciclo de teclado de dois segundos.** `⌃⌥T` funciona com o app em segundo plano, mostra
   a janela **e já põe o cursor no campo** (Adendo 4). A mão nunca sai do teclado.
2. **Sempre visível por cima.** `alwaysOnTop`, sem decoração, fora da taskbar. A lista não
   afunda atrás de janelas nem vira mais um ícone a caçar.
3. **Abas como contextos.** Escopos separados de lista (projeto, casa, hoje) criados e
   nomeados no mesmo gesto, sem diálogo e sem tela nova (Adendo 5) — separação de contexto
   sem o peso de um gerenciador de projetos.
4. **Zero peso e zero conta.** Sem login, sem nuvem, sem sync. Um `todos.json` local.

## Operating Context

- A janela ocupa **360x480 px, não redimensionável**. Toda decisão de interface é disputada
  contra essa altura: poucas linhas visíveis, faixa de abas de ~28px, nada que ocupe altura
  permanente sem pagar por ela.
- O app passa a maior parte do tempo **escondido**. As vias de volta são o atalho global
  (`⌃⌥T`) e o ícone do tray (clique esquerdo alterna, direito abre menu).
- O tray carrega a informação que o app existe para dar **sem abrir a janela**: o tooltip
  mostra pendentes somando todas as abas.
- A janela é arrastada pela barra de título desenhada pelo próprio frontend, e a posição
  persiste entre execuções, limitada à área visível do monitor atual.
- Estado em disco em dois arquivos: `app_data_dir()/todos.json` (tarefas, abas, aba ativa)
  e `janela.json` (posição da janela).
- Fronteira rígida: **backend e frontend só se falam pelos comandos IPC** documentados no
  `CONTRACT.md`. Mudança que atravessa essa fronteira entra no contrato antes do código.

## Capabilities and Constraints

**Funcionalidade confirmada** (detalhe normativo em `CONTRACT.md` — este é o índice, não a
duplicata): tarefas com criar/concluir/renomear/remover, "Limpar concluídas", desfazer curto
para todo gesto destrutivo (sem caixa de confirmação), abas com criar/renomear/fechar/restaurar,
aba ativa persistida, atalho global, tray com contagem, posição de janela persistida, migração
do formato antigo de `todos.json`.

**Vocabulário do produto:** *tarefa* (não "item"), *aba* (não "lista" nem "projeto"),
*pendentes* (não "abertas"), *concluídas* (não "feitas"). O nome padrão de aba nova é
`Lista N`.

**Restrições técnicas firmes:**

- Limite de 200 caracteres por título de tarefa; 40 por nome de aba.
- **Nenhum texto pode vazar dos limites da janela em nenhuma largura** — sem rolagem
  horizontal, sem corte na borda, inclusive para 200 caracteres sem espaço nenhum.
- Sempre existe pelo menos uma aba; fechar a última é recusado.
- Nada é selecionável exceto `input` e `textarea` (Adendo 3), porque arrastar a janela e
  selecionar texto disputam o mesmo movimento do mouse.
- Janela `transparent: true` sem decoração: o container raiz desenha a própria superfície,
  cantos e borda; `html`/`body` não podem pintar fundo.
- Estado otimista com rollback em erro, sem biblioteca de estado além de `useState`/`useEffect`.
- Dark mode segue o sistema (`prefers-color-scheme`), sem toggle.
- shadcn/ui obrigatório para os componentes de base.
- **Nenhum caminho pode apagar tarefa antiga.** É a única falha declarada inaceitável.

**Decisões em aberto** (registradas, não resolvidas — trabalho futuro não deve assumir
nenhum lado):

- **Alcance multiplataforma vs. contrato escrito em macOS.** O alvo confirmado é
  **macOS, Windows e Linux**, mas várias decisões do `CONTRACT.md` foram raciocinadas só
  em macOS e precisam ser reabertas antes de distribuir nos três: a escolha de `⌃⌥T`
  (justificada por eliminação contra atalhos do macOS), `macOSPrivateApi: true` (o que
  viabiliza a transparência no mac), o comportamento do tray e a própria transparência da
  janela em Linux. **Resolvido em parte pelo Adendo 6:** a *forma escrita* do atalho já
  segue a convenção de cada sistema nos dois lados do IPC. A *escolha* da combinação, a
  transparência e o tray continuam abertos.
- **Identidade visual e nome.** Nem "Mini To-Do" nem o ícone estão fechados. O ícone
  empacotado hoje é o **logo padrão do Tauri**, provisório, e não pode ser distribuído
  como identidade do produto.
- **Descobribilidade em produto distribuído.** *Endereçada, e ainda sem confirmação de
  campo.* A "dica discreta" do Adendo 2 era dimensionada para quem já sabia do atalho, e
  morria na primeira tarefa — um gesto antes do primeiro `Escape`. O primeiro uso agora
  tem duas etapas: um estado vazio de primeira execução que ensina as **duas** vias de
  volta (atalho e ícone da bandeja, este escrito na palavra de cada sistema), e uma faixa
  passageira que repete o atalho quando a primeira tarefa entra, para a instrução
  atravessar o instante em que o estado vazio sai da tela. Nada disso ocupa altura
  permanente. **O que continua aberto** é se basta: não há métrica de ativação, e a
  pergunta só se responde com alguém instalando o app pela primeira vez.
- ~~**Tradução do tray.**~~ **Resolvida.** O tooltip e os itens de menu seguem o locale
  do sistema, com a mesma regra de escolha do frontend (ordem de preferência do usuário,
  inglês como fallback) transcrita em `src-tauri/src/idioma.rs`. As frases do tray são as
  mesmas do rodapé da janela nas duas línguas, de propósito.

## Brand Commitments

- **Nome atual:** "Mini To-Do" (`productName` e título da janela), sem confirmação de que
  é definitivo.
- **Voz:** direta e concreta, na língua do usuário e sem jargão de produtividade. Os textos
  existentes dizem "3 pendentes" e "Limpar concluídas", não "Você tem 3 itens em aberto".
  Mensagens de erro são frases legíveis, não códigos.
- **Idioma:** **pt-BR e inglês fazem parte do produto.** Implementado (Adendo 6 do
  `CONTRACT.md`): dicionário em `src/lib/i18n.ts`, escolha automática pelo locale do
  sistema, sem seletor, com inglês como fallback. O português é o dicionário canônico e o
  inglês é tipado contra ele — chave nova sem tradução quebra o build. Medido: o inglês é
  mais curto que o português em toda string crítica da janela de 360px.
  **O tray acompanha.** Tooltip e menu (strings do Rust) também seguem o locale do
  sistema, por `src-tauri/src/idioma.rs`: a leitura é própria porque o ícone é desenhado
  no `setup`, antes de a webview existir, e ali não há `navigator.languages` a quem
  perguntar. As duas metades usam a mesma regra de escolha e as mesmas frases.
- **Sem identidade visual definida.** Nenhum logotipo, paleta ou tipografia foi declarado
  vinculante pelo usuário. A tipografia atual (Geist Variable) e o tema shadcn são estado
  do código, não compromisso de marca.

## Evidence on Hand

- `CONTRACT.md` (raiz do projeto) — fonte da verdade normativa: modelo de dados, os comandos
  IPC, invariantes, regras de janela e cinco adendos com a razão de cada decisão, incluindo
  três esclarecimentos de contrato (5.1, 5.2, 5.3). É o artefato mais valioso do repositório.
- Implementação real e rodando: `src/**` (React) e `src-tauri/src/**` (Rust), com testes
  `cargo test` cobrindo os comandos, a migração do formato antigo e a contagem do tray.
- Relatos diretos do usuário citados no contrato (arrastar quebrado, seleção de texto
  indevida, pedido de melhorias, pedido de abas) — feedback real de uso, não hipótese.

**Ausências que trabalho futuro não pode inventar:** não existem métricas de uso, número de
usuários, depoimentos, pesquisa com usuários, benchmarks de desempenho, preço, licença,
canal de distribuição, site, presença em loja ou identidade visual. O app nunca foi
distribuído a ninguém.

## Product Principles

1. **Atrito é o inimigo, não a falta de recurso.** Toda melhoria deve tirar um passo do uso
   diário. Recurso que acrescenta superfície de interface sem tirar atrito não entra.
2. **A altura de 360x480 é o orçamento.** Nada ocupa altura permanente sem justificar o que
   empurrou para fora da dobra.
3. **Nada exige aprendizado.** Se precisa ser explicado, foi mal desenhado. Corolário: o que
   é essencial (as vias de volta para a janela) precisa ser visível, não documentado.
4. **Desfazer em vez de confirmar.** Gesto destrutivo é reversível por alguns segundos, e não
   protegido por um clique cobrado de toda ação certa.
5. **Falha faz barulho, nunca limpa a tela.** Toda mutação é tudo-ou-nada; nenhum caminho de
   erro pode ser indistinguível de perda de dados.
