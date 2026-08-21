/**
 * Datas escritas no meio do título.
 *
 * Não existe campo de data neste app, e não vai existir: a janela tem 360x480 e
 * um segundo campo permanente ao lado do de nova tarefa custaria altura que
 * pertence à lista (Regra do Custo de Altura). O que existe é o hábito de quem
 * escreve tarefa em papel — "pagar boleto 20/08" — e este módulo só LÊ o que já
 * estava escrito.
 *
 * Duas perguntas, e só elas: **onde estão as datas deste título, e alguma delas
 * é hoje?** Não há ordenação por data, não há prazo, não há vencido nem
 * atrasado — uma data que passou fica igual a uma que vem, e nenhuma das duas é
 * gravada em lugar nenhum.
 *
 * Toda data encontrada ganha destaque, e a de hoje ganha um destaque diferente.
 * A primeira versão só marcava hoje, e o resto do título passava em branco.
 *
 * **Uma data no fim do título é levada para a direita da linha.** É o formato que
 * as pessoas escrevem sozinhas ("pagar boleto 20/08"), e tirá-la do texto alinha
 * as datas numa coluna sem gastar um pixel de altura. A extração é conservadora
 * de propósito — ver `splitTitle`.
 *
 * **Nada aqui valida calendário.** `31/02` é tratado como data e ganha pílula.
 * Enquanto a pergunta era só "é hoje?", isso saía de graça: `31/02` nunca é igual
 * a hoje, então o mês de 30 dias e o ano bissexto não precisavam existir. Com
 * toda data destacada o argumento morreu, e a escolha de não validar passou a ser
 * uma decisão consciente (Adendo 11): o custo de mostrar uma pílula em cima de
 * uma data impossível é menor que o de carregar um calendário para desmentir quem
 * digitou.
 */

/**
 * Um pedaço do título. `date` diz se ele é uma data — e toda data ganha pílula.
 * `today` só quer dizer algo quando `date` é verdadeiro, e é o que troca a pílula
 * de cinza para o vermelho pastel.
 */
export type TitleSegment = { text: string; date: boolean; today: boolean };

/** A data levada para a direita da linha. */
export type TrailingDate = { text: string; today: boolean };

/**
 * O título repartido para a linha desenhar.
 *
 * `rest` é o texto que fica à esquerda, já sem a data extraída. `segments` é esse
 * mesmo texto fatiado, quando há data inline a marcar — **vazio significa
 * "desenhe `rest` como um nó de texto"**, sem elemento nenhum em volta, que é o
 * DOM que a linha sempre teve. `trailing` é a data que foi para a direita, ou
 * `null`.
 *
 * Invariante que os testes fixam: se `segments` não está vazio, os textos dele
 * concatenados são exatamente `rest`.
 */
export type TitleParts = {
  segments: TitleSegment[];
  rest: string;
  trailing: TrailingDate | null;
};

/**
 * `dia/mês` com o ano opcional, com uma guarda de cada lado.
 *
 * **Um ou dois dígitos**, e não dois obrigatórios: gente escreve `6/9` do mesmo
 * jeito que escreve `06/09`, e recusar a forma curta faria o destaque funcionar
 * para uns e não para outros sem nenhum aviso na tela. O preço é `3/4` num
 * "beber 3/4 de litro" ser lido como data — e o preço só é cobrado no dia 3 de
 * abril, na forma de um pedaço de texto em cinza. Barata.
 *
 * **Só a barra.** `20-08` também é data para muita gente, mas `20-08` também é
 * intervalo, placar e código de peça; a barra é a única forma que quase não tem
 * segundo significado.
 *
 * A guarda da esquerda é um GRUPO e não um lookbehind de propósito: a webview do
 * macOS é o WebKit do sistema, e lookbehind só existe lá a partir do Safari 16.4
 * — uma regex que o motor não entende não falha no destaque, falha na carga do
 * módulo, e o app abre em branco. O grupo custa uma linha a mais na varredura
 * abaixo e roda em qualquer motor.
 *
 * As duas guardas juntas recusam a data que é pedaço de outra coisa: em
 * `1/2/3/4` não há data nenhuma, e em `20/08/2026` a captura é a inteira, com
 * ano, e não `20/08` seguido de sobra.
 */
