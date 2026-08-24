---
name: NoCom
description: Uma vidraça acromática de 360x480 que flutua sobre o trabalho real e só ganha cor quando algo falha.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.544 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  control-border: "oklch(0.643 0 0)"
  ring: "oklch(0.48 0 0)"
  destructive: "oklch(0.529 0.245 27.325)"
  folha-pelicula: "#e8ebee"
  folha-prancha: "#f6f7f9"
  folha-tinta: "#161a1f"
  folha-tinta-fraca: "#5c6672"
  folha-fio: "#c9cfd6"
  folha-fio-forte: "#adb6c0"
  folha-cota: "oklch(0.529 0.245 27.325)"
  folha-cota-fraca: "oklch(0.529 0.245 27.325 / 12%)"
  folha-halo: "oklch(0.48 0 0)"
typography:
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "normal"
  micro:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  folha-display:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(38px, 5.6vw, 68px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  folha-assunto:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(19px, 2vw, 25px)"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  folha-zona:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.13em"
  folha-rotulo:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.13em"
  folha-corpo:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  folha-corpo-secundario:
    fontFamily: "Spectral, Georgia, Times New Roman, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  folha-escolha:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  folha-medida:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  folha-codigo:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Segoe UI Symbol, Noto Sans Symbols 2, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  folha-numero:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
rounded:
  folha: "0"
  checkbox: "4px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  pill: "9999px"
spacing:
  hairline: "2px"
  tight: "4px"
  snug: "6px"
  base: "8px"
  gutter: "12px"
  folha-margem: "clamp(16px, 4vw, 56px)"
  folha-recuo-prancha: "clamp(16px, 2.4vw, 28px)"
  folha-zona: "clamp(40px, 5vw, 64px)"
  folha-pe: "clamp(56px, 8vw, 104px)"
components:
  surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    width: "360px"
    height: "480px"
  titlebar:
    height: "40px"
    padding: "0 12px"
    typography: "{typography.title}"
  counter-badge:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.pill}"
    padding: "2px 6px"
    typography: "{typography.micro}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
    typography: "{typography.label}"
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  button-ghost-xs:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
    typography: "{typography.label}"
  button-icon-xs:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    size: "24px"
  checkbox:
    backgroundColor: "transparent"
    rounded: "{rounded.checkbox}"
    size: "16px"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.checkbox}"
    size: "16px"
  todo-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px"
    typography: "{typography.body}"
  todo-row-hover:
    backgroundColor: "oklch(0.97 0 0 / 60%)"
    textColor: "{colors.foreground}"
  todo-row-done:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
  tab-chip:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
    width: "max 8.5rem"
    typography: "{typography.label}"
  tab-chip-active:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "24px"
  notice-error:
    backgroundColor: "oklch(0.529 0.245 27.325 / 10%)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.label}"
  notice-undo:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.label}"
  context-menu:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "4px"
  context-menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "28px"
    padding: "0 8px"
    typography: "{typography.label}"
  context-menu-item-highlighted:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  folha-prancha:
    backgroundColor: "{colors.folha-prancha}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "{spacing.folha-recuo-prancha}"
  folha-comando:
    backgroundColor: "{colors.folha-pelicula}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "8px 11px"
    typography: "{typography.folha-codigo}"
    width: "max 62ch"
  folha-botao-copiar:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "0 11px"
    typography: "{typography.folha-rotulo}"
  folha-botao-copiar-hover:
    backgroundColor: "{colors.folha-cota-fraca}"
    textColor: "{colors.folha-tinta}"
  folha-botao-varredura:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "7px 13px"
    typography: "{typography.folha-rotulo}"
  folha-botao-varredura-hover:
    backgroundColor: "transparent"
    textColor: "{colors.folha-cota}"
  folha-seletor-botao:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "9px 18px"
  folha-seletor-botao-escolhido:
    backgroundColor: "{colors.folha-tinta}"
    textColor: "{colors.folha-prancha}"
  folha-aviso-movel:
    backgroundColor: "{colors.folha-cota-fraca}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "12px 14px"
  folha-especime:
    backgroundColor: "transparent"
    rounded: "{rounded.folha}"
    width: "600px"
    height: "520px"
  folha-chamada:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "11px 0"
    typography: "{typography.folha-corpo-secundario}"
  folha-chamada-escolhida:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta}"
  folha-chamada-numero:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    typography: "{typography.folha-numero}"
    padding: "1px 0"
  folha-chamada-numero-escolhido:
    backgroundColor: "{colors.folha-cota}"
    textColor: "{colors.folha-prancha}"
  folha-balao:
    backgroundColor: "{colors.folha-prancha}"
    textColor: "{colors.folha-cota}"
    rounded: "{rounded.folha}"
    size: "20px"
    typography: "{typography.folha-medida}"
  folha-detalhe-vidro:
    backgroundColor: "{colors.folha-pelicula}"
    rounded: "{rounded.folha}"
    height: "80px"
    width: "max 560px"
---

# Design System: NoCom

## Este documento guarda DOIS mundos, e diz qual superfície cada um governa

O projeto tem duas superfícies de tela, com trabalhos diferentes, e elas **não** compartilham
uma única escala tipográfica, um único ritmo de espaçamento nem um único vocabulário de forma.
Tentar unificá-las produziria um documento que não descreve nenhuma das duas.

| Mundo | Superfície | Código |
| --- | --- | --- |
| **A Vidraça** | a janela do aplicativo — 360x480 px, sempre por cima, acromática | `src/**`, `src-tauri/**` |
| **A Folha de Cotas** | a landing page de duas línguas — folha de desenho técnico | `site/**`, gerada por `scripts/site.mjs` |

**Como ler as seções abaixo.** Em cada seção canônica, o conteúdo **sem rótulo de mundo é
d'A Vidraça** — ele é o incumbente, está no ar e continua valendo verbatim. Os blocos
intitulados **"A Folha de Cotas"** governam a página, e só ela.

**Onde os dois discordam, não há deriva a reconciliar: são duas superfícies com orçamentos
opostos.** Dois exemplos que não devem ser mediados:

- A janela proíbe qualquer espaçamento acima de 12px e não tem tipografia de exibição. A
  folha tem um nome de produto de até 68px e um pé de até 104px. As duas coisas estão
  certas, cada uma na sua superfície. Uma janela de 480px de altura disputa cada pixel com
  a lista; uma folha rolável não disputa nada.
- A janela declara que **responsividade não existe, e é uma decisão**. A folha tem cinco
  pontos de quebra (1100, 1080, 720, 700, 560px), inclusive um que troca o SVG do palco
  inteiro. Também é uma decisão: a janela tem um tamanho só, a página é aberta em qualquer
  tela que exista.

**O que atravessa as duas, de propósito:** a **Regra do Pigmento Único** (uma matiz, o
vermelho), o anel de foco de **2px sólidos sem raio**, o tema pelo sistema **sem toggle**, e
a regra de **um estado, uma voz** na acessibilidade. Cada uma está registrada nas duas
seções, com o motivo de valer nos dois lugares.

## Overview

**Creative North Star: "A Vidraça"** — *superfície: a janela do aplicativo.*

Uma lâmina de vidro pousada sobre o trabalho real. A janela flutua permanentemente
acima de tudo — editor, planilha, navegador — e por isso ela não pode ter cor
própria: qualquer pigmento seu competiria, o dia inteiro, com o conteúdo que
realmente importa. O sistema é **acromático de propósito**: quase toda a paleta é
OKLCH com croma exatamente `0`, cinzas puros, sem uma gota de matiz. **Existe uma
matiz e só uma** — o vermelho —, e ela aparece em duas intensidades: saturada no
erro, pastel na data de hoje. Nenhuma outra cor entra, e é essa escassez que faz as
duas serem impossíveis de ignorar.

A vidraça é pequena e não redimensiona: **360x480 px, fixos**. Isso não é um detalhe
de configuração, é a restrição que governa cada decisão aqui. Não há hierarquia
tipográfica em cascata porque não há altura para ela; há três tamanhos de texto e um
quarto minúsculo para o contador. Não há sombras internas porque profundidade custa
espaço visual que a janela não tem — a única sombra do app é a que ele projeta sobre
a área de trabalho, e ela existe apenas porque a janela dispensou a decoração do
sistema operacional e precisa se descolar do que está atrás. Os controles somem em
repouso e voltam quando a mão (ou o foco do teclado) chega perto.

O sistema é deliberadamente **anti-expressivo**. Não é um app de produtividade
colorido, não é um widget de vidro fosco, não é um dashboard de métricas, e não imita
o cromo de nenhum sistema operacional — o app roda em três, e imitar um quebra nos
outros dois. A qualidade não está na aparência; está no ajuste. Um checkbox de 16px
com área de clique de 40px de largura. Um título de 200 caracteres sem um espaço que
nunca vaza pela borda. Uma linha que desliza 180ms até o novo lugar em vez de saltar.

**Key Characteristics:**

- Croma `0` em toda a paleta, exceto uma matiz de vermelho em duas intensidades (erro e hoje)
- Superfície única: um cartão de 14px de raio é o app inteiro, com borda e sombra próprias
- Densidade extrema — faixas de altura fixa de 40px, 28px e 24px em 480px de janela
- Três tamanhos de texto (13px / 12px / 11px), uma família só (Geist Variable)
- Plano por dentro; a única sombra é a da janela contra a área de trabalho
- Controles discretos que se revelam no hover **e no foco de teclado**, nunca só no mouse
- Alvos de clique maiores que o desenho que os representa
- Tema claro e escuro pelo sistema operacional, sem toggle
- Movimento reservado a três coisas que se mexem sozinhas — a tinta do checkbox, a linha
  que muda de lugar por causa dela, e a faixa de aviso que toma altura da lista; nada
  acima de 200ms, nada no caminho de abrir a janela

### A Folha de Cotas

**Creative North Star: "A Folha de Cotas"** — *superfície: `site/index.html` e `site/en/index.html`,
geradas por `scripts/site.mjs`.*

Uma prancha de desenho técnico. **Nada é afirmado, tudo é mostrado.** A página não tem herói,
não tem manchete e não tem uma única frase de venda em corpo grande: ela tem um bloco de
título com dois campos do desenho, um seletor de sistema, uma prancha com o espécime anotado
de um lado e a instalação do outro, e três notas. O argumento do produto são oito linhas
conferíveis, quatro delas zeros.

**O contrato de direção era "nada é afirmado, tudo é medido", e a forma honesta hoje é
"tudo é mostrado".** O desenho parou de anotar TAMANHO e passou a anotar FUNÇÃO: as cotas de
360 e 480 saíram, e no lugar delas há cinco chamadas numeradas que apontam para pixels reais
de uma captura real, com o detalhe ampliado a 2:1 embaixo. **A medida não foi descartada, ela
mudou de lugar:** `360 × 480` é uma linha da tabela de números, que é onde medida pertence.
Ninguém instala um app de tarefas porque a janela tem 360x480 — as cotas mediam exatamente a
coisa que menos importa, e ocupavam o dispositivo central da folha para dizê-la. O que
substitui é **nativo do mesmo mundo**: o balão numerado com linha de chamada e o detalhe
ampliado numa escala declarada são desenho técnico tanto quanto a cota, e a primeira revisão
de acabamento já os tinha listado como teto não usado da folha.

**O nome do mundo continua "A Folha de Cotas"**, e não por inércia: a cotação não saiu da
folha, ela saiu do *desenho*. A tabela de números é uma cotação em forma de lista — oito
linhas, coluna de valor em vermelho —, e é ela que carrega `360 × 480` agora. O que mudou é
qual dos dois dispositivos ocupa o centro da prancha.

**O seletor de sistema é o dispositivo que organiza a folha.** Ele fica entre o bloco de
título e a prancha, e tudo que é específico de um sistema — o bloco de instalação e o trecho
de primeira abertura — aparece ou desaparece com ele. Uma prancha mostra o corte que
interessa; esta folha passou a mostrar o sistema que interessa, e ninguém mais lê uma linha
de `brew` estando no Windows.

O mundo visual é **herdado de `assets/marca/especificacao.html`**, a folha que documenta a
marca: película cinza-fria, prancha um tom acima, fio de 1px, Archivo em versalete tracked,
Spectral no corpo e Azeret Mono em toda medida. Os seis neutros são **os mesmos valores**,
não uma aproximação. A diferença de propósito é uma só e decide todo o resto: **aquela folha
mede a marca, esta mede o produto.** E a única substituição de token é a cor de cota — o
azul daquela folha saiu para entrar o vermelho `destructive` do próprio app, para a Regra do
Pigmento Único valer no projeto inteiro e não só dentro da janela.

A folha é **plana e reta por lei**: não existe um `border-radius` nem um `box-shadow` em
lugar nenhum do seu CSS. A única profundidade na tela é a sombra que o PNG do espécime já
carrega — a sombra que o sistema operacional desenha sob a janela real, que é a borda física
do app. Profundidade aqui se faz com **tom** (película e prancha, um tom de diferença) e com
**fio de 1px**.

**Key Characteristics:**

- Escala 1:1 literal: o espécime mede 360x480 px CSS na tela de quem visita, e o realce de
  cada chamada é cravado nas coordenadas reais da janela dentro do raster — **nas duas
  geometrias**, derivadas de uma lista só
- **Cinco chamadas numeradas** (1 o campo, 2 as abas, 3 a data, 4 a concluída, 5 a saída) são
  o dispositivo central do desenho e o único controle do palco: escolher uma realça a região
  na janela, acende o balão e recorta o detalhe ampliado a 2:1
- Um seletor de sistema no topo, e o escolhido marcado por **inversão** (placa de tinta
  cheia, texto em prancha): o sinal mais forte disponível sem abrir uma segunda matiz. **São
  duas as superfícies preenchidas da folha**, e as duas dizem "escolhido": a placa de tinta do
  sistema, e o número da chamada escolhida, preenchido em cota
- Sem JavaScript o seletor desaparece e os três sistemas ficam à vista: a folha degrada para
  a página que ela era, e aquela página funcionava
- Zero canto arredondado e zero sombra em toda a folha; a única sombra é a do raster
- Uma matiz, o vermelho `destructive` do app, reservada a **valor medido e a índice de
  desenho** — coluna de valor, numeral do ciclo, número de nota, número de chamada — e às
  duas faixas que avisam
- Três famílias auto-hospedadas com trabalhos separados: Archivo (rótulo e nome), Spectral
  (prosa), Azeret Mono (toda medida, comando e numeral)
- **Rótulo de zona em vez de manchete de seção:** o único texto grande da página é o nome do
  produto
- Tema claro como definição base, escuro redefinindo a mesma lista por `prefers-color-scheme`,
  sem toggle — igual ao app
- Um único movimento autoral (a linha de chamada que se desenha, uma vez) e uma varredura de
  2s que só corre a pedido; nada em laço, nada ambiente. A troca de chamada é transição de
  140ms em opacidade e cor, e não um movimento novo
- Zero requisição de terceiro: fontes, capturas, marca e favicons saem do próprio domínio,
  porque um produto que promete "sem telemetria" não entrega o IP de quem visita ao Google Fonts
- A ação primária (instalar) fica **ao lado da prova**, na primeira dobra e não no pé da
  página, e os números que a sustentam ficam logo abaixo dela, na mesma prancha

## Colors

Uma paleta de cinzas neutros em OKLCH — croma `0` em quase todos os tokens — com um
único pigmento, o vermelho, em duas intensidades. Os valores normativos do frontmatter são os do tema
claro; o tema escuro troca a mesma lista via `prefers-color-scheme`, sem classe e sem
JavaScript.

### Primary
- **Grafite** (`primary`): o quase-preto que preenche o checkbox marcado. É a única
  aplicação de tinta cheia em toda a interface, e por isso concluir uma tarefa é o
  gesto visualmente mais afirmativo do app. No escuro, inverte para o quase-branco.

### Neutral
- **Vidro** (`background` / `card`): branco puro no claro, quase-preto no escuro. É a
  superfície da vidraça inteira — pintada pelo cartão raiz, nunca pelo `body`, que
  precisa permanecer transparente para os cantos arredondados não aparecerem sobre um
  retângulo opaco.
- **Tinta** (`foreground`): o texto de tarefa pendente, o título da janela, o nome da
  aba ativa. Contraste máximo, reservado para o que ainda exige ação.
- **Névoa** (`muted-foreground`): cinza médio. Carrega tudo que é secundário e tudo
  que já foi resolvido — o rodapé, o contador, as abas inativas, o estado vazio e o
  **título riscado de uma tarefa concluída**. Concluir não apaga: desbota.
- **Bruma** (`muted`): o cinza quase-branco de fundo. É o recurso de destaque do
  sistema — marca a aba ativa, o hover de uma linha (a 60% de opacidade) e a pílula do
  contador. Faz sozinho o trabalho que outros sistemas dividem entre cor, sombra e peso.
- **Bruma Densa** (`foreground/10`): a **única** exceção à Bruma, e ela existe por
  medida e não por gosto. É o fundo da data de hoje destacada no título de uma tarefa —
  um destaque que vive **dentro** de uma linha que já usa `muted/60` no hover. Em
  `muted`, a pílula desaparecia exatamente quando o mouse chegava nela, que é quando a
  pessoa está olhando. Continua croma `0`, então o Pigmento Único vale; o que muda é a
  densidade, não a matiz. Ver a Regra do Destaque que Sobrevive ao Fundo.
- **Fio** (`border` / `input`): a borda da vidraça e o traço dos separadores. Linha
  **decorativa**: divide e delimita, não informa. No escuro deixa de ser um cinza sólido
  e vira branco a 10%, para não cintilar sobre a superfície escura.
- **Fio de Controle** (`control-border`): o contorno do checkbox e do campo de texto.
  Parece a mesma coisa que o Fio e não é: esta linha é a **única informação** de que
  existe ali algo que responde. Um checkbox desmarcado é só a sua borda.
- **Halo** (`ring`): o anel de foco. Sólido, 2px, em todo controle sem exceção. Fica em
  ~6.5:1 contra a superfície — visível de longe, e ainda assim bem abaixo dos 17.9:1 do
  checkbox marcado: o foco se anuncia sem gritar mais alto que o gesto de concluir. É a
  contrapartida obrigatória da Regra da Revelação com Teclado.

### Destructive
- **Alarme** (`destructive`): vermelho-alaranjado saturado (croma `0.245`), a
  intensidade **cheia** da única matiz do sistema. Aparece em exatamente um lugar: a
  faixa de aviso de erro, como texto sobre o próprio fundo a 10%. Não colore o botão de
  remover, não colore o fechar da aba, não colore o "Limpar concluídas" — nenhum gesto
  destrutivo é vermelho, porque nenhum deles é irreversível: todos oferecem desfazer.

