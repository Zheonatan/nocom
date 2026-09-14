import { soleDate } from "./dates.ts";

/**
 * Ordem de exibição por data do título (Adendo 15).
 *
 * Até aqui a lista só conhecia duas regras: pendentes antes de concluídas e,
 * em cada grupo, `created_at` crescente (Adendo 4). Este módulo põe as
 * pendentes COM data antes das SEM, em ordem crescente de data — a mais
 * próxima no topo. Concluídas continuam no fim, por criação: resolvido não
 * reordena por data.
 *
 * **O que conta como "ter data" é o `soleDate`.** Uma data única e válida no
 * calendário; duas datas ("de 19/10 a 25/10") ou uma impossível (`31/02`)
 * contam como sem data — a mesma régua do lembrete, pelo mesmo motivo: este
 * módulo lê caracteres, não português.
 *
 * **Sobe vencida, por construção.** Crescente põe o passado antes do futuro,
 * então uma data de ontem fica acima de uma de amanhã. É o preço assumido da
 * ordem pedida — e o que a mantém tinta: a cor continua cinza igual.
 *
 * **Sem ano, o ano é o de hoje** — a mesma definição de `soleDate`. `05/01`
 * escrito em agosto é janeiro DESTE ano: passado, e portanto no topo.
 *
 * Puro e sem `@/`, como `dates.ts`: é o que deixa o `node --test` carregar.
 */

/** O mínimo que a ordenação lê de uma tarefa — `Todo` satisfaz sem import. */
export type Orderable = { title: string; done: boolean; created_at: number };

/**
 * A data do título como número comparável (`20260821`), ou `null` quando
 * `soleDate` não acha data única e válida. Número, e não texto, para a
 * comparação ser subtração — e `ano * 10000 + mês * 100 + dia` ordena como o
 * calendário porque cada campo tem peso fixo.
 */
export function dateKey(
  title: string,
  today: string,
  dayFirst: boolean,
): number | null {
  const data = soleDate(title, today, dayFirst);
  if (data === null) return null;
  return data.year * 10000 + data.month * 100 + data.day;
}

/** Uma tarefa com a chave já resolvida — ver `withDates`. */
export type Dated<T> = { todo: T; date: number | null };

/**
 * Resolve a chave UMA vez por tarefa. A ordenação chama o comparador O(n log n)
 * vezes, e cada `soleDate` é uma varredura com regex no título — recalcular por
 * comparação é trabalho repetido em todo render que muda a lista.
 */
export function withDates<T extends Orderable>(
  todos: readonly T[],
  today: string,
  dayFirst: boolean,
): Dated<T>[] {
  return todos.map((todo) => ({
    todo,
    date: dateKey(todo.title, today, dayFirst),
  }));
}

/**
 * O comparador sobre chaves já resolvidas. A regra, na ordem em que é lida:
 * pendente antes de concluída; concluída por criação; com data antes de sem;
 * entre datas, crescente; empate de data, criação.
 */
export function compareDated<T extends { done: boolean; created_at: number }>(
  a: Dated<T>,
  b: Dated<T>,
): number {
  if (a.todo.done !== b.todo.done) return a.todo.done ? 1 : -1;
  if (a.todo.done) return a.todo.created_at - b.todo.created_at;
  if (a.date !== null && b.date !== null) {
    if (a.date !== b.date) return a.date - b.date;
    return a.todo.created_at - b.todo.created_at;
  }
  if (a.date !== null) return -1;
  if (b.date !== null) return 1;
  return a.todo.created_at - b.todo.created_at;
}

/**
 * Atalho para uma comparação só: resolve as duas chaves e compara. É o que os
 * testes e o reexport usam; a lista usa `withDates` + `compareDated`.
 */
export function byDisplayOrder(
  a: Orderable,
  b: Orderable,
  today: string,
  dayFirst: boolean,
): number {
  return compareDated(
    { todo: a, date: dateKey(a.title, today, dayFirst) },
    { todo: b, date: dateKey(b.title, today, dayFirst) },
  );
}
