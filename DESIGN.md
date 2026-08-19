---
name: Mini To-Do
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
rounded:
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
---

# Design System: Mini To-Do

## Overview

**Creative North Star: "A Vidraça"**

Uma lâmina de vidro pousada sobre o trabalho real. A janela flutua permanentemente
acima de tudo — editor, planilha, navegador — e por isso ela não pode ter cor
própria: qualquer pigmento seu competiria, o dia inteiro, com o conteúdo que
realmente importa. O sistema inteiro é **acromático de propósito**. Toda a paleta é
OKLCH com croma exatamente `0`: cinzas puros, sem uma gota de matiz. A única exceção
em todo o app é o vermelho de erro, e é essa escassez que o torna impossível de
ignorar.

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

- Acromático absoluto — croma `0` em toda a paleta, exceto o vermelho de erro
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

## Colors

Uma paleta de cinzas neutros em OKLCH — croma `0` em todos os tokens — com um único
pigmento reservado para o erro. Os valores normativos do frontmatter são os do tema
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
- **Bruma** (`muted`): o cinza quase-branco de fundo. É o único recurso de destaque do
  sistema — marca a aba ativa, o hover de uma linha (a 60% de opacidade) e a pílula do
  contador. Faz sozinho o trabalho que outros sistemas dividem entre cor, sombra e peso.
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
- **Alarme** (`destructive`): vermelho-alaranjado, o **único** valor cromático do
  sistema (croma `0.245`). Aparece em exatamente um lugar: a faixa de aviso de erro,
  como texto sobre o próprio fundo a 10%. Não colore o botão de remover, não colore o
  fechar da aba, não colore o "Limpar concluídas" — nenhum gesto destrutivo é vermelho,
  porque nenhum deles é irreversível: todos oferecem desfazer.

### Named Rules

**A Regra do Pigmento Único.** Cor não decora, não categoriza e não hierarquiza —
**cor reporta falha, e nada mais**. Todo o resto do sistema é croma `0`. Um segundo
acento colorido, mesmo discreto, gastaria a raridade que faz o erro saltar aos olhos
numa janela cinza. Teste: se um pixel colorido apareceu na tela e nada deu errado, é bug.

**A Regra da Linha que Informa.** Uma linha que só divide pode ser discreta; uma linha
que **identifica um controle** carrega informação e precisa de 3:1 (WCAG 1.4.11). Por
isso o sistema tem dois cinzas de traço em vez de um: `border` para separador e moldura,
`control-border` para a borda de checkbox e campo. Confundir os dois foi o que deixou o
checkbox desmarcado em 1.26:1 — praticamente invisível sobre branco.

**A Regra do Desbotamento.** Concluir uma tarefa nunca a apaga nem a esconde — move
para `muted-foreground` com riscado, e a manda para o fim da lista. Estado resolvido é
estado com menos contraste, jamais estado ausente.

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
usa 12px de recuo lateral. A lista usa 10px (8px de contêiner + 8px de linha, menos o
que a área expandida do checkbox recupera), de modo que o texto das tarefas alinha
opticamente com o texto das faixas acima e abaixo.

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

**A Regra dos 2px de Vizinhança.** Dois elementos focáveis vizinhos precisam de pelo menos
4px entre as caixas, ou os anéis de um invadem o outro. Vale entre bandas, não dentro de um
mesmo controle composto (no chip, nome e `×` ficam a 2px, mas só um recebe foco por vez).

**A Regra do Custo de Altura.** Nada ocupa altura permanente sem justificar o que
empurrou para fora da dobra. Dicas, avisos e estados de ajuda são passageiros
(auto-dispensa) ou vivem no espaço vazio que some quando há tarefas.

## Elevation & Depth

**O sistema é plano por dentro. Existe uma sombra e ela vive do lado de fora.**

A janela tem `decorations: false` e `transparent: true`: o sistema operacional não
desenha moldura nem sombra nenhuma. O `shadow-lg` do cartão raiz não é um efeito de
interface — é **a borda física do aplicativo contra a área de trabalho**, o que impede
que a vidraça se dissolva sobre um fundo claro. Junto dela trabalham uma borda de 1px
(`border`) e um anel interno de 1px em `foreground/10`, que sustentam o contorno quando
o fundo atrás é escuro demais para a sombra aparecer.

Dentro da janela não há uma única sombra. Profundidade é feita por **tom e por linha**:
`muted` como fundo para o que está ativo ou sob o cursor, e o `Separator` de 1px para
dividir o cromo da lista. Não há camadas, não há popover elevado, não há modal.

