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
  folha-campo: "#eaeaea"
  folha-folha: "#f8f8f8"
  folha-tinta: "#171717"
  folha-tinta-fraca: "#5d5d5d"
  folha-vinco: "#cfcfcf"
  folha-vinco-forte: "#a9a9a9"
  folha-faceta-a: "#f1f1f1"
  folha-faceta-b: "#dcdcdc"
  folha-faceta-fio: "#bcbcbc"
  folha-cota: "oklch(0.529 0.245 27.325)"
  folha-cota-fraca: "oklch(0.529 0.245 27.325 / 12%)"
  folha-sobre-cota: "#ffffff"
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
    fontFamily: "Chakra Petch, Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.75rem, 3.4vw, 2.9rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "0.005em"
  folha-zona:
    fontFamily: "Chakra Petch, Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 600
    letterSpacing: "0.14em"
  folha-marca:
    fontFamily: "Chakra Petch, Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    letterSpacing: "0.22em"
  folha-peca:
    fontFamily: "Chakra Petch, Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    letterSpacing: "0.1em"
  folha-corpo:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  folha-secundario:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  folha-mono:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    fontFeature: "tabular-nums"
  folha-medida:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    fontFeature: "tabular-nums"
  folha-rotulo:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.12em"
    fontFeature: "tabular-nums"
  folha-codigo:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Segoe UI Symbol, Noto Sans Symbols 2, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
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
  folha-recuo-prancha: "clamp(18px, 2.6vw, 36px)"
  folha-respiro-prancha: "30px"
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
    backgroundColor: "{colors.folha-folha}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "{spacing.folha-recuo-prancha}"
  folha-botao-implantar:
    backgroundColor: "{colors.folha-cota}"
    textColor: "{colors.folha-sobre-cota}"
    rounded: "{rounded.folha}"
    padding: "15px 30px"
    typography: "{typography.folha-peca}"
  folha-seletor-botao:
    backgroundColor: "{colors.folha-folha}"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "8px 18px"
    typography: "{typography.folha-mono}"
  folha-seletor-botao-escolhido:
    backgroundColor: "{colors.folha-tinta}"
    textColor: "{colors.folha-folha}"
  folha-chamada-botao:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "12px 14px"
  folha-chamada-botao-escolhido:
    backgroundColor: "{colors.folha-cota-fraca}"
    textColor: "{colors.folha-tinta}"
  folha-chamada-num:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    size: "26px"
    typography: "{typography.folha-mono}"
  folha-chamada-num-escolhido:
    backgroundColor: "{colors.folha-cota}"
    textColor: "{colors.folha-sobre-cota}"
  folha-comando:
    backgroundColor: "{colors.folha-campo}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "11px 14px"
    typography: "{typography.folha-codigo}"
  folha-botao-copiar:
    backgroundColor: "{colors.folha-folha}"
    textColor: "{colors.folha-tinta-fraca}"
    rounded: "{rounded.folha}"
    padding: "0 14px"
    typography: "{typography.folha-rotulo}"
  folha-botao-copiar-hover:
    backgroundColor: "{colors.folha-faceta-a}"
    textColor: "{colors.folha-tinta}"
  folha-botao-varredura:
    backgroundColor: "transparent"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "8px 18px"
    typography: "{typography.folha-mono}"
  folha-aviso-movel:
    backgroundColor: "{colors.folha-cota-fraca}"
    textColor: "{colors.folha-tinta}"
    rounded: "{rounded.folha}"
    padding: "12px 16px"
  folha-nota-num:
    backgroundColor: "transparent"
    textColor: "{colors.folha-cota}"
    rounded: "{rounded.folha}"
    padding: "5px 10px"
  folha-palco:
    backgroundColor: "transparent"
    rounded: "{rounded.folha}"
    width: "600px"
    height: "520px"
  folha-pacote:
    backgroundColor: "{colors.folha-cota}"
    rounded: "{rounded.folha}"
    size: "54px"
  folha-detalhe-vidro:
    backgroundColor: "{colors.folha-campo}"
    rounded: "{rounded.folha}"
    height: "132px"
---

# Design System: NoCom

## Este documento guarda DOIS mundos, e diz qual superfície cada um governa

O projeto tem duas superfícies de tela, com trabalhos diferentes, e elas **não** compartilham
uma única escala tipográfica, um único ritmo de espaçamento nem um único vocabulário de forma.
Tentar unificá-las produziria um documento que não descreve nenhuma das duas.

| Mundo | Superfície | Código |
| --- | --- | --- |
| **A Vidraça** | a janela do aplicativo — 360x480 px, sempre por cima, acromática | `src/**`, `src-tauri/**` |
| **A Folha Miura** | a landing page de duas línguas — folha de dobra Miura | `site/**`, gerada por `scripts/site.mjs` |

**Como ler as seções abaixo.** Em cada seção canônica, o conteúdo **sem rótulo de mundo é
d'A Vidraça** — ele é o incumbente, está no ar e continua valendo verbatim. Os blocos
intitulados **"A Folha Miura"** governam a página, e só ela. (O mundo anterior da página,
"A Folha de Cotas", foi substituído por inteiro nesta passagem — o contrato de direção, com
seed `9139ab9b`, está escrito no topo de `site/index.html` e recusa por escrito polir a folha
anterior.)

**Onde os dois discordam, não há deriva a reconciliar: são duas superfícies com orçamentos
opostos.** Três exemplos que não devem ser mediados:

- A janela proíbe qualquer espaçamento acima de 12px e não tem tipografia de exibição. A
  folha tem uma manchete de display de até 46px em caixa alta e pranchas com recuo interno de
  até 36px. As duas coisas estão certas, cada uma na sua superfície. Uma janela de 480px de
  altura disputa cada pixel com a lista; uma folha rolável não disputa nada.
- A janela não projeta uma única sombra por dentro — e a folha projeta **uma por plano de
  papel**: a prancha sobre o campo, o espécime sobre a prancha. Também não é deriva: a janela
  é um único retângulo que recorta qualquer sombra antes de ela chegar à tela; a folha é
  papel sobre uma mesa, e papel de verdade levanta da mesa.
- A janela declara que **responsividade não existe, e é uma decisão**. A folha tem quatro
  pontos de quebra (1080, 860, 720, 420px), inclusive um que troca o palco inteiro e esconde
  o leque. Também é uma decisão: a janela tem um tamanho só, a página é aberta em qualquer
  tela que exista.

**O que atravessa as duas, de propósito:** a **Regra do Pigmento Único** (uma matiz, o
vermelho `destructive` do app), o anel de foco de **2px sólidos sem raio** (em cinza no app;
na própria matiz na folha), o tema pelo sistema **sem toggle**, e a regra de **um estado,
uma voz** na acessibilidade. Cada uma está registrada nas duas seções, com o motivo de valer
nos dois lugares.

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

### A Folha Miura

**Creative North Star: "A Folha Miura"** — *superfície: `site/index.html` e
`site/en/index.html`, geradas por `scripts/site.mjs`.*

Uma folha de dobra Miura. O campo atrás é o padrão de vincos em paralelogramo; cada seção é
uma **prancha** de papel fosco com o canto dobrado; e a primeira dobra mostra o argumento
inteiro do produto como geometria: **o leque de doze facetas abrindo do pacote vermelho (o
app fechado, `⌃⌥T`) até a janela real de 360x480 (o app aberto)**. O que a página afirma,
ela desdobra. A tese está escrita no contrato de direção no topo do HTML (seed `9139ab9b`):
o app abre num puxão, e a página é a folha que o prova. A direção escolhida chamava-se
"O Pacote Miura" (forma de catálogo `paper-folds-pleats-deployable-miura-orbit-sheet`); o
mundo construído recebeu o nome da folha, porque a folha é o que se vê.

Este mundo **substituiu "A Folha de Cotas"** — a prancha de desenho técnico herdada da folha
de especificação da marca. Não foi um polimento: o contrato recusa por escrito tanto o herói
de SaaS com screenshot emoldurado quanto polir a folha anterior. O que sobreviveu da
antecessora sobreviveu por ser lei do projeto, e não estilo dela: a matiz única, o canto sem
raio, o tema pelo sistema, o zero de requisição de terceiro, a página legível sem JavaScript,
e o dispositivo das cinco chamadas sobre o espécime — que deixou de ser o centro solitário da
prancha e passou a ser a legenda de uma janela que se desdobra.

