/**
 * Testes de `lib/reminders.ts`, pela mesma razão dos de `recurrence.ts`: funções
 * puras que decidem coisas que **não aparecem na tela quando estão erradas**. Um
 * lembrete calculado para o dia errado chega no dia errado, e não há nada na
 * janela que mostre isso antes de acontecer — e um que nunca é agendado é
 * indistinguível de um que o sistema engoliu.
 *
 * **Nenhum relógio real.** Todo instante é construído com `new Date(ano, mes,
 * dia, hora)` — hora LOCAL dos dois lados, então o teste passa em qualquer fuso:
 * a mesma régua local que o módulo usa é a que monta os cenários.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  REMINDER_HOUR,
  endOfDate,
  remindAt,
  sameDate,
  stillAhead,
  type CivilDate,
} from "./reminders.ts";

/** Um instante local, legível. Mês humano (1–12), não o do Date. */
function em(ano: number, mes: number, dia: number, hora = 0): number {
  return new Date(ano, mes - 1, dia, hora).getTime();
}

/** Uma data de calendário, legível. Mês humano, como o tipo pede. */
function data(ano: number, mes: number, dia: number): CivilDate {
  return { year: ano, month: mes, day: dia };
}

describe("remindAt", () => {
  it("os três períodos caem no mesmo horário, em dias diferentes", () => {
    const alvo = data(2026, 8, 20);
    assert.equal(remindAt(alvo, "on_date"), em(2026, 8, 20, REMINDER_HOUR));
    assert.equal(remindAt(alvo, "day_before"), em(2026, 8, 19, REMINDER_HOUR));
    assert.equal(remindAt(alvo, "week_before"), em(2026, 8, 13, REMINDER_HOUR));
  });

  it("a antecedência atravessa a virada do mês", () => {
    assert.equal(
      remindAt(data(2026, 9, 3), "week_before"),
      em(2026, 8, 27, REMINDER_HOUR),
    );
    assert.equal(
      remindAt(data(2026, 9, 1), "day_before"),
      em(2026, 8, 31, REMINDER_HOUR),
    );
  });

  it("a antecedência atravessa a virada do ano", () => {
    assert.equal(
      remindAt(data(2027, 1, 2), "week_before"),
      em(2026, 12, 26, REMINDER_HOUR),
    );
  });

  /**
   * O caso que uma subtração de dias em milissegundos erraria: fevereiro de um
   * ano bissexto. Sete dias antes de 3 de março de 2028 é 25 de fevereiro, e não
   * 24 — quem calcula com `- 7 * 86400000` acerta isto por acidente e erra na
   * virada do horário de verão, que é o motivo de o módulo usar o calendário do
   * `Date` em vez de aritmética de milissegundos.
   */
  it("o calendário é do `Date`, e não aritmética de milissegundos", () => {
    assert.equal(
      remindAt(data(2028, 3, 3), "week_before"),
      em(2028, 2, 25, REMINDER_HOUR),
    );
    assert.equal(
      remindAt(data(2027, 3, 3), "week_before"),
      em(2027, 2, 24, REMINDER_HOUR),
    );
  });
});

describe("endOfDate", () => {
  it("é a meia-noite seguinte à data, e não o último milissegundo dela", () => {
    assert.equal(endOfDate(data(2026, 8, 20)), em(2026, 8, 21, 0));
  });

  it("atravessa a virada do mês e a do ano", () => {
    assert.equal(endOfDate(data(2026, 8, 31)), em(2026, 9, 1, 0));
    assert.equal(endOfDate(data(2026, 12, 31)), em(2027, 1, 1, 0));
  });
});

describe("stillAhead", () => {
  const alvo = data(2026, 8, 20);

  it("uma data futura ainda vale lembrete", () => {
    assert.equal(stillAhead(alvo, em(2026, 8, 1, 12)), true);
  });

  /**
   * **A régua é o DIA, e não o alarme.** Às duas da tarde do próprio 20/08 as
   * nove da manhã já passaram, e mesmo assim "lembrar na data" continua sendo
   * uma coisa sensata de pedir — é o backend que dispara o alarme atrasado no
   * próximo tique. Se a régua fosse o alarme, o submenu fecharia no meio do dia
   * de que ele fala.
   */
  it("o dia inteiro da data ainda vale, inclusive depois das nove", () => {
    assert.equal(stillAhead(alvo, em(2026, 8, 20, 0)), true);
    assert.equal(stillAhead(alvo, em(2026, 8, 20, 14)), true);
    assert.equal(stillAhead(alvo, em(2026, 8, 20, 23)), true);
  });

  it("a meia-noite seguinte fecha a janela", () => {
    assert.equal(stillAhead(alvo, em(2026, 8, 21, 0)), false);
    assert.equal(stillAhead(alvo, em(2026, 8, 21, 9)), false);
  });
});

describe("sameDate", () => {
  it("compara os três campos, e duas ausências são iguais", () => {
    assert.equal(sameDate(data(2026, 8, 20), data(2026, 8, 20)), true);
    assert.equal(sameDate(data(2026, 8, 20), data(2026, 8, 21)), false);
    assert.equal(sameDate(data(2026, 8, 20), data(2026, 9, 20)), false);
    assert.equal(sameDate(data(2026, 8, 20), data(2027, 8, 20)), false);
    assert.equal(sameDate(null, null), true);
    assert.equal(sameDate(null, data(2026, 8, 20)), false);
    assert.equal(sameDate(data(2026, 8, 20), null), false);
  });
});
