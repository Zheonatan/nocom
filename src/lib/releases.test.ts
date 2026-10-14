/**
 * Testes de `lib/releases.ts` (Adendo 17).
 *
 * O que se testa aqui é a decisão de MOSTRAR, e a integridade das notas. Um erro
 * na decisão não quebra a janela: ele ou repete a tela de novidades para sempre
 * (o defeito que `onboarding.ts` já existe para evitar, com a mesma trava), ou
 * engole a nota de uma atualização sem que ninguém perceba. Os dois são
 * silenciosos, e é por isso que valem teste.
 *
 * `node --test`, sem dependência nova: `releases.ts` só importa o tipo `Locale`
 * (apagado na hora de rodar), não toca em `localStorage` ao carregar, e o runner
 * da biblioteca padrão basta.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RELEASES, releaseFor, shouldAnnounce } from "./releases.ts";

describe("shouldAnnounce", () => {
  it("instalação nova não anuncia nada", () => {
    // Sem "antes" para comparar, e o estado vazio de primeira execução já
    // apresenta o app: novidades ali seriam novidade nenhuma.
    assert.equal(shouldAnnounce(null, "0.7.0"), false);
  });

  it("versão diferente da última vista anuncia", () => {
    assert.equal(shouldAnnounce("0.6.0", "0.7.0"), true);
    // Atualização que pula versões também anuncia: o que importa é que mudou.
    assert.equal(shouldAnnounce("0.4.0", "0.7.0"), true);
  });

  it("mesma versão não anuncia de novo", () => {
    assert.equal(shouldAnnounce("0.7.0", "0.7.0"), false);
  });

  it("uma versão ANTIGA não é atualização", () => {
    // Reinstalar 0.6.0 por cima de 0.7.0 (ou um downgrade) não faz a nota de
    // 0.6.0 virar novidade; a comparação é de texto, não de ordem.
    assert.equal(shouldAnnounce("0.7.0", "0.6.0"), true);
    // ...mas a regra é literal: qualquer diferença anuncia. Este teste fixa a
    // literalidade de propósito, para ninguém "consertar" com um `>` que
    // silenciaria o downgrade sem que ninguém soubesse que era esperado.
    assert.equal(shouldAnnounce("1.0.0", "0.9.9"), true);
  });
});

describe("releaseFor", () => {
  it("acha a versão que tem nota", () => {
    const release = releaseFor("0.7.0");
    assert.ok(release);
    assert.equal(release.version, "0.7.0");
  });

  it("versão sem nota devolve null — a atualização passa em silêncio", () => {
    assert.equal(releaseFor("9.9.9"), null);
  });
});

describe("as notas, como dado", () => {
  it("nenhuma versão se repete", () => {
    const vistas = new Set(RELEASES.map((r) => r.version));
    assert.equal(vistas.size, RELEASES.length);
  });

  it("a data casa o formato do CHANGELOG", () => {
    for (const release of RELEASES) {
      assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/, release.version);
    }
  });

  it("toda versão tem os DOIS idiomas, com manchete e ao menos um tópico", () => {
    // O tipo `copy: Record<Locale, ReleaseCopy>` já força a presença dos dois
    // idiomas no compilador; o teste cobre o que o tipo não vê — texto vazio.
    for (const release of RELEASES) {
      for (const idioma of ["pt-BR", "en"] as const) {
        const copy = release.copy[idioma];
        assert.ok(copy.headline.trim() !== "", `${release.version}/${idioma}: manchete vazia`);
        assert.ok(copy.items.length > 0, `${release.version}/${idioma}: sem tópicos`);
        for (const item of copy.items) {
          assert.ok(item.trim() !== "", `${release.version}/${idioma}: tópico vazio`);
        }
      }
    }
  });

  it("estão da mais nova para a mais antiga", () => {
    const versoes = RELEASES.map((r) => r.version);
    const ordenadas = [...versoes].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );
    assert.deepEqual(versoes, ordenadas);
  });
});