A história do primeiro viewport é a do produto: à esquerda a manchete em display caps, o
subtítulo, o botão vermelho de instalar e o seletor de sistema; à direita o palco — o leque
abrindo do pacote até a janela em escala 1:1. E a interação-assinatura cumpre a promessa na
própria página: **`⌃⌥T` dobra e desdobra a janela**, o mesmo atalho do app, um movimento por
gesto.

**Key Characteristics:**

- O campo de vincos: o padrão Miura em data-URI no `body` — duas fileiras de paralelogramo
  com o tombo alternado, traçadas num cinza de meia-opacidade (`rgba(138,138,138,0.14)`) que
  serve aos dois temas sem um segundo arquivo
- Pranchas de papel fosco: fundo um tom acima do campo, **dente de papel** por `feTurbulence`
  em data-URI, fio de 1px, **uma sombra** (`--sombra-prancha`) e o **canto dobrado** de 16x28
  — o triângulo mostra o campo atrás, e o vinco diagonal está a 60°, o ângulo da tesselação
- **Uma geometria, um ângulo:** `--tombo: -14deg`. Botão primário, células do seletor, número
  de chamada, número de nota e balão são paralelogramos tombados nesse ângulo, e todo
  paralelogramo **destomba o próprio conteúdo** (um `<span>` que o gerador emite para isso)
- Uma matiz, a do app: o vermelho `destructive` pinta o pacote, a ação primária, o realce
  aceso e os índices de desenho — e também o foco, o cursor de texto e a seleção. Todo cinza
  é RGB igual: croma zero por construção, não por aproximação
- Três vozes da folha mais uma do espécime: Chakra Petch 600 caps no display (os cantos
  chanfrados da fonte leem como papel dobrado), Archivo no corpo, Azeret Mono em id de vinco,
  medida e comando — e Geist Variable **só dentro do espécime**, porque ela é a tipografia do
  app e não da folha
- O espécime é a **janela de verdade, não uma foto**: o DOM montado do app numa shadow root
  declarativa, com o CSS do app dentro dela, tema pelo mesmo `prefers-color-scheme` do app, e
  a data de hoje reescrita no navegador de quem visita
- Ids de vinco em mono (`M-01`…`M-04` nas pranchas; `V-02`, `M-05`, `V-11`, `M-08` no leque):
  a folha se indexa como uma dobra de verdade se numera — vale e montanha
- Um movimento de entrada, **uma vez** (`IntersectionObserver` → `.desenhada`): o leque abre,
  a janela desdobra, as linhas de chamada se desenham; e um estado dobrado (`.dobrado`) que
  `⌃⌥T` e o clique no pacote alternam, desenhado **nos dois sentidos**
- A única coisa cronometrada é a varredura de 2 s do diagrama de ciclo, e ela só corre a
  pedido; nada em laço, nada ambiente; `prefers-reduced-motion` curto-circuita tudo para o
  estado final
- Zero requisição de terceiro: fontes, marca e favicons saem do próprio domínio, porque um
  produto que promete "sem telemetria" não entrega o IP de quem visita ao Google Fonts
- Sem JavaScript a folha inteira se lê: somem o seletor (os três sistemas ficam à vista), o
  botão do pacote, a dica do puxão, o detalhe 2:1 e os botões de copiar — o filtro e a
  demonstração são melhoria, nunca conteúdo
- O conteúdo mora no **dicionário do gerador** (`scripts/site.mjs`): o português é canônico,
  o inglês é conferido chave a chave contra ele, e a geração aborta se divergirem

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

### A Folha Miura

Nove cinzas de **RGB igual** — croma zero por construção, não por aproximação — mais **uma
matiz**, a mesma do app, em duas densidades, e a tinta que escreve sobre ela. O **tema claro
é a definição base**; o escuro redefine a **mesma lista** dentro de
`prefers-color-scheme: dark`. Nenhuma cor tem sua única definição no bloco escuro, e não há
toggle: o app segue o sistema e a folha também.

Os valores normativos estão no frontmatter (prefixo `folha-`), com o claro como canônico.
Os pares do escuro: campo `#131313`, folha `#1d1d1d`, tinta `#e8e8e8`, tinta-fraca
`#a0a0a0`, vinco `#303030`, vinco-forte `#4f4f4f`, faceta-a `#303030`, faceta-b `#1f1f1f`,
faceta-fio `#4c4c4c`, cota `oklch(0.704 0.191 22.216)`, cota-fraca a 14% da mesma,
sobre-cota `#1a0605`, e a sombra de prancha sobe de 0.32 para 0.72 de alfa.

#### Primary

- **Cota** (`--cota`): o vermelho `destructive` do próprio app — medido pelo comentário do
  CSS em **5.1:1 sobre o campo no claro e 6.0:1 no escuro**. Ele pinta as três coisas que a
  tese pediu: o **pacote** (o app fechado, o fecho do leque), a **ação primária** (o botão de
  instalar) e o **realce aceso** (o contorno da região apontada e tudo que acende com ela:
  balão, linha, seta, número). Pinta os índices de desenho — o id de vinco de cada prancha e
  o número de cada nota — e os dois sinais de resposta: o estado `copiado` do botão de copiar
  (1800ms) e a varredura de 2 s. E é a tinta das superfícies que o navegador desenha: o anel
  de foco, `caret-color`, `accent-color` e o hover do sublinhado de link.
- **Cota Fraca** (`--cota-fraca`): a mesma matiz a 12% (14% no escuro). Quatro usos: o fundo
  do aviso de celular, o fundo do botão de chamada escolhido, o **preenchimento translúcido
  do realce** sobre o espécime, e `::selection`.
- **Sobre-Cota** (`--sobre-cota`): o que escreve em cima da cota — branco puro no claro, um
  quase-preto avermelhado (`#1a0605`) no escuro. É o texto do botão de instalar, o anel da
  marca dentro do pacote e o numeral do balão aceso.

#### Neutral

- **Campo** (`--campo`): o fundo da página inteira — o papel por baixo do papel, vestido com
  o padrão de vincos. Também é o fundo do que recua um tom para dentro da prancha: a linha de
  comando, a vidraça do detalhe, a citação de sistema — e o triângulo do canto dobrado, que
  mostra o campo porque a dobra revela o que está atrás.
- **Folha** (`--folha`): um tom acima do campo. É o papel das pranchas, o fundo dos botões do
  seletor em repouso, do botão de copiar, do balão de chamada em repouso e da tecla desenhada
  da dica do puxão — e o **texto** do sistema escolhido e do link de pular, onde a folha vira
  a tinta da inversão.
- **Tinta** (`--tinta`): o texto de corpo, a manchete, os rótulos, o `⌃⌥T` sob o pacote — e
  **a placa do sistema escolhido** e o link de pular focado, os dois lugares onde a tinta
  vira fundo.
- **Tinta Fraca** (`--tinta-fraca`): tudo que é secundário — subtítulo, legendas, rótulos
  mono, texto das chamadas em repouso, observação da tabela, carimbo — e os ids de vinco do
  leque.
- **Vinco** (`--vinco`): o traço fraco — o **vale** da dobra. Borda das chamadas em repouso,
  linhas do corpo da tabela, borda da citação de sistema, o segundo fio do carimbo.
- **Vinco Forte** (`--vinco-forte`): o traço forte — a **montanha**. A moldura da prancha, o
  contorno do seletor e da linha de comando, o fio do topo, o primeiro fio do carimbo, o
  sublinhado de link em repouso, o polegar da barra de rolagem, a borda em zigue-zague do
  leque (1.5px), a linha e a seta das chamadas em repouso, o vinco da manchete, e o contorno
  do número de chamada e do número de nota.
- **Faceta A / Faceta B** (`--faceta-a`, `--faceta-b`): as **duas luzes extremas do leque**.
  Nenhuma faceta usa uma das duas pura: o gerador escreve um `--mix` por faceta e o CSS
  mistura as duas em `color-mix(in oklab, …)` na proporção do próprio ângulo — a alternância
  montanha/vale dá o salto, e o ângulo escurece devagar rumo à horizontal, então cada face
  pega a luz do próprio plano em vez de duas tintas chapadas se revezando. O `fill` simples
  antes do `color-mix` é o fallback de navegador antigo. Faceta A é também o fundo de hover
  discreto da folha inteira (seletor, chamadas, copiar, varredura).
- **Faceta Fio** (`--faceta-fio`): o traço de 1px entre facetas do leque, mais fraco que a
  silhueta para o zigue-zague externo continuar sendo o desenho.

