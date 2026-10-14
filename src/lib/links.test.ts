/**
 * Testes de `lib/links.ts` (Adendo 16).
 *
 * O mesmo raciocínio de `dates.test.ts`: um link que não foi achado é
 * indistinguível de uma tarefa sem link, e um `::` lido como link quando não era
 * reescreve o que a pessoa escreveu. Nenhum dos dois quebra a janela — os dois
 * só silenciam uma coisa errada —, e é justamente isso que faz o teste valer.
 *
 * `node --test`, sem dependência nova: `links.ts` não importa nada, o Node apaga
 * os tipos sozinho e o runner da biblioteca padrão basta.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { linkHref, segmentLinks } from "./links.ts";

/**
 * Atalho de leitura: o que a linha desenha, em forma comparável. Cada pedaço
 * vira `{ texto }` ou `{ link, href }`, para a asserção caber numa linha sem
 * repetir `href: null` em todo trecho comum.
 */
function ler(text: string) {
  return segmentLinks(text).map((s) =>
    s.href === null ? { texto: s.text } : { link: s.text, href: s.href },
  );
}

describe("segmentLinks — o caso comum", () => {
  it("texto sem `::` é um segmento só, e continua sendo o texto inteiro", () => {
    assert.deepEqual(ler("pagar boleto"), [{ texto: "pagar boleto" }]);
  });

  it("título vazio não devolve segmento nenhum", () => {
    assert.deepEqual(ler(""), []);
  });
});

describe("segmentLinks — o rótulo e o endereço", () => {
  it("o rótulo vira link, o endereço some da tela, o resto fica", () => {
    assert.deepEqual(ler("veja google::google.com agora"), [
      { texto: "veja " },
      { link: "google", href: "https://google.com/" },
      { texto: " agora" },
    ]);
  });

  it("só `palavra::endereço` já basta", () => {
    assert.deepEqual(ler("google::google.com"), [
      { link: "google", href: "https://google.com/" },
    ]);
  });

  it("o rótulo é UMA palavra: o resto antes dele continua texto", () => {
    // O pedido foi "link numa palavra", e é isso que sai: em "meu site::site.com"
    // o link é o "site", e o "meu " fica onde estava.
    assert.deepEqual(ler("meu site::site.com"), [
      { texto: "meu " },
      { link: "site", href: "https://site.com/" },
    ]);
  });

  it("espaço depois do `::` não atrapalha", () => {
    assert.deepEqual(ler("google:: google.com"), [
      { link: "google", href: "https://google.com/" },
    ]);
  });

  it("espaço ANTES do `::` faz disto texto comum", () => {
    // A colagem é o que separa a sintaxe de pontuação solta; quem digita
    // "google :: x.com" não quis um link, e o desfecho certo é não mexer.
    assert.deepEqual(ler("google :: google.com"), [
      { texto: "google :: google.com" },
    ]);
  });

  it("dois links no mesmo título", () => {
    assert.deepEqual(ler("a::x.com e b::y.org"), [
      { link: "a", href: "https://x.com/" },
      { texto: " e " },
      { link: "b", href: "https://y.org/" },
    ]);
  });

  it("acento no rótulo", () => {
    assert.deepEqual(ler("café::x.com"), [
      { link: "café", href: "https://x.com/" },
    ]);
  });

  it("o endereço com caminho vai inteiro para o href", () => {
    assert.deepEqual(ler("docs::site.com/guia?p=1#top"), [
      { link: "docs", href: "https://site.com/guia?p=1#top" },
    ]);
  });
});

