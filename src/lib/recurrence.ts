/**
 * O cálculo da recorrência (Adendo 13): quando uma tarefa concluída com
 * "repetir" volta a ser pendente.
 *
 * **O calendário é local, e é por isso que este módulo existe no frontend.** O
 * backend não tem relógio de fuso sem uma crate nova, e o frontend já é quem
 * sabe quando vira o dia (`useToday`, Adendo 11). A divisão de trabalho: aqui se
 * decide QUAIS tarefas venceram o período; o backend (`revive_todos`) executa a
 * mutação — `done = false`, `done_at = null` — dentro da transação de sempre.
 *
 * A régua dos três períodos, sempre em meia-noite local sobre o dia de
 * `done_at`:
 *
 * - **diária**: a primeira meia-noite depois da conclusão;
 * - **semanal**: a meia-noite 7 dias depois do dia da conclusão;
 * - **mensal**: a meia-noite do mesmo dia do mês seguinte — dia 31 num mês de
 *   30 cai no último dia do mês, que é a régua do `Date` fixada nos testes.
 *
 * O que a recorrência NÃO faz mora no PRODUCT.md: não notifica, não conta
 * atraso, não ordena. A tarefa só reaparece pendente.
 *
 * **Zero imports, de propósito** — a mesma regra de `dates.ts`: é o que deixa o
 * módulo testável por `node --test` sem resolver o alias `@/` do Vite. O tipo
 * `Repeat` nasce aqui e `todos.ts` o importa, e não o contrário.
 */

/** A recorrência como ela viaja no fio (`Todo.repeat` do contrato). */
export type Repeat = "none" | "daily" | "weekly" | "monthly";

/**
 * O pedaço de `Todo` que o cálculo lê. Estrutural de propósito: o `Todo` inteiro
 * satisfaz isto sem conversão, e o teste monta o mínimo.
 */
export type RecurringTodo = {
  id: string;
  done: boolean;
  /** epoch millis, ou null (pendente, ou concluída antes desta versão). */
  done_at: number | null;
  repeat: Repeat;
};

/** A meia-noite local do dia em que `ms` cai. */
function startOfDay(ms: number): Date {
  const dia = new Date(ms);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

/**
 * Quando a tarefa volta a pendente (epoch millis), dado o instante em que foi
 * concluída. Só faz sentido para `repeat` diferente de `none` — o tipo exclui o
 * quarto valor para o erro não compilar.
 */
export function nextOccurrence(
  repeat: Exclude<Repeat, "none">,
  doneAt: number,
): number {
  const base = startOfDay(doneAt);
  if (repeat === "daily") {
    base.setDate(base.getDate() + 1);
  } else if (repeat === "weekly") {
    base.setDate(base.getDate() + 7);
  } else {
    // Mensal: mesmo dia do mês seguinte, preso ao último dia quando o mês é
    // mais curto. O `setDate(1)` antes do `setMonth` é o que impede o
    // transbordo do próprio Date (31 de janeiro + 1 mês virar 3 de março).
    const dia = base.getDate();
    base.setDate(1);
    base.setMonth(base.getMonth() + 1);
    const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(dia, ultimo));
  }
  return base.getTime();
}

/**
 * Esta tarefa venceu o período? Só uma concluída, com recorrência e com carimbo
 * pode vencer. `done_at` nulo numa concluída recorrente não deveria existir (o
 * backend carimba no toggle e no `set_repeat`); se existir, a resposta é não —
 * sem base de cálculo, afirmar o vencimento seria chutar.
 */
export function isDue(todo: RecurringTodo, now: number): boolean {
  if (todo.repeat === "none" || !todo.done || todo.done_at === null) return false;
  return now >= nextOccurrence(todo.repeat, todo.done_at);
}

/**
 * Os ids que `revive_todos` deve receber agora. É chamada com o retorno de
 * `list_recurring` — todas as abas, porque uma rotina numa aba de fundo tem que
 * voltar mesmo sem ninguém abrir a aba.
 */
export function dueIds(todos: readonly RecurringTodo[], now: number): string[] {
  return todos.filter((todo) => isDue(todo, now)).map((todo) => todo.id);
}