### Named Rules (A Folha Miura)

**A Regra do Pigmento Único vale nos DOIS mundos, e aqui ela desce até o canal.** Uma matiz
no projeto inteiro, e ela é o vermelho `destructive` do app. Na folha a regra é mecânica:
**todo cinza é RGB igual** — o comentário dos tokens diz o porquê: "um canal desigual é um
cast azul entrando pela porta que ninguém olhou". O mundo anterior herdava cinzas-frios
azulados da folha de especificação da marca; este os recusa por construção. Teste, aqui como
lá: **matiz que não seja a do vermelho é bug** — e um cinza com canais desiguais também é.

**A Regra do Vermelho que Conta a História.** A matiz não decora nem enfatiza: ela marca **o
gesto e o que o indexa**. O pacote (o app fechado), a ação primária (instalar), o realce
aceso (o que a chamada aponta agora) — os três pontos da história que a página conta — e os
índices de desenho (id de vinco, número de nota, número de chamada aceso), mais os dois
sinais de resposta (copiado, varredura). O que **não** é vermelho, de propósito: o sistema
escolhido no seletor (inversão de tinta), a coluna de valor da tabela (mono em tinta — a
tabela argumenta por número, não por cor; no mundo anterior essa coluna era vermelha, e a
mudança é deliberada), qualquer título e qualquer prosa. Teste: um vermelho novo precisa ser
um gesto, um índice ou uma resposta; se for ênfase, é bug.

**A Regra das Superfícies que o Navegador Desenha.** As superfícies que ninguém lembra de
vestir são vestidas pela paleta: `::selection` (cota-fraca com tinta por cima), `caret-color`
e `accent-color` (cota), `scrollbar-color` (vinco-forte sobre transparente, `thin`), o
polegar `-webkit` de 12px com 3px de borda em campo para ele se ler como um traço, o
sublinhado de link (vinco-forte de 1px a 3px de distância, virando cota no hover) e o anel de
foco — **2px sólidos em cota, 2px de deslocamento, sem raio**. A lei do anel é a do app (2px
sólidos, sem raio); a tinta é desta folha: aqui o foco é a matiz, porque o foco é exatamente
a classe de coisa que a matiz marca — "isto, agora". Um azul de seleção padrão do sistema
seria uma segunda matiz entrando pela porta que ninguém olhou.

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

### A Folha Miura

**Display Font:** Chakra Petch (600, um peso só, com `Archivo`, `Helvetica Neue`, `Arial`,
`sans-serif`)
**Body Font:** Archivo (variável 100–900, com `Helvetica Neue`, `Arial`, `sans-serif`)
**Mono Font:** Azeret Mono (variável 100–900, com `ui-monospace`, `SF Mono`, `Menlo`,
`monospace`)
**A quarta família é do espécime, não da folha:** Geist Variable, a tipografia do app.

**Todas são auto-hospedadas**, copiadas de `node_modules` por `scripts/site.mjs`, no
subconjunto latino, `font-display: swap`, com as três da folha pré-carregadas no `<head>`.
Nenhuma requisição sai para um terceiro — é requisito do produto, não preferência técnica.

**Character:** três vozes com três trabalhos. Chakra Petch é a voz de exibição, **sempre em
caixa alta e sempre a 600** — o arquivo baixado é um peso só, e os cantos chanfrados da fonte
leem como papel dobrado: a tipografia repete a tese da folha. Archivo é a voz que explica, em
tudo que é frase. Azeret Mono é o instrumento: id de vinco, medida, comando e numeral —
e `font-variant-numeric: tabular-nums` está ligado no `body` inteiro, então nenhum numeral da
página saltita. A serifa do mundo anterior (Spectral) **saiu com ele**: esta folha não tem
serifa.

**A Geist mora no documento e trabalha no espécime.** Nenhum texto da folha a usa — ela
existe para o desenho da janela sair na fonte que a janela usa: enquanto o espécime era um
PNG ela viajava como pixel dentro dele, e agora que ele é DOM ela precisa estar aqui, ou a
janela sai na fallback do sistema e deixa de ser fiel. O `@font-face` dela fica no CSS da
**página** (e não dentro do espécime) porque `@font-face` é do documento, e o documento
alcança a shadow root; os **dois subconjuntos** com `unicode-range` vêm copiados de
`src/index.css`, e o navegador baixa só o latino enquanto nenhuma palavra do espécime pedir o
estendido.

**A pilha separada dos modificadores** (`--mono-atalho`). Os glifos `⌃` (U+2303) e `⌥`
(U+2325) não estão no subconjunto latino da Azeret Mono. A pilha acrescenta `Segoe UI Symbol`
(Windows) e `Noto Sans Symbols 2` (Linux) depois de `SF Mono` (mac), e ela é **a pilha de
todo `<code>`** (`code { font-family: var(--mono-atalho) }`) e do rótulo `⌃⌥T` do pacote —
um seletor de exceção só funciona enquanto alguém lembra de aplicá-lo. Até o `em` do
subtítulo ("some com *Escape*") é vestido com a pilha: tecla é grafia de instrumento, não
ênfase.

#### Hierarchy

- **Manchete** (Chakra Petch 600, `clamp(1.75rem, 3.4vw, 2.9rem)` — 28 a 46px —, altura
  1.14, `0.005em`, caixa alta, `text-wrap: balance`): a frase de assunto da primeira dobra.
  É um `<p>` com id, e não um heading — a hierarquia é `h1` NoCom e `h2` por prancha, e a
  manchete é assunto, não seção. Cruza-a o **vinco da manchete**: um traço de 92x1px em
  vinco-forte rodado a `--tombo` — um vinco, não um sublinhado. Abaixo de 720px ela cai para
  `clamp(1.5rem, 7vw, 2rem)`.
- **Rótulo de prancha** (Chakra Petch 600, 1.1875rem/19px, `0.14em`, caixa alta): o `h2` de
  cada prancha, precedido pelo id de vinco em mono cota (`M-01`…`M-04`).
- **Marca** (Chakra Petch 600, 1.125rem/18px, `0.22em`, caixa alta): o `h1` NoCom do topo, ao
  lado do anel.
- **Nome de peça** (Chakra Petch 600, caixa alta): os degraus menores da mesma voz — nome de
  sistema e `h3` de nota a 0.9375rem/15px (`0.1em`), o botão de instalar no mesmo corpo com
  `0.14em`, o nome de chamada a 0.875rem/14px (`0.1em`), os `h3` do carimbo a 0.8125rem/13px
  (`0.12em`). No mundo anterior um nome próprio não ia a versalete; neste mundo **todo
  display é caixa alta**, `macOS` inclusive — a voz de exibição tem uma forma só, e a grafia
  fiel do nome vive no seletor, que é mono.
- **Corpo** (Archivo 400, 1rem/16px, altura 1.55): a prosa. Subtítulo a 1.0625rem/17px;
  notas, alternativas, texto de chamada, legenda e carimbo a 0.9375rem/15px; dica do puxão e
  observação da tabela a 0.875rem/14px.
- **Medida** (Azeret Mono, 0.875rem/14px, `tabular-nums`): a coluna de valor da tabela — em
  **tinta**, não em cota: neste mundo a tabela argumenta por número, e o vermelho ficou com o
  gesto.
- **Mono de trabalho** (Azeret Mono, 0.8125rem/13px): os comandos, os botões do seletor, o
  botão de varredura, o número de chamada, os valores do topo, o numeral do ciclo, o link de
  pular e o `⌃⌥T` do pacote (13px dentro do SVG).
- **Rótulo mono** (Azeret Mono, 0.6875–0.75rem / 11–12px, `0.1em`–`0.14em`, caixa alta): o
  piso funcional — campos do topo, rótulo do seletor, botão de copiar, `via`, cabeçalho de
  tabela, rótulo do detalhe, rótulos do ciclo, número de nota, `cite`, id de vinco de
  prancha.
- **Dentro do SVG do palco:** numeral de balão a 12px, `⌃⌥T` a 13px — e os **ids de vinco do
  leque a 10px**, o único texto abaixo de 11px da página: gramática da forma num desenho
  `aria-hidden`, igual nas duas línguas, não texto funcional.

#### Named Rules (A Folha Miura)

