/**
 * Testes de `lib/shortcut.ts` — a fronteira do único dado de configuração do
 * app: a combinação que o usuário aperta virando o acelerador que o backend
 * grava.
 *
 * As funções recebem um objeto com a forma do evento, então o teclado é
 * simulado por literal. A prévia dos modificadores depende da plataforma
 * (`isMac` lê o `navigator` NA CHAMADA, não na carga), e o teste troca o
 * `navigator` do global para ver as duas convenções — com o descritor original
 * devolvido no `finally`, porque um global vazado envenena os testes vizinhos.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acceleratorFrom,
  hasGlobalModifier,
  isModifierKey,
  modifiersPreview,
} from "./shortcut.ts";

type Evento = Parameters<typeof acceleratorFrom>[0];

function evento(parcial: Partial<Evento> & { code: string }): Evento {
  return {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...parcial,
  };
}

function comUserAgent(userAgent: string, corpo: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent },
    configurable: true,
  });
  try {
    corpo();
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
  }
}

describe("isModifierKey", () => {
  it("modificadores e teclas de estado não podem ser a tecla principal", () => {
    for (const code of ["ControlLeft", "AltRight", "ShiftLeft", "MetaRight", "CapsLock"]) {
      assert.equal(isModifierKey(code), true, code);
    }
    assert.equal(isModifierKey("KeyT"), false);
    assert.equal(isModifierKey("Space"), false);
  });
});

describe("hasGlobalModifier", () => {
  it("⌃, ⌥ ou ⌘ valem; ⇧ sozinho NÃO — é uma letra com maiúscula", () => {
    assert.equal(hasGlobalModifier(evento({ code: "KeyT", ctrlKey: true })), true);
    assert.equal(hasGlobalModifier(evento({ code: "KeyT", altKey: true })), true);
    assert.equal(hasGlobalModifier(evento({ code: "KeyT", metaKey: true })), true);
    assert.equal(hasGlobalModifier(evento({ code: "KeyT", shiftKey: true })), false);
    assert.equal(hasGlobalModifier(evento({ code: "KeyT" })), false);
  });
});

describe("acceleratorFrom", () => {
  it("modificador sozinho ainda não é atalho: null, e não 'o atalho é Control'", () => {
    assert.equal(acceleratorFrom(evento({ code: "ControlLeft", ctrlKey: true })), null);
  });

  it("escreve os modificadores SEMPRE na mesma ordem canônica", () => {
    // É esta estabilidade que deixa o painel comparar com a combinação atual
    // sem regravar o que já vale.
    assert.equal(
      acceleratorFrom(
        evento({
          code: "KeyT",
          metaKey: true,
          shiftKey: true,
          altKey: true,
          ctrlKey: true,
        }),
      ),
      "Control+Alt+Shift+Super+KeyT",
    );
    assert.equal(
      acceleratorFrom(evento({ code: "KeyT", ctrlKey: true, altKey: true })),
      "Control+Alt+KeyT",
    );
  });

  it("fala a língua do `event.code`, não a da letra produzida", () => {
    assert.equal(
      acceleratorFrom(evento({ code: "Digit1", ctrlKey: true })),
      "Control+Digit1",
    );
    assert.equal(acceleratorFrom(evento({ code: "Space", altKey: true })), "Alt+Space");
  });
});

describe("modifiersPreview", () => {
  const combinado = evento({
    code: "ControlLeft",
    ctrlKey: true,
    altKey: true,
    shiftKey: true,
    metaKey: true,
  });

  it("no Mac escreve símbolos na ordem da Apple (⌃⌥⇧⌘)", () => {
    comUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X)", () => {
      assert.equal(modifiersPreview(combinado), "⌃⌥⇧⌘");
      assert.equal(modifiersPreview(evento({ code: "AltLeft", altKey: true })), "⌥");
    });
  });

  it("fora do Mac escreve por extenso, na mesma ordem", () => {
    comUserAgent("Mozilla/5.0 (Windows NT 10.0)", () => {
      assert.equal(modifiersPreview(combinado), "Ctrl+Alt+Shift+Win+");
      assert.equal(
        modifiersPreview(evento({ code: "ControlLeft", ctrlKey: true })),
        "Ctrl+",
      );
    });
  });
});
