/**
 * Os lembretes do sistema (Adendo 14): quando o app avisa, em notificação nativa,
 * que a data escrita no título de uma tarefa está chegando.
 *
 * **Isto move uma linha que o PRODUCT.md tinha traçado** ("não notifica", "não
 * avisa quando passa"), e o registro honesto está lá. O que a mantém no lugar
 * mais estreito possível: o lembrete **não existe sem gesto explícito** — nenhuma
 * tarefa ganha aviso por ter data, só a que o usuário pediu no menu de contexto —
 * e **nada na tela é derivado dele**: não há ordenação por lembrete, não há
 * "atrasada", não há contagem de dias. A tarefa continua sendo uma linha de texto
 * com uma data em cima.
 *
 * **A data continua morando no título, e só nele.** Este módulo não guarda data:
 * ele recebe uma já lida por `lib/dates.ts` e devolve o INSTANTE do alarme. O que
 * o backend persiste é esse instante (`remind_at`), não a data — que continua
 * sendo lida do título a cada renderização, como sempre foi. Renomear a tarefa
 * recalcula o alarme a partir do título novo; apagar a data do título apaga o
 * lembrete junto.
 *
 * **Zero imports, de propósito** — a mesma regra de `dates.ts` e de
 * `recurrence.ts`: é o que deixa o módulo testável por `node --test` sem resolver
 * o alias `@/` do Vite. O tipo `Reminder` nasce aqui e `todos.ts` o importa, e
 * não o contrário.
 */

/** O lembrete como ele viaja no fio (`Todo.reminder` do contrato). */
export type Reminder = "none" | "on_date" | "day_before" | "week_before";

/**
 * A hora local em que todo lembrete dispara.
 *
 * **A data escrita no título não tem hora** — "pagar boleto 20/08" diz o dia e
 * mais nada — então a hora tem que sair de algum lugar, e há três candidatos:
 * uma constante, um ajuste no painel, ou um seletor por tarefa. Os dois últimos
 * custam altura ou um diálogo numa janela de 360x480 (Regra do Custo de Altura),
 * e cobram uma configuração de quem só queria ser lembrado.
 *
 * Nove da manhã porque um lembrete existe para chegar **antes** do dia começar a
 * gastar a atenção de quem o recebe. Meia-noite seria tecnicamente o início do
 * dia e praticamente um alarme no meio do sono; o fim da tarde chega depois de o
 * dia já ter sido decidido.
 */
export const REMINDER_HOUR = 9;

/**
 * Uma data de calendário, sem hora e sem fuso — o que está escrito no título,
 * exatamente como está escrito. Mês HUMANO (1–12), e não o do `Date`: o valor
 * vem de um texto que a pessoa digitou, e converter na fronteira é onde o erro
 * de um a menos nasce.
 *
 * Estrutural de propósito, como o `RecurringTodo` de `recurrence.ts`: o retorno
 * de `soleDate` (em `lib/dates.ts`) satisfaz isto sem conversão e sem import
 * atravessando os dois módulos — que é o que mantém os dois carregáveis pelo
 * `node --test`.
 */
export type CivilDate = { year: number; month: number; day: number };

/**
 * Quantos dias antes da data cada lembrete cai. É a definição inteira dos três
 * períodos — não há régua de calendário aqui, porque `new Date` já sabe que sete
 * dias antes de 3 de março é 24 de fevereiro, inclusive em ano bissexto.
 */
const DIAS_ANTES: Record<Exclude<Reminder, "none">, number> = {
  on_date: 0,
  day_before: 1,
  week_before: 7,
};

/**
 * O instante do alarme (epoch millis), dado a data do título e o período
 * escolhido. Sempre `REMINDER_HOUR` local do dia calculado.
 *
 * **O calendário é local, e é por isso que este cálculo mora no frontend** — a
 * mesma divisão de trabalho da recorrência (Adendo 13): aqui se decide QUANDO, e
 * o backend só guarda o número e compara com o relógio. O Rust não tem calendário
 * de fuso sem uma crate nova, e um alarme calculado em UTC dispararia na hora
 * errada para todo mundo que não mora em Londres.
 */
export function remindAt(
  date: CivilDate,
  reminder: Exclude<Reminder, "none">,
): number {
  return new Date(
    date.year,
    date.month - 1,
    date.day - DIAS_ANTES[reminder],
    REMINDER_HOUR,
  ).getTime();
}

/**
 * O instante em que o dia escrito no título acaba — a meia-noite seguinte a ele.
 * É a fronteira de "esta data ainda está por vir".
 */
export function endOfDate(date: CivilDate): number {
  return new Date(date.year, date.month - 1, date.day + 1).getTime();
}

/**
 * Ainda dá para ser lembrado desta data?
 *
 * A régua é o DIA, e não o alarme: uma data de hoje às 14h continua valendo um
 * lembrete ("é hoje"), mesmo que as nove da manhã já tenham passado — e é o
 * backend que trata o alarme atrasado, disparando no próximo tique. Já uma data
 * de ontem não vale lembrete nenhum: não há nada a antecipar num dia que acabou.
 *
 * É esta função que decide se o submenu "Lembrar" abre ou fica desabilitado.
 */
export function stillAhead(date: CivilDate, now: number): boolean {
  return now < endOfDate(date);
}

/**
 * As duas datas são a mesma? `null` é "nenhuma data", e duas ausências contam
 * como iguais.
 *
 * Existe para o renomear (Adendo 14). Quando o título muda, o lembrete só é
 * recalculado se a **data** tiver mudado — e essa condição não é um detalhe de
 * eficiência, é correção: um lembrete que já disparou tem `remind_at` nulo, e
 * recalculá-lo por causa de um typo corrigido no mesmo dia o rearmaria para um
 * instante que já passou, fazendo o mesmo aviso tocar uma segunda vez.
 */
export function sameDate(a: CivilDate | null, b: CivilDate | null): boolean {
  if (a === null || b === null) return a === b;
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