const DATE_PATTERN = /(^|[^\d/])(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?(?![\d/])/g;

/**
 * `20/08` é 20 de agosto ou 20 de… mês 20? **A resposta não mora neste módulo, e
 * não podia morar na webview.** Ela chega de fora, no parâmetro `dayFirst`, e
 * quem a produz é o `formato.rs` do backend, pelo comando `date_day_first`.
 *
 * A primeira versão perguntava ao `Intl` com o `navigator.language`, e estava
 * errada de duas formas independentes — as duas medidas, as duas registradas no
 * Adendo 11:
 *
 * 1. **`navigator.language` é o idioma da interface, não a região.** Num Mac com
 *    idioma inglês e região Brasil ele responde `en-US`, enquanto o sistema
 *    formata datas como `dd/MM/yy`. Quem digitava `20/08` não via destaque
 *    nenhum, e o inverso (interface em português, região Estados Unidos) errava
 *    para o outro lado.
 * 2. **Nem com a etiqueta certa o `Intl` responderia.** Ele escolhe a ordem pela
 *    língua e ignora a região: `Intl.DateTimeFormat("en-BR")` devolve
 *    mês-primeiro, e a extensão `-u-rg-brzzzz`, que existe no BCP-47 justamente
 *    para dizer "inglês com formatos do Brasil", não é implementada pelo motor.
 *
 * O que sobrou foi perguntar ao sistema operacional o padrão de data curta que
 * ele mesmo usa (`dd/MM/y` no Brasil, `M/d/yy` nos Estados Unidos) e ler a ordem
 * dali — o que só código nativo alcança. Por isso este módulo não detecta nada:
 * ele **recebe** a ordem já decidida, e continua sendo função pura.
 */

function pad(valor: string | number): string {
  return String(valor).padStart(2, "0");
}

/**
 * Hoje como chave comparável (`2026-08-19`). É uma STRING, e não um `Date`, por
 * duas razões: a comparação com o que foi digitado vira igualdade de texto (sem
 * fuso, sem hora, sem `Date` construído para depois ser descartado), e o valor
 * atravessa o `memo` do `TodoRow` como primitivo — dois objetos `Date` do mesmo
 * dia são props diferentes e re-renderizariam a lista inteira.
 */
export function todayKey(base: Date = new Date()): string {
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}

/**
 * Quanto falta para o próximo dia começar, em milissegundos. Quem usa é o
 * `useToday`: o app fica semanas aberto na bandeja, então "hoje" tem que virar
 * sozinho à meia-noite — um destaque em cima de ontem é pior que destaque
 * nenhum, porque ele afirma algo errado.
 *
 * Com um segundo de folga: um timer que acorda no instante exato da virada pode
 * ser servido alguns milissegundos ANTES dela e recalcular o mesmo dia de novo.
 */
export function msUntilNextDay(now: Date = new Date()): number {
  const meiaNoite = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return meiaNoite.getTime() - now.getTime() + 1000;
}

/** O que foi digitado é o dia de `today`? */
function matchesToday(
  primeiro: string,
  segundo: string,
  ano: string | undefined,
  today: string,
  dayFirst: boolean,
): boolean {
  const [anoHoje, mesHoje, diaHoje] = today.split("-");
  const dia = dayFirst ? primeiro : segundo;
  const mes = dayFirst ? segundo : primeiro;
  if (pad(dia) !== diaHoje || pad(mes) !== mesHoje) return false;
  // Sem ano, a data é deste ano por definição — é o que "20/08" quer dizer em
  // qualquer lista de tarefas.
  if (ano === undefined) return true;
  // `26` é 2026. O século não é adivinhado: uma lista de tarefas fala de dias
  // por vir e de dias que acabaram de passar, nunca de 1926.
  return (ano.length === 2 ? `20${ano}` : ano) === anoHoje;
}

/** Uma data achada na varredura, antes de a linha decidir onde ela vai. */
type Achada = {
  /** Onde o texto da data começa — depois da guarda, que nunca entra no destaque. */
  inicio: number;
  /** Onde termina. */
  fim: number;
  today: boolean;
};

/** Todas as datas do título, na ordem, com a guarda da esquerda já descontada. */
function achar(title: string, today: string, dayFirst: boolean): Achada[] {
  const achadas: Achada[] = [];
  // `matchAll` e não um laço de `exec`: a regex é do módulo, e `exec` num objeto
  // compartilhado deixa `lastIndex` sujo se este laço sair pelo meio. O
  // `matchAll` trabalha sobre uma cópia.
  for (const m of title.matchAll(DATE_PATTERN)) {
    const [inteiro, guarda, primeiro, segundo, ano] = m;
    // A guarda é o caractere de antes (ou nada, no começo do título): faz parte
    // da varredura, nunca do destaque.
    const inicio = m.index + guarda.length;
    achadas.push({
      inicio,
      fim: m.index + inteiro.length,
      today: matchesToday(primeiro, segundo, ano, today, dayFirst),
    });
  }
  return achadas;
}

/**
 * Reparte o título entre o texto que fica à esquerda e a data que vai para a
 * direita.
 *
 * **A extração é conservadora, e as três condições são o desenho inteiro:** o
 * título tem *exatamente uma* data, ela termina no *fim* do texto, e *sobra
 * texto* antes dela.
 *
 * Cada uma paga por si:
 *
 * - **Exatamente uma.** "de 19/10 a 25/10" tem duas, e levar a última para a
 *   direita deixaria "de 19/10 a" pendurado, dizendo menos que o original.
 *   Qualquer regra mais esperta que essa precisaria entender a frase, e este
 *   módulo lê caracteres, não português.
 * - **No fim.** "reunião 19/10 com o time" viraria "reunião com o time" com um
 *   19/10 do outro lado — a data sai do lugar onde ela qualificava algo e o texto
 *   fica com um buraco que ninguém escreveu.
 * - **Sobra texto.** Uma tarefa cujo título é só "21/08" ficaria com a esquerda
 *   vazia e um badge solto na direita: uma linha que parece não ter conteúdo. Aí
 *   a data fica inline, onde ela é o próprio título.
 *
 * O que não é extraído não é perdido: continua inline, com a mesma pílula. A
 * pessoa nunca deixa de ver o que digitou — é a diferença entre mover e apagar, e
 * é o que mantém o texto da linha igual ao texto que o editor inline abre.
 */
export function splitTitle(
  title: string,
  today: string,
  dayFirst: boolean,
): TitleParts {
  const achadas = achar(title, today, dayFirst);

  // A candidata a ir para a direita, se as três condições valerem.
  let trailing: TrailingDate | null = null;
  let rest = title;
  let inline = achadas;

  if (achadas.length === 1) {
    const unica = achadas[0];
    // `trimEnd` na cauda: "pagar boleto 21/08   " tem espaço depois da data, e
    // ele não desqualifica a extração — só não pode sobrar no `rest`.
    const depois = title.slice(unica.fim);
    const antes = title.slice(0, unica.inicio).trimEnd();
    if (depois.trim() === "" && antes !== "") {
      trailing = { text: title.slice(unica.inicio, unica.fim), today: unica.today };
      rest = antes;
      inline = [];
    }
  }

  if (inline.length === 0) return { segments: [], rest, trailing };

  // Fatia `rest` (que aqui é o título inteiro, porque não houve extração) nos
  // pedaços que a linha desenha. O texto entre duas datas sai num pedaço só.
  const segments: TitleSegment[] = [];
  let cursor = 0;
  for (const { inicio, fim, today: eHoje } of inline) {
    if (inicio > cursor) {
      segments.push({ text: rest.slice(cursor, inicio), date: false, today: false });
    }
    segments.push({ text: rest.slice(inicio, fim), date: true, today: eHoje });
    cursor = fim;
  }
  if (cursor < rest.length) {
    segments.push({ text: rest.slice(cursor), date: false, today: false });
  }
  return { segments, rest, trailing };
}