**A Regra da Voz Única de Display.** A voz de exibição é **um arquivo**: Chakra Petch 600,
sempre caixa alta. Não há display em outro peso, em caixa baixa nem em outra família — peso e
caso não são variáveis desta voz, e a hierarquia dentro dela se faz por tamanho e tracking
(0.22em na marca, 0.14em na zona e no botão, 0.1em no nome de peça). Teste: um segundo
arquivo de Chakra Petch no diretório de fontes é bug.

**A Regra da Tecla em Mono.** Toda menção de tecla ou comando é `<code>` na pilha
`--mono-atalho` — inclusive o *Escape* do subtítulo, marcado `<em>` e vestido de mono pelo
CSS. Tecla é grafia de instrumento; itálico diria ênfase, que é outra coisa. E a pilha cobre
os glifos `⌃`/`⌥` nos três sistemas, então `⌃⌥T` nunca cai num retângulo vazio.

**A Regra do Numeral que Não Saltita.** `font-variant-numeric: tabular-nums` está no `body`:
a tabela, os campos do topo, os números de chamada e as datas do espécime reescritas no
navegador ficam estáveis por herança, e não por lembrança. É a Regra do Número Tabular do
app, aplicada por atacado — e é ela que deixa o realce da chamada 3 cravado quando a data
muda de mês.

**A Regra do Piso Funcional de 11px.** Nenhum texto **funcional** desce abaixo de 11px
(`0.6875rem`). Os ids de vinco do leque estão a 10px e não a furam: vivem num SVG
`aria-hidden`, não carregam conteúdo (são iguais nas duas línguas) e somem com o leque no
palco estreito. O diagrama do ciclo continua sem texto nenhum dentro do SVG — numeral e
rótulos são HTML no fluxo, porque texto que escala com a coluna furaria o piso no telefone.

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

### A Folha Miura

**A folha é uma coluna única de pranchas sobre um campo de vincos**, com uma primeira dobra
de duas colunas antes delas. Não há grade global de doze colunas, não há barra de navegação e
não há rodapé de links: há o topo, a primeira dobra, quatro pranchas e o carimbo.

- **A coluna da folha:** máx. 1240px, centrada, margem lateral `clamp(16px, 4vw, 56px)`,
  64px de respiro no pé.
- **Topo:** grade `minmax(0, 1fr) | auto | auto` alinhada ao centro — a marca (40px,
  sangrando no próprio campo preto) com o nome em display, os dois campos do desenho (`dl`
  mono: **versão e licença, e nada mais**) e o link da outra língua. Fecha com um fio de 1px
  em vinco-forte. A 860px os campos somem — versão e licença continuam na tabela e no
  carimbo.
- **A primeira dobra** (`.dobra-abre`): grade `minmax(340px, 5fr) | minmax(0, 7fr)` com
  `min-height: min(88vh, 820px)` — o argumento à esquerda (máx. 34rem), a implantação à
  direita, alinhados ao centro. O argumento empilha manchete, subtítulo (máx. 30rem), botão
  de instalar, seletor (34px abaixo) e o aviso de celular quando é o caso. **A ação primária
  fica ao lado da prova**, na primeira dobra, não no pé da página.
- **O palco:** 600x520px fixos, centrado na coluna da direita. O leque desenha **para fora do
  próprio viewBox de propósito** (`overflow: visible`): as facetas longas sangram acima do
  palco e à direita dele, papel que não coube na prancha. A legenda respira 46px abaixo — o
  rótulo `⌃⌥T` do pacote assenta 23px abaixo do palco, e a legenda vem depois dele, não por
  cima.
- **As pranchas:** empilhadas com 30px entre elas; recuo interno `--recuo-prancha`
  (`clamp(18px, 2.6vw, 36px)`). A prancha da janela é uma grade `6fr | 5fr` (chamadas à
  esquerda; detalhe e ciclo à direita); instalar e números dividem uma grade `7fr | 5fr`
  (`.par-pranchas`, goteira de 30px); notas e carimbo fecham a folha.
- **Pontos de quebra, e o que cada um resolve:** **1080px** a primeira dobra, a grade da
  janela e o par de pranchas empilham em coluna única; **860px** o topo perde os campos do
  desenho; **720px** o palco troca por completo — saem o leque, o botão do pacote e a dica do
  puxão, entra a marca compacta do pacote acima da janela (`.pacote-movel`), o palco vira
  360x480 com `overflow: clip`, o SVG estreito (só realces) substitui o largo e a janela
  chega implantada, porque sem leque não há origem para dobrar; **420px** a folha aperta para
  12px de margem e a prancha para `18px 14px` — é o que dá lugar aos 360px da janela em 1:1
  numa tela de 390 sem uma barra de rolagem.
- **Medidas de linha declaradas** onde há prosa: 34rem no argumento, 30rem no subtítulo, 46ch
  na legenda do palco, 62ch no corpo das notas. O aviso de celular não tem medida: uma faixa
  que interrompe a página ocupa a largura da página.

### Named Rules (A Folha Miura)

**A Regra do Palco que Sangra.** O leque não é recortado pelo palco: `overflow: visible`, e a
geometria do gerador conta com isso — o raio longo de 600 foi dimensionado para a borda em
zigue-zague contornar a janela por cima e pela direita **sem** a sangria alcançar o topo da
página (600 − 498 = 102px de sangria, contra ~116px até o fio do cabeçalho). Papel dobrado
não respeita a caixa de quem o segura; o que o contém é a conta, não o recorte.

**A Regra da Janela que Chega Implantada.** Onde o leque não existe (≤720px), o gesto de
dobrar não existe: a janela chega aberta, o atalho não dobra nada e a marca compacta do
pacote guarda a origem da história. Uma dobra sem origem visível seria a janela sumindo para
dentro de nada — o dispositivo sai inteiro, nunca pela metade.

**A Regra do Canto que Custa a Margem.** Abaixo de 420px a prancha sangra até quase a borda
da viewport (12px) para os 360px do espécime caberem em 1:1. A escala é a claim; a margem é o
que se paga por ela no estreito.

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

### A Folha Miura

**A folha tem profundidade, e ela é contada em planos de papel: uma sombra por plano.** É a
inversão declarada do mundo anterior — que tinha zero sombra, por decisão — e não uma deriva:
o mundo mudou de metáfora. Uma prancha de cotas é um papel só; uma folha Miura é papel
**sobre** papel, e papel de verdade levanta da mesa.

Os planos, de baixo para cima:

- **O campo** (`--campo` + o padrão de vincos): a mesa. Não projeta nada.
- **A prancha**: papel fosco um tom acima, com o **dente** de `feTurbulence` (ruído de croma
  zero em data-URI que escurece de leve no claro e clareia de leve no escuro — um arquivo
  para os dois temas), fio de 1px em vinco-forte e **uma sombra**: `--sombra-prancha`
  (`0 14px 28px -22px rgb(0 0 0 / 0.32)` no claro; `-20px` e alfa `0.72` no escuro, porque no
  escuro a mesma separação pede uma sombra mais funda).
- **O espécime**: a única coisa que flutua de verdade, e por isso a única sombra grande da
  página — `0 24px 48px -24px rgb(0 0 0 / 0.4)` (no estreito, `0 16px 32px -18px`). No mundo
  anterior essa sombra vinha fotografada no PNG; agora que o espécime é DOM, a folha a
  desenha — e ela continua sendo **a borda física do app contra o que está atrás**, o mesmo
  papel que a seção d'A Vidraça atribui à sombra do sistema operacional.

O resto da profundidade continua sendo **tom e linha**: a linha de comando, a vidraça do
detalhe e a citação de sistema são caixas de campo sobre a prancha (um tom para dentro), e o
leque simula os planos das próprias facetas **por luz** (`--mix` + `color-mix`), não por
sombra.

### Shadow Vocabulary (A Folha Miura)

- **Sombra de prancha** (`box-shadow: var(--sombra-prancha)`): toda prancha, e nada além de
  prancha. Difusa, deslocada para baixo, spread negativo — papel a milímetros da mesa.
- **Sombra do espécime** (`box-shadow: 0 24px 48px -24px rgb(0 0 0 / 0.4)`): só a janela.
  Quase o dobro da altura da prancha, porque a janela é a única coisa que flutua de verdade.

### Named Rules (A Folha Miura)

**A Regra de Uma Sombra por Plano.** Sombra marca **plano de papel**, nunca estado nem
controle: a prancha tem a dela, o espécime tem a dele, e nenhum botão, hover, foco ou faceta
projeta nada. As três ocorrências de `box-shadow` em `site/folha.css` são exatamente essas
(a terceira é o espécime no estreito), e a busca é a verificação. Se algo parece precisar de
sombra para se destacar, ele precisa é de um tom (campo dentro de prancha), de um fio, ou da
luz de faceta.

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