### Shadow Vocabulary
- **Sombra da janela** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`):
  a única sombra do sistema. Aplicada uma vez, no cartão raiz. Nunca em mais nada.

### Named Rules

**A Regra da Sombra Externa.** Sombra é a borda do app contra a área de trabalho, não
um recurso de interface. Nenhum elemento dentro da janela projeta sombra — nem no
hover, nem no foco, nem em elevação. Se um componente novo parece precisar de sombra
para se destacar, ele precisa é de `muted` atrás dele.

## Shapes

Retângulos de cantos arredondados, e nada além disso. Não há círculos (exceto a pílula
do contador), não há formas orgânicas, não há recortes, ilustração ou ornamento. A
única geometria decorativa do app é a ausência dela.

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
- **Por que existe:** o `maxLength` truncava em silêncio. Colar um parágrafo punha 200
  caracteres no campo e jogava o resto fora sem sinal nenhum — o usuário só descobria lendo
  a tarefa depois. Fora dos últimos 20 o contador seria mobília, e mobília não ocupa o campo
  mais usado do app.
- `aria-hidden`: o `maxLength` do input já é anunciado por leitor de tela, e um número solto
  seria a mesma informação dita duas vezes, uma delas sem unidade.

### Chips (abas)
- **Style:** 24px de altura, raio de 8px, máximo de 8.5rem de largura, texto de 12px,
  truncado com reticências e nome inteiro no `title`.
- **State:** inativa é `muted-foreground` sem fundo, com `muted/50` no hover; ativa é
  fundo `muted`, texto `foreground` e peso 500. `transition-colors`.
- **Fechar:** sempre visível na aba ativa (a 70% de opacidade); nas demais, só no hover
  ou no foco de teclado. Escondido por completo quando existe uma aba só.
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

### Painel de atalho (a única troca de vista do app)
A combinação que mostra e esconde a janela é escolha do usuário (Adendo 9), e escolher
uma tecla precisa de uma superfície onde apertá-la. Ela **entra no lugar da lista**, e
não por cima dela.

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
- **Uma linha de resposta, reservada.** Aceita, já tomada por outro aplicativo, sem
  modificador, ou "vale agora e não na próxima abertura": as quatro são a mesma linha de
  11px embaixo do campo, `destructive` quando é recusa e névoa quando não é. A altura
  dela é reservada mesmo vazia — uma linha que nasce empurra o resto do painel para
  baixo no instante em que a pessoa está lendo o que aconteceu.
- **"Restaurar padrão" só existe quando há o que restaurar.** Um botão que não faz nada
  é mobília, e esta janela não tem espaço para mobília.

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
faixa a mais é o orçamento inteiro. Enquanto uma vista dessas está aberta, ela é a camada
de fora do teclado: o `Escape` é dela, e os atalhos da vista que ela cobriu ficam
desligados (`⌘T` não pode criar uma aba enquanto a pessoa está dizendo que quer usar
`⌘T`).

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

## Do's and Don'ts

### Do:
- **Do** manter croma `0` em toda cor nova. Se um token novo tem matiz, ele precisa de
  uma justificativa tão forte quanto a do vermelho de erro — e provavelmente não tem.
- **Do** declarar altura fixa e `shrink-0` em toda faixa nova, ou colocá-la dentro da lista.
- **Do** usar `muted` como fundo para destacar. É o recurso de destaque do sistema,
  no lugar de cor, sombra ou borda.
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
  gradiente ou barra de progresso. Isto não é um app de produtividade colorido, e a cor
  gasta seria o sinal de erro.
- **Don't** usar blur, `backdrop-filter`, brilho ou borda iluminada. A janela é
  transparente por necessidade técnica do Tauri, **não** por estilo — glassmorphism seria
  ler a restrição como estética.
- **Don't** acrescentar estatística, streak, gráfico, gamificação ou qualquer painel de
  métrica. Custaria a altura que a janela não tem.
- **Don't** imitar o cromo nativo de um sistema operacional (Aqua, Fluent, Material). O
  app roda em três; imitar um quebra a coerência nos outros dois.
- **Don't** projetar sombra em nada que esteja dentro da janela.
- **Don't** resolver uma superfície nova com modal, popover ou camada elevada. Vista nova
  troca de lugar com a lista e devolve o espaço ao sair — ver a Regra da Vista que Troca
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
- **Don't** nomear um controle pelo que ele parece fazer em vez do que ele faz. O botão do
  cabeçalho esconde a janela, e chamava-se "Fechar janela" para quem usa leitor de tela —
  numa janela sem decoração e fora da barra de tarefas, "fechei e não sei voltar" é o pior
  desfecho que existe aqui.
