/**
 * Testes de `lib/i18n.ts` — a escolha do idioma e as regras de plural escritas
 * à mão.
 *
 * A sobreposição do `zero` é regra de negócio, não biblioteca: o CLDR trata 0
 * como `one` em português (`i = 0..1`) e daria "0 pendente", que nenhum falante
 * escreve. As asserções usam `translate` com o idioma por parâmetro — `t` está
 * preso ao locale detectado na carga, que muda de máquina para máquina, e um
 * teste que só passa em máquina pt-BR não é um teste.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectLocale, translate } from "./i18n.ts";

describe("detectLocale", () => {
  it("percorre a lista NA ORDEM e fica no primeiro idioma que o app fala", () => {
    // A segunda preferência do usuário é melhor que o nosso palpite.
    assert.equal(detectLocale(["de-DE", "pt-BR", "en"]), "pt-BR");
    assert.equal(detectLocale(["fr", "en-GB", "pt-BR"]), "en");
  });

  it("casa por prefixo de língua, sem depender de região ou de caixa", () => {
    assert.equal(detectLocale(["pt"]), "pt-BR");
    assert.equal(detectLocale(["pt-PT"]), "pt-BR");
    assert.equal(detectLocale(["PT-br"]), "pt-BR");
    assert.equal(detectLocale(["en-AU"]), "en");
  });

  it("não confunde prefixo com pedaço de outra etiqueta", () => {
    // "ptg" não é português; o casamento é "pt" exato ou "pt-…".
    assert.equal(detectLocale(["ptg"]), "en");
  });

  it("sistema em língua que o app não fala cai no inglês, não no português", () => {
    // O app é distribuído: um sistema em japonês tem mais chance de ler inglês.
    assert.equal(detectLocale(["ja-JP", "ko"]), "en");
    assert.equal(detectLocale([]), "en");
  });

  it("entrada que não é string é pulada, não derruba a detecção", () => {
    const tags = [42, null, "pt-BR"] as unknown as readonly string[];
    assert.equal(detectLocale(tags), "pt-BR");
  });
});

describe("translate — plural", () => {
  it("o zero sobrepõe o CLDR em português: '0 pendentes', nunca '0 pendente'", () => {
    assert.equal(translate("pt-BR", "pending.count", { n: 0 }), "0 pendentes");
    assert.equal(translate("pt-BR", "pending.count", { n: 1 }), "1 pendente");
    assert.equal(translate("pt-BR", "pending.count", { n: 3 }), "3 pendentes");
  });

  it("em inglês o CLDR já acerta o zero sem sobreposição", () => {
    // A entrada `en` não tem `zero` de propósito: 0 cai em `other` pela regra
    // da própria língua. Se alguém acrescentar a categoria, este teste conta.
    assert.equal(translate("en", "pending.count", { n: 0 }), "0 pending");
    assert.equal(translate("en", "pending.count", { n: 1 }), "1 pending");
    assert.equal(translate("en", "pending.count", { n: 2 }), "2 pending");
  });

  it("entrada plural chamada sem `n` cai na frase de `other`", () => {
    assert.equal(translate("en", "pending.count", {}), "{n} pending");
  });
});

describe("translate — interpolação", () => {
  it("substitui os parâmetros presentes", () => {
    assert.equal(
      translate("pt-BR", "window.closeHint", { shortcut: "⌃⌥T" }),
      "Esconder — ⌃⌥T traz de volta",
    );
  });

  it("placeholder sem valor fica VISÍVEL de propósito", () => {
    // Sumir no texto é um bug que passa despercebido; "{shortcut}" na tela é
    // um bug que alguém reporta.
    assert.equal(
      translate("pt-BR", "window.closeHint"),
      "Esconder — {shortcut} traz de volta",
    );
  });
});