### A Folha Miura

**Canto reto, canto dobrado e paralelogramo — e nenhuma curva.** Continua não existindo um
`border-radius` na folha, em nenhum valor, em nenhum elemento, o anel de foco incluso. O que
mudou do mundo anterior é que a forma deixou de ser só o retângulo: **a folha dobra**.

- **O canto dobrado** (`.prancha::before` / `::after`): o canto superior direito de toda
  prancha é uma dobra de 16x28 — o triângulo mostra o **campo** atrás (papel dobrado revela a
  mesa) e o vinco diagonal é um gradiente de 1px a **60°, o ângulo da tesselação**
  (`atan(28/16)`). Papel de verdade dobra para trás, não arredonda: esta é a assinatura de
  forma da folha.
- **O paralelogramo com o tombo da dobra** (`--tombo: -14deg`): botão de instalar, células do
  seletor, número de chamada, número de nota e balão são caixas em `skewX(var(--tombo))` — e
  **todo paralelogramo destomba o próprio conteúdo** com um `<span>` interno em
  `skewX(calc(var(--tombo) * -1))`, que o gerador emite exatamente para isso. Caixa tombada,
  letra em pé. O vinco da manchete usa o mesmo ângulo em `rotate`.
- **O leque**: doze facetas triangulares com raios alternando 600/520 a partir da origem
  (84, 498) — a silhueta externa é o zigue-zague da dobra, traçado como uma `polyline`
  contínua de 1.5px que faz as pontas soltas lerem como **uma** folha. O pacote é um quadrado
  de 54px rodado a −8°, o fecho do leque.
- **As setas** (chamadas e ciclo) continuam **polígonos preenchidos** de três pontos,
  desenhados no SVG, e não `marker-end`: um marcador escala com a espessura do traço e a
  ponta engorda quando o fio é 1px.
- **O vocabulário de linha:** 1px em vinco (o vale — divide), 1px em vinco-forte (a montanha
  — delimita e contorna o que responde), 1.25px em cota (o realce), 1.5px em vinco-forte (a
  silhueta do leque), e o carimbo fecha com **dois fios** (vinco-forte e vinco a 3px), como a
  dobra dupla que fecha uma folha de verdade. A dica do puxão desenha a tecla com
  `border-bottom-width: 2px` — um teclado de um traço.

### Named Rules (A Folha Miura)

**A Regra do Canto Reto (herdada e mantida).** Nenhum elemento tem raio; não há exceção de
tamanho, componente ou estado, e o anel de foco também é reto. Teste: um `border-radius`
computado diferente de `0` nesta página é bug. (Nos dois mundos a lei é oposta e as duas
estão certas: a janela é um objeto de interface e arredonda por isso; a folha é papel.)

**A Regra do Ângulo Único.** A dobra tem **um** ângulo de tombo, `-14deg`, e ele mora num
token. Botão, seletor, números, balão e o vinco da manchete tombam por ele; o canto dobrado
usa o ângulo da tesselação (60°) porque é outra geometria — a da dobra diagonal, não a do
tombo. Um paralelogramo novo que escolha um terceiro ângulo quebra a tesselação: ou é
`--tombo`, ou é a diagonal do canto, ou não entra.

**A Regra do Conteúdo em Pé.** Tombar a caixa nunca tomba a letra: todo elemento em
`skewX(var(--tombo))` carrega o `<span>` que desfaz o tombo no conteúdo, e o gerador emite o
`<span>` junto com o controle. Quem cria um paralelogramo novo cria o par, ou o texto sai
tombado e ilegível no pior lugar possível: dentro de um botão.

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
não merecem botão permanente: **Mover para** (as outras abas), **Repetir** (nunca /
todo dia / toda semana / todo mês) e, desde o Adendo 14, **Lembrar** (não lembrar / na
data / um dia antes / uma semana antes) — e é o lugar canônico das opções futuras dessa
classe. O terceiro item chegou sem custar um pixel a nenhuma superfície permanente, que
é a prova de que a exceção declarada abaixo estava paga. Ele é a **exceção declarada** à Regra da Vista que Troca, com o argumento
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
- **O sino do lembrete** (Adendo 14) é o irmão do glifo acima e usa exatamente a mesma
  régua: 12px, névoa, `title` e `aria-label` com a frase inteira. Dois metadados na
  mesma linha só não viram ruído porque nenhum dos dois é tinta — se um deles ganhasse
  cor, a linha passaria a ter duas hierarquias competindo com o texto que a pessoa
  escreveu.
- **A hora do lembrete só existe no `title` do sino** ("Avisa na data, às 09:00"),
  escrita na convenção do sistema. Ela é fixa e não é escolhível, então um controle para
  ela seria altura gasta com uma decisão que ninguém tomou — mas escondê-la por completo
  faria o usuário descobrir a hora só quando o aviso chegasse, que é tarde demais para
  ser informação.
- **O sino muda o que promete depois de tocar.** Com o aviso já dado, o `title` passa a
  falar no passado ("O aviso deste lembrete já foi dado"). A tinta é a mesma — o que
  mudou não é o estado da tarefa, é o que a marca promete —, e um sino que continua
  dizendo "avisa na data" depois de ter tocado afirma um futuro que não existe.
- **"Lembrar" desabilita, e desabilita em duas alturas.** O submenu inteiro fica cinza
  quando não há data única e por vir no título **e** não há lembrete marcado; dentro
  dele, os três períodos ficam cinza sem data válida, e **"Não lembrar" nunca**. As duas
  metades pagam por si: o item cinza é o que conta, a quem nunca escreveu uma data no
  título, que escrever uma faz algo; e o cancelamento precisa continuar alcançável
  depois de a data ter passado ou ter sido apagada, senão o sino tranca na linha.
- **Nenhuma cor entra com o lembrete.** Vermelho continua sendo erro e hoje (Regra do
  Pigmento Único), e a data de um lembrete armado tem exatamente a mesma pílula que a de
  uma tarefa sem aviso nenhum. Uma tarefa que vai notificar **não parece diferente** de
  uma que não vai, e é essa indiferença visual que segura a linha do PRODUCT.md.

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

### A Folha Miura

O caráter é **instrumental e dobrado**: quase todo componente é um retângulo de fio com texto
dentro, e os que carregam gesto ou índice são paralelogramos no tombo da dobra. **Os
preenchimentos contam nos dedos, e cada um diz uma coisa:** tinta cheia no sistema escolhido e
no link de pular (inversão), cota no pacote, no botão de instalar e no número de chamada
aceso (gesto e índice), cota-fraca no realce, na chamada escolhida e no aviso de celular
(isto, agora). Todo o resto é papel, fio e luz de faceta.

#### O palco de implantação (componente-assinatura)

É a primeira dobra inteira dita em geometria: o app fechado (o pacote), o gesto (`⌃⌥T`) e o
app aberto (a janela real), ligados pelo leque que se desdobra.

- **O leque é calculado pelo gerador** (`leque()` em `scripts/site.mjs`), não desenhado à
  mão — coordenada calculada não diverge de coordenada copiada. Origem no centro do pacote
  (84, 498), abaixo e à esquerda da janela, a região que as chamadas não usam; doze facetas
  entre os ângulos da constante `LEQUE` (`a0: -100`, `a1: -6`), raios alternando 600/520 para
  a silhueta externa virar o zigue-zague da dobra. Cada faceta sai com três variáveis
  escritas no `style`: `--i` (a ordem de abertura, contada a partir da mais deitada — um
  leque de verdade abre a partir do fecho), `--fecha` (quantos graus ela roda para deitar
  sobre a última espoca, fechada no pacote) e `--mix` (a luz da faceta — ver Colors).
  **Achado aberto:** o comentário do bloco 3b ainda diz "entre -87 e -6 graus"; a constante
  diz `a0: -100`. Um comentário de geometria que mente não quebra nada — só ensina o número
  errado à próxima pessoa.
- **O pacote:** quadrado de 54px em cota, rodado a −8°, com o anel da marca em sobre-cota e o
  rótulo `⌃⌥T` (mono, 13px, tinta) 45px abaixo do centro. É a única tinta vermelha do palco
  além do realce — o fecho do leque, o app fechado.