describe("segmentLinks — o que NÃO é link", () => {
  it("`std::vector` continua sendo texto", () => {
    // O segundo significado de `palavra::palavra` numa lista de tarefas é código.
    // Sem a exigência de ponto no host, isto viraria um link para `vector`.
    assert.deepEqual(ler("std::vector"), [{ texto: "std::vector" }]);
    assert.deepEqual(ler("usar Foo::bar aqui"), [
      { texto: "usar Foo::bar aqui" },
    ]);
  });

  it("`::` sem endereço nenhum é texto", () => {
    assert.deepEqual(ler("horário::"), [{ texto: "horário::" }]);
  });

  it("endereço impossível de abrir não vira clique", () => {
    assert.deepEqual(ler("x::javascript:alert(1)"), [
      { texto: "x::javascript:alert(1)" },
    ]);
    assert.deepEqual(ler("x::file://etc/passwd"), [
      { texto: "x::file://etc/passwd" },
    ]);
  });

  it("um `::` ruim não engole o link bom que vem depois", () => {
    assert.deepEqual(ler("bad::ok::x.com e docs::good.dev"), [
      // `bad::ok::x.com` inteiro falha e volta a ser texto...
      { texto: "bad::ok::x.com e " },
      // ...mas o segundo vínculo é reconhecido normalmente.
      { link: "docs", href: "https://good.dev/" },
    ]);
  });
});

describe("linkHref — normalização", () => {
  it("sem esquema, ganha `https://`", () => {
    assert.equal(linkHref("google.com"), "https://google.com/");
  });

  it("http e https explícitos são preservados", () => {
    assert.equal(linkHref("http://google.com"), "http://google.com/");
    assert.equal(linkHref("https://google.com/Path"), "https://google.com/Path");
    assert.equal(linkHref("HTTPS://GOOGLE.com"), "https://google.com/");
  });

  it("a porta sobrevive — e não vira esquema", () => {
    // `example.com:8080` tem `:` e não é `http:`; sem o `//` o `:` é da porta.
    assert.equal(linkHref("example.com:8080"), "https://example.com:8080/");
  });

  it("a pontuação final da frase fica de fora", () => {
    assert.equal(linkHref("google.com."), "https://google.com/");
    assert.equal(linkHref("google.com,"), "https://google.com/");
    assert.equal(linkHref("google.com)"), "https://google.com/");
  });

  it("IP funciona", () => {
    assert.equal(linkHref("127.0.0.1:1420"), "https://127.0.0.1:1420/");
  });
});

describe("linkHref — o que é recusado", () => {
  it("esquema que não é http(s)", () => {
    assert.equal(linkHref("javascript://x.com"), null);
    assert.equal(linkHref("mailto:x@y.com"), null);
    assert.equal(linkHref("ftp://x.com"), null);
  });

  it("host sem ponto", () => {
    assert.equal(linkHref("localhost"), null);
    assert.equal(linkHref("vector"), null);
    assert.equal(linkHref("http://intranet"), null);
  });

  it("endereço com userinfo, para não virar clique no lugar errado", () => {
    assert.equal(linkHref("a@b.com"), null);
    assert.equal(linkHref("mailto:x@y.com"), null);
  });

  it("vazio e sobra de pontuação", () => {
    assert.equal(linkHref(""), null);
    assert.equal(linkHref("..."), null);
  });
});

describe("invariante de reconstrução", () => {
  const TITULOS = [
    "pagar boleto",
    "veja google::google.com agora",
    "google::google.com",
    "meu site::site.com",
    "a::x.com e b::y.org",
    "std::vector",
    "google :: google.com",
    "café::x.com",
    "sem link nenhum 21/08",
  ];

  it("os textos dos segmentos só perdem o `::` e o endereço", () => {
    // A leitura conservadora, escrita como invariante: fora a sintaxe do link (o
    // `::`, o endereço e o espaço que o separa do rótulo), nada do que a pessoa
    // escreveu desaparece da tela. Um `slice` com índice trocado cairia aqui.
    for (const titulo of TITULOS) {
      const segmentos = segmentLinks(titulo);
      if (segmentos.every((s) => s.href === null)) {
        assert.equal(
          segmentos.map((s) => s.text).join(""),
          titulo,
          `texto comum foi alterado: ${titulo}`,
        );
      }
    }
  });

  it("nenhum segmento é vazio", () => {
    for (const titulo of TITULOS) {
      for (const s of segmentLinks(titulo)) {
        assert.notEqual(s.text, "", `segmento vazio em ${titulo}`);
      }
    }
  });
});
