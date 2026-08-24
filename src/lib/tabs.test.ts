/**
 * Testes de `lib/tabs.ts` — o nome padrão da próxima aba e a vizinha que herda
 * o lugar da fechada.
 *
 * `neighbourTabId` é a metade do frontend de uma regra que o backend espelha
 * (Esclarecimento 5.2: destinos diferentes fariam a tela piscar de uma aba
 * para a outra quando a resposta chegasse) — e até aqui nada fixava este lado.
 *
 * `nextTabName` compara contra o nome JÁ traduzido, então as asserções pedem o
 * nome ao mesmo `t()` que a função usa: o teste passa em qualquer locale de
 * máquina, porque afirma a REGRA (colisão sobe o número), não uma string.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { t } from "./i18n.ts";
import { neighbourTabId, nextTabName } from "./tabs.ts";
import type { Tab } from "./todos.ts";

function aba(id: string, name: string, created_at: number): Tab {
  return { id, name, created_at };
}

function nome(n: number): string {
  return t("tabs.defaultName", { n });
}

describe("nextTabName", () => {
  it("a segunda aba é a de número 2 — nunca existe uma 'Lista 1'", () => {
    // A primeira aba é a "Tarefas" da migração; o piso em 2 vale até com a
    // lista ainda vazia (o instante antes de `list_tabs` responder).
    assert.equal(nextTabName([]), nome(2));
    assert.equal(nextTabName([aba("a", "Tarefas", 1)]), nome(2));
  });

  it("acompanha a contagem de abas, não os nomes que ficaram", () => {
    // Duas abas → a próxima é a terceira, mesmo que nenhuma se chame assim.
    assert.equal(
      nextTabName([aba("a", "Tarefas", 1), aba("b", "Casa", 2)]),
      nome(3),
    );
  });

  it("um nome padrão já tomado sobe o número até a primeira vaga", () => {
    const tabs = [aba("a", "Tarefas", 1), aba("b", nome(3), 2)];
    // A contagem diria 3, mas "Lista 3" existe — sobe para 4.
    assert.equal(nextTabName(tabs), nome(4));
  });

  it("nome de usuário igual ao padrão também conta como colisão", () => {
    // Não importa QUEM criou o nome: se está na faixa, o palpite não repete.
    const tabs = [aba("a", nome(2), 1)];
    assert.equal(nextTabName(tabs), nome(3));
  });
});

describe("neighbourTabId", () => {
  const tabs = [aba("a", "A", 1), aba("b", "B", 2), aba("c", "C", 3)];

  it("fechar uma do meio ativa a PRÓXIMA da faixa", () => {
    assert.equal(neighbourTabId(tabs, "b"), "c");
  });

  it("fechar a última da faixa volta para a anterior", () => {
    assert.equal(neighbourTabId(tabs, "c"), "b");
  });

  it("fechar a primeira ativa a segunda — nunca teleporta", () => {
    assert.equal(neighbourTabId(tabs, "a"), "b");
  });

  it("id desconhecido e aba única devolvem null", () => {
    // Aba única nem chega aqui em uso real (fechar a última é recusado), mas o
    // null é o contrato de "não há vizinha" — melhor que inventar um destino.
    assert.equal(neighbourTabId(tabs, "z"), null);
    assert.equal(neighbourTabId([aba("a", "A", 1)], "a"), null);
  });
});