- **O controle de verdade é um botão invisível** (`.pacote-botao`, 62x62, rodado a −8°) sobre
  o desenho do pacote: o SVG inteiro é `aria-hidden`, então foco, teclado e leitor de tela
  passam pelo botão (`aria-label` "Dobrar ou desdobrar a janela (⌃⌥T)", `aria-pressed` com o
  estado, anel de foco em cota a 3px). O desenho só aparece.
- **A janela viva** (`.janela-viva`): o espécime e os SVGs de chamada, juntos, com
  `transform-origin` na origem do leque — dobram e desdobram como uma coisa só, a partir do
  pacote.
- **A entrada, uma vez** (`IntersectionObserver`, `threshold: 0.25`, `unobserve` na primeira
  interseção → classe `.desenhada`): as facetas abrem em 680ms na
  `cubic-bezier(0.16, 1, 0.3, 1)` — a mesma `ease-settle` do app — escalonadas a 34ms por
  faceta; a janela desdobra em 640ms com 300ms de atraso; a borda em zigue-zague **espera o
  leque abrir** (opacidade em 420ms com 900ms de atraso — ela é a soma das facetas, e some
  com elas); as linhas de chamada correm em 460ms a partir de 620ms, e balões, setas e
  numerais entram por último (900ms). Sem `IntersectionObserver`, tudo chega desenhado.
- **A dobra** (`.dobrado`, alternada por `⌃⌥T` — `ctrlKey + altKey + code === "KeyT"`, com
  `preventDefault` — ou pelo clique no pacote): a janela recolhe primeiro (`scale(0.05)`,
  520ms numa curva de aceleração, `cubic-bezier(0.5, 0, 0.75, 0.4)`, com `visibility`
  trocando só ao fim), e o leque fecha **depois**, na ordem inversa à da abertura (560ms,
  atraso de `220ms + (11 − i) × 24ms`); a borda some na hora. Desdobrar refaz a abertura
  pelas transições de base. **Dobrar é tão desenhado quanto desdobrar** — e o puxão só
  responde depois de `.desenhada`: antes da entrada, não há o que dobrar.
- **A marca compacta** (`.pacote-movel`): no palco estreito o leque some e um pacote de 34px
  com o rótulo `⌃⌥T` sobe para cima da janela — a origem do gesto continua contada, mesmo
  onde a dobra não existe.

#### O espécime (a janela de verdade, e não uma foto dela)

O que está na página é **o DOM montado do app dentro de uma shadow root declarativa**
(`<template shadowrootmode="open">`), com o CSS do app inline dentro dela — extraídos por
`npm run vitrine` para `assets/especime/`. É verdade do produto, e a folha **não o
restiliza**: o isolamento da shadow root vale nos dois sentidos (o reset do app não vaza para
a folha; a tipografia da folha não vaza para a janela).

- **Por que shadow root:** o CSS do app é Tailwind v4, que emite `:root,:host` justamente
  para funcionar ali — entra verbatim, sem reescrever um seletor. Os `@property` do Tailwind
  vão para o `<head>` do documento, porque dentro de shadow root eles são ignorados (sem
  eles, o campo do espécime aparecia sem borda no Chromium, sem um erro no console).
- **Por que o CSS vai inline:** uma folha ligada de dentro da shadow root não bloqueia a
  pintura, e o espécime apareceria sem estilo por um instante na primeira dobra — o pior
  lugar da página para um lampejo. 24 kB (5 kB comprimidos), menos que o PNG que substituiu.
- **O tema é o do visitante pelo mesmo mecanismo do app:** `@media (prefers-color-scheme)` é
  do documento e atravessa a shadow root. Foi assim que os dois PNGs e o `<picture>` que
  escolhia entre eles saíram da página.
- **Acessibilidade:** `role="img"` com uma etiqueta só — sem isso o leitor de tela leria sete
  tarefas, dois nomes de aba e cinco botões de remover. O foco é neutralizado por
  `tabindex="-1"` escrito na extração (não `inert`, que apagaria o `aria-label` e deixaria o
  desenho sem nome).
- **O fallback:** um parágrafo de luz (`.especime-ausente`) com a mesma frase do
  `aria-label`. Host sem `<slot>` não renderiza filho de luz, então quem prende a shadow root
  nunca o vê, e quem não prende vê só ele — uma fonte de texto, não duas.
- **O espécime não envelhece:** a data de hoje e a futura (+3 dias) são **reescritas no
  navegador de quem visita** (`atualizarDatas` em `site/folha.js`), na ordem da língua
  (`data-ordem`: dia/mês em português, mês/dia em inglês), preservando o
  `<span class="sr-only"> (hoje)</span>` — só o primeiro nó de texto muda. O formato tem
  largura fixa e a página é `tabular-nums`, então a caixa medida em `cotas.json` vale em
  qualquer dia do ano. Quem decide **qual** pílula é vermelha continua sendo o app (a classe
  veio na extração, conferida por `conferirHoje`) — decidir aqui seria uma segunda cópia da
  regra que mora em `src/lib/dates.ts`.

#### As chamadas de detalhe

Cinco chamadas na ordem da história de uso (1 o campo, 2 as abas, 3 a data, 4 a concluída,
5 a saída), e **as regiões são medidas, não escritas**: `npm run vitrine` mede cada uma no
DOM real, por seletor, e grava `assets/especime/cotas.json` — **por língua**, porque o risco
da concluída mede 180px em português e 164px em inglês. O que fica em `CHAMADAS`
(`scripts/site.mjs`) é só a decisão de composição que nenhuma medição toma: de que **lado** o
balão fica, e se o `detalhe` mostra um pedaço menor que a região (o campo tem 334px e a 2:1
não caberia na vidraça; realçar só o pedaço recortado contornava meio campo de texto, o que
se lê como defeito do app). Da lista única saem o realce largo (somado a
`JANELA = {esq: 130, topo: 30}`), o estreito (somado a zero), o balão, a linha, a seta e o
recorte do detalhe.

- **A lista é o controle:** botões com borda de 1px em vinco (vinco-forte e fundo faceta-a no
  hover; borda cota e fundo cota-fraca no escolhido), grade `34px | 1fr`, nome em display
  caps, texto em tinta-fraca que sobe para tinta. O número é um paralelogramo de 26px em
  contorno vinco-forte que **acende em cota preenchida** quando escolhido.
- **No SVG:** balão de 20x20 em folha com contorno vinco-forte, **tombado a `--tombo`** — o
  mesmo paralelogramo do número da lista, para a lista e o palco se lerem como o mesmo objeto
  visto duas vezes; linha e seta em vinco-forte, a ponta assentando 2px antes da aresta e
  apontando para dentro. A chamada acesa pinta balão, numeral, linha e seta em cota, e o
  **realce** é um retângulo de contorno cota de 1.25px com **preenchimento em cota-fraca** —
  translúcido: a interface embaixo continua legível através dele. A troca é transição de
  160ms em opacidade e 120ms em cor, não um movimento novo.
- **A chamada não escolhida não desaparece:** fica à vista em cinza (vinco-forte e tinta) —
  quem não vê que existem cinco não clica na segunda.
- **Três eventos escolhem** (`click`, `focus`, `mouseenter`): o foco é o que faz Tab
  funcionar sem um segundo caminho de código, e o hover é a prévia que só o mouse consegue
  pedir. A primeira chamada entra escolhida — um detalhe vazio parece uma vidraça quebrada.
- **O detalhe 2:1 é o próprio espécime, clonado** (`clonarEspecime`): a vidraça de 132px
  clona o DOM (a shadow root não vem no `cloneNode`; ela é recriada com o mesmo conteúdo, com
  o `<style>` do app já parseado) e o amplia por `transform: scale(2)` — **amplia texto**,
  nítido em qualquer escala, onde o recorte de PNG do mundo anterior gastava toda a resolução
  do raster. Economiza os 28 kB da duplicata de marcação e não tira nada de ninguém: a
  vidraça já era só-com-JavaScript (`.sem-js .detalhe`).
- **O recorte é calculado e preso:** centrado na região, depois **preso dentro dos 360x480**
  da janela (sem isso o recorte da data mostrava o campo atrás do espécime como um bloco de
  outra cor); região mais larga que a vidraça **alinha pelo começo**, não pelo centro
  (centralizar corta o início do campo de texto, que é onde a leitura começa). Recalculado no
  `resize`; o deslize da lente é transição de 220ms na `ease-settle`.