### Hoje
- **Hoje** (`today` / `today-foreground`): a mesma matiz do Alarme na intensidade
  **pastel** — croma `0.045` no fundo contra os `0.245` do erro, 5,4x menos. É o fundo
  da pílula de uma data que é hoje, e o **segundo e último** valor cromático do app.
  Existe porque "hoje" é a única informação da lista que muda sozinha e cuja janela de
  utilidade fecha à meia-noite; cinza diria "aqui tem uma data", e é justamente o que as
  outras datas dizem. A distância de croma é o que impede uma pílula de 40px de competir
  com a mensagem de que algo falhou. Medido: texto em 6.64:1 no claro e 7.09:1 no
  escuro; a pílula em 1.27:1 e 1.90:1 contra o cartão. Ver a Regra do Pigmento Único.

### Named Rules

**A Regra do Pigmento Único.** **Uma matiz no app inteiro, e ela é o vermelho.** Cor
não decora, não categoriza e não hierarquiza; ela marca as duas coisas que pedem o olho
agora — *algo falhou* e *é hoje* —, e o que separa as duas é **intensidade**, não tom.
Todo o resto é croma `0`.

A regra já foi mais estreita ("cor reporta falha, e nada mais"), e a data de hoje a
abriu de propósito. O que ela **não** virou é um orçamento de cores: continua sendo uma
matiz, e o segundo uso teve de provar que era a mesma classe de informação — passageira,
não-decorativa, e sem um segundo jeito de ser dita (cinza já significa "aqui tem uma
data"). Duas intensidades da mesma matiz também não se confundem em uso: o erro é texto
saturado numa faixa de largura inteira, hoje é um fundo pastel de 40px dentro de uma
linha.

Testes, agora dois: **matiz que não seja a do vermelho é bug**; e **vermelho saturado
sem nada ter falhado é bug**. Um terceiro uso precisa de um argumento tão forte quanto o
segundo, e a resposta padrão é não.

**A Regra da Linha que Informa.** Uma linha que só divide pode ser discreta; uma linha
que **identifica um controle** carrega informação e precisa de 3:1 (WCAG 1.4.11). Por
isso o sistema tem dois cinzas de traço em vez de um: `border` para separador e moldura,
`control-border` para a borda de checkbox e campo. Confundir os dois foi o que deixou o
checkbox desmarcado em 1.26:1 — praticamente invisível sobre branco.

**A Regra do Desbotamento.** Concluir uma tarefa nunca a apaga nem a esconde — move
para `muted-foreground` com riscado, e a manda para o fim da lista. Estado resolvido é
estado com menos contraste, jamais estado ausente.

### A Folha de Cotas

Seis neutros cinza-frios em hex, herdados verbatim da folha de especificação da marca, mais
**uma matiz** — a mesma do app — em duas densidades, e o cinza do anel de foco. O **tema
claro é a definição base**; o escuro redefine a **mesma lista** dentro de
`prefers-color-scheme: dark`. Nenhuma cor tem sua única definição no bloco escuro, e não há
toggle: o app segue o sistema e a folha também.

Os valores normativos estão no frontmatter (prefixo `folha-`), com o claro como canônico.
Os pares do escuro: película `#15181c`, prancha `#1d2126`, tinta `#e6e9ec`, tinta-fraca
`#909aa5`, fio `#2e343b`, fio-forte `#414951`, cota `oklch(0.704 0.191 22.216)`, cota-fraca
a 14% da mesma, halo `oklch(0.72 0 0)`.

#### Primary

- **Cota** (`--cota`): o vermelho `destructive` do próprio app. É a tinta de **toda medida e
  de todo índice de desenho**: a coluna de valor da tabela de números, o numeral do ciclo de
  2 s, o número de cada nota e o ponteiro para ela, e o desenho inteiro de uma chamada — o
  contorno do balão de 20x20, o numeral dentro dele, a linha de chamada, a seta, e o
  retângulo de realce sobre a região. Quando uma chamada é a escolhida, o número dela na
  lista **inverte**: fundo cota, texto prancha. E o fio de 1px das duas faixas tintas — a
  citação de aviso do sistema e o aviso de celular. Medido pelo código: **5.1:1 sobre a
  película no claro e 6.0:1 no escuro**.
- **Cota Fraca** (`--cota-fraca`): a mesma matiz a 12% (14% no escuro). Três usos, todos
  "isto é para você agora": o fundo da citação de aviso do sistema, o fundo do aviso de
  celular, e o fundo do hover do botão de copiar. Também é a cor de `::selection`. A faixa
  que marcava a linha do sistema de quem visita saiu junto com o seletor: com um sistema por
  vez na tela, não há mais o que destacar entre iguais.

#### Neutral

- **Película** (`--pelicula`): o cinza-frio de fundo da folha inteira — a mesa sobre a qual a
  prancha está. Também é o fundo da linha de comando, para o `<code>` recuar um tom em
  relação à prancha.
- **Prancha** (`--prancha`): um tom acima da película. É o papel — a caixa única que guarda o
  espécime, a instalação e os números. **A diferença de um tom é a única elevação que a folha
  tem.** Também é o **preenchimento do balão de chamada** — um quadrado de papel sobre a
  captura, para o numeral se ler sem placa opaca e sem halo —, o texto do número de chamada
  quando ele está invertido, e o texto da placa de tinta do sistema escolhido.
- **Tinta** (`--tinta`): o texto de corpo, o nome do produto, a linha de assunto, os rótulos
  de zona. E os dois fios estruturais de **2px**: a base do bloco de título e o topo do
  carimbo. É também **uma das duas superfícies preenchidas da folha**: a placa do sistema
  escolhido no seletor, onde a tinta deixa de ser texto e passa a ser fundo. (A outra é o número
  da chamada escolhida, preenchido em cota — ver a Regra da Inversão para o Escolhido.)
- **Tinta Fraca** (`--tinta-fraca`): tudo que é secundário — subtítulos de zona, a coluna de
  observação da tabela, os rótulos do diagrama de ciclo, o rótulo do detalhe, o pé. E as
  quatro linhas de chamada que não estão escolhidas, incluindo o contorno do número delas em
  fio-forte: **nenhum texto de chamada é vermelho**, só o índice.
- **Fio** (`--fio`): a moldura da prancha, o divisor entre as duas zonas, o fio que separa os
  números da instalação, o fio abaixo da faixa do seletor, e os separadores das listas de
  instalação, de notas e de chamadas. Linha decorativa: divide, não informa.
- **Fio Forte** (`--fio-forte`): o traço que **delimita algo com que se interage** — a borda
  da linha de comando, a borda do botão de varredura, o sublinhado dos links em repouso, o
  polegar da barra de rolagem, o fio abaixo de um rótulo de zona e do cabeçalho da tabela, e
  o contorno do número de chamada em repouso. É a mesma distinção que a Regra da Linha que
  Informa faz no app, aplicada aqui. **A moldura da vidraça do detalhe é a única exceção
  declarada:** ela não é clicável, mas é o *resultado* do controle ao lado dela e precisa se
  ler como instrumento — em fio simples, a caixa de 80px pareceria uma divisão de papel em
  vez de uma lente.
- **Halo** (`--halo`): o anel de foco. `oklch(0.48 0 0)` no claro — **exatamente o valor do
  `ring` do app**, e não um cinza novo. No escuro sobe para `oklch(0.72 0 0)`.

### Named Rules (A Folha de Cotas)

**A Regra do Pigmento Único vale nos DOIS mundos, e é por isso que a cota é vermelha.** A
folha herdou tudo de `assets/marca/especificacao.html` menos uma coisa: aquela folha coteja
em **azul** (`#1f6f9c` no claro, `#6bbde8` no escuro), e a landing page trocou esse azul pelo
`destructive` do app. O motivo é a própria regra — *uma matiz no projeto inteiro, e ela é o
vermelho* — e a troca não custou autenticidade nenhuma, porque **cota em vermelho de revisão
é nativa do desenho técnico**: a lei do produto e a verdade do mundo pediram a mesma cor. A
consequência é que as duas superfícies do projeto têm exatamente um pigmento em comum e
nenhum outro. Teste, aqui como lá: **matiz que não seja a do vermelho é bug.**

**A Regra do Valor Medido.** Nesta folha, a cor de cota marca **valor medido ou índice de
desenho**, e nada mais. Coluna de valor, numeral do ciclo, número de nota, número de chamada
e o desenho que o acompanha (balão, linha, seta, realce). Não marca ênfase, não
marca link de corpo, não marca título e não marca estado — e em particular **não marca o
sistema escolhido no seletor**, que se resolve por inversão de tom. A tabela de números é uma
cotação em forma de lista, não um quadro de destaques — é por isso que a coluna do meio
inteira é vermelha e as outras duas não. Teste: se o vermelho está em algo que não é um
número ou o seu rótulo de linha, ele está decorando.

A exceção é declarada e são duas: as **faixas tintas**, que abrem com um fio de 1px em cota
sobre fundo cota-fraca — a citação do aviso do sistema e o aviso de celular. Ali a matiz não
mede, ela **avisa**, que é exatamente o trabalho que o vermelho saturado faz na janela do
app. Uma terceira faixa tinta precisa provar que também é um aviso, e não uma ênfase.

**A Regra das Superfícies que o Navegador Desenha.** As superfícies que ninguém lembra de
vestir são vestidas pela paleta, e não pelo padrão do navegador: `::selection` (cota-fraca
com tinta por cima), `caret-color` e `accent-color` (cota), `scrollbar-color` (fio-forte
sobre transparente, `thin`), o polegar `-webkit` de 11px com 3px de borda em película para
ele se ler como um traço e não como uma barra, o sublinhado de link (fio-forte de 1px a 3px
de distância, virando cota no hover) e o anel de foco (**2px sólidos em halo, 2px de
deslocamento, sem raio** — a mesma lei do app). Um azul de seleção padrão do sistema seria
uma segunda matiz entrando pela porta que ninguém olhou.

## Typography

**Body Font:** Geist Variable (com `ui-sans-serif`, `system-ui`, `-apple-system`,
`Segoe UI`, `Roboto`, `sans-serif`)
**Display Font:** nenhuma. Não existe tipografia de exibição neste sistema.

**Character:** Uma família só, geométrica e neutra, em três tamanhos e três pesos. A
tipografia aqui não tem personalidade própria por decisão — a vidraça não fala, ela
mostra. `-webkit-font-smoothing: antialiased` está ligado globalmente porque em 13px o
peso aparente do texto muda o suficiente para importar.

### Hierarchy
- **Title** (600, 13px, `tracking-tight`): exclusivo do nome do app na barra de título.
  É o único texto semibold da interface.
- **Body** (400, 13px, altura de linha 20px): o texto das tarefas e o campo de nova
  tarefa. É o tamanho de trabalho do app — tudo que a pessoa escreveu está aqui.
- **Label** (400, 12px): tudo que a interface diz por conta própria — rodapé, nomes de
  abas, avisos, estado vazio, botão "Limpar concluídas". A aba ativa sobe para peso 500.
- **Micro** (400, 11px, `tabular-nums`, altura de linha 1): apenas o contador de
  pendentes na pílula da barra de título.

### Named Rules

**A Regra dos Três Tamanhos.** 13px, 12px, 11px. Não existe um quarto tamanho, e não
existe nada acima de 13px. Numa janela de 480px de altura, uma escala tipográfica em
cascata gastaria em hierarquia o espaço que pertence às tarefas. Hierarquia aqui se faz
com **peso e com cinza**, não com tamanho.

**A Regra do Número Tabular.** Todo número que muda no lugar — o contador da barra de
título, o "N pendentes" do rodapé — usa `tabular-nums`. Sem isso, o texto ao redor
saltita lateralmente a cada tarefa marcada.

**A Regra do Texto que Não Vaza.** Nenhum texto pode ultrapassar a borda da janela em
nenhuma largura, nem gerar rolagem horizontal. Título de tarefa: `wrap-anywhere` +
`line-clamp-2`, com o texto inteiro no `title`. Nome de aba: `truncate` com `title`.
Mensagem de erro: `wrap-anywhere` + `line-clamp-3` com `title`. Teste: uma tarefa de
200 caracteres sem um único espaço tem que caber.

### A Folha de Cotas

**Display / Label Font:** Archivo (variável 100–900, com `Helvetica Neue`, `Arial`,
`sans-serif`)
**Body Font:** Spectral (400, 400 itálico e 500, com `Georgia`, `Times New Roman`, `serif`)
**Mono Font:** Azeret Mono (variável 100–900, com `ui-monospace`, `SF Mono`, `Menlo`,
`monospace`)

**Todas as três são auto-hospedadas**, copiadas de `node_modules` por `scripts/site.mjs`, no
subconjunto latino, `font-display: swap`, com Archivo e Azeret pré-carregadas no `<head>`.
Nenhuma requisição sai para um terceiro — é requisito do produto, não preferência técnica.

**Character:** três famílias com três trabalhos que não se cruzam. Archivo é a caligrafia do
desenhista: versalete tracked a `0.13em` nos rótulos, e o único texto grande da página no
nome do produto. Spectral é a voz que explica — a página tem prosa de verdade, e prosa longa
em grotesca cansa. Azeret Mono é o instrumento: **toda medida, todo comando e todo numeral**,
sempre com `tabular-nums`.

**A pilha separada dos modificadores** (`--mono-atalho`). Os glifos `⌃` (U+2303) e `⌥`
(U+2325) **não estão no subconjunto latino da Azeret Mono**. Sem uma pilha própria, `⌃⌥T` cai
na fonte de fallback do navegador com métrica alheia, ou pior, em retângulo vazio. A pilha
acrescenta `Segoe UI Symbol` (Windows) e `Noto Sans Symbols 2` (Linux) depois de `SF Mono`
(mac), e hoje ela é **a pilha de `<code>` inteira**, sem classe nenhuma: `code {
font-family: var(--mono-atalho) }`. A razão é que os modificadores passaram a morar dentro de
`<code>` no texto das chamadas (`⌃⌥T` na chamada 1), e um seletor de exceção só funciona
enquanto alguém lembra de aplicá-lo. A pilha custa dois nomes de família a mais e resolve
todo `<code>` futuro. **Retirados nesta passagem:** a classe `.atalho-texto`, morta, e a
classe `.atalho` de dentro do SVG, que saiu junto com o rótulo `atalho global` do palco.

#### Hierarchy

- **Nome do produto** (Archivo 700, `clamp(38px, 5.6vw, 68px)`, altura 0.92, `-0.035em`): o
  `h1`, e o **único** texto de exibição da folha. Aparece uma vez.
- **Assunto** (Archivo 500, `clamp(19px, 2vw, 25px)`, altura 1.3, `-0.02em`, `text-wrap:
  balance`, máx. 32ch): a linha de assunto do bloco de título, do outro lado do eixo em
  relação à marca.
- **Nome de sistema** (Archivo 600, 17px): o `macOS` / `Windows` / `Linux` do bloco de
  instalação que está à vista. É o maior texto fora do bloco de título, e não é um cabeçalho.
- **Escolha do seletor** (Archivo 600, 15px, `-0.01em`): os três botões do seletor de
  sistema. É Archivo **sem versalete**, e de propósito: `macOS` é um nome próprio, não um
  rótulo de campo, e versalete o transformaria em `MACOS`. Os outros dois usos de Archivo a
  15px são peso 500, nas duas faixas tintas.
- **Nome de chamada** (Archivo 600, 13px, `0.02em`, **sem versalete**): o `O campo` / `As
  abas` / `A data` / `A concluída` / `A saída` da lista de chamadas, numa coluna de 6.5rem. É
  o segundo texto funcional em Archivo que não é versalete, pela mesma razão do seletor: um
  nome de peça é nome, não rótulo de campo, e `A CONCLUÍDA` em versalete gritaria mais alto
  que o rótulo de zona acima dele. O tracking mínimo de `0.02em` é o que separa 13px liso do
  corpo Spectral ao lado, sem virar rótulo.
- **Rótulo de zona** (Archivo 600, 13px, `0.13em`, versalete, sobre um fio de 1px): o `h2`.
  É o **único nível de cabeçalho de seção** que a folha tem. O `h3` é o mesmo desenho a 11px — o passo de rótulo, e não um degrau intermediário,
  sem fio.
- **Corpo** (Spectral 400, 17px, altura 1.6, máx. 68ch): a prosa das notas.
- **Corpo secundário** (Spectral 400, 15px): subtítulo de zona (máx. 62ch), legenda do
  espécime (60ch), coluna de observação da tabela, parágrafos do carimbo (40ch).
- **Rótulo funcional** (Archivo 600, **11px**, `0.13em`, versalete): o piso. Campos do bloco
  de título, seletor de idioma, o rótulo do seletor de sistema, cabeçalho de tabela, `via`,
  `nota N`, os dois rótulos do diagrama de ciclo, o rótulo `Detalhe · 2:1`, o texto dos
  botões de copiar e de varredura, o `cite`.
- **Medida** (Azeret Mono 500, 14px, `tabular-nums`): os valores dos campos do bloco de
  título, a tabela de números inteira, o numeral do ciclo. Dentro do SVG, o numeral do balão
  de chamada é 14px — herda `.cotas text`, que é o mesmo passo.
- **Número de chamada** (Azeret Mono 500, **11px**, `tabular-nums`, dentro de um contorno de
  1px): o índice de cada linha da lista de chamadas. É mono no piso de 11px porque é um
  índice e não um nome, e o contorno é o que faz o número parecer o balão que está no desenho
  acima — a lista e o palco falam do mesmo objeto.
- **Código** (13px na linha de comando; `0.8235em` para `<code>` inline, que é a razão que
  devolve 14px no corpo de 17px). A família é a pilha `--mono-atalho`, não `--mono` — ver
  acima.

#### Named Rules (A Folha de Cotas)

**A Regra do Rótulo de Zona.** Uma prancha de desenho **não tem manchete de seção**; tem
legenda de zona. Todo cabeçalho de seção desta folha é Archivo 600 em versalete tracked, a
13px (`h2`) ou **11px** (`h3`) — menor que o corpo que ele encima. (O registro anterior dizia
12px para o `h3`; o CSS diz 11px, e o comentário ao lado dele explica por quê: a 12 contra os
13 do rótulo de zona a diferença era invisível.) O único texto grande da página
é o nome do produto, e é exatamente por isso que ele é o foco. Corolário: uma seção nova
recebe um rótulo de zona, nunca um título de 29px.

**A Regra dos Dois Passos Vizinhos.** A folha tem 14px e 15px, e eles não são um
descuido entre 13 e 17: **14px é mono e 15px é serifa.** Azeret a 14px e Spectral a 15px
têm largura de olho parecida, então a medida e a prosa secundária pesam igual na página
apesar do número diferente. Dois valores adjacentes numa rampa precisam dessa justificativa
ou são ruído — e o teste é o de sempre: se os dois passassem a ser da mesma família, um dos
dois teria que sair.

**A regra já cobrou essa conta.** A coluna de característica da tabela de números esteve em
serif a **16px**, e com a prosa a 15px e o corpo a 17px isso dava **três passos vizinhos na
mesma família** — exatamente o ruído que a regra recusa, e sem justificativa nenhuma para o
degrau do meio. A correção foi subir para **17px**, o corpo da folha: a característica é o que
se varre com o olho descendo a tabela, então ela pertence ao corpo cheio e não a um passo
inventado entre dois que já existiam. Piso e teto de serif na folha: 15px e 17px, e nada
entre eles.

**A Regra do Piso de 11px.** Nenhum texto funcional da folha desce abaixo de 11px
(`0.6875rem`) — e isso vale **inclusive dentro de SVG**, que é onde o piso é fácil de
furar por acidente. É por isso que o diagrama do ciclo de 2 s **não carrega texto nenhum**:
ele escala com a largura da coluna, e texto dentro dele encolheria abaixo do piso no
telefone. O numeral "2 s" e os dois rótulos são HTML, no fluxo, fora do SVG. Duas rodadas de
revisão impuseram esse piso; ele não é uma preferência.

**A Regra da Medida em Mono, e da Prosa em Serif.** O mono existe nesta folha para **código,
dado e medida**. Nota em mono é defeito duas vezes: mente sobre a natureza do texto e ainda
cobra a largura de uma medida — foi o que empurrava a coluna de observação para fora da caixa
de rolagem no telefone. Por isso a terceira coluna da tabela de números é Spectral enquanto
as outras duas são Azeret; o `<code>` dentro dela continua mono, porque ali é nome de
arquivo. Corolário simétrico: medida em serif também é bug.

**A Regra do Número Tabular.** Todo numeral da folha usa `tabular-nums` — os campos do bloco
de título, a tabela de números inteira, o numeral do ciclo, os números da lista de chamadas e
os numerais dentro do SVG do palco. É a mesma regra do app, aplicada a uma superfície onde
números se empilham em coluna.

**A Regra da Frase que Ajuda a Instalar.** É a lei de texto desta folha, e ela está escrita
no cabeçalho do dicionário em `scripts/site.mjs`: **toda frase precisa ajudar alguém a decidir
instalar.** Explicação que serve a quem **construiu** o app, e não a quem vai usá-lo, mora no
README. A revisão que aplicou a lei cortou a dissertação sobre assinatura ad-hoc e quarentena
do Homebrew, o aviso de que os 2 s são ergonomia e não benchmark, o inventário de métricas
ausentes, a nota sobre um conjunto de folhas que não existe, as quatro negativas da regra de
data, e a legenda do próprio seletor — que explicava um controle que já se explica. No mesmo
passo os rótulos de zona ficaram lisos: `O espécime` virou **A janela**, `Tabela de revisão —
instalar` virou **Instalar**, `Tabela de calibre` virou **Em números**. O passo continua; o
ensaio técnico foi embora. Teste: uma frase que só faz sentido para quem leu o código é uma
frase que sai.

**Dois cortes desta passagem, e os dois pela mesma lei.** **Um:** a **nota 4** ("A data que
você escreveu") deixou de existir — ela *descrevia* uma funcionalidade em prosa, e a chamada 3
**aponta para ela** nos pixels em que ela acontece. Um parágrafo que explica o que um realce
mostra é o parágrafo que sai; as notas são 1, 2 e 3 agora. **Dois: a densidade de travessão.**
Nove travessões em saturação foram reescritos como vírgula, parêntese ou ponto. Travessão é
pausa forte e a folha o gastava como conjunção de uso geral — em densidade alta ele para de
marcar ênfase e passa a ser tique de voz, que é o oposto de uma prancha. Sobraram três na
página: o título, a frase do `Cancelar` e o sinal `—` de "não há nota", e cada um desses é um
travessão que faz trabalho de travessão.

## Layout

A janela é uma **pilha vertical de faixas de altura fixa com exatamente um elemento
elástico**: a lista. Tudo que não é a lista tem altura declarada, e a lista consome o
que sobrar (`flex-1 min-h-0` dentro de um `ScrollArea`). É o que garante que a janela
nunca cresça nem role por inteiro.

Da borda superior para a inferior:

- **Barra de título** — 40px. Nome + pílula do contador + espaçador elástico + fechar.
  Área de arrasto da janela (o espaçador existe para que o vazio também arraste).
- **Faixa de abas** — 28px, **colada à barra de título**: as duas dizem "onde estou" e
  formam um bloco só. Chips de 24px que rolam na horizontal sem barra visível, com o "+"
  **fora** do contêiner de rolagem, fixo à direita. O contêiner que rola reserva 2px acima
  e abaixo do chip — ver a Regra do Anel que Cabe.
- **Campo de nova tarefa** — banda própria: 8px de ar, 32px de campo, 8px de ar. Este
  respiro é o que separa o cromo da **ação**, e é a única folga generosa do topo.
- **Faixa de aviso** — condicional, e compartilhada entre erro, desfazer e a dica de
  primeira execução. As três dividem a mesma faixa porque a janela não tem altura para
  três barras, e porque todas são passageiras pelo mesmo motivo (6s de auto-dispensa).
- **Separador** (1px) → **lista rolável** (elástica) → **separador** (1px).
- **Rodapé** — 40px. Contador à esquerda, "Limpar concluídas" à direita. Também arrasta.

**Ritmo vertical do topo.** `0 → 8 → 8`: nada entre a barra de título e as abas (um bloco
só), 8px acima do campo, 8px abaixo dele. Não é espaçamento uniforme — é agrupamento.
Três faixas separadas por intervalos iguais viram três listras sem hierarquia, que foi
exatamente o defeito corrigido aqui (as folgas eram `0 → 3 → 0 → 8`, e os 3px deixavam o
chip de aba colidir com o campo).

**Goteira de 12px.** Toda faixa de cromo — barra de título, abas, campo, aviso, rodapé —
usa 12px de recuo lateral, **e a lista também**: 4px no contêiner mais 8px na linha põem
o quadrado do checkbox exatamente a 12px da borda do cartão, na mesma vertical do nome
do app, da borda do campo e do contador do rodapé. O `×` de remover fecha a conta pelo
outro lado, também a 12px.

Os dois recuos não são um número só por acaso, e a divisão entre eles é o que a linha
precisa: os 8px de dentro da linha são a distância entre o conteúdo e a beirada do
realce de hover, e o `after:-left-2` do checkbox é dimensionado para chegar exatamente
nela. Mudar a divisão mexe nas três coisas.

**O que não alinha, e não tem como:** o *texto* da tarefa fica a 36px, porque entre ele
e a goteira há um checkbox de 16px e o `gap-2`. O que alinha é a coluna de controles,
que é o que o olho segue descendo a janela. Já foi escrito aqui que o texto das tarefas
alinhava com o das faixas; não alinhava, e a lista inteira ainda começava com um degrau
de 4px porque o contêiner usava 8px.

**Ritmo de espaçamento:** 2px, 4px, 6px, 8px, 12px. Não há nada acima de 12px em lugar
nenhum da interface, exceto os 24px de respiro vertical do estado vazio — o único lugar
do app com espaço de sobra, e por isso o único que pode se dar ao luxo de respirar.

**Responsividade: não existe, e é uma decisão.** A janela é `resizable: false` em
360x480. Não há breakpoints, não há grid fluido, não há layout alternativo. O que
substitui a responsividade é a **disciplina de contenção**: `min-w-0` em todo contêiner
que pode encolher, `shrink-0` em todo elemento que não pode, e truncamento declarado em
todo texto de origem do usuário.

### Named Rules

**A Regra da Faixa Fixa.** Só a lista é elástica. Qualquer elemento novo entra com
altura declarada e `shrink-0`, ou entra dentro da lista. Um segundo elemento elástico
faria as duas partes disputarem a altura e a lista encolheria sozinha.

**A Regra do Anel que Cabe.** O anel de foco é `box-shadow`, desenhado **2px para fora**
da caixa. Todo contêiner com `overflow` diferente de `visible` recorta o que sai dele — e
`overflow-x: auto` faz o `overflow-y` computar como `auto` junto. Um contêiner de rolagem
com a altura exata do seu conteúdo **apaga o anel de foco de tudo que está dentro dele**.
Reserve 2px em cada eixo, ou o indicador existe no CSS e não existe na tela. Foi o que
aconteceu com a faixa de abas: scroller de 24px, chip de 24px, anel invisível.

**A Regra do Editor que Cabe.** Um editor que substitui conteúdo no lugar herda a forma e
o tamanho do que substituiu — mesmo raio, mesma altura — e sinaliza foco **por dentro**.
Crescer para fora empurra o layout e, dentro de um contêiner que rola, some recortado.

**"Mesma altura" é a altura OCUPADA, e não a desenhada.** O editor de tarefa mede 24px e o
título que ele cobre mede 20px, então ele entra com `-my-0.5`: a caixa externa volta aos
20px e a linha não muda de altura no instante do duplo clique. A alternativa — subir o
título para 24px — custaria 4px em **toda** linha da lista, cerca de uma das oito que
caibem, e numa janela onde a altura é o orçamento é o lado errado da troca.

**O que esta regra não alcança:** um título de duas linhas (40px) editado num campo de uma
linha encolhe a linha em 16px, e isso é inerente — o editor é um `input`, e um `input` não
tem duas alturas de texto. Fica registrado como consequência aceita, e não como coisa a
consertar: o caminho seria um `textarea`, que traria um segundo padrão de edição para o app
justamente onde ele tem um só.

**A Regra dos 2px de Vizinhança.** Dois elementos focáveis vizinhos precisam de pelo menos
4px entre as caixas, ou os anéis de um invadem o outro. Vale entre bandas, não dentro de um
mesmo controle composto (no chip, nome e `×` ficam a 2px, mas só um recebe foco por vez).

**A Regra do Custo de Altura.** Nada ocupa altura permanente sem justificar o que
empurrou para fora da dobra. Dicas, avisos e estados de ajuda são passageiros
(auto-dispensa) ou vivem no espaço vazio que some quando há tarefas.

### A Folha de Cotas

**A folha é uma coluna única de zonas empilhadas**, com uma prancha de duas colunas dentro
dela. Não há grade global de doze colunas, não há barra de navegação e não há rodapé de
links: há o bloco de título, o seletor de sistema, a prancha, a zona de notas e o carimbo.

- **A coluna da folha:** máx. 1320px, centrada, com margem lateral
  `clamp(16px, 4vw, 56px)`, `clamp(20px, 3.5vw, 44px)` de respiro no topo e
  `clamp(56px, 8vw, 104px)` no pé.
- **Bloco de título** (o canto de uma prancha de verdade): grade de **três campos** —
  `auto | minmax(0,1fr) | auto`, alinhados pela **base** (`align-items: end`) — identidade
  (a marca sangrando no seu próprio campo preto de 52–74px, mais o nome), assunto (linha de
  assunto, subtítulo e o link da outra língua), e a tabela de campos do desenho (`dl` de
  duas colunas: **versão e licença, e nada mais**; rótulo em 11px versalete, valor em mono
  tabular, alinhados à direita). Fecha com um fio de **2px em tinta** — o mais grosso da
  folha, junto com o topo do carimbo. Os dois campos que saíram: `sistemas`, porque o seletor
  passou a dizer isso melhor e em lugar mais útil, e `folha 01/04`, porque prometia um
  conjunto de folhas que não existe — um campo de desenho técnico não pode ser cenografia.
- **Seletor de sistema:** faixa própria entre o bloco de título e a prancha — `flex` com
  `flex-wrap`, 16px de ar acima e abaixo, fechada por um fio de 1px. Rótulo de 11px versalete
  à esquerda, e à direita dele os três botões dentro de um contorno único. Ele fica **antes de
  tudo que filtra**, que é a única posição em que um filtro se lê como filtro.
- **Zona:** `clamp(40px, 5vw, 64px)` acima de cada uma. O rótulo de zona substitui a
  manchete.
- **A prancha:** fundo prancha, fio de 1px, e recuo interno `--recuo-prancha`
  (`clamp(16px, 2.4vw, 28px)`). Este recuo é um **token com dependentes**: no estreito, a caixa
  de rolagem do palco e a caixa da tabela de números usam-no em **margem negativa** para sangrar
  até a aresta da prancha, e a tabela ainda o devolve como recuo nas células das pontas. Mudar o
  token move as três coisas juntas, que é o objetivo.
- **A prancha de duas zonas:** `600px | minmax(0, 1fr)` — o palco do espécime à esquerda, a
  instalação à direita, separadas por um fio de 1px que é o `border-left` da coluna da
  direita. **A ação primária fica ao lado da prova**, na primeira dobra.
- **A coluna do palco é uma pilha de cinco coisas, nessa ordem:** rótulo de zona, palco
  (600x520), legenda de escala, **lista de chamadas** (18px abaixo, fechada por fio em cima e
  embaixo de cada linha), **detalhe ampliado** (20px abaixo, máx. 560px, vidraça de 80px), e o
  diagrama do ciclo (18px). A ordem é a do desenho técnico: o desenho, o que ele afirma, a
  legenda das chamadas, e a ampliação — o detalhe fica **depois** do controle que o move, para
  a mudança acontecer abaixo do dedo e não acima dele.
- **A coluna da direita tem duas seções**, não uma: a instalação e, abaixo dela, a zona
  "Em números", separadas por um fio de 1px (26px acima do fio, 22px abaixo). Os zeros são o
  argumento de venda, e por isso eles moram **dentro da prancha, encostados na ação** — não
  numa zona própria a uma rolagem de distância.
- **Ritmo de espaçamento:** 5, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 26, 28px nos detalhes, e os
  quatro clamps do frontmatter na estrutura, até 104px. **O teto de 12px d'A Vidraça não
  atravessa para cá** — ver o preâmbulo dos dois mundos.
- **Pontos de quebra, e o que cada um resolve:** **1100px** o bloco de título passa a duas
  colunas com a identidade em linha própria; **1080px** a prancha empilha as duas zonas e o
  fio vertical vira horizontal; **720px** o palco troca para a geometria estreita, o SVG
  estreito (só realces, sem balão) substitui o largo, e a caixa da tabela de números sangra até
  as arestas da prancha com o recuo voltando nas células das pontas; **700px** os campos do
  bloco de título passam a se alinhar à esquerda, as células da tabela apertam para `9px 10px`
  e a coluna de característica cai de 17px para 15px; **560px** as notas deixam de ter coluna
  de número e a linha de chamada passa de três colunas para duas, com o texto descendo para
  baixo do nome.
- **Medidas de linha declaradas** em quase todo bloco de texto: 68ch no corpo, 62ch no
  subtítulo e na linha de comando, 60ch na legenda, 56ch na citação, 54ch nas alternativas,
  46ch no subtítulo de assunto, 40ch no carimbo, 32ch no assunto. **A exceção é o aviso de
  celular** (`max-width: none`): uma faixa que interrompe a página ocupa a largura da página, e
  medi-la a 56ch a faria parecer uma citação.

### Named Rules (A Folha de Cotas)

**A Regra do Fio que Alcança o Chão.** O divisor entre as duas zonas da prancha é
`align-items: stretch` na grade, e não `start`. Com `start`, o `border-left` da coluna de
revisão parava na altura do conteúdo mais curto e as duas zonas deixavam de ser uma
composição para virar duas páginas encostadas. **Um divisor de zona vai até o chão da
prancha ou não é um divisor de zona.**

**A Regra da Goteira que Não é Recuo.** A goteira entre as zonas é `column-gap`, nunca
`padding` dentro da trilha. Com `box-sizing: border-box`, um recuo dentro da trilha de 600px
deixa o palco (600px, fixo em px porque o realce das chamadas aponta para arestas reais)
**maior** que a caixa de conteúdo, e o `overflow-x` corta o balão da chamada da goteira
direita — a anotação some justamente na folha que existe para mostrar.

**A Regra da Tabela que Vive Dentro da Prancha.** A tabela de números não tem caixa própria:
ela é a segunda seção da coluna de instalação. Três consequências, e todas as três são
obrigação de qualquer tabela que more dentro de uma prancha. **Um:** ela não desenha borda nem
fundo — a prancha já é a caixa, e uma segunda moldura a 1px de outra é um erro de desenho, não
uma hierarquia. **Dois:** as células das pontas perdem o recuo horizontal, para o texto
encostar na mesma vertical do rótulo de zona que a encima; uma tabela recuada dentro de uma
caixa recuada abre um degrau que nenhum fio explica. **Três:** ela **nunca** declara largura
mínima (`min-width: 0`) — envolve o texto em qualquer largura, e abaixo de 720px a caixa sangra
até as arestas da prancha com o recuo voltando só nas pontas, que é o que devolve à coluna de
observação os 32px que o recuo da prancha lhe tirava.

Aquela coluna é o **argumento do produto**, a explicação dos quatro zeros: com largura mínima
ela caía inteira fora da caixa de rolagem e ficava invisível no telefone. E envolver é a saída
certa em vez de `display: block`, que faria a tabela caber destruindo a semântica de tabela
para leitor de tela.

## Elevation & Depth

**O sistema é plano por dentro, e a única sombra que existe não é desenhada por ele.**

A janela tem `decorations: false` e `transparent: true`, e o cartão raiz preenche
exatamente os 360x480 de um `#root` com `overflow: hidden`. **Isso torna todo
`box-shadow` outset impossível aqui:** ele cai fora do único retângulo que existe e é
recortado antes de chegar à tela. Não é uma sombra discreta — é nenhuma sombra.

Quem separa a vidraça da área de trabalho é **o sistema operacional, a partir do alfa
da janela**: o macOS desenha a sombra de uma janela em camada com fundo transparente, e
no Windows é o DWM (com `cantos.rs` desligando o arredondamento próprio dele, para os
dois arcos não brigarem). No Linux depende do compositor, e é por isso que a **borda de
1px** (`border`) é a única separação garantida em todas as máquinas: ela é o contorno do
app, não um detalhe, e é o que sobra quando o sistema não desenha nada.

Uma sombra de verdade em CSS exigiria a janela do Tauri ser maior que o cartão, com a
folga sobrando de cada lado. São pixels que o orçamento de 360x480 não tem.

Dentro da janela não há uma única sombra. Profundidade é feita por **tom e por linha**:
`muted` como fundo para o que está ativo ou sob o cursor, e o `Separator` de 1px para
dividir o cromo da lista. Não há camadas, não há popover elevado, não há modal.

### Shadow Vocabulary

Vazio, e é a leitura certa: **não existe nenhuma sombra no CSS deste app.** O cartão
raiz leva `ring-0` para desligar o anel outset que o primitivo `Card` do shadcn traz —
ele também era recortado.

Registrado porque a versão anterior deste documento afirmava o contrário, e por muito
tempo: descrevia o `shadow-lg` do cartão como "a borda física do aplicativo contra a
área de trabalho" e um anel interno de `foreground/10` que "sustenta o contorno". Os
dois estavam no código, os dois eram recortados, e nenhum dos dois nunca apareceu.
**A pista que existia e não foi lida:** `scripts/vitrine/index.html` põe o `#root` num
viewport maior justamente para a sombra não sair cortada na captura — as fotos do README
mostravam uma separação que o app não desenhava. A sombra simulada mora lá agora, com o
motivo escrito ao lado dela.

### Named Rules

**A Regra da Sombra Externa.** Sombra é a borda do app contra a área de trabalho, não um
recurso de interface — e neste app ela é **do sistema operacional**, não do CSS. Nenhum
elemento dentro da janela projeta sombra, nem no hover, nem no foco, nem em elevação. Se
um componente novo parece precisar de sombra para se destacar, ele precisa é de `muted`
atrás dele. Corolário novo, e mecânico: **nenhum `box-shadow` outset funciona no cartão
raiz.** Se a separação da janela precisar de reforço algum dia, ela tem que ser desenhada
por dentro (`inset-ring`, `inset` shadow) ou a janela precisa crescer — e crescer custa
altura de lista.

### A Folha de Cotas

**Não existe um único `box-shadow` no CSS da folha** — verificável por busca em
`site/folha.css`: zero ocorrências de `shadow`, zero de `radius`. E, ao contrário do app,
aqui não é uma consequência técnica: nada recorta nada nesta página, sombra funcionaria
perfeitamente, e ela não está lá **por decisão**. Uma prancha de desenho não tem
profundidade; ela tem papel, fio e tinta.

**A única profundidade na tela é a sombra que o raster do espécime já carrega.** As capturas
`telas/janela-clara.png` e `telas/janela-escura.png` trazem a sombra que o sistema
operacional desenha sob a janela real — a mesma sombra que a seção d'A Vidraça descreve como
a borda física do app contra a área de trabalho. A folha não a desenha, ela a **fotografa**;
e é por isso que ela é a única, e por isso que ela é correta: é uma medida, não um efeito.

O resto da profundidade é **tom e linha**: película e prancha com um tom de diferença marcam
"mesa" e "papel", e o fio de 1px delimita. A folha tem hoje **uma** caixa de prancha sobre
película — a prancha, que guarda o espécime, a instalação e os números; a tabela de números
deixou de ser uma segunda caixa quando entrou nesta. A linha de comando é o caso inverso: uma
caixa de **película** sobre a prancha, um tom para dentro em vez de para fora — e a vidraça do
detalhe ampliado é a segunda do tipo, com película como fundo enquanto o recorte não chega. E as duas
faixas tintas (a citação de sistema e o aviso de celular) são o terceiro caso, que não gasta
tom nenhum: fundo em cota-fraca com um fio de 1px em cota à esquerda.

### Named Rules (A Folha de Cotas)

**A Regra da Sombra Fotografada.** A única sombra da folha é a que a captura do app já
contém. Nenhum elemento da página projeta sombra — não no repouso, não no hover, não no foco,
não em elevação. Corolário para trabalho futuro: se algo parece precisar de sombra para se
destacar, ele precisa é de **um tom** (a prancha sobre a película, ou a película sobre a
prancha) ou de **um fio**. Teste: `box-shadow` em `site/folha.css` é bug, e a busca é a
verificação.

## Shapes

Retângulos de cantos arredondados, e nada além disso. **Dentro da janela** não há
círculos (exceto a pílula do contador), não há formas orgânicas, não há recortes,
ilustração ou ornamento. A única geometria decorativa do app é a ausência dela.

A marca é o único círculo do produto, e ela vive **fora** da janela — no Dock, na
bandeja, na aba do navegador durante o desenvolvimento. Ver "A Marca".

O raio base é `0.625rem` (10px), e a escala inteira deriva dele por multiplicação —
`sm` a 0.6×, `md` a 0.8×, `lg` a 1×, `xl` a 1.4×.

- **Vidraça** (14px): o cartão raiz. O maior raio do sistema, e o único elemento que o usa.
- **Controles** (10px): botões de tamanho padrão e o campo de texto.
- **Elementos internos** (8px): linhas de tarefa, chips de aba, botões pequenos e ícones,
  faixa de aviso.
- **Checkbox** (4px): quadrado quase reto. Um raio maior o transformaria num botão de
  rádio à distância de 13px de texto.
- **Pílula** (`9999px`): exclusiva do contador de pendentes.

Bordas são sempre de 1px — não existe borda mais grossa em lugar nenhum. O anel de foco
é a única exceção: **2px sólidos** de `ring`, por fora da borda, sem deslocamento.

### Named Rules

**A Regra do Raio Decrescente.** Quanto menor o elemento, menor o raio: 14px na janela,
10px nos controles, 8px nas linhas e chips, 4px no checkbox. Um raio constante em
elementos de 480px e de 16px faria o pequeno parecer uma pastilha e o grande parecer
uma caixa.

### A Folha de Cotas

**Retângulos de canto reto, e nada além disso.** Não existe um `border-radius` no CSS da
folha, em nenhum valor, em nenhum elemento — nem no botão, nem na placa de tinta do sistema
escolhido, nem na caixa de comando, nem no anel de foco. O canto reto é a forma nativa de uma prancha de desenho: papel
tem canto, cota tem ponta, e um raio de 8px numa caixa de medida a faria parecer um cartão.

O vocabulário de forma é **linha, e a espessura dela informa**:

- **1px em fio** — moldura da prancha, divisor de zona, separador de lista, linhas da tabela.
- **1px em fio-forte** — o contorno do que se interage (linha de comando, botão de varredura,
  o contorno único do seletor e os fios entre os seus três botões) e o fio que fecha um rótulo
  de zona ou um cabeçalho de tabela.
- **1px em cota** — o desenho de anotação inteiro (o contorno do quadrado de 20x20 do balão,
  a linha de chamada, e o retângulo de realce sobre a região), o contorno do número de chamada
  escolhido, e as duas coisas que abrem uma faixa tinta: o fio à esquerda da citação de aviso
  do sistema e o do aviso de celular.
- **2px em tinta** — os dois fios estruturais da folha: a base do bloco de título e o topo
  do carimbo. Eles fecham o desenho.
- **2px em halo, sem raio, a 2px de distância** — o anel de foco, idêntico ao do app.

As setas das chamadas (e as do diagrama de ciclo) são **polígonos preenchidos** de três
pontos, desenhados à mão no SVG, e não `marker-end`: um marcador escala com a espessura do
traço e a ponta engorda quando o fio é 1px.

**O balão de chamada é um quadrado de 20x20 sem raio**, e isso não é uma escolha de estilo
dentro da Regra do Canto Reto — é a regra sendo obedecida no lugar onde ela é mais fácil de
furar. Balão de chamada é redondo em quase todo software de anotação, e um círculo aqui seria
a única curva de uma folha que não tem nenhuma. O quadrado ainda ganha uma coisa: ele repete
a forma do contorno do número na lista, então a lista e o palco se leem como o mesmo objeto
visto duas vezes.

### Named Rules (A Folha de Cotas)

**A Regra do Canto Reto.** Nenhum elemento da folha tem raio. Não há exceção de tamanho, de
componente nem de estado, e o anel de foco também é reto. Teste: um `border-radius` computado
diferente de `0` nesta página é bug. (Nos dois mundos a lei é oposta e as duas estão certas:
a janela é um objeto de interface e arredonda por isso; a folha é papel.)

## A Marca

**Um anel branco de fio fino num campo preto.** É a única forma da identidade — não
há logotipo escrito, monograma, nem símbolo derivado de tarefa (nenhum check, nenhuma
lista, nenhuma prancheta). O nome já está escrito na barra de título, no tooltip da
bandeja e no README; a marca não precisa repeti-lo.

A geometria canônica mora em `assets/marca/nocom.svg`, e todo raster empacotado sai de
`scripts/marca.mjs`. **A folha de especificação é `assets/marca/especificacao.html`** —
abra no navegador para ver a marca em todos os tamanhos reais, ampliada na grade de
pixel, e a silhueta da barra de menus. Ela é **gerada** (`npm run marca:folha`) do mesmo
desenho que produz os ícones, e por isso não pode divergir deles: uma folha escrita à mão
empata na primeira mudança de fração e depois mente com confiança, que é pior que não
existir — alguém vai medir por ela.

Duas frações, ambas relativas ao lado do **campo** (o retângulo preto visível, que no
macOS é menor que o canvas):

- **Diâmetro externo do anel: `0.62 × campo`.** Um anel de fio fino precisa de
  circunferência para ter peso visual; um círculo pequeno com traço fino é timidez
  duas vezes. 62% é grande o bastante para o anel ser a forma do ícone, e pequeno o
  bastante para o preto ao redor continuar sendo a maior parte do desenho.
- **Traço: `campo / 64`.** Dá ~40:1 de diâmetro por traço, que é o que "bem fino"
  significa em número.

### O campo tem duas formas, uma por plataforma

- **macOS:** a squircle do sistema, **medida** em ícones do próprio macOS (Automator,
  Calculator, App Store — todos idênticos): arte de 824×824 num canvas de 1024
  (80,47%) e superelipse de expoente **5,07**. Não é um `rx` de retângulo
  arredondado: um arco simples de raio constante se lê como forma errada ao lado dos
  vizinhos no Dock, que é onde o ícone é sempre visto em companhia.
- **Windows e Linux:** o preto sangra até a borda do quadrado, sem respiro e sem
  arredondamento, que é a convenção desses sistemas.

### Preto puro, e não a superfície escura do app

O campo é `#000000` e o anel é `#ffffff` — os dois com croma `0`, então a Regra do
Pigmento Único continua valendo sem exceção nova. Mas repare que **não** é o
`background` escuro da janela (`oklch(0.145 0 0)`, um quase-preto): um ícone não é uma
superfície de interface. Ele é visto sobre papel de parede arbitrário, em miniatura, no
meio de dezenas de vizinhos coloridos, e ali o quase-preto se lê como cinza-escuro
indeciso. A janela tem o luxo de ser discreta porque ela já está na frente de tudo; a
marca precisa se afirmar em 32px contra uma fotografia.

### Named Rules

**A Regra do Traço Calibrado por Tamanho.** Uma fração é uma intenção, não um pixel.
`campo / 64` dá 16px em 1024 e **0,25px em 16** — e 0,25px não é um fio fino, é um fio
cinza: o antialias reparte a tinta entre dois pixels e nenhum dos dois fica branco.
Por isso cada tamanho é **desenhado no seu próprio tamanho**, nunca reduzido do maior,
com traço de pelo menos 1px inteiro e raio travado na grade de pixel até 64px. A
consequência é deliberada: **em tamanho pequeno o anel é proporcionalmente mais grosso**.
Ícone pequeno pede traço mais pesado, e a alternativa não é um anel mais fino — é
nenhum anel.

**A Regra da Cobertura em Luz Linear.** A mistura de branco com preto acontece em luz
linear, e só depois é codificada para sRGB (`sRGB()` em `scripts/marca.mjs`). Num anel
de fio fino quase todo pixel da curva é um pixel parcialmente coberto, então o erro de
compor em sRGB não fica nas beiradas: ele **encolhe o traço inteiro**. Meia cobertura
gravada como 128 é 21% de luz onde deveriam estar 50%, e o resultado é um anel mais
fino e mais apagado do que a fração pediu.

**A Regra da Silhueta na Barra de Menus.** Na barra de menus do macOS o ícone é
silhueta: `icon_as_template(true)` descarta a cor e usa **só o canal alfa** para o
sistema pintar a forma na tinta certa de cada tema. O alfa do ícone do app é o campo
inteiro, opaco de ponta a ponta — usá-lo ali mostraria um **retângulo cheio**, com o
anel sumido dentro dele. Então a bandeja do Mac recebe o anel **sozinho**, desenhado em
`src-tauri/src/marca.rs`: 36×36 (que é @2x dos 18pt que o `tray-icon` impõe), traço de
1,5pt — a espessura dos ícones que a Apple põe nessa barra, que é a vizinhança contra a
qual este desenho é julgado, e não os 40:1 do ícone do app. Windows e Linux continuam
com o ícone do app, porque lá a bandeja desenha com as cores do arquivo e o campo preto
é justamente o que dá contraste próprio ao anel.

**A Regra do Desenho que se Confere a Olho.** As duas metades da marca têm saída de
inspeção, e é obrigação de quem mexer nas frações usá-la: `node scripts/marca.mjs
--contato f.png` amplia cada tamanho pequeno nas duas formas de campo, e o teste
`grava_a_silhueta_para_conferencia` em `marca.rs` grava a silhueta da bandeja. Os
defeitos desta classe de desenho — anel pontilhado, traço cinza, squircle bojuda —
passam por qualquer asserção pontual, são invisíveis em tamanho real e óbvios
ampliados.

## Components

O caráter é **discreto e preciso**: quase invisíveis em repouso, revelando-se quando a
mão chega perto. `ghost` é o único variante de botão que o app usa de verdade — não há
um único botão preenchido na interface. A qualidade está no ajuste do alvo, não na
aparência.

### Buttons
- **Shape:** 10px no tamanho padrão, 8px nos tamanhos `xs` e `icon-xs` (24px).
- **Ghost (o padrão real do app):** sem fundo e sem borda em repouso; fundo `muted` no
  hover. Usado em absolutamente todos os botões da interface — fechar janela, nova aba,
  remover tarefa, desfazer, limpar concluídas.
- **Hover / Focus:** `transition-all`; foco visível como **anel sólido de 2px** em `ring`.
  Um indicador só, igual em todos os controles — o par "borda trocada + halo difuso" do
  preset dividia o sinal em duas partes fracas, e nenhuma das duas alcançava 3:1.
- **Active:** `translate-y-px` — um pixel de afundamento, a única resposta física do sistema.
- **Disabled:** `opacity-50` e ponteiro desativado. É o estado permanente do
  "Limpar concluídas" enquanto não há nada concluído.
- **Preenchido / destrutivo:** existem no primitivo, **não são usados**. Não introduza
  um botão preenchido sem revisar a Regra do Pigmento Único.

### Inputs / Fields
- **Style:** fundo transparente sobre a superfície, borda de 1px em `input`, raio de
  10px, altura de 32px, texto de 13px. O campo de nova tarefa é o único elemento
  permanentemente presente que aceita digitação.
- **Focus:** anel sólido de 2px em `ring`, por fora da borda. A borda em repouso é
  `control-border`, distinta o bastante do anel para que o estado de foco se leia.
- **Seleção de texto:** `input` e `textarea` são os **únicos** elementos selecionáveis
  da janela inteira, e os únicos com cursor de texto. O resto usa `user-select: none`
  porque arrastar a janela e selecionar texto disputam o mesmo movimento do mouse.

### Campo de nova tarefa — o contador dos últimos 20
- Nos últimos 20 caracteres do limite, e **só** neles, aparece a conta do que resta:
  `text-micro`, cinza, `tabular-nums`, dentro do campo à direita. Chega a zero exatamente
  quando o campo para de aceitar.
- **A régua é ponto de código, não `maxLength` (Adendo 12).** O atributo conta unidades
  UTF-16 — um emoji valia 2, o campo parava antes do limite do contrato e o contador
  mentia por fator 2. O corte vive no `onChange` (`clampLength`), com a mesma régua do
  `chars().count()` do backend, nos dois campos (novo e edição inline).
- **Por que existe:** o truncamento era em silêncio. Colar um parágrafo punha 200
  caracteres no campo e jogava o resto fora sem sinal nenhum — o usuário só descobria lendo
  a tarefa depois. Um corte de colagem (mais de um caractere) agora avisa na faixa, sem
  atropelar erro nem desfazer que estejam nela. Fora dos últimos 20 o contador seria
  mobília, e mobília não ocupa o campo mais usado do app.
- `aria-hidden`: um número solto seria informação sem unidade para leitor de tela; o corte
  que importa (colar) é anunciado pela faixa, que é `role="status"`.

### Chips (abas)
- **Style:** 24px de altura, raio de 8px, máximo de 8.5rem de largura, texto de 12px,
  truncado com reticências e nome inteiro no `title`.
- **State:** inativa é `muted-foreground` sem fundo, com `muted/50` no hover; ativa é
  fundo `muted`, texto `foreground` e peso 500. `transition-colors`.
- **Fechar:** sempre visível na aba ativa (a 70% de opacidade); nas demais, só no hover
  ou no foco de teclado. Escondido por completo quando existe uma aba só.
- **Fechar — tom e raio.** O hover é `foreground/10`, e não o `background` da janela: este
  `×` mora dentro de um chip que já é `muted`, que é o caso exato da Regra do Destaque que
  Sobrevive ao Fundo. O `background` também é a **superfície errada** — a superfície aqui é
  o `card` —, e os dois só coincidem no tema claro: no escuro o `background` é mais escuro
  que o cartão, então o mesmo hover clareava num tema e escurecia no outro. O raio é o do
  **checkbox** (4px) e não os 8px dos botões de ícone: os 8px são dimensionados para uma
  caixa de 24px, e nos 16px desenhados deste `×` eles consomem metade da caixa e o transformam
  num círculo — o mesmo motivo que mantém o checkbox em 4px.
- **Alvo:** o botão do nome ocupa a **altura inteira** do chip (24px). O `×` é desenhado
  com **16px** e alcança 24×24 por pseudo-elemento — o mesmo recurso do checkbox. Inflar
  a caixa desenhada para 24px fazia o fundo do hover cobrir a altura toda da aba, e o `×`
  virava um bloco em vez de um botão.
- **Semântica:** `role="group"`, deliberadamente **não** `role="tablist"` — o padrão
  ARIA de abas promete navegação por setas e painel associado, e prometer sem cumprir é
  pior para leitor de tela do que um grupo honesto de botões.

### Faixa de abas — transbordo
- **A faixa esmaece na beirada por onde ela continua.** 20px de `mask-image`, no lado que
  transborda (ou nos dois). Não é sombra nem borda: é a própria tinta do chip se apagando,
  então não gasta cor, não gasta um pixel de altura e funciona igual nos dois temas sem
  token novo.
- **Por que existe:** a barra de rolagem foi tirada por razão de layout (numa faixa de 28px
  ela comeria a altura do texto do chip), e com ela foi embora a única pista de que existem
  mais abas do que as visíveis. Com três ou quatro nomes longos, as outras respondem por
  atalho e por clique e não apareciam em lugar nenhum. Um chip cortado ao meio pelo degradê
  é exatamente a leitura desejada.
- CSS não sabe medir transbordo: `data-overflow` é escrito pelo JS (scroll, troca de aba,
  `ResizeObserver`), e a **ausência** do atributo é o caso comum — cabe tudo, nada é
  mascarado.

### Cards / Containers
- **Uso:** existe **um** cartão no app inteiro, e ele é a janela. Raio de 14px, fundo
  `card`, borda de 1px, anel interno de `foreground/10`, sombra externa,
  `overflow-hidden`. O padding vertical padrão do primitivo é zerado (`gap-0 py-0`) —
  o espaçamento de 16px do shadcn é largo demais para 360x480.

### Checkbox
- **Style:** 16px, raio de 4px, borda de 1px. Marcado, preenche com `primary` e mostra
  o check em `primary-foreground` — o único preenchimento sólido do sistema.
- **Marcar é o momento autoral do app, e é desenhado.** O fundo atravessa para `primary`
  em 150ms e, 30ms depois, o check **se risca**: `stroke-dasharray: 24 24` com o
  `stroke-dashoffset` indo de `-24` a `0` em 160ms. O sinal negativo é a decisão — ele
  faz o traço nascer na ponta do braço curto, descer até o canto e subir até a ponta
  alta, que é a ordem em que uma mão desenha um check. Positivo, a marca cresce ao
  contrário e o braço curto aparece nos últimos 15%, num piparote.
- **Desmarcar é assimétrico de propósito:** 75ms, o indicador desmonta na hora e não há
  desenho nenhum. Marcar é afirmação; desmarcar é correção, e correção não tem cerimônia.
- **Área de clique:** expandida por pseudo-elemento muito além do desenho, e **medida pela
  linha**: a altura inteira da linha (uma ou duas alturas de texto), 8px à esquerda até a
  borda interna do cartão, 44px de largura total — terminando 12px depois do quadrado.
  **Para na direita de propósito:** avançar mais comeria o título e roubaria o duplo clique
  de editar. Ver a Regra do Alvo Medido pela Linha.

### Lista de tarefas (componente-assinatura)
- **Linha:** raio de 8px, padding de 8px, `hover:bg-muted/60`. Sem borda, sem separador
  entre linhas — 2px de intervalo bastam.
- **Divisão de gestos:** o checkbox alterna, o **duplo clique no título** edita, o × remove.
  Três gestos, três alvos, sem sobreposição.
- **Ordem de exibição:** pendentes primeiro, concluídas depois, cada grupo por data de
  criação. É regra de exibição, aplicada só na borda da renderização.
- **Movimento — viajar.** Marcar uma tarefa a manda para o fim da lista, e ela
  **desliza** 180ms até o novo lugar em vez de saltar (FLIP: `offsetTop` antes do
  reflow, `translateY` depois). Vale igual para o buraco que uma remoção deixa: as
  linhas de baixo sobem deslizando. **Com 70ms de atraso**, para a viagem se ler como
  consequência da tinta e não como parte dela — ver a Regra da Batida em Três Tempos.
  Sob `prefers-reduced-motion` a linha troca de posição sem animação.
- **Movimento — chegar.** Uma linha que **passa a existir** não viaja de lugar nenhum:
  ela chega, com os mesmos 150ms de tudo que passa a ocupar a área da lista. Nunca as
  duas coisas na mesma linha no mesmo instante.

### Data no título (pílula e coluna da direita)

Uma tarefa escrita como "pagar boleto 20/08" mostra `20/08` **numa pílula, alinhada à
direita da linha** — o texto fica à esquerda, a data numa coluna própria. É o único
elemento do app que nasce do texto que a pessoa digitou. O comportamento normativo
(formato aceito, as condições da extração, a ordem de dia e mês, a virada da meia-noite)
está no Adendo 11 do `CONTRACT.md`; aqui está só a forma.

**Toda data é destacada; só a de hoje muda de cor.**

- **Cinza** (`foreground/10`, croma `0`) para qualquer data. Diz "aqui tem uma data" e
  nada mais.
- **Vermelho pastel** (`today`) no dia. É o segundo e último valor cromático do app —
  ver a Regra do Pigmento Único, que foi reaberta para caber isto.

**O que o olho compara não é a pílula contra o fundo, é uma pílula contra as outras da
mesma lista.** É o que permite ao vermelho ser fraco: matiz contra ausência de matiz é a
diferença mais fácil que existe de ver, e numa coluna de pílulas cinzas uma pastel salta
sem precisar de saturação. Foi essa leitura que fixou o croma em `0.045` em vez de subir
até brigar com a faixa de erro.

**A cor nunca é o único sinal.** A pílula já está lá em cinza, e o peso 500 é o mesmo nas
duas; quem não distingue vermelho de cinza continua vendo uma data destacada, e perde só
o "é hoje" — que o leitor de tela recebe por escrito. Cor carregando informação sozinha
seria falha de acessibilidade, não decisão de estilo.

**A coluna da direita:**

- **Entre o título e o `×`, nunca no lugar dele.** O botão de remover já ocupa largura
  fixa em repouso (só troca de opacidade), então a data entra ao lado sem que nada ande
  quando o mouse chega — a Regra do Movimento que se Paga proíbe layout que se mexe no
  hover.
- **`shrink-0` contra o título em `min-w-0 flex-1`.** Quem cede largura é o texto, que já
  sabe se truncar em duas linhas. A data nunca quebra nem encolhe: uma data pela metade
  não é uma data. Custo máximo de largura: `21/08/2026` em `tabular-nums` de 13px.
- **`tabular-nums`.** Empilhadas numa coluna, datas com dígitos de larguras diferentes
  ficam com as barras desalinhadas. É a Regra do Número Tabular aplicada ao único lugar
  novo onde números se empilham.
- **Custo de altura: zero.** A pílula mora dentro de uma linha que já existia, e a coluna
  usa largura que o título cedeu — nada foi empurrado para fora da dobra.

**A extração é conservadora, e o que não é extraído fica inline com a mesma pílula.** Três
condições: uma única data no título, terminando no fim do texto, com texto antes dela.
"de 19/10 a 25/10" mantém as duas datas no lugar, porque levar a última para a direita
deixaria "de 19/10 a" pendurado; "reunião 19/10 com o time" também, porque a data
qualifica o que está ao lado dela. **Mover nunca pode virar apagar** — é o que mantém o
texto da linha igual ao texto que o editor inline abre no duplo clique.

**Detalhes que se pagam:**

- **`<mark>`, e não `<span>`.** É o elemento que quer dizer "trecho realçado por ser
  relevante agora". Os dois padrões do navegador (fundo amarelo, texto preto) são
  substituídos — sem isso `mark` traria uma terceira cor para um app que tem uma.
- **`rounded-sm` (6px)** contra os 8px da linha, pela Regra do Raio Decrescente. Padding
  lateral de 4px e nenhum vertical: a pílula não pode engordar a linha, ou uma tarefa com
  data mediria diferente de uma sem e a lista ganharia um degrau.
- **`box-decoration-clone`** para a pílula inline, que pode cair na quebra entre as duas
  linhas do título; sem isso ela ficaria com padding só nas pontas de fora.
- **Concluída não destaca e não extrai.** Pela Regra do Desbotamento, resolvido é estado
  com menos contraste. E extrair no instante do clique faria o título mudar de forma
  debaixo do olho de quem acabou de marcar — a Regra da Batida em Três Tempos já cuida de
  não empilhar consequências nesse gesto.
- **Não se anima.** Aparece com a linha e troca de cor à meia-noite, quando ninguém está
  olhando.

### Edição inline
- Um campo de 24px de altura substitui o texto **no lugar dele** — mesma linha, mesma
  posição, sem diálogo. `Enter` confirma, `Escape` cancela, blur confirma, e o texto
  chega inteiramente selecionado (na montagem do campo, não no `onFocus` — o `onFocus`
  perdia a seleção no remonte do StrictMode).
- **Forma:** raio de 8px e anel de foco **por dentro** (`ring-inset`), não 10px com anel
  por fora. Um editor que substitui algo no lugar não pode ocupar mais espaço nem ter
  forma diferente do que substituiu: 10px numa caixa de 24px consomem 83% da altura em
  curva, e o editor ficava mais redondo que o chip que ele cobre.
- **Abre por duplo clique ou por `F2`.** O `F2` é o duplo clique do teclado, e vale tanto
  na linha de tarefa quanto no chip de aba. Sem ele, renomear seria gesto exclusivo de
  mouse. Na tarefa o handler fica na linha, não no título: assim funciona com o foco no
  checkbox ou no botão de remover, sem acrescentar uma terceira parada de tabulação. É o mesmo componente para tarefa e para aba: dois padrões de edição
  no mesmo app seriam dois padrões a aprender.

### Faixa de aviso
- Erro, desfazer e a dica de primeira execução compartilham uma faixa condicional acima
  da lista, com raio de 8px e texto de 12px. Erro é `destructive` sobre
  `destructive/10`; desfazer e dica são `muted-foreground` sobre `muted`. Todos se
  dispensam sozinhos em 6 segundos e trazem um × de dispensa manual.
- **O erro traz um botão "Detalhes"** (`aria-expanded`) que abre a frase crua do backend
  dentro da própria faixa, em `text-micro` com `line-clamp-4` (visual — o texto inteiro
  fica no DOM para leitor de tela, e continua no `title`). O `title` era o único canal do
  detalhe, e `title` é mouse-only: teclado e leitor de tela não alcançavam nem o caminho
  do arquivo resgatado (Adendo 12).
- **O botão "Desfazer" anuncia `⌘Z`/`Ctrl+Z` no `title`** — a tecla aciona o desfazer
  enquanto a oferta está na faixa, fora de edição inline e do painel. Passada a oferta,
  `⌘Z` volta a ser o desfazer de texto de quem tem o foco.
- **Uma faixa, um ocupante, e a ordem de prioridade é fixa:** um erro nunca é substituído
  por uma dica. Quem chega para ensinar cede a vez a quem chega para avisar que algo
  falhou, e a dica se perde em silêncio — o estado vazio acabou de dizer a mesma coisa
  com mais espaço.
- **Ela cresce e encolhe, não pisca.** É a única coisa que muda o layout da janela sem
  ninguém ter pedido: aparece tomando ~28px da lista e devolve os 28px seis segundos
  depois, sozinha. `grid-template-rows: 0fr → 1fr` (a altura de destino varia — o erro
  vai de uma a três linhas), 200ms para entrar e 150ms para sair. Fechada mede
  exatamente 0 e é `inert`: o texto continua montado só para poder encolher, e não pode
  sobrar na ordem de tabulação nem na árvore de acessibilidade.

### Estados vazios (são dois)
A lista vazia é o único lugar da janela com espaço de sobra, e o único que pode gastar
os 24px de respiro que o resto da interface não tem. **São dois estados, e a diferença
não é cosmética: eles falam com pessoas que sabem coisas diferentes.**

- **Primeira execução** (nunca acrescentou tarefa nesta máquina): ensina as **duas vias
  de volta** — o atalho global e o ícone da bandeja, este último escrito na palavra que
  o sistema usa para o lugar ("barra de menus" no Mac, "área de notificação" fora dele).
  Três frases, hierarquizadas por peso e por cinza: a instrução de acrescentar em névoa
  (o cursor já está piscando no campo e o campo convida sozinho), o atalho em tinta e
  peso 500, o ícone em névoa. `text-balance` nas três — sem ele o português quebra com
  "Enter." órfão e pendura a preposição "de" no fim da linha.
- **Depois** (limpou a lista, ou criou uma aba): toque leve. "Nada por aqui." e só o
  atalho. Repetir "escreva acima e aperte Enter" para quem já acrescentou antes é
  explicar o óbvio, mas a via de volta continua valendo a repetição — é ela que se perde
  quando a janela se esconde.

**E cada um tem uma segunda forma, para o atalho morto (Adendo 12).** Com
`Descricao.active: false` — o sistema recusou o registro — ensinar a tecla em tinta e
peso 500 seria ensinar a instrução que falha no primeiro Escape. A hierarquia inverte:
a via em tinta passa a ser o ícone da bandeja, e a frase em névoa diz que a combinação
está ocupada e aponta a engrenagem. A faixa da primeira tarefa e o rodapé seguem a
mesma regra: **nenhuma superfície anuncia uma tecla que não faz nada.** No rodapé vale
o inverso também — em "Tudo em dia", com o atalho vivo, a frase pendura a combinação
("Tudo em dia — ⌃⌥T esconde"): o único lugar permanente onde ela fica legível depois
dos 6 segundos da faixa, a custo zero de altura.

### Menu de contexto da tarefa (a única superfície flutuante do app)

O clique direito numa linha abre um menu (Adendo 13) com os gestos sobre a tarefa que
não merecem botão permanente: **Mover para** (as outras abas) e **Repetir** (nunca /
todo dia / toda semana / todo mês) — e é o lugar canônico das opções futuras dessa
classe. Ele é a **exceção declarada** à Regra da Vista que Troca, com o argumento
inteiro: aparece sob o cursor por gesto explícito, some ao primeiro clique fora, e
custa zero de altura permanente — que é exatamente o que a regra protege. Pelo
teclado, `Shift+F10` (ou a tecla de menu) com o foco na linha abre o mesmo menu, de
graça, porque é o gesto nativo do navegador.

- **Separação por tom e traço, nunca sombra**: fundo `card`, fio de 1px em `border`,
  item realçado em `muted` — a mesma lei de profundidade do resto do app.
- **Escolhido é croma 0.** O check do período escolhido é tinta, não vermelho: estado
  não é alarme (Regra do Pigmento Único).
- **"Mover para" desabilita com uma aba só**, em vez de sumir: um menu que muda de
  tamanho conforme o estado ensina a procurar opções que não estão lá. Os nomes de aba
  no submenu truncam com o texto inteiro alcançável — a Regra do Texto que Não Vaza
  vale na superfície nova.
- **Linha otimista não abre menu**: não dá para mover nem repetir o que o backend
  ainda não confirmou.
- **O glifo da recorrência na linha** (↻ de 12px, em névoa) é a única marca permanente
  de que a tarefa volta sozinha — metadado, não alarme, e por isso névoa e não tinta.
  Ele fica visível também na concluída, porque é ali que responde a pergunta que a
  linha riscada levanta ("acabou?" — não: volta). A frase do período vive no `title` e
  no `aria-label`.

### Painel de configurações (a única troca de vista do app)
O painel da engrenagem guarda os quatro assuntos que não são sobre a lista (Adendos 9,
10 e 13): o atalho global, o início com o sistema, os dados (exportar/importar) e a
versão. Ele **entra no lugar da lista**, e não por cima dela.

- **Não é camada.** Não há modal, popover nem sombra interna neste sistema, e uma janela
  de 360x480 não tem espaço para uma segunda superfície flutuando dentro da primeira. O
  painel ocupa a área elástica — a mesma que os dois estados vazios ocupam — com a mesma
  animação `arrive`, e por isso não gasta um pixel de altura permanente.
- **Entrada pela engrenagem no cabeçalho**, ao lado do botão de esconder: é o mesmo
  assunto, as duas teclas que fazem a janela ir e voltar. `aria-expanded`, porque
  alterna vista em vez de levar para outro lugar; o `ghost` já pinta `muted` aberto.
- **O capturador herda a forma do campo de nova tarefa** — 32px, `rounded-lg`, borda de
  controle — porque é o mesmo tipo de coisa: o lugar onde se põe algo dentro. Capturando,
  o fundo vira `muted` e a borda vira `ring`: é o "estou ouvindo" feito com tom e linha,
  como a Regra da Sombra Externa exige.
- **Prévia dos modificadores enquanto a tecla principal não chega** (`⌃⌥…`). Sem ela o
  campo fica parado dizendo "aperte as teclas" com a mão já em cima do teclado, e a
  dúvida de "ele está me ouvindo?" é o que faz alguém desistir de um capturador.
- **A captura precisa estar armada para salvar.** Um combo que fecha a menos de 300ms
  de uma armada pelo teclado é reflexo (`⌘C`, `⌘W`), não escolha: é engolido, a captura
  fica de pé e repetir a tecla com o modificador seguro salva. O clique no capturador
  salva de primeira — clicar é intenção explícita.
- **Uma linha de resposta, reservada.** Aceita, já tomada por outro aplicativo, sem
  modificador, ou "vale agora e não na próxima abertura": as quatro são a mesma linha de
  11px embaixo do campo, `destructive` quando é recusa e névoa quando não é. A altura
  dela é reservada mesmo vazia — uma linha que nasce empurra o resto do painel para
  baixo no instante em que a pessoa está lendo o que aconteceu.
- **"Restaurar padrão" só existe quando há o que restaurar.** Um botão que não faz nada
  é mobília, e esta janela não tem espaço para mobília.
- **As seções novas falam a mesma língua do atalho** (Adendo 13): rótulo de 12px em
  peso 500, explicação de 11px em névoa, separador de linha entre assuntos, e uma linha
  de resposta por seção — `destructive` na recusa, névoa no resto, com o detalhe cru
  (caminho de arquivo, frase do backend) no `title`.
- **O interruptor de iniciar com o sistema desabilita até a leitura chegar**: um
  interruptor mostrando estado chutado é pior que um que espera. O `label` envolve o
  texto inteiro — alvo maior que o desenho, sem pseudo-elemento.
- **Cancelar um diálogo de arquivo é silêncio.** A pessoa desistiu; não falhou nada, e
  não há frase a mostrar. A frase do desfecho da importação diz quantos ENTRARAM
  ("Importado: 3 tarefas novas, 1 aba nova"), porque entrar é a única coisa que uma
  importação faz — remover, nunca.

### Named Rules

**A Regra da Volta que Sobrevive ao Estado Vazio.** O estado vazio é o melhor lugar do
app para ensinar as vias de volta e o pior lugar para deixá-las: ele desaparece na
primeira tarefa, que é exatamente o gesto anterior ao primeiro `Escape`. Por isso o
ensino tem **duas etapas**, e a segunda existe só para atravessar esse instante: a faixa
de aviso repete o atalho uma vez, quando a primeira tarefa entra. Qualquer instrução
futura que viva no estado vazio herda o mesmo problema e precisa da mesma passagem de
bastão.

**A Regra do Que o App Já Sabe.** Nada é ensinado duas vezes. O que a interface já
ensinou fica gravado (`localStorage`, não `todos.json` — é estado da tela, não do
produto, e não vale reabrir o contrato por ele), e quem atualiza o app de uma versão
anterior é reconhecido pelo uso que já tem: tarefa em disco ou mais de uma aba encerram
o assunto. Uma atualização que se apresentasse como instalação nova explicaria o app a
quem já tem o hábito.

**A Regra da Vista que Troca em Vez de Empilhar.** Uma superfície nova não sobe por cima
da interface: ela ocupa a área da lista, que é a única elástica, e sai quando termina.
Modal, popover e sombra interna não existem neste sistema — e o custo de altura de uma
faixa a mais é o orçamento inteiro. **A exceção declarada é o menu de contexto** (Adendo
13), e ela não abre a porta para as outras: um menu de contexto aparece sob o cursor por
gesto explícito, some ao primeiro clique fora e custa zero de altura permanente — os
três motivos da regra, atendidos por outra forma. Um modal ou um popover ancorado em
botão continua proibido, porque nenhum dos dois passa nesse teste. Enquanto uma vista dessas está aberta, ela é a camada
de fora do teclado: o `Escape` é dela, e os atalhos da vista que ela cobriu ficam
desligados (`⌘T` não pode criar uma aba enquanto a pessoa está dizendo que quer usar
`⌘T`). **E a regra vale para o mouse tanto quanto para o teclado**: o campo de nova
tarefa e a faixa de abas ficam `inert` enquanto o painel está aberto — clicar numa aba
com a lista fora da tela dispararia undo e aviso sobre conteúdo que ninguém está vendo.

**Desligar atalho não basta — o que MUTA fica inerte.** A regra valia pela metade: as teclas
de aba eram desligadas, mas o campo de nova tarefa continuava alcançável por `Tab` e o
"Limpar concluídas" por clique, então dava para acrescentar e apagar tarefas numa lista fora
da tela, com o resultado invisível. Agora a banda do campo recebe `inert` e o botão do rodapé
fica desabilitado enquanto a vista está aberta. O teste para uma vista nova: **todo controle
que grava fora dela precisa parar de responder, não só de ouvir teclas.**

O que **não** fica inerte, e por quê: a faixa de abas continua clicável (trocar de aba muda o
que está atrás da vista, mas o chip ativo se acende — o resultado é visível, e nada é
gravado), e o rodapé inteiro também não, porque ele é região de arrasto da janela e carrega a
região viva do contador. Daí o `disabled` no botão em vez de `inert` na faixa: perder o
arrasto de metade da janela cada vez que o painel abrisse seria trocar um defeito por outro.

**Sair da vista devolve o cursor ao campo.** Toda saída, e num lugar só — um efeito que
observa a vista fechar, e não uma chamada em cada handler. Com uma chamada por saída, o botão
"Concluir" devolvia o foco e o `Escape` e a engrenagem não: o painel desmontava com o foco no
capturador, ele caía no `body`, e as teclas seguintes não iam a lugar nenhum. Numa janela cujo
ciclo é `⌃⌥T → digitar → Enter`, uma vista que sai deixando o teclado sem destino quebra o
gesto **seguinte**, que é o mais difícil de atribuir à causa.

**A Regra do Destaque que Sobrevive ao Fundo.** Um destaque desenhado **dentro** de um
elemento que também se destaca precisa ser medido contra o estado mais forte do
hospedeiro, e não contra a superfície em repouso. `muted` é o recurso de destaque do
sistema, e por isso mesmo ele não pode destacar nada que viva numa linha que já vira
`muted/60` sob o cursor — o destaque desapareceria no exato instante em que a pessoa
levou o olho até lá. A saída é subir a **densidade** (`foreground/10`), e não alcançar a
matiz: cinza mais denso resolve o destaque, e matiz é um recurso que a Regra do Pigmento
Único racionou para outra coisa. A pílula de hoje é vermelha por **significar** hoje, e
não por precisar aparecer — os dois problemas são separados, e confundi-los é como uma
paleta cresce sem ninguém decidir que ela ia crescer. Teste: passe o mouse por cima. Se o
destaque sumiu, ele estava desenhado contra o fundo errado — e a correção é densidade.

**A Regra da Revelação com Teclado.** Todo controle que se esconde em repouso **deve**
reaparecer tanto no `hover` quanto no `focus-visible`. Esconder é permitido; tornar
exclusivo de mouse, nunca. Vale para o × de remover tarefa e para o × de fechar aba, e
vale para qualquer controle futuro que use o mesmo padrão.

**A Regra do Alvo Maior que o Desenho.** O tamanho visível de um controle nunca é maior
que a sua área de clique — no mínimo os dois coincidem, e onde dá, o alvo cresce por
baixo. Piso de 24×24 em todo controle. Numa janela de 360px com linhas de 36px, o desenho fica
pequeno e o alvo cresce por baixo — mas nunca a ponto de invadir o alvo vizinho.

**A Regra de Um Gesto, Um Alvo.** Nenhuma região responde a dois gestos concorrentes.
O título já foi uma `label` ligada ao checkbox, e o duplo clique para editar disparava
duas gravações no disco por edição. Alternar é do checkbox, editar é do título.

**A Regra do Movimento que se Paga.** Só três coisas se animam neste app, e todas pelo
mesmo motivo: **elas se mexem sozinhas**. A tinta que assenta no checkbox, a linha que
muda de lugar por causa dela, e a faixa de aviso que toma e devolve altura da lista sem
ninguém ter tocado em nada. Tudo o mais aparece seco. O ciclo do produto é `⌃⌥T →
digitar → Enter → ⌃⌥T`, dezenas de vezes por dia: movimento no caminho de abrir a
janela, de trocar de aba ou de dar foco a um campo não é acabamento, é latência com
outro nome. Nada passa de 200ms; a saída é sempre mais curta que a entrada.

**A Regra do Vocabulário de Chegada.** Tudo que passa a ocupar a área da lista chega do
mesmo jeito — 150ms, opacidade mais 4px de subida (`arrive`). Uma linha nova, a lista
inteira ao trocar de aba, as tarefas que o desfazer repõe, os dois estados vazios. A
lista é a única região do app onde o conteúdo troca de identidade, e três formas
diferentes de aparecer nela seriam três coisas a aprender numa janela que não ensina
nada. Corolário: uma linha ou **chega** ou **viaja**, nunca as duas.

**A Regra da Batida em Três Tempos.** Concluir uma tarefa é um gesto e três
consequências — o check se desenha, o título desbota, a linha vai para o fim da lista.
As três no mesmo instante viram uma só, e a linha sai debaixo do olho no meio do gesto
que a marcou. Por isso o desbotamento acompanha a tinta (150ms, a mesma frase dita em
dois lugares) e a viagem entra **70ms depois**: tempo curto demais para se ler como
espera, longo o bastante para se ler como consequência.

**A Regra da Chegada que Sobrevive à Troca de Id.** Uma linha otimista troca de id
quando o backend responde, e o `key` do React troca junto — o `<li>` não é atualizado, é
destruído e refeito. Medido: a chegada morria no meio e a linha definitiva aparecia
seca. Quem anima por identidade de nó neste app precisa passar o estado adiante junto
com o id (`carryOver` em `useFlipRows`), ou a animação some exatamente no gesto mais
frequente que existe aqui.

**A Regra do Movimento Reduzido é Menos, Não Nada.** Sob `prefers-reduced-motion` sai o
deslocamento espacial — a viagem da linha, os 4px da chegada, a altura da faixa. Ficam a
opacidade e a cor, porque avisar que algo apareceu, mudou ou falhou é informação, e não
é o incômodo que a preferência pede para tirar.

**A Regra do Alvo Medido pela Linha.** O alvo ampliado de um controle dentro de uma linha
de conteúdo é medido **pela linha**, e não pelo desenho do controle. O checkbox usa
`position: static` para que o `::after` dele resolva contra a `li`, e `inset-y-0` passa a
significar "a altura desta linha, qualquer que ela seja". Antes eram 40px fixos medidos do
quadrado: acertavam a linha de uma altura por coincidência e deixavam 6px mortos em cima e
embaixo na de duas — invertendo a Regra do Alvo Maior que o Desenho justamente onde a linha
é maior. Corolário: a **geometria** do alvo não mora no componente de base (ele não sabe
quanto padding a linha tem nem onde começa o texto ao lado); ela mora em quem usa. A base dá
só o mecanismo, e sem geometria o alvo colapsa no desenho — que é o desfecho certo para um
esquecimento.

**A Regra do Aviso que Espera para Ser Lido.** A faixa se dispensa em 6 segundos porque todo
aviso dela fala de um gesto que a pessoa acabou de fazer e cujo desfecho ela está vendo. Um
aviso que fala de algo acontecido **antes de a janela existir** — o arquivo de tarefas que
não pôde ser lido — não tem esse contexto, e 6 segundos para ele é o mesmo que não avisar:
ele é `sticky` e espera o `×`. É a única exceção, e o teste para admitir outra é esse
mesmo: a pessoa estava olhando quando a causa aconteceu?

**A Regra do Relógio que Só Anda na Frente.** A contagem dos 6 segundos corre **só com a
janela em foco**. O ciclo do produto é esconder e voltar dezenas de vezes por dia, e um
relógio que anda com a janela escondida gastava a janela inteira de desfazer sem ninguém
olhando — o gesto de volta era oferecido e expirava fora da vista. Voltar ao foco reinicia a
contagem, porque o aviso ainda não foi lido.

**A Regra da Espera que Não Pisca.** Nenhum estado de carregamento aparece antes de 140ms.
Ler a lista de uma aba chega em milissegundos, e o "Carregando…" entrava e saía no mesmo
piscar a cada troca de aba — um aviso que ninguém consegue ler não informa nada, só faz a
área da lista tremer. Abaixo do limiar a área fica **em branco** (nunca o estado vazio, que
diria "Nada por aqui" sobre uma lista a caminho); acima dele o texto aparece, porque aí há
espera de verdade e espera sem explicação é pior que o tremor.

**A Regra da Confirmação que Cabe na Vista.** Um gesto cujo resultado nasce fora da vista
não foi confirmado. O viewport da lista cabe oito linhas: com mais que isso, a tarefa nova
aparecia abaixo da dobra e o Enter — o gesto mais frequente do app — ficava sem nenhum sinal
na tela além de um contador que ninguém olha enquanto digita. A linha nova é trazida à vista
num efeito de **layout** (antes da pintura, então não há um quadro em que a lista pareça não
ter mudado) e com rolagem **seca**: a linha ainda chega pelo `arrive`, mas rolagem animada no
caminho de acrescentar seria a latência com outro nome que a Regra do Movimento que se Paga
proíbe.

### A Folha de Cotas

O caráter é **instrumental**: quase nada tem cor, e quase todo componente é um retângulo de
fio com texto dentro. **Existem exatamente dois preenchimentos em toda a folha, e os dois
dizem a mesma palavra: escolhido.** A placa de tinta do sistema no seletor, e o número da
chamada escolhida em cota. Nada mais nesta página tem fundo, e é essa escassez que faz os dois
serem lidos como estado e não como decoração.

#### O seletor de sistema (o dispositivo que organiza a folha)

- **Três botões num contorno único** de 1px em fio-forte, com um fio do mesmo tom **entre**
  eles e nenhum antes do primeiro, dentro de uma faixa própria (`role="group"`, `aria-label`
  "Sistema") que tem o rótulo de zona à esquerda e fecha com um fio de 1px.
- **O escolhido é marcado por INVERSÃO:** fundo em tinta cheia, texto em prancha. Os outros
  dois ficam transparentes com texto em tinta-fraca e sobem para tinta no hover. Texto Archivo
  600 a 15px, recuo `9px 18px`, transição de 120ms em cor e fundo.
- **O estado mora em `aria-pressed`, não numa classe:** a inversão é desenhada a partir do
  atributo (`button[aria-pressed="true"]`). O que a tela mostra e o que o leitor de tela
  anuncia são o mesmo fato, e não duas fontes que podem divergir.
- **O que ele filtra:** todo `[data-sistema]` da página. Hoje são dois painéis por sistema — o
  bloco de instalação e o trecho de primeira abertura dentro da nota 1 —, e **exatamente dois
  ficam visíveis por vez**. Um painel novo entra na filtragem só por carregar o atributo.
- **A escolha inicial é palpite, não decisão:** `userAgentData.platform`, depois `platform`,
  depois `userAgent`; sem resposta nenhuma, macOS. O palpite é barato porque o seletor está
  logo ali e o custo de errar é um clique — e é essa disponibilidade que autoriza a página a
  esconder os outros dois sistemas, coisa que a versão anterior não podia fazer.

#### O aviso de celular

- **Uma faixa tinta** (`#aviso-movel`), `hidden` no HTML e desescondida pelo JavaScript quando
  a visitante está num telefone ou tablet: fundo cota-fraca, fio de 1px em cota à esquerda,
  Archivo 500 a 15px em tinta, recuo `12px 14px`, sem medida de linha.
- **É o único elemento da folha que usa a faixa tinta fora de um aviso de sistema**, e merece
  a matiz pelo mesmo motivo que o app pinta o erro de vermelho: quem abria no telefone recebia
  uma linha de `brew` sem ter onde rodá-la, e uma página que entrega um comando inútil sem
  dizer nada está falhando em silêncio.
- A detecção de celular vem **antes** da de sistema, porque o Android chega com `linux` no
  `userAgent` e o iPad moderno se anuncia como `macintosh`. E mesmo no telefone um sistema
  fica escolhido e o seletor continua funcionando: a folha segue inteira e legível, ela só diz
  primeiro que a instalação não é para agora.

#### O espécime anotado (componente-assinatura)

É a claim central da folha. A geometria continua exata porque **`ESCALA 1:1` é uma afirmação
literal** — mas o que ela sustenta mudou: antes ela sustentava duas cotas, hoje ela sustenta
**cinco realces cravados em pixels reais** e um recorte ampliado a 2:1. A exatidão passou de
enfeite da medida a condição da anotação: um realce 30px fora de lugar contorna metade de um
campo de texto e se lê como defeito do app.

- **Palco largo: 600 x 520 px**, fixos em px (`.palco`). O `<picture>` é a **caixa
  posicionada** — `position: absolute; left: 100px; top: 0; width: 420px; height: 540px` — e o
  `<img>` apenas a preenche a 100%/100%. Posicionar os dois foi o defeito que deslocou a
  imagem em 70px e desalinhou toda a anotação.
- **O palco encurtou 100px nesta passagem** (620 → 520) e a imagem subiu (`top: 60px` → `top:
  0`). Os 90px de ar acima da janela existiam **para a cota de 360 correr ali** e não tinham
  nenhum outro trabalho; com a cota fora, eram altura morta na primeira dobra. Um palco de
  desenho não guarda espaço para um traço que não existe mais.
- **A imagem é 840x1080 e entra a 420x540** — metade, porque foi capturada a 2x. Ela carrega
  **30px CSS de margem transparente em cada lado**.
- **Logo, a JANELA ocupa (130, 30) a (490, 510) dentro do palco: exatamente 360 x 480 px
  CSS.** É isto que torna a escala 1:1 verdadeira na tela de quem visita, e é por isso que
  todo realce é somado a `JANELA = {esq: 130, topo: 30}` — **as arestas da janela, nunca as da
  imagem**. Realçar contra a caixa da imagem daria 420x540 e a folha estaria anotando a moldura
  do seu próprio raster. Corolário mecânico: mudar a margem transparente da captura, o
  `left/top` do `picture` ou a escala da imagem **obriga a rederivar a origem `JANELA`** — e
  ela é um lugar só, o que é o ponto.
- **Palco estreito (≤720px): 360px de largura**, com a imagem em `left: -30px; top: -30px`: a
  margem transparente é recortada **nos dois eixos**, e a janela ocupa **(0, 0) a (360, 480)**
  do palco, então o realce entra com deslocamento zero. A escala 1:1 se mantém em 360px de
  largura, e a caixa de rolagem sangra até as arestas da prancha por margem negativa de
  `--recuo-prancha`.
- **Achado aberto: o palco estreito ainda declara `height: 540px`.** O seu SVG é
  `viewBox="0 0 360 480"` e a janela recortada termina em y=480, então há **60px de altura
  morta** embaixo dela — 30px de margem transparente da captura e 30px de prancha vazia. Os 540
  eram a altura do viewBox da cotação estreita, que desenhava abaixo da janela; com a cota fora,
  eles são exatamente o mesmo tipo de ar que o palco largo acabou de devolver ao encurtar de 620
  para 520. **A correção é `height: 480px`**, e ela não move nenhuma coordenada, porque o realce
  estreito soma zero.
- **Dois SVGs, cada um 1:1 com o seu palco.** O largo tem `viewBox="0 0 600 520"`, o estreito
  `viewBox="0 0 360 480"`, e a troca é por `display` no ponto de quebra de 720px. Um viewBox de
  600 servindo um palco de 360 escalaria toda a geometria por 0,6 e desalinharia cada realce —
  é por isso que são dois desenhos e não um responsivo.
- **No estreito não há balão, não há linha e não há seta: só o realce.** Em 360px de largura
  não existe goteira, e um balão dentro do espécime cobriria a interface que ele aponta. **A
  lista de chamadas é o único controle ali**, e ela basta: o realce continua acontecendo na
  janela e o detalhe continua se recortando.
- **A captura muda com o tema:** `<source media="(prefers-color-scheme: dark)">` troca o PNG,
  então o espécime é sempre a janela no mesmo tema em que a folha está sendo lida. O detalhe
  ampliado troca o mesmo par de arquivos por `@media (prefers-color-scheme: dark)` no CSS.

**O que saiu do palco, e é uma lista para ninguém tentar trazer de volta sem ler o motivo:**
as duas linhas de cota (360 e 480) com as suas linhas de extensão e setas; a terceira cota de
gesto, que saía do texto `⌃⌥T` à esquerda e apontava para dentro da janela; o rótulo `atalho
global` dentro do SVG; a cotação por dentro do espécime estreito e o halo em prancha que a
tornava legível. O atalho não se perdeu: ele é a chamada 1, dita em `<code>` no fluxo, onde
tem métrica e pode ser copiado.

**Um comentário de geometria continua sendo fonte, e continua sendo o ponto frágil.** A
passagem anterior fechou dois defeitos de geometria que este documento tinha registrado como
abertos, e a lição registrada era sobre o comentário e não sobre o número: **enquanto ele
mente, a próxima pessoa desenha pelo número errado e nada quebra.** O guarda automático
(`conferirCaptura`) segue no lugar — ele lê largura e altura do IHDR do PNG e falha o build se
a captura deixar de ser 840x1080 —, e a mensagem dele hoje manda acertar `JANELA`/`CHAMADAS`,
que são os nomes que existem. **Dois comentários ainda mentem, e ficam registrados aqui como
achados abertos:** o cabeçalho de `conferirCaptura` em `scripts/site.mjs` ainda descreve a
imagem em `(100, 60)` e "as cotas" em `(130, 90)–(490, 570)`, e o bloco da seção 3 do mesmo
arquivo ainda diz que o realce largo soma `(130, 90)`. O código faz `(100, 0)` e soma
`(130, 30)`; os comentários são de antes do encurtamento do palco. **O comentário de geometria
de `site/folha.css` já está certo** (600x520, `left: 100`, janela em `(130, 30)–(490, 510)`), o
que torna o par ainda mais perigoso: dois comentários concordantes e um discordante são um
convite a acreditar no errado. **Terceiro achado, menor:** a chave `cota_atalho_rotulo` continua
nos dois dicionários (`atalho global` / `global shortcut`) e não é emitida em lugar nenhum — é
texto morto que saiu com o rótulo do SVG.

#### As chamadas de detalhe (o dispositivo central)

Cinco chamadas, e a ordem é **a da história de uso, não a espacial**: 1 o campo, 2 as abas,
3 a data, 4 a concluída, 5 a saída. Numeração de desenho segue a sequência em que alguém usa a
peça, e de cima para baixo daria 5, 2, 1, 3, 4 — a ordem em que ninguém aprende nada.

- **Uma lista, e todo o resto derivado dela.** `CHAMADAS` em `scripts/site.mjs` guarda cada
  região em **px da janela** (a janela é 360x480, e a origem é o canto superior esquerdo dela).
  Dessa fonte única saem cinco coisas: o retângulo de realce do palco largo (somado a
  `JANELA`), o do palco estreito (somado a zero), a posição do balão, a linha de chamada, e a
  seta. O JavaScript deriva a sexta — o recorte do detalhe — da mesma lista, por
  `data-regiao`. Mexer numa coordenada move as seis juntas, e é por isso que elas não podem
  divergir: se divergirem, o detalhe mostra uma parte e a seta aponta outra.
- **`regiao` e `detalhe` são dois campos, e colapsá-los foi um defeito de verdade.** `regiao`
  realça a **funcionalidade inteira**; `detalhe`, quando existe, é o pedaço que **cabe
  ampliado 2:1**. O campo de nova tarefa tem 336px de largura, e a 2:1 isso pediria 672px numa
  vidraça de 560px — então o detalhe mostra 256px, a parte que interessa. A tentação é usar um
  campo só, e ela foi testada: realçar apenas o pedaço recortado desenhava um retângulo em
  volta de **meio campo de texto**, o que não se lê como recorte, se lê como bug do app.
  **Realce e recorte respondem a perguntas diferentes** — "onde isto fica" e "como isto é de
  perto" — e uma coordenada só não responde às duas.
- **O balão:** quadrado de **20x20** em prancha com contorno de 1px em cota, na **goteira do
  palco** — `x=92` à esquerda, `x=512` à direita, centrado na vertical do meio da região. Três
  chamadas ficam na goteira esquerda (campo, abas, concluída) e duas na direita (data, saída),
  escolhidas por proximidade: um balão atravessa a janela inteira quando fica do lado errado.
- **A seta aponta PARA DENTRO da região, e a ponta assenta 2px antes da aresta.** A ponta e a
  base são calculadas **a partir da aresta** (`aresta ∓ 2`, base a 9px da ponta), e não de um
  deslocamento fixo, para os dois lados espelharem de verdade. Os 2px são a diferença entre
  uma seta que aponta e uma seta que rabisca em cima do que ela aponta.
- **O realce:** retângulo de 1px em cota, sem preenchimento,
  `shape-rendering: geometricPrecision`, `opacity: 0` em repouso e `1` quando aceso. Ele
  contorna, nunca cobre — a captura embaixo tem que continuar legível, porque ela é a prova.
- **A chamada não escolhida NÃO desaparece: ela recua para 38%** de opacidade (140ms
  `ease-out`, `transition: none` sob `prefers-reduced-motion`). Um desenho que mostra só a
  chamada ativa perde a informação de que existem cinco — **e é essa informação que faz alguém
  clicar na segunda.** Ver a Regra das Cinco que Continuam à Vista.
- **A lista de chamadas é o controle**, e ela é uma `<ol>` de cinco botões. Grade de
  `1.75rem | 6.5rem | 1fr` (número, nome, texto) alinhada pela base, `11px 0` de recuo
  vertical, fio de 1px acima e abaixo de cada linha, cor de repouso em tinta-fraca subindo para
  tinta no hover e no escolhido. **O escolhido acende o próprio número, e não o fundo da
  linha:** são cinco linhas, e uma placa cheia trocando de lugar a cada escolha piscaria a
  coluna inteira. Abaixo de 560px a grade cai para duas colunas e o texto desce para baixo do
  nome.
- **O detalhe ampliado** (`.detalhe-vidro`): 80px de altura, até 560px de largura, moldura de
  1px em fio-forte, fundo película enquanto a imagem não chega. Ele pinta **a mesma captura**
  do espécime como `background-image`, a `background-size: 840px 1080px` — o tamanho **natural**
  (2x) do raster que o espécime mostra a 420x540. É exatamente isso que faz a ampliação ser
  2:1, bater com o rótulo `Detalhe · 2:1`, e **não custar um raster novo**: uma imagem por
  tema, as duas já baixadas. O `background-position` é calculado em `site/folha.js`: px da
  janela mais 30 (a margem transparente da captura), vezes 2.
- **Duas correções no cálculo do recorte, as duas defeitos encontrados e fechados.** **Uma:**
  o recorte é **preso dentro dos 360x480 da janela**, senão ele passa da aresta e mostra a
  margem transparente da captura, que aparece como um bloco de outra cor — foi o que aconteceu
  com a chamada 3, a data, que fica a 18px da borda direita. **Duas:** uma região **mais larga
  que a vidraça alinha pelo COMEÇO**, e não pelo centro; região que cabe fica centrada.
  Centralizar um campo de texto corta justamente o início dele, que é onde a leitura começa. O
  recorte é recalculado no `resize`, porque a largura da vidraça acompanha a coluna.
- **Sem JavaScript a lista continua legível como lista numerada** — cinco itens em tinta, com
  o cursor padrão em vez de `pointer` — e **o detalhe não é renderizado** (`.sem-js .detalhe {
  display: none }`). Um retângulo ampliado parado numa região que ninguém escolheu não informa
  nada e finge ser um controle.

#### O diagrama do ciclo de 2 s

- **Fica fora do palco**, com diagrama próprio, porque **mede o gesto e não a janela**. O
  ciclo é `⌃⌥T → digitar → Enter → ⌃⌥T`.
- **O SVG carrega só linha, seta e a faixa de varredura — nenhum texto** (viewBox
  `0 0 460 34`, largura fluida até 460px). O numeral `2 s` e os rótulos `lembrar` / `anotado`
  são HTML, pela Regra do Piso de 11px.
- **O numeral fica ACIMA da linha inteira, no fluxo, centrado** (`text-align: center`, sem
  percentual vertical, que é frágil numa caixa que escala). É a colocação clássica do desenho
  técnico e resolve um defeito real: uma placa opaca no meio da linha tapava justamente o
  trecho em que a varredura é a única tinta, e a faixa desaparecia no meio da corrida.
- **A varredura:** `stroke-width: 5`, opacidade 0.3, `stroke-dasharray/offset: 458` — as 458
  unidades são o comprimento real da linha (1 a 459), declarado no CSS e ancorado na
  geometria do SVG.

#### A linha de comando

- Caixa de **película** sobre a prancha, fio de 1px em fio-forte, máx. 62ch, `display: flex`
  com `align-items: stretch`. Comandos consecutivos ficam a 5px um do outro.
- O `<code>` é 13px mono, `white-space: pre`, com **rolagem horizontal própria e barra
  escondida** (`scrollbar-width: none`): um comando longo rola dentro da sua caixa em vez de
  quebrar em duas linhas ou esticar a coluna.
- **Botão copiar:** `flex: none`, sem fundo, separado por um `border-left` (o mesmo fio),
  rótulo de 11px versalete e um ícone SVG de 12px desenhado à mão em `currentColor`. No hover
  ganha fundo cota-fraca e texto em tinta. No estado `copiado` troca **ícone e palavra** e vai
  para a cor de cota por 1800ms.
- **Sem JavaScript o botão não existe** (`.sem-js .copiar { display: none }`; a classe do
  `<html>` vira `js` por um script inline no `<head>`). O texto continua ali para selecionar,
  e um botão morto é pior que nenhum. Sem `navigator.clipboard`, o clique **seleciona a
  linha** em vez de fingir que copiou, e diz isso na região viva.

#### O bloco de instalação (a ação primária)

- **Um bloco por sistema, e o seletor mostra um por vez.** Blocos empilhados, e não uma tabela
  de quatro colunas: os comandos precisam de largura, e uma tabela que rola na horizontal é o
  pior lugar possível para a ação primária da página.
- Cada bloco: cabeça em `flex` com o nome do sistema (Archivo 600, 17px) e a via (11px
  versalete em tinta-fraca); depois os comandos, a alternativa de download (14px, máx. 54ch) e
  o ponteiro para a nota. Separados por fio de 1px, sem fio no último.
- **As letras de revisão saíram, e a razão é aritmética.** `rev A` / `rev B` / `rev C`
  indexavam três blocos abertos ao mesmo tempo; com um só na tela, **um índice de três não tem
  o que indexar**. A mesma conta levou a faixa cota-fraca e o selo "o seu sistema": os dois
  existiam para apontar uma linha entre iguais, e não há mais iguais na tela. O bloco carrega
  agora o nome do sistema e a via, e nada além disso.

#### A zona "Em números" (dentro da prancha)

- **Não é mais uma zona da página: é a segunda seção da coluna de instalação**, separada dela
  por um fio de 1px. Ver a Regra da Tabela que Vive Dentro da Prancha — dela vêm as três
  obrigações desta tabela: sem borda, sem fundo, e com as células das pontas sem recuo
  horizontal para o texto encostar na vertical do rótulo de zona.
- **Sem `caption`.** A legenda "Valores medidos na versão X" saiu porque a versão já está no
  bloco de título, dita uma vez — e uma tabela dentro de uma prancha já está apresentada pelo
  rótulo da zona acima dela.
- `thead th` em 11px versalete sobre fio-forte; `tbody th` em **serif a 17px e 36% de
  largura** (a característica é prosa, e cede largura para a observação, que é a que explica o
  zero; 17px é o corpo da folha, e não um passo novo — ver a Regra dos Dois Passos Vizinhos);
  valor em **mono, cota, `nowrap`**; observação em serif 15px com `hyphens: auto`. Abaixo de
  700px a característica desce para 15px, junto com o aperto das células.
- **A linha `janela` é onde a medida foi morar.** `360 × 480` sai do desenho e entra aqui, na
  coluna de valor, como qualquer outro número conferível da folha. Foi essa linha que
  autorizou as cotas a sair do palco: a medida não foi descartada, ela foi para o lugar onde
  medida pertence.
- **Oito linhas, quatro zeros, e a ordem vende:** preço, contas, nuvem, telemetria, arquivo de
  dados, janela, sistemas, licença. Os quatro zeros primeiro; a coluna do meio é a cotação em
  forma de lista. Saíram as quatro linhas que mediam **o desenho e não o produto** — a escala
  da própria folha, o limite de 200 caracteres de título, os 40 do nome de aba, e a contagem
  de requisições de terceiro da página. Eram verdadeiras e não eram argumento.

#### Notas, citação de sistema e carimbo

- **Notas:** grade `4.5rem | 1fr` com o número em cota (11px versalete), separadas por fio de
  1px; abaixo de 560px o número passa para cima do corpo.
- **Citação de sistema** (`blockquote.sistema`): a frase que o macOS ou o SmartScreen
  realmente mostra, em Archivo 500 15px sobre cota-fraca, com fio de 1px em cota à esquerda e
  `cite` de 11px versalete dizendo de quem é a voz. **É a única citação da folha, e ela existe
  para a pessoa reconhecer o aviso quando ele aparecer na tela dela.** As duas citações e a
  frase do Linux ("não há aviso de sistema: o pacote instala e o app abre direto") são painéis
  `[data-sistema]` dentro da nota 1: quem escolheu Windows não lê a frase que o macOS mostra.
- **Carimbo** (o pé): fio de 2px em tinta no topo, grade `auto-fit` de `minmax(230px, 1fr)`,
  parágrafos de 15px em tinta-fraca com máx. 40ch, em três campos — estado do projeto, apoiar,
  código. Diz o estado do projeto na voz de quem o escreveu. **O inventário do que não existe**
  (número de usuários, depoimento, métrica) saiu do texto: a folha não inventa nenhum deles, e
  listar ausências era explicação sobre a página em vez de ajuda para instalar. A proibição
  continua na lista de Don't; o que saiu foi a frase que a anunciava.

#### Named Rules (A Folha de Cotas)

**A Regra da Inversão para o Escolhido.** Numa folha de uma matiz só, o sinal mais forte
disponível não é cor: é **inverter**. O sistema escolhido recebe placa de tinta cheia com texto
em prancha; a chamada escolhida recebe o número preenchido em cota com o algarismo em prancha.
São os dois únicos preenchimentos da página — a mesma economia que o app usa no checkbox
marcado, onde concluir é o único lugar com tinta cheia. Três corolários:

- **Um estado "escolhido" novo se resolve por inversão**, nunca por sombra, raio, negrito extra
  ou uma matiz nova.
- **Inverte-se com a tinta que o elemento JÁ usa.** Este é o corolário corrigido nesta
  passagem, e a correção importa: o registro anterior dizia "nunca gastando a matiz de cota,
  que está reservada a valor medido", e o número de chamada escolhido preenche em **cota**. Não
  é uma exceção aberta — é a regra lida certo. Aquele número já era cota (é um índice de
  desenho, como o número de nota), e inverter uma coisa é trocar figura e fundo **dentro da
  tinta dela**, não importar a tinta de outra. Preenchê-lo em tinta o faria parecer a placa do
  seletor, que é outro controle, sobre outro assunto. O teste continua o mesmo de antes, só
  mais preciso: um estado escolhido que introduz uma tinta que aquele elemento não usava em
  repouso está errado.
- **A inversão se desenha a partir de `aria-pressed`**, não de uma classe, para o estado visto
  e o estado anunciado serem o mesmo fato. Vale nos dois lugares.

**Corolário de escala, e ele decidiu o desenho da lista de chamadas:** inverter o **número** e
não a linha inteira. São cinco linhas trocando de estado a cada `mouseenter`, e uma placa cheia
de largura total piscaria a coluna a cada passagem do mouse. O que muda de fundo é o menor
elemento que carrega o estado; o resto da linha muda só de cor de texto.

**A Regra do Seletor que Não Promete Setas.** O seletor é `role="group"` com `aria-pressed`, e
**não** um `tablist` — porque a página não cumpre a navegação por setas que um tablist promete.
É a mesma decisão que a faixa de abas do app tomou, pela mesma regra: **não anunciar semântica
ARIA que a interface não cumpre.** Uma das duas superfícies chegou a essa conclusão primeiro; a
outra herdou a conclusão em vez de repetir o erro, que é para isso que este documento serve.

**A Regra da Página que Sobrevive ao Seletor.** Sem JavaScript o seletor **não aparece**
(`.sem-js .seletor`) e todos os painéis `[data-sistema]` ficam visíveis: a folha degrada
exatamente para a página que ela era antes do seletor, e aquela página funcionava. É a mesma lei
do botão de copiar — um controle que não pode agir sai da tela em vez de ficar morto —, e ela
vale ao contrário também: **o filtro é a melhoria, nunca o conteúdo.** Nenhum `hidden` escrito
pelo JavaScript pode ser a única via até uma informação. Teste: com o JavaScript desligado, os
três sistemas se leem inteiros e nada fica escondido.

**A Regra do Cotar por Dentro está RETIRADA.** Ela governava a cotação do palco estreito —
a cota de altura correndo em `x=334` sobre a interface, o halo de 4px em prancha com
`paint-order: stroke`, e a exigência de que cotar por dentro não autoriza cotar por
aproximação. **Nada disso existe mais:** não há cota em nenhuma das duas geometrias, e o palco
estreito é só realce. Uma regra que governa um dispositivo removido não é uma regra fraca, é
uma regra sobre nada — e mantê-la faria a próxima pessoa procurar um `x=334` que não está no
código. O que **sobrevive dela** é a parte que não era sobre cotas, e ela está reescrita abaixo
como a Regra da Anotação que Não Tapa: quando a anotação passa por cima do espécime, ela tem de
se separar do que está embaixo sem esconder, e ela tem de ser exata. Junto com ela saem, do
registro e da folha: a cotação unidirecional (todo numeral na horizontal), que só existia
porque havia numeral de cota; e a linha de extensão a 0.55 de opacidade dentro do palco, que só
existia para apontar de onde uma medida começava. **A linha de extensão continua no CSS e
continua em uso — no diagrama do ciclo**, que é o único desenho da folha que ainda mede algo.

**A Regra da Fonte Única de Geometria.** Uma coordenada do desenho é declarada **uma vez**, num
lugar, e todo o resto é derivado dela. `CHAMADAS` guarda cinco regiões em px da janela; delas
saem o realce largo (somado a `JANELA`), o realce estreito (somado a zero), o balão, a linha, a
seta e o recorte do detalhe. **A prova de que isto não é elegância é o que acontece quando se
duplica:** duas coordenadas que descrevem a mesma coisa divergem na primeira correção, e o
resultado não é uma quebra — é uma seta apontando um lugar enquanto o detalhe mostra outro,
numa folha cuja única promessa é que o que ela mostra é real. Teste: uma coordenada de pixel
escrita à mão em `folha.css`, `folha.js` ou no HTML gerado é bug. Corolário: **realce e recorte
podem ser dois campos** (`regiao` e `detalhe`) porque respondem a perguntas diferentes; o que
não pode é a mesma pergunta ter duas respostas.

**A Regra da Anotação que Não Tapa.** Uma anotação desenhada por cima do espécime **contorna,
nunca cobre** — a captura embaixo é a prova, e prova coberta não é prova. Três consequências
mecânicas: o realce é retângulo de 1px sem preenchimento; a ponta da seta assenta **2px antes
da aresta**, apontando para dentro da região, e é calculada a partir da aresta para os dois
lados espelharem; e o balão fica **fora do espécime**, na goteira do palco, onde não há
interface debaixo dele. Onde não existe goteira — o palco estreito, em 360px — a resposta certa
é **não desenhar balão nenhum** e deixar a lista de chamadas ser o controle, e não empurrar o
balão para dentro da janela. Teste: se um traço de anotação cobre um pixel de conteúdo que ele
está apontando, ele está errado.

**A Regra das Cinco que Continuam à Vista.** A chamada não escolhida **recua, não desaparece**:
38% de opacidade, e não `display: none`. Um desenho que mostra só a chamada ativa perde a
informação de que existem cinco, **e é essa informação que faz alguém clicar na segunda** — o
mesmo raciocínio que na janela do app manda a tarefa concluída desbotar em vez de sair da
lista (a Regra do Desbotamento). Corolário para qualquer seletor futuro do desenho: o estado
não escolhido é estado com menos contraste, jamais estado ausente. Teste: com uma chamada
escolhida, ainda é possível contar quantas existem.

**A Regra do Recorte que Não Sai da Janela.** Um recorte ampliado é **preso dentro dos 360x480
da janela**, sempre, e nunca centrado quando a região é mais larga que a vidraça. Os dois
lados dessa regra são defeitos que aconteceram: sem a prisão, a chamada 3 (a data, a 18px da
borda direita) mostrava a margem transparente da captura como um bloco de outra cor; com
centralização, o campo de texto aparecia cortado justamente no início, que é onde a leitura
começa — **região mais larga que a vidraça alinha pelo começo**, região que cabe fica centrada.
Teste: renderize os cinco recortes e olhe cada um. Um recorte que mostra margem transparente,
ou que começa no meio de uma palavra, está errado, e nenhuma asserção pontual pega isso.

**A Regra da Cota que se Desenha** (o nome fica; o que ela desenha mudou). A folha tem
**exatamente um movimento autoral**, e ele acontece **uma vez**: quando a prancha entra na
tela, cada traço corre até o fim e a seta assenta por último. Os traços hoje são as **linhas de
chamada** do palco largo e as duas do diagrama de ciclo; a mecânica é a mesma, `path.traco` é a
mesma classe, e é isso que fez a troca de dispositivo não custar um movimento novo. A mecânica,
porque ela é o que faz o gesto se ler como desenho e não como transição de CSS:

- Cada `path.traco` recebe **o próprio comprimento** em `--corrida`
  (`getTotalLength().toFixed(1)`, escrito pelo JS), e o CSS usa esse valor em
  `stroke-dasharray` e `stroke-dashoffset`. **A linha corre na velocidade do desenho, não na
  do CSS** — traços de comprimentos diferentes terminam juntos em vez de todos correrem a
  mesma distância. Vale visivelmente aqui: as cinco linhas de chamada têm comprimentos
  diferentes, porque a região de cada uma começa num x diferente.
- **460ms em `cubic-bezier(0.16, 1, 0.3, 1)`** — a mesma curva `ease-settle` que o app usa em
  todo movimento. Desaceleração exponencial: sai rápido, encosta devagar.
- **Setas e numerais entram por último:** opacidade em 180ms `ease-out` com **380ms de
  atraso**, então o número aparece depois de a linha ter chegado. É a ordem em que uma mão
  anota. O quadrado do balão não participa: ele é papel, não traço, e já está lá.
- **Disparo único por `IntersectionObserver`** (`threshold: 0.25`), com `unobserve`
  imediatamente depois: a anotação não se redesenha ao rolar de volta. Sem
  `IntersectionObserver`, tudo entra já desenhado.
- **O estado inicial depende da classe `js`.** Sem JavaScript, nada fica escondido por
  temporização — a folha inteira se lê e a anotação aparece pronta.
- **Especificidade é parte da regra:** o estado desenhado precisa de especificidade **maior**
  que o inicial, e não apenas vir depois dele. `.desenhada text` (0,1,1) perdia de
  `.js .cotas text` (0,2,1) e o numeral ficava invisível para sempre.
- **A troca de chamada não é este movimento.** Escolher uma chamada é transição de 140ms em
  opacidade (balão, realce) e cor (a linha da lista), sem deslocamento e sem redesenho de
  traço. O movimento autoral responde à **entrada da prancha na tela**, acontece uma vez, e
  não se repete a cada clique — que é a diferença entre um desenho que se desenha e um desenho
  que pisca.

**A Regra da Varredura que Só Corre a Pedido.** A única coisa cronometrada da folha é a
varredura de **2000ms linear** do diagrama de ciclo, e ela **não começa sozinha**: existe um
botão de verdade, com rótulo escrito ("Correr os 2 segundos"), e ele fica `aria-disabled`
enquanto a corrida acontece. Um laço que corre sem causa é exatamente o que o produto recusa —
e um número que se anima sozinho seria um anúncio, não uma medida. **Nada nesta folha entra em
laço, e nada é ambiente.**

**A Regra do Movimento Reduzido Chega ao Fim.** Sob `prefers-reduced-motion: reduce`, os dois
movimentos **curto-circuitam para o estado final**: `transition: none` com `stroke-dashoffset:
0` e opacidade 1 na anotação, `animation: none` com a varredura inteira desenhada, e
`scroll-behavior: auto` no `html`. A preferência tira o movimento, **nunca a informação** — é
a mesma leitura que a Regra do Movimento Reduzido é Menos, Não Nada faz no app.

**A Regra de Um Estado, Uma Voz (na folha).** Todo desenho decorativo é `aria-hidden`, e o
que ele diz é **redito em texto de verdade** logo ao lado. Os dois SVGs do palco e o diagrama
de ciclo inteiro são `aria-hidden="true"`; a legenda embaixo do palco diz por escrito que a
escala é 1:1 e que aquele é o tamanho real da janela na tela, mais o ciclo completo em texto,
e a tabela de números carrega o `360 × 480` em linha conferível. Três fragmentos anunciados
soltos ("2 s",
"lembrar", "anotado") dizem menos do que a frase da legenda. **É a mesma regra que o app já
declara sobre a pílula do contador:** um estado, uma voz — o desenho para o olho, a frase para
quem ouve. Acompanham a regra: o link "pular para a instalação" como primeiro elemento
focável, uma região viva (`role="status"`, `aria-live="polite"`) para o resultado da cópia, o
`aria-label` do botão de copiar carregando **o comando inteiro**, e a marca com
`role="img"` e nome acessível.

**As chamadas são o caso mais afiado da regra, porque aqui o desenho tem estado.** Escolher
uma chamada muda três coisas de uma vez — o realce na janela, o balão aceso, o recorte do
detalhe —, e nenhuma delas é anunciada, porque **todas as três são a mesma coisa dita pelo
botão**: o `aria-pressed` carrega o estado, e o nome e o texto do próprio botão são a versão
anunciada do que o desenho mostra. Por isso a `<figure>` do detalhe é `aria-hidden="true"`:
uma imagem de fundo recortada não tem descrição honesta que já não esteja escrita na linha que
a pediu, e anunciar "detalhe mudou" a cada `mouseenter` seria a região viva virando ruído. O
estado mora em `aria-pressed`, e não numa classe — a mesma decisão do seletor de sistema, pela
mesma razão: o que a tela mostra e o que o leitor de tela anuncia têm de ser um fato só.

**Três eventos escolhem, e cada um existe por um motivo diferente.** `click` é o gesto óbvio;
`focus` é o que faz **Tab** funcionar sem um segundo caminho de código (e cobre o clique de
tabela); `mouseenter` dá a **prévia que só o mouse consegue pedir** — passar por cima de cinco
linhas e ver cinco recortes é como alguém descobre que a lista responde. Nenhum dos três é
exclusivo de um dispositivo de entrada, que é a Regra da Revelação com Teclado do app dita
nesta superfície. A primeira chamada entra escolhida, porque um detalhe vazio à espera de um
clique é uma vidraça que parece quebrada.

## Do's and Don'ts

**As duas primeiras listas governam A Vidraça — a janela do aplicativo.** As duas últimas
governam A Folha de Cotas — a landing page em `site/`. Uma regra de um mundo não é argumento
no outro; ver o preâmbulo dos dois mundos.

### Do:
- **Do** manter croma `0` em toda cor nova. As duas exceções que existem (erro e hoje)
  são a mesma matiz em intensidades distantes; um token com matiz **nova** precisa de uma
  justificativa que nenhum dos dois teve de dar, e provavelmente não tem.
- **Do** declarar altura fixa e `shrink-0` em toda faixa nova, ou colocá-la dentro da lista.
- **Do** usar `muted` como fundo para destacar. É o recurso de destaque do sistema,
  no lugar de cor, sombra ou borda. **A exceção é o destaque dentro de algo que já
  usa `muted`:** ali ele desaparece no hover, e a saída é subir a densidade
  (`foreground/10`) — não a matiz, que só entra quando carrega significado próprio. Ver a
  Regra do Destaque que Sobrevive ao Fundo.
- **Do** dar `min-w-0` a todo contêiner que pode encolher e truncamento declarado
  (`truncate` ou `wrap-anywhere` + `line-clamp`) a todo texto vindo do usuário, sempre
  com o texto inteiro no `title`.
- **Do** manter o par hover + `focus-visible` em qualquer controle que se esconda, **e dar
  a ele o anel de 2px**: opacidade sozinha não diz onde o foco está. Botões escritos à mão
  (fora do componente `Button`) são justamente os que esquecem.
- **Do** dar caminho de teclado a todo gesto que existe no mouse. `F2` renomeia, `↑`/`↓`
  percorrem a lista, `⌘1..9` / `Ctrl+Tab` / `⌘T` mandam na faixa de abas — e o atalho
  aparece no `title` do controle, que já existia por causa do truncamento. Atalho que não
  aparece em lugar nenhum é atalho que só quem escreveu conhece.
- **Do** respeitar `prefers-reduced-motion` em qualquer animação nova, tirando o
  deslocamento e mantendo o que informa — como a viagem e a chegada da lista fazem.
- **Do** manter os três tamanhos de texto. Hierarquia nova se faz com peso e com cinza.
- **Do** oferecer desfazer em vez de confirmação para qualquer gesto destrutivo novo.
- **Do** usar a curva `ease-settle` (`--motion-settle`, `cubic-bezier(0.16, 1, 0.3, 1)`)
  em qualquer movimento novo. Desaceleração exponencial: a coisa sai rápido e encosta
  devagar, que é como algo pousa.

### Don't:
- **Don't** introduzir cor decorativa, etiquetas coloridas, prioridade por cor, emoji,
  gradiente ou barra de progresso. Isto não é um app de produtividade colorido. As duas
  intensidades de vermelho que existem são o teto, não o começo de uma paleta — e a
  próxima cor gasta sai da conta do erro.
- **Don't** usar blur, `backdrop-filter`, brilho ou borda iluminada. A janela é
  transparente por necessidade técnica do Tauri, **não** por estilo — glassmorphism seria
  ler a restrição como estética.
- **Don't** acrescentar estatística, streak, gráfico, gamificação ou qualquer painel de
  métrica. Custaria a altura que a janela não tem.
- **Don't** imitar o cromo nativo de um sistema operacional (Aqua, Fluent, Material). O
  app roda em três; imitar um quebra a coerência nos outros dois.
- **Don't** projetar sombra em nada que esteja dentro da janela.
- **Don't** resolver uma superfície nova com modal, popover ou camada elevada. Vista nova
  troca de lugar com a lista e devolve o espaço ao sair — ver a Regra da Vista que Troca,
  inclusive a exceção única dela (o menu de contexto do Adendo 13) e por que ela não
  abre precedente
  em Vez de Empilhar.
- **Don't** usar botão preenchido ou botão vermelho de destruição. Todo gesto destrutivo
  aqui é reversível, e vermelho prometeria uma gravidade que ele não tem.
- **Don't** criar um segundo padrão de edição. Edição é inline, no lugar do texto, com o
  componente que já existe.
- **Don't** usar espaçamento acima de 12px fora do estado vazio.
- **Don't** animar nada no caminho de abrir a janela, dar foco ao campo ou trocar de
  aba, e nada acima de 200ms. Movimento que a pessoa espera acabar é atrito.
- **Don't** usar curva com volta (bounce, elastic), animação em laço, `pulse`, skeleton
  animado ou qualquer movimento que continue depois de a causa dele ter passado.
- **Don't** animar uma quarta coisa sem que ela se mexa sozinha. Se a pessoa causou o
  movimento diretamente e ele é instantâneo, ele já está explicado.
- **Don't** anunciar semântica ARIA que a interface não cumpre (foi por isso que a faixa
  de abas é `group` e não `tablist`).
- **Don't** pôr `aria-label` em elemento genérico (`span`, `div`). A ARIA não permite nome
  acessível ali, e o que várias tecnologias assistivas faziam com a pílula do contador era
  ler "3", sem unidade. O número é a leitura rápida para o olho (`aria-hidden`); a leitura
  anunciada é a frase por extenso do rodapé, que é a região viva. **Um estado, uma voz.**
- **Don't** gerar um tamanho de ícone reduzindo outro. Todo raster da marca é desenhado
  no tamanho dele, com o traço recalculado — ver a Regra do Traço Calibrado por Tamanho.
  Corolário: **não acrescente um tamanho novo à mão**; acrescente-o a `scripts/marca.mjs`.
- **Don't** dar à marca um segundo elemento — check, lista, cursor, letra, monograma. O
  anel sozinho é a identidade, e o nome já está escrito ao lado dele em todo lugar onde
  o ícone aparece.
- **Don't** nomear um controle pelo que ele parece fazer em vez do que ele faz. O botão do
  cabeçalho esconde a janela, e chamava-se "Fechar janela" para quem usa leitor de tela —
  numa janela sem decoração e fora da barra de tarefas, "fechei e não sei voltar" é o pior
  desfecho que existe aqui.

### Do (A Folha de Cotas):

- **Do** manter todo canto reto e toda superfície plana. Zero `border-radius`, zero
  `box-shadow` — a busca em `site/folha.css` é o teste.
- **Do** usar o vermelho `destructive` do app como a única matiz, e **só em valor medido**:
  coluna de valor, numeral do ciclo, número de nota, número de chamada e o desenho de anotação
  que o acompanha. A exceção declarada são as duas faixas tintas, onde a matiz **avisa** em vez
  de medir.
- **Do** marcar um estado "escolhido" por **inversão**, invertendo com a tinta que o elemento
  já usa (tinta na placa do seletor, cota no número da chamada), e desenhá-la a partir de
  `aria-pressed`. Ver a Regra da Inversão para o Escolhido.
- **Do** inverter o **menor** elemento que carrega o estado quando há vários itens trocando: o
  número, não a linha inteira.
- **Do** cortar toda frase que não ajude alguém a decidir instalar. Explicação que serve a quem
  construiu o app mora no README — ver a Regra da Frase que Ajuda a Instalar.
- **Do** pôr um controle que filtra a página **antes** de tudo que ele filtra, e filtrar por
  atributo (`[data-sistema]`) para um painel novo entrar na filtragem só por carregá-lo.
- **Do** definir toda cor no `:root` claro e apenas **redefini-la** dentro de
  `prefers-color-scheme: dark`. Nenhuma cor pode ter a sua única definição no bloco escuro.
- **Do** pôr medida, comando e numeral em Azeret Mono com `tabular-nums`, e prosa em
  Spectral — inclusive dentro de uma célula de tabela.
- **Do** rotular uma zona (Archivo 600, 11–13px, `0.13em`, versalete, sobre um fio) em vez de
  escrever uma manchete de seção.
- **Do** declarar toda coordenada de desenho **numa lista só** (`CHAMADAS`, em px da janela) e
  derivar dela o realce das duas geometrias, o balão, a linha, a seta e o recorte. Rederive a
  origem (`JANELA`) sempre que a margem transparente, o `left/top` do `picture` ou a escala da
  imagem mudarem. Ver a Regra da Fonte Única de Geometria.
- **Do** deixar a anotação **contornar** o que ela aponta: realce sem preenchimento, ponta de
  seta 2px antes da aresta e apontando para dentro, balão na goteira. Ver a Regra da Anotação
  que Não Tapa.
- **Do** manter as cinco chamadas à vista, recuando a não escolhida para 38% em vez de
  esconder. Ver a Regra das Cinco que Continuam à Vista.
- **Do** prender todo recorte ampliado dentro dos 360x480 da janela, e alinhar pelo começo a
  região que não cabe na vidraça. Depois **renderize os cinco recortes e olhe cada um** — esta
  classe de defeito é invisível para asserção.
- **Do** manter o comentário de geometria do CSS e do gerador **igual ao código**. Ele é fonte:
  quando mente, nada quebra e o desenho passa a apontar para o lugar errado.
- **Do** manter todo texto funcional em 11px ou acima. Se o texto de um diagrama escalaria
  abaixo do piso, tire-o do SVG e componha-o em HTML — foi o que o diagrama do ciclo fez.
- **Do** redizer em texto de verdade o que um desenho `aria-hidden` diz, no elemento vizinho.
- **Do** auto-hospedar todo recurso. Zero requisição de terceiro é requisito do produto: a
  página que promete "sem telemetria" não entrega o IP de quem visita a um CDN de fontes.
- **Do** deixar a folha inteira legível **sem JavaScript** — comandos selecionáveis, anotação
  já desenhada, nenhum botão morto, o seletor escondido, os três sistemas à vista, a lista de
  chamadas legível como lista numerada e o detalhe **não renderizado**.
- **Do** deixar um controle do desenho responder a `click`, `focus` **e** `mouseenter`: o foco
  é o que faz Tab funcionar, e o hover é a prévia que só o mouse consegue pedir.

### Don't (A Folha de Cotas):

- **Don't** acrescentar raio, sombra, gradiente, `backdrop-filter` ou brilho. A profundidade
  é um tom de diferença entre película e prancha, e mais nada.
- **Don't** introduzir uma segunda matiz — e em particular **não** o azul de cota de
  `assets/marca/especificacao.html` (`#1f6f9c` / `#6bbde8`). O projeto tem uma matiz.
- **Don't** escrever uma manchete de seção, um herói ou uma frase de venda em corpo grande. O
  único texto de exibição da folha é o nome do produto.
- **Don't** compor uma medida em serif nem uma nota de prosa em mono.
- **Don't** anotar contra a caixa da imagem: o raster carrega 30px CSS de margem transparente
  por lado, e anotar a imagem aponta a moldura em vez do produto.
- **Don't** deixar um traço de anotação **cobrir** o que ele aponta — nem a ponta da seta, nem
  o balão, nem um preenchimento de realce. Ver a Regra da Anotação que Não Tapa.
- **Don't** escrever a mesma coordenada de pixel em dois lugares. Se o realce e o recorte
  divergirem, a seta aponta uma coisa e o detalhe mostra outra, e nada quebra.
- **Don't** colapsar `regiao` e `detalhe` num campo só para "simplificar": realçar apenas o
  pedaço recortado contorna metade de um campo de texto e se lê como bug do app.
- **Don't** esconder a chamada não escolhida. Ela recua para 38%; quem não vê que existem
  cinco não clica na segunda.
- **Don't** centrar um recorte mais largo que a vidraça, nem deixá-lo passar da aresta da
  janela: alinhe pelo começo e prenda dentro de 360x480, ou o detalhe mostra a margem
  transparente da captura.
- **Don't** anunciar `tablist` (nem qualquer outra semântica ARIA) que a página não cumpre. O
  seletor é `group` com `aria-pressed` exatamente por isso.
- **Don't** deixar um `hidden` escrito pelo JavaScript ser a única via até uma informação. Sem
  JavaScript, tudo que o filtro esconderia fica visível.
- **Don't** indexar com letra (`rev A`, `rev B`) o que aparece sozinho na tela. Um índice de
  três não tem o que indexar quando só um bloco está à vista.
- **Don't** entregar comando de terminal a quem abriu no telefone sem dizer que ele não serve
  ali. Uma página que passa um `brew` a um celular está falhando em silêncio.
- **Don't** dar borda, fundo ou recuo de ponta a uma tabela que já mora dentro de uma prancha.
- **Don't** declarar uma escala que a geometria não produz. `ESCALA 1:1` é conferível com uma
  régua na tela, e `Detalhe · 2:1` é conferível na conta: `background-size` de 840x1080 contra
  um espécime de 420x540.
- **Don't** animar nada em laço, nada que comece sozinho e nada que continue depois de a causa
  ter passado. A varredura tem botão; a anotação se desenha uma vez e nunca mais, e a troca de
  chamada é transição de cor e opacidade, não movimento novo.
- **Don't** guardar ar no palco para um traço que não existe mais. Os 90px acima da janela
  eram da cota de 360 e saíram com ela.
- **Don't** escalar um viewBox para servir dois palcos. Dois palcos, dois desenhos, cada um
  1:1 com o seu.
- **Don't** mover a ação primária (instalar) para o pé da página. Ela fica ao lado da prova.
- **Don't** resolver largura estreita com `display: block` numa tabela: envolver o texto cabe
  igual e não destrói a semântica para leitor de tela.
- **Don't** fazer do botão de copiar o único caminho até o texto do comando.
- **Don't** inventar número de usuários, depoimento, métrica, selo ou logotipo de imprensa.
  Não existem. O carimbo já não gasta uma frase dizendo que não existem — listar ausências era
  explicação sobre a página —, e a proibição vale sem ela.
- **Don't** trazer para cá o teto de 12px de espaçamento d'A Vidraça, nem levar para lá o
  texto de 68px desta folha. Cada lei é da sua superfície.
