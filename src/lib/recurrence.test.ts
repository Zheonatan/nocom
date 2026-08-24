/**
 * Testes de `lib/recurrence.ts`, pela mesma razão dos de `dates.ts`: funções
 * puras que decidem coisas que **não aparecem na tela quando estão erradas**.
 * Uma rotina que não volta é indistinguível de uma rotina concluída; uma que
 * volta cedo demais parece um toggle fantasma. Nenhum dos dois quebra a janela.
 *
 * **Nenhum relógio real.** Todo instante é construído com `new Date(ano, mes,
 * dia, hora)` — hora LOCAL dos dois lados, então o teste passa em qualquer fuso:
 * a mesma régua local que o módulo usa é a que monta os cenários.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dueIds, isDue, nextOccurrence, type RecurringTodo } from "./recurrence.ts";

/** Um instante local, legível. Mês humano (1–12), não o do Date. */
function em(ano: number, mes: number, dia: number, hora = 12): number {
  return new Date(ano, mes - 1, dia, hora).getTime();
}

function tarefa(parcial: Partial<RecurringTodo>): RecurringTodo {
  return {
    id: "t1",
    done: true,
    done_at: em(2026, 8, 23),
    repeat: "daily",
    ...parcial,
  };
}

describe("nextOccurrence", () => {
  it("diária volta na primeira meia-noite depois da conclusão", () => {
    // Concluída às 15h de 23/08 → volta à 0h de 24/08. A hora da conclusão não
    // importa: 23h59 e 0h01 do mesmo dia voltam no mesmo instante.
    const volta = nextOccurrence("daily", em(2026, 8, 23, 15));
    assert.equal(volta, em(2026, 8, 24, 0));
    assert.equal(nextOccurrence("daily", em(2026, 8, 23, 23)), volta);
  });

  it("semanal volta 7 dias depois do dia da conclusão", () => {
    assert.equal(
      nextOccurrence("weekly", em(2026, 8, 23, 9)),
      em(2026, 8, 30, 0),
    );
  });

  it("semanal atravessa a virada do mês", () => {
    assert.equal(
      nextOccurrence("weekly", em(2026, 8, 28)),
      em(2026, 9, 4, 0),
    );
  });

  it("mensal volta no mesmo dia do mês seguinte", () => {
    assert.equal(
      nextOccurrence("monthly", em(2026, 8, 23)),
      em(2026, 9, 23, 0),
    );
  });

  it("mensal no dia 31 cai no último dia de um mês mais curto", () => {
    // 31/08 + 1 mês: setembro tem 30 — a régua do contrato é o último dia, e
    // NUNCA o transbordo do Date (que daria 1º de outubro).
    assert.equal(
      nextOccurrence("monthly", em(2026, 8, 31)),
      em(2026, 9, 30, 0),
    );
  });

  it("mensal de 31 de janeiro respeita o fevereiro de 28", () => {
    assert.equal(
      nextOccurrence("monthly", em(2026, 1, 31)),
      em(2026, 2, 28, 0),
    );
  });

  it("mensal atravessa a virada do ano", () => {
    assert.equal(
      nextOccurrence("monthly", em(2026, 12, 15)),
      em(2027, 1, 15, 0),
    );
  });
});

describe("isDue", () => {
  it("concluída ontem com recorrência diária está vencida hoje", () => {
    const rotina = tarefa({ done_at: em(2026, 8, 22, 18) });
    assert.equal(isDue(rotina, em(2026, 8, 23, 0)), true);
  });

  it("concluída hoje não vence hoje — nem um segundo antes da meia-noite", () => {
    const rotina = tarefa({ done_at: em(2026, 8, 23, 8) });
    assert.equal(isDue(rotina, em(2026, 8, 23, 23)), false);
  });

  it("pendente nunca vence, e sem recorrência nunca vence", () => {
    assert.equal(isDue(tarefa({ done: false }), em(2026, 8, 30)), false);
    assert.equal(isDue(tarefa({ repeat: "none" }), em(2026, 8, 30)), false);
  });

  it("concluída sem carimbo não vence: sem base de cálculo, a resposta é não", () => {
    assert.equal(isDue(tarefa({ done_at: null }), em(2026, 8, 30)), false);
  });
});

describe("dueIds", () => {
  it("devolve só os ids do que venceu, na ordem recebida", () => {
    const agora = em(2026, 8, 24, 0);
    const lote: RecurringTodo[] = [
      tarefa({ id: "vencida", done_at: em(2026, 8, 23) }),
      tarefa({ id: "de-hoje", done_at: em(2026, 8, 24, 0) }),
      tarefa({ id: "pendente", done: false }),
      tarefa({ id: "semanal-no-meio", repeat: "weekly", done_at: em(2026, 8, 20) }),
    ];
    assert.deepEqual(dueIds(lote, agora), ["vencida"]);
  });

  it("lote sem nada vencido devolve vazio — e é o chamador que não liga o IPC", () => {
    assert.deepEqual(dueIds([], em(2026, 8, 24)), []);
  });
});