- **Um dispositivo morto, registrado como achado aberto:** `.chamada-explicacao` — o
  parágrafo que o JavaScript preenche com a frase da chamada escolhida — está `display: none`
  em todas as larguras. Ou ganha o ponto de quebra que o mostre, ou sai do HTML e do JS: hoje
  é escrita que ninguém lê.

#### O diagrama do ciclo de 2 s

Mantido do mundo anterior, porque ele mede o gesto e não a janela: SVG só com linha, setas e
a faixa de varredura (nenhum texto — o numeral `2 s` e os rótulos são HTML, pelo piso
funcional); varredura de `stroke-width: 5` a 0.35 de opacidade, 458 unidades declaradas no
CSS e ancoradas na geometria do SVG; **2000ms lineares que só correm a pedido**, com o botão
(paralelogramo de fio, "Correr os 2 segundos") em `aria-disabled` durante a corrida. O bloco
é `aria-hidden`; a voz é a legenda e o texto das chamadas.

#### O seletor de sistema

- **Três células de dobra lado a lado:** paralelogramos mono de 13px num contorno partilhado
  de 1px em vinco-forte (`border-left-width: 0` a partir do segundo), fundo folha e texto
  tinta-fraca em repouso, faceta-a e tinta no hover, e o escolhido **invertido em tinta
  cheia** com texto em folha. O estado mora em `aria-pressed`
  (`button[aria-pressed="true"]`), não numa classe.
- **O que ele filtra:** todo `[data-sistema]` — o bloco de instalação e os painéis da nota de
  primeira abertura. Um painel novo entra na filtragem só por carregar o atributo.
- **A escolha inicial é palpite, não decisão** (`userAgentData.platform` → `platform` →
  `userAgent`; macOS na falta de resposta): o seletor está logo ali e o custo de errar é um
  clique. A checagem de celular vem **antes** — o Android chega com `linux` no `userAgent` e
  o iPad moderno se anuncia `macintosh`.
- **Sem JavaScript o seletor não aparece** (`.sem-js .seletor`) e os três sistemas ficam à
  vista: a folha degrada para a página que ela era, e aquela página funcionava.

#### O aviso de celular

Faixa em cota-fraca (Archivo 15px, sem medida de linha), `hidden` no HTML e desescondida
quando a visitante está num telefone ou tablet: uma página que entrega um `brew` a quem não
tem onde rodá-lo está falhando em silêncio. Mesmo no telefone um sistema fica escolhido e o
seletor segue funcionando — a folha só diz primeiro que a instalação não é para agora.

#### A linha de comando e o copiar

- Caixa de **campo** sobre a prancha (um tom para dentro), fio de 1px em vinco-forte; o
  `<code>` é 13px na pilha `--mono-atalho`, com rolagem horizontal própria
  (`white-space: nowrap`, `scrollbar-width: thin`): um comando longo rola dentro da caixa em
  vez de quebrar ou esticar a coluna.
- **Botão copiar:** dentro da caixa, separado por `border-left`, rótulo de 11px caps com
  ícone SVG de 12px em `currentColor`; hover em faceta-a e tinta; no estado `copiado` troca
  **ícone e palavra** e fica em cota por 1800ms. O `aria-label` carrega o comando inteiro, e
  texto de atributo passa por `escaparAtributo` — o comando do `xattr` carrega aspas que,
  cruas, terminavam o atributo no meio.
- **Sem JavaScript o botão não existe** (`.sem-js .copiar`); sem `navigator.clipboard`, o
  clique **seleciona a linha** em vez de fingir que copiou — e cada desfecho é anunciado na
  região viva (`#aviso-vivo`, `role="status"`, `aria-live="polite"`).

#### A tabela, as notas, a citação e o carimbo

- **Em números** (prancha M-03): cabeçalho em 11px mono caps sobre fio vinco-forte, linhas do
  corpo em fio vinco, característica a 15px peso 500, **valor em mono tinta** (`nowrap`),
  observação a 14px tinta-fraca; a caixa rola no estreito (`.rolo`). Oito linhas, quatro
  zeros primeiro, `360 × 480` como linha conferível — a tabela argumenta por número, e é por
  isso que a coluna de valor não é vermelha neste mundo.
- **Notas** (prancha M-04): grade `96px | 1fr`; o número é um paralelogramo de fio
  vinco-forte com o texto em **cota** a 12px caps — índice de desenho. Abaixo de 720px o
  número sobe para cima do corpo.
- **Citação de sistema** (`blockquote.sistema`): a frase que o macOS ou o SmartScreen
  realmente mostra, em itálico sobre **campo** com fio de 1px em vinco e `cite` de 11px caps
  dizendo de quem é a voz. É citação, não aviso — a faixa tinta do mundo anterior saiu: a
  matiz desta folha marca gesto e índice, e a frase de outro sistema não é nem um nem outro.
- **Carimbo:** fecha a folha com **dois fios** (vinco-forte, e vinco a 3px — a dobra dupla),
  três campos em grade com `h3` em display 13px caps e parágrafos de 15px em tinta-fraca.
- **Topo:** a marca sangrando no próprio campo preto (as frações de `assets/marca/`), o nome
  em display `0.22em`, versão e licença em `dl` mono, o link da outra língua. O primeiro
  elemento focável da página é o link de pular ("Ir para a instalação"), tinta cheia quando o
  Tab o alcança.

#### Named Rules (A Folha Miura)

**A Regra do Que a Página Afirma, Ela Desdobra.** O argumento central não é dito, é
**executado**: a página promete que o app abre num puxão, e `⌃⌥T` dobra e desdobra a janela
na própria página. Corolário para conteúdo novo: uma afirmação sobre o comportamento do app
entra como demonstração, como chamada apontando pixels reais, ou como linha conferível da
tabela — nunca como frase de venda solta.

**A Regra da Dobra nos Dois Sentidos.** Um estado que se alterna é desenhado **nos dois
sentidos**, e a volta não é o replay da ida: dobrar recolhe a janela primeiro e fecha o leque
depois, em ordem inversa e numa curva de aceleração; desdobrar abre na `ease-settle`. Sob
`prefers-reduced-motion`, **cada estado fechado é desligado um a um**: eles têm transições
próprias e mais específicas que a base, e um `transition: none` genérico deixava o `⌃⌥T`
ainda animando o recolhimento.

**A Regra da Entrada que Acontece Uma Vez.** O único movimento que começa sem gesto é a
entrada do palco e das linhas de chamada, e ele acontece **uma vez**
(`IntersectionObserver` com `unobserve`; sem observer, tudo chega pronto). Cada traço corre o
próprio comprimento (`--corrida`, escrito pelo JS via `getTotalLength()`): a linha corre na
velocidade do desenho, não na do CSS. Rolar de volta não redesenha nada, e a troca de chamada
é transição de cor e opacidade, nunca o redesenho.

**A Regra da Varredura que Só Corre a Pedido.** A única coisa cronometrada da folha é a
varredura de 2000ms, e ela não começa sozinha: tem botão com rótulo escrito, `aria-disabled`
durante a corrida. Nada nesta folha entra em laço, e nada é ambiente — um número que se anima
sozinho seria um anúncio, não uma medida.

**A Regra do Espécime Intocável.** O espécime é **verdade do produto**: o DOM e o CSS que a
extração gravou entram verbatim, e a folha nunca escreve uma regra de estilo que alcance o
interior da shadow root. Se a janela parece errada no site, o defeito é do app ou da extração
(`npm run vitrine`), e é lá que se conserta. A Geist existe no site só para ele; um texto da
folha em Geist é bug tão certo quanto um título do espécime em Chakra Petch.

**A Regra da Fonte Única de Geometria (herdada, e agora medida).** Uma coordenada do desenho
é declarada uma vez e todo o resto deriva dela — e neste mundo a fonte é **medida**:
`cotas.json` sai do DOM real por seletor, por língua; `CHAMADAS` guarda só a decisão de
composição (lado do balão, recorte do detalhe); `JANELA` é a origem única do palco largo; e o
leque inteiro sai da constante `LEQUE`, calculado em node. Teste: uma coordenada de pixel
escrita à mão em `folha.css`, `folha.js` ou no HTML gerado é bug. Corolário: `regiao` e
`detalhe` podem ser dois campos porque respondem a perguntas diferentes ("onde isto fica" e
"como isto é de perto"); o que não pode é a mesma pergunta ter duas respostas.

