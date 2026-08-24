/**
 * Testes de `lib/text.ts` — a régua de 200 do contrato, em pontos de código.
 *
 * É a fronteira mais fina do IPC: o backend conta `chars().count()` e o campo
 * precisa contar IGUAL, senão o limite vale para uns caracteres e não para
 * outros (o `maxLength` nativo contava unidades UTF-16 e um emoji valia 2 —
 * foi o defeito que abriu o Adendo 12). Emoji e pares substitutos são
 * exatamente o caso que motivou a regra, e até aqui não tinham um teste.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clampLength, lengthOf } from "./text.ts";

describe("lengthOf", () => {
  it("conta ASCII como sempre", () => {
    assert.equal(lengthOf(""), 0);
    assert.equal(lengthOf("pagar boleto"), 12);
  });

  it("conta um emoji como UM ponto, e não as duas unidades UTF-16", () => {
    // "😀" é U+1F600: `.length` diz 2, a régua do contrato diz 1.
    assert.equal("😀".length, 2);
    assert.equal(lengthOf("😀"), 1);
  });

  it("conta a família com ZWJ como os CINCO pontos que a compõem", () => {
    // 👨 + ZWJ + 👩 + ZWJ + 👧 — o `chars().count()` do Rust conta 5, e esta
    // régua precisa dizer o MESMO número, não o que um segmentador de grafemas
    // diria (1). Igualdade entre os lados vale mais que a intuição visual.
    const familia = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";
    assert.equal(lengthOf(familia), 5);
  });

  it("conta acento combinante como ponto próprio, igual ao backend", () => {
    // "é" decomposto: `e` + U+0301. Dois pontos de código nas duas línguas.
    assert.equal(lengthOf("é"), 2);
  });
});

describe("clampLength", () => {
  it("não toca no texto dentro do limite, nem exatamente nele", () => {
    assert.deepEqual(clampLength("abc", 5), { text: "abc", cut: 0 });
    assert.deepEqual(clampLength("abcde", 5), { text: "abcde", cut: 0 });
  });

  it("corta em pontos de código e diz quantos saíram", () => {
    assert.deepEqual(clampLength("abcdefgh", 5), { text: "abcde", cut: 3 });
  });

  it("aceita o emoji inteiro na última vaga, sem parti-lo ao meio", () => {
    // Três emojis = 3 pontos (6 unidades UTF-16). Limite 2 corta o terceiro
    // INTEIRO: nenhum caminho pode deixar meia unidade substituta no texto.
    const resultado = clampLength("😀😀😀", 2);
    assert.deepEqual(resultado, { text: "😀😀", cut: 1 });
    // A prova de que nada foi partido: os 2 pontos são 4 unidades UTF-16 — o
    // corte caiu na fronteira do emoji, não no meio de um par substituto.
    assert.equal(resultado.text.length, 4);
  });

  it("uma colagem de 400 num limite de 200 relata o corte de 200", () => {
    // `cut > 1` é o sinal que o campo usa para avisar na faixa (Adendo 12).
    const colado = "x".repeat(400);
    assert.deepEqual(clampLength(colado, 200), {
      text: "x".repeat(200),
      cut: 200,
    });
  });
});
