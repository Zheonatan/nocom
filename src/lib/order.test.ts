/**
 * Testes de `lib/order.ts`, pela mesma razão dos de `dates.ts`: a ordem
 * decidida errada **não aparece na tela como erro** — uma tarefa no lugar
 * trocado é indistinguível de uma lista em outra ordem, e nenhum dos dois
 * quebra a janela.
 *
 * **Nenhum relógio real.** `today` é string construída à mão (`2026-08-21`,
 * uma sexta), então o teste passa em qualquer dia e em qualquer fuso: datas
 * sem ano caem no ano da string, e não no ano de quem roda.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  byDisplayOrder,
  compareDated,
  dateKey,
  withDates,
  type Orderable,
} from "./order.ts";

// As duas ordens, nomeadas — o mesmo par de `dates.test.ts`.
const DIA = true; // dia/mês — Brasil, Reino Unido, Alemanha
const MES = false; // mês/dia — Estados Unidos

// 21 de agosto de 2026.
const HOJE = "2026-08-21";

type Linha = Orderable;

let relogio = 0;

/** Uma tarefa qualquer, com `created_at` crescente por construção. */
function tarefa(parcial: Partial<Linha>): Linha {
  relogio += 1;
  return { title: "sem data", done: false, created_at: relogio, ...parcial };
}

/** Ordena como o App ordena: chaves resolvidas uma vez, depois o comparador. */
function visivel(todos: Linha[], today = HOJE, dayFirst = DIA): Linha[] {
  const dated = withDates(todos, today, dayFirst);
  dated.sort(compareDated);
  return dated.map((entry) => entry.todo);
}

function titulos(todos: Linha[]): string[] {
  return todos.map((item) => item.title);
}

describe("dateKey", () => {
  it("devolve ano-mês-dia como número comparável", () => {
    assert.equal(dateKey("pagar boleto 21/08", HOJE, DIA), 20260821);
    assert.equal(dateKey("pagar boleto 21/08/2026", HOJE, DIA), 20260821);
    assert.equal(dateKey("evento 20/08/27", HOJE, DIA), 20270820);
  });

  it("sem ano, o ano é o de hoje — e vem de `today`, não do relógio", () => {
    assert.equal(dateKey("20/08", "2031-01-02", DIA), 20310820);
  });

  it("lê na ordem de fora", () => {
    assert.equal(dateKey("pay bill 08/21", HOJE, MES), 20260821);
    // A mesma escrita, lida ao contrário: em dia-primeiro `08/21` seria dia 8
    // do mês 21 — mês inválido, então não é data nenhuma.
    assert.equal(dateKey("pay bill 08/21", HOJE, DIA), null);
    // Com dia e mês ambos válidos, a ordem decide: 5 de maio ou 5 de agosto.
    assert.equal(dateKey("reunião 05/08", HOJE, MES), 20260508);
    assert.equal(dateKey("reunião 05/08", HOJE, DIA), 20260805);
  });

  it("sem data única e válida, é null", () => {
    assert.equal(dateKey("comprar leite", HOJE, DIA), null);
    assert.equal(dateKey("de 19/10 a 25/10", HOJE, DIA), null);
    assert.equal(dateKey("prazo 31/02", HOJE, DIA), null);
    assert.equal(dateKey("versão 1/2/3/4", HOJE, DIA), null);
  });
});

describe("byDisplayOrder", () => {
  it("pendente vem antes de concluída, mesmo com data mais tarde", () => {
    const pendente = tarefa({ title: "sem data" });
    // Concluída com data de hoje: continua no fim, por criação.
    const concluida = tarefa({ title: "feita 21/08", done: true });
    assert.deepEqual([pendente, concluida].sort((a, b) => byDisplayOrder(a, b, HOJE, DIA)), [
      pendente,
      concluida,
    ]);
  });

  it("entre datas, a mais próxima fica em cima", () => {
    const longe = tarefa({ title: "dentista 25/10" });
    const perto = tarefa({ title: "boleto 19/10" });
    // Entra fora de ordem de propósito: o comparador é quem ordena.
    assert.deepEqual(titulos(visivel([longe, perto])), [
      "boleto 19/10",
      "dentista 25/10",
    ]);
  });

  it("data passada sobe para o topo — é o preço da ordem crescente", () => {
    const vencida = tarefa({ title: "atrasado 01/08" });
    const hoje = tarefa({ title: "hoje 21/08" });
    const futura = tarefa({ title: "depois 19/10" });
    assert.deepEqual(titulos(visivel([futura, hoje, vencida])), [
      "atrasado 01/08",
      "hoje 21/08",
      "depois 19/10",
    ]);
  });

  it("com data fica antes de sem data; sem data segue por criação", () => {
    const antiga = tarefa({ title: "primeira" });
    const datada = tarefa({ title: "prazo 19/10" });
    const nova = tarefa({ title: "segunda" });
    assert.deepEqual(titulos(visivel([antiga, datada, nova])), [
      "prazo 19/10",
      "primeira",
      "segunda",
    ]);
  });

  it("empate de data desempatada por criação", () => {
    const primeira = tarefa({ title: "a 19/10" });
    const segunda = tarefa({ title: "b 19/10" });
    assert.deepEqual(titulos(visivel([segunda, primeira])), [
      "a 19/10",
      "b 19/10",
    ]);
  });

  it("concluídas ignoram a data e seguem por criação", () => {
    const velha = tarefa({ title: "feita 25/10", done: true });
    const nova = tarefa({ title: "feita 19/10", done: true });
    // Fora de ordem de criação na entrada; a data não pode reordenar.
    assert.deepEqual(titulos(visivel([nova, velha])), [
      "feita 25/10",
      "feita 19/10",
    ]);
  });

  it("ano explícito manda: 2027 fica depois de 2026 sem ano", () => {
    const esteAno = tarefa({ title: "dezembro 25/12" });
    const proximo = tarefa({ title: "janeiro 05/01/2027" });
    assert.deepEqual(titulos(visivel([proximo, esteAno])), [
      "dezembro 25/12",
      "janeiro 05/01/2027",
    ]);
  });

  it("duas datas e data impossível contam como sem data", () => {
    const intervalo = tarefa({ title: "de 19/10 a 25/10" });
    const impossivel = tarefa({ title: "prazo 31/02" });
    const datada = tarefa({ title: "boleto 19/10" });
    // As duas sem chave ficam depois da datada, entre si por criação.
    assert.deepEqual(titulos(visivel([intervalo, impossivel, datada])), [
      "boleto 19/10",
      "de 19/10 a 25/10",
      "prazo 31/02",
    ]);
  });

  it("`withDates` + `compareDated` equivale a `byDisplayOrder`", () => {
    // A invariante que impede as duas vias de divergirem: o atalho de uma
    // comparação tem que dar a mesma ordem que o caminho da lista.
    const lista = [
      tarefa({ title: "sem data" }),
      tarefa({ title: "boleto 19/10" }),
      tarefa({ title: "feita 21/08", done: true }),
      tarefa({ title: "de 19/10 a 25/10" }),
      tarefa({ title: "dentista 25/10" }),
      tarefa({ title: "atrasado 01/08" }),
    ];
    const peloAtalho = [...lista].sort((a, b) => byDisplayOrder(a, b, HOJE, DIA));
    assert.deepEqual(titulos(visivel(lista)), titulos(peloAtalho));
  });
});