**A Regra do Controle de Verdade sobre o Desenho.** Um desenho `aria-hidden` nunca é o
controle: quem age é um elemento de verdade por cima dele (o botão invisível do pacote) ou ao
lado dele (a lista de chamadas, o botão da varredura), com `aria-pressed` e `aria-label`
carregando o estado. O que a tela mostra e o que o leitor de tela anuncia têm de ser um fato
só — e é por isso que a inversão se desenha **a partir de** `aria-pressed`, nunca de uma
classe.

**A Regra da Inversão para o Escolhido (herdada, com a mesma leitura).** Escolhido se marca
invertendo **com a tinta que o elemento já usa**: o sistema escolhido vira placa de tinta com
texto em folha (o seletor é um controle de tinta); o número de chamada escolhido preenche em
cota com o algarismo em sobre-cota (o número aceso é índice do desenho, e o desenho aceso é
cota). E inverte-se o menor elemento que carrega o estado — o número, não a linha: a linha
escolhida ganha só a borda em cota e o fundo em cota-fraca.

**A Regra do Seletor que Não Promete Setas.** O seletor é `role="group"` com `aria-pressed`,
e não um `tablist`: a página não cumpre a navegação por setas que um tablist promete. Herdada
da faixa de abas do app, pela mesma regra — não anunciar semântica ARIA que a interface não
cumpre.

**A Regra da Página que Sobrevive ao JavaScript.** O que `.sem-js` esconde é exatamente o que
não pode agir sem JavaScript — **o seletor, o botão do pacote, a dica do puxão, o detalhe 2:1
e os botões de copiar** — e nada disso é conteúdo: os três sistemas ficam à vista, os
comandos continuam selecionáveis, a lista de chamadas se lê como lista numerada, o leque
chega aberto e a janela implantada. Nenhum `hidden` escrito pelo JavaScript pode ser a única
via até uma informação. Teste: desligue o JavaScript e leia a folha inteira.

**A Regra do Dicionário Canônico.** Todo texto da página mora no dicionário de
`scripts/site.mjs`: o português é canônico, o inglês é conferido chave a chave
(`conferirDicionario` aborta com chave faltando ou sobrando), a versão vem do `package.json`,
e o HTML gerado nunca é editado à mão — o `--check` da CI para a publicação se o disco
divergir. Texto que entra em atributo passa por `escaparAtributo`. Corolário: corrigir uma
frase é corrigir o dicionário; corrigir o HTML é criar uma divergência que a CI vai acusar.

**A Regra de Um Estado, Uma Voz (na folha).** Todo desenho decorativo é `aria-hidden`, e o
que ele diz é redito em texto de verdade ao lado: o leque e os SVGs de chamada são
`aria-hidden` (a legenda diz a escala por escrito e o texto de cada chamada diz o que o
realce mostra), o diagrama do ciclo idem, o detalhe é `aria-hidden` porque a chamada
escolhida já se anuncia pelo próprio botão, e a cópia anuncia o desfecho na região viva. O
espécime fala por uma etiqueta só. É a mesma regra que o app declara sobre a pílula do
contador: o desenho para o olho, a frase para quem ouve.

## Do's and Don'ts

**As duas primeiras listas governam A Vidraça — a janela do aplicativo.** As duas últimas
governam A Folha Miura — a landing page em `site/`. Uma regra de um mundo não é argumento
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

### Do (A Folha Miura):

- **Do** manter todo canto sem raio e resolver profundidade com **uma sombra por plano de
  papel** (prancha, espécime) — nunca em controle, estado ou faceta. As buscas em
  `site/folha.css` são o teste: zero `border-radius`, três `box-shadow`.
- **Do** usar o vermelho `destructive` do app como a única matiz, e só em **gesto, índice ou
  resposta**: pacote, ação primária, realce aceso, id de vinco, número de nota, estado
  copiado, varredura, foco.
- **Do** manter todo cinza novo em **RGB igual** — um canal desigual é um cast entrando pela
  porta que ninguém olhou.
- **Do** tombar superfícies de gesto e índice a `--tombo` (-14deg) e **destombar o conteúdo
  com o `<span>` que o gerador emite**. Caixa tombada, letra em pé.
- **Do** dar a toda prancha nova o conjunto completo: fundo folha, dente de `feTurbulence`,
  fio de 1px, `--sombra-prancha`, canto dobrado de 16x28 e um id de vinco (`M-0N`) no rótulo.
- **Do** escrever todo texto no dicionário de `scripts/site.mjs` (português canônico, inglês
  conferido chave a chave) e regerar — texto de atributo passa por `escaparAtributo`.
- **Do** medir coordenada em vez de escrevê-la: região nova vem de `npm run vitrine`
  (`cotas.json`, por língua); em `CHAMADAS` fica só a composição (lado do balão, recorte do
  detalhe); geometria nova do palco se calcula no gerador, como `leque()`.
- **Do** deixar o espécime intocado: estilo do app muda no app, extração muda em
  `npm run vitrine`, e a Geist só existe dentro dele.
- **Do** desenhar todo estado alternável nos dois sentidos, disparar a entrada **uma vez**
  por `IntersectionObserver`, e curto-circuitar `prefers-reduced-motion` para o estado
  final — desligando também os estados fechados mais específicos que a base.
- **Do** pôr um controle de verdade por cima ou ao lado de todo desenho `aria-hidden`, com o
  estado em `aria-pressed` — e desenhar a inversão a partir do atributo.
- **Do** deixar a folha inteira legível sem JavaScript: somem o seletor, o botão do pacote, a
  dica do puxão, o detalhe e o copiar; ficam os três sistemas à vista, os comandos
  selecionáveis, a lista de chamadas numerada, o leque aberto e a janela implantada.
- **Do** auto-hospedar todo recurso e manter zero requisição de terceiro — requisito do
  produto, não preferência técnica.
- **Do** manter texto funcional em 11px ou acima, medida e comando em mono com
  `tabular-nums`, e texto de diagrama fora do SVG que escala.
- **Do** deixar um controle do desenho responder a `click`, `focus` **e** `mouseenter`, e
  prender todo recorte ampliado dentro dos 360x480 — região mais larga que a vidraça alinha
  pelo começo.

### Don't (A Folha Miura):

- **Don't** introduzir uma segunda matiz, um raio, um gradiente decorativo,
  `backdrop-filter` ou brilho. A folha é papel, fio, luz de faceta e uma matiz.
- **Don't** usar o vermelho em ênfase, título, prosa, link de corpo ou na coluna de valor da
  tabela — a tabela argumenta por número; o vermelho ficou com o gesto e o índice.
- **Don't** dar sombra a botão, hover, foco ou faceta. Sombra marca plano de papel, e cada
  plano já tem a sua.
- **Don't** promover a manchete a heading: a hierarquia é `h1` NoCom e `h2` por prancha, e a
  manchete é assunto (`<p>` com id), não seção.
- **Don't** tombar um paralelogramo num terceiro ângulo, nem esquecer o `<span>` que destomba
  o conteúdo.
- **Don't** restilizar o interior da shadow root do espécime, usar a Geist em texto da folha,
  nem decidir na página qual data é hoje — a classe da pílula vem da extração; o navegador só
  reescreve o numeral.
- **Don't** escrever uma coordenada de pixel à mão em `folha.css`, `folha.js` ou no HTML
  gerado; e não deixar um comentário de geometria divergir do código — o achado aberto do
  "-87" contra `a0: -100` é o exemplo em vigor.
- **Don't** animar nada em laço, nada ambiente, nada que comece sozinho além da entrada
  única; a varredura tem botão, e a troca de chamada é transição de cor e opacidade.
- **Don't** anunciar `tablist` (nem qualquer outra semântica ARIA) que a página não cumpre; o
  seletor é `group` com `aria-pressed` exatamente por isso.
- **Don't** deixar um `hidden` escrito pelo JavaScript ser a única via até uma informação,
  nem fazer do botão de copiar o único caminho até o texto do comando.
- **Don't** entregar comando de terminal a quem abriu no telefone sem o aviso — e a checagem
  de celular vem antes da de sistema, porque o Android diz `linux` e o iPad diz `macintosh`.
- **Don't** editar `site/index.html` ou `site/en/index.html` à mão. São gerados; o `--check`
  da CI para a publicação se o disco divergir.
- **Don't** inventar número de usuários, depoimento, métrica, selo ou logotipo de imprensa —
  não existem, e a tabela de números é o único placar da página.
- **Don't** trazer para cá o teto de 12px de espaçamento d'A Vidraça, nem levar para lá a
  manchete de display desta folha. Cada lei é da sua superfície.
