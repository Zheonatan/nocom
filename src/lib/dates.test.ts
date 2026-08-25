/**
 * Testes de `lib/dates.ts`.
 *
 * O backend tem 138 testes e o frontend não tinha runner nenhum. Este é o
 * primeiro, e ele começa aqui por um motivo: as funções deste módulo são puras,
 * recebem tudo o que usam por parâmetro e decidem coisas que **não aparecem na
 * tela quando estão erradas**. Uma data que não foi achada é indistinguível de uma
 * tarefa que não tinha data; uma data extraída para a direita quando não devia
 * deixa um buraco na frase que só quem escreveu percebe. Nenhum dos dois quebra a
 * janela, e é justamente isso que faz o teste valer mais aqui que num componente
 * — um erro de layout se vê, um erro de calendário não.
 *
 * **`node --test`, e nenhuma dependência nova.** O par natural do Vite seria o
 * vitest, e ele não entrou porque não precisou entrar: `dates.ts` não importa
 * nada (nem `@/`, nem React, nem DOM), o Node apaga os tipos sozinho, e o runner
 * da biblioteca padrão dá `describe`/`it` e asserções. Trocar isso por trinta
 * pacotes transitivos custaria mais do que resolve. O dia em que um teste precisar
 * de DOM — um `TodoRow` renderizado — é o dia de reabrir a conversa, e não antes.
 *
 * **A ordem de dia e mês é parâmetro, e é o que torna estes testes triviais.**
 * Ela já foi constante de módulo, lida do `navigator.language` na carga, e naquele
 * desenho exercitar as duas ordens exigia instanciar o módulo duas vezes com o
 * `navigator` global trocado no meio. Hoje quem responde é o backend
 * (`formato.rs`, comando `date_day_first`), o módulo só **recebe** a resposta, e o
 * teste passa `DIA` ou `MES` como argumento.
 *
 * **`matchesToday` e `achar` não são importadas de propósito.** São privadas,
 * `splitTitle` é a única chamadora, e todo galho delas é alcançável de fora.
 * Exportar função só para o teste vê-la seria o teste ditando a forma do módulo,
 * quando o escopo estreito é o principal ativo deste código.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { msUntilNextDay, soleDate, splitTitle, todayKey } from "./dates.ts";

// As duas ordens, nomeadas. `splitTitle(titulo, hoje, DIA)` diz mais na chamada
// do que um `true` solto, e o teste inteiro fica legível sem consultar a
// assinatura.
const DIA = true; // dia/mês — Brasil, Reino Unido, Alemanha
const MES = false; // mês/dia — Estados Unidos

// 21 de agosto de 2026.
const HOJE = "2026-08-21";

/**
 * Atalho de leitura: o que a linha desenha, em forma comparável.
 *
 * Reduz cada segmento ao essencial (`{ texto }` ou `{ data, hoje }`) para a
 * asserção caber numa linha em vez de repetir `date: false, today: false` em todo
 * pedaço de texto comum.
 */
function ler(title: string, today = HOJE, dayFirst = DIA) {
  const { segments, rest, trailing } = splitTitle(title, today, dayFirst);
  return {
    rest,
    trailing,
    inline: segments.map((s) =>
      s.date ? { data: s.text, hoje: s.today } : { texto: s.text },
    ),
  };
}

describe("todayKey", () => {
  it("preenche mês e dia com zero à esquerda", () => {
    assert.equal(todayKey(new Date(2026, 0, 5)), "2026-01-05");
  });

  it("não mexe no que já tem dois dígitos", () => {
    assert.equal(todayKey(new Date(2026, 11, 31)), "2026-12-31");
  });

  it("é o dia LOCAL, e não o de UTC", () => {
    // Este é o teste que justifica os três `get*()` no lugar de um
    // `toISOString().slice(0, 10)`, que seria uma linha em vez de três. Às 23:30
    // no Brasil já é o dia seguinte em UTC, e a chave sairia um dia à frente do
    // que o relógio da pessoa mostra — a pílula vermelha acenderia em cima de
    // amanhã na última hora e meia de todo dia. A asserção vale em qualquer fuso:
    // a data é construída em hora local e lida em hora local.
    assert.equal(todayKey(new Date(2026, 7, 21, 23, 30)), "2026-08-21");
  });
});

describe("msUntilNextDay", () => {
  it("conta até a meia-noite, com a folga de um segundo", () => {
    assert.equal(msUntilNextDay(new Date(2026, 7, 21, 23, 59, 0)), 60_000 + 1000);
  });

  it("recém-passada a meia-noite, espera o dia inteiro", () => {
    assert.equal(
      msUntilNextDay(new Date(2026, 7, 21, 0, 0, 0)),
      86_400_000 + 1000,
    );
  });

  it("atravessa a virada do ano", () => {
    // O `new Date(ano, mês, dia + 1)` normaliza sozinho: 31 de dezembro + 1 é
    // 1º de janeiro, e não "32 de dezembro". Vale a asserção porque é fácil
    // "consertar" isso mais tarde com uma conta de dias no mês e reintroduzir o
    // bug que o construtor já não tem.
    assert.equal(
      msUntilNextDay(new Date(2026, 11, 31, 23, 59, 0)),
      60_000 + 1000,
    );
  });

  it("nunca devolve zero nem negativo", () => {
    // A folga existe porque um `setTimeout` pode ser servido alguns
    // milissegundos ANTES do instante pedido, recalcular o mesmo dia e reagendar
    // para zero — o que viraria um laço apertado em vez de um despertador.
    assert.ok(msUntilNextDay(new Date(2026, 7, 21, 23, 59, 59, 999)) > 0);
  });
});

describe("título sem data nenhuma", () => {
  it("devolve segments VAZIO, e o título inteiro em rest", () => {
    // A distinção é o contrato do retorno, e não gosto pessoal: o `TodoRow` lê
    // `segments` vazio como "renderize `rest` como sempre" — um nó de texto, sem
    // elemento nenhum em volta. É o caminho da esmagadora maioria das tarefas, e
    // ele continua sendo exatamente o DOM que já era.
    assert.deepEqual(ler("pagar boleto"), {
      rest: "pagar boleto",
      trailing: null,
      inline: [],
    });
  });

  it("título vazio", () => {
    assert.deepEqual(ler(""), { rest: "", trailing: null, inline: [] });
  });
});

describe("extração: as três condições", () => {
  it("uma data no fim, com texto antes, vai para a direita", () => {
    assert.deepEqual(ler("pagar boleto 21/08"), {
      rest: "pagar boleto",
      trailing: { text: "21/08", today: true },
      inline: [],
    });
  });

  it("data que NÃO é hoje também é extraída — toda data vai para a direita", () => {
    // O comportamento que mudou. Antes só hoje era marcado e o resto do título
    // passava em branco; agora a direita é o lugar da data, hoje ou não.
    assert.deepEqual(ler("TESTE 19/10"), {
      rest: "TESTE",
      trailing: { text: "19/10", today: false },
      inline: [],
    });
  });

  it("o espaço entre o texto e a data não sobra no rest", () => {
    assert.equal(ler("pagar boleto 21/08").rest, "pagar boleto");
    assert.equal(ler("pagar boleto    21/08").rest, "pagar boleto");
  });

  it("espaço DEPOIS da data não desqualifica a extração", () => {
    assert.deepEqual(ler("pagar boleto 21/08   "), {
      rest: "pagar boleto",
      trailing: { text: "21/08", today: true },
      inline: [],
    });
  });

  it("o ano vai junto para a direita", () => {
    assert.deepEqual(ler("pagar boleto 21/08/2026").trailing, {
      text: "21/08/2026",
      today: true,
    });
    assert.deepEqual(ler("pagar boleto 21/08/26").trailing, {
      text: "21/08/26",
      today: true,
    });
  });

  it("data no MEIO da frase fica inline, e não é extraída", () => {
    // Extrair daqui deixaria "reuniao com o time" — um texto que ninguém
    // escreveu, com a data reposicionada para longe do que ela qualificava.
    assert.deepEqual(ler("reuniao 19/10 com o time"), {
      rest: "reuniao 19/10 com o time",
      trailing: null,
      inline: [
        { texto: "reuniao " },
        { data: "19/10", hoje: false },
        { texto: " com o time" },
      ],
    });
  });

  it("DUAS datas ficam as duas inline, mesmo com uma no fim", () => {
    // A condição que protege o intervalo. Levar `25/10` para a direita deixaria
    // "de 19/10 a" pendurado, dizendo menos que o original.
    assert.deepEqual(ler("de 19/10 a 25/10"), {
      rest: "de 19/10 a 25/10",
      trailing: null,
      inline: [
        { texto: "de " },
        { data: "19/10", hoje: false },
        { texto: " a " },
        { data: "25/10", hoje: false },
      ],
    });
  });

  it("duas datas de hoje também ficam inline", () => {
    assert.deepEqual(ler("medico 21/08 e dentista 21/08"), {
      rest: "medico 21/08 e dentista 21/08",
      trailing: null,
      inline: [
        { texto: "medico " },
        { data: "21/08", hoje: true },
        { texto: " e dentista " },
        { data: "21/08", hoje: true },
      ],
    });
  });

  it("título que é SÓ a data fica inline, para a linha não parecer vazia", () => {
    // Sem esta condição, `rest` seria "" e a linha apareceria com a esquerda
    // vazia e um badge solto na direita.
    assert.deepEqual(ler("21/08"), {
      rest: "21/08",
      trailing: null,
      inline: [{ data: "21/08", hoje: true }],
    });
  });

  it("título que é a data com espaços em volta também fica inline", () => {
    assert.equal(ler("  21/08  ").trailing, null);
  });
});

describe("toda data ganha pílula, não só a de hoje", () => {
  it("data de outro dia é marcada, com hoje falso", () => {
    assert.deepEqual(ler("reuniao 19/10 com o time").inline[1], {
      data: "19/10",
      hoje: false,
    });
  });

  it("a de hoje é marcada com hoje verdadeiro", () => {
    assert.equal(ler("pagar boleto 21/08").trailing?.today, true);
  });

  it("ano diferente é data, mas não é hoje", () => {
    assert.deepEqual(ler("pagar 21/08/2025").trailing, {
      text: "21/08/2025",
      today: false,
    });
    assert.deepEqual(ler("pagar 21/08/25").trailing, {
      text: "21/08/25",
      today: false,
    });
  });

  it("`21/08/1926` é data e não é hoje", () => {
    // O `20${ano}` só entra na forma de dois dígitos. Um ano de quatro é usado
    // literalmente, então 1926 é 1926 e não vira 2026 pela regra do século.
    assert.deepEqual(ler("pagar 21/08/1926").trailing, {
      text: "21/08/1926",
      today: false,
    });
  });
});

describe("nenhum calendário é validado — e agora isso se VÊ", () => {
  it("`31/02` é tratado como data e ganha pílula", () => {
    // Enquanto a pergunta era só "é hoje?", isto saía de graça: `31/02` nunca é
    // igual a hoje, então nada aparecia na tela e o calendário não precisava
    // existir. Com toda data destacada, a pílula passa a aparecer em cima de uma
    // data que não existe — decisão consciente do Adendo 11, e este teste é ela
    // escrita em forma executável, para que uma mudança futura seja deliberada e
    // não um acidente.
    assert.deepEqual(ler("prazo 31/02").trailing, {
      text: "31/02",
      today: false,
    });
  });

  it("`00/00` também", () => {
    assert.deepEqual(ler("prazo 00/00").trailing, {
      text: "00/00",
      today: false,
    });
  });

  it("`31/02` nunca é hoje, em nenhum dia", () => {
    for (const dia of ["2026-02-28", "2026-03-31", "2026-02-03"]) {
      assert.equal(ler("prazo 31/02", dia).trailing?.today, false, dia);
    }
  });
});

describe("as duas guardas da regex", () => {
  it("`1/2/3/4` não contém data nenhuma", () => {
    // A guarda da direita (`(?![\d/])`) é o que recusa isto. Sem ela, `1/2`
    // casaria e o resto sobraria.
    assert.deepEqual(ler("1/2/3/4"), {
      rest: "1/2/3/4",
      trailing: null,
      inline: [],
    });
    assert.equal(ler("proporcao 1/2/3/4").trailing, null);
  });

  it("`21/08/2026` captura a data INTEIRA, não `21/08` com sobra", () => {
    assert.deepEqual(ler("pagar 21/08/2026").trailing, {
      text: "21/08/2026",
      today: true,
    });
  });

  it("ano de três dígitos não é ano, e derruba a data toda", () => {
    // `(\d{2}|\d{4})` não aceita três, e aí a guarda da direita reprova o que
    // sobrou. Melhor nada que marcar `21/08` e deixar `/026` pendurado do lado.
    assert.deepEqual(ler("pagar 21/08/026"), {
      rest: "pagar 21/08/026",
      trailing: null,
      inline: [],
    });
  });

  it("data colada em número à esquerda não é data", () => {
    // A guarda da esquerda (`(^|[^\d/])`) recusa: em `1221/08` o `21/08` está
    // dentro de outro número, e marcar um pedaço dele seria afirmar que parte de
    // um número é uma data.
    assert.equal(ler("nota 1221/08").trailing, null);
    assert.equal(ler("11/21/08").trailing, null);
  });

  it("ano na frente (ISO) não é reconhecido", () => {
    // `2026/08/21` não casa: o primeiro grupo aceita no máximo dois dígitos, e
    // não há guarda válida em lugar nenhum de uma cadeia só de dígitos e barras.
    // Fica documentado como não suportado — a forma que este módulo lê é a que se
    // escreve à mão numa lista.
    assert.equal(ler("pagar 2026/08/21").trailing, null);
  });

  it("a guarda da esquerda fica FORA da pílula", () => {
    // O caractere de antes participa da varredura e nunca da tinta. Se ele
    // vazasse para dentro do `mark`, a pílula começaria no espaço — o que se vê
    // como uma margem torta de um lado só.
    assert.deepEqual(ler("de 19/10 a 25/10").inline[0], { texto: "de " });
  });
});

describe("um e dois dígitos", () => {
  // 6 de setembro: dia e mês ambos de um dígito, o único jeito de exercitar as
  // quatro combinações de forma curta e longa.
  const SEIS_DE_SETEMBRO = "2026-09-06";

  it("aceita a forma curta nos dois campos", () => {
    assert.deepEqual(ler("ligar 6/9", SEIS_DE_SETEMBRO).trailing, {
      text: "6/9",
      today: true,
    });
  });

  it("aceita a forma longa nos dois campos", () => {
    assert.deepEqual(ler("ligar 06/09", SEIS_DE_SETEMBRO).trailing, {
      text: "06/09",
      today: true,
    });
  });

  it("aceita as duas misturadas", () => {
    // É o caso que uma comparação de texto crua erraria, e a razão de existir o
    // `pad()` nos dois lados: quem escreve `6/09` está dizendo o mesmo que
    // `06/9`, e recusar uma das formas faria o destaque funcionar para umas
    // pessoas e não para outras sem nada na tela explicando por quê.
    assert.equal(ler("ligar 6/09", SEIS_DE_SETEMBRO).trailing?.today, true);
    assert.equal(ler("ligar 06/9", SEIS_DE_SETEMBRO).trailing?.today, true);
  });

  it("três dígitos não é dia nem mês", () => {
    assert.equal(ler("ligar 006/09", SEIS_DE_SETEMBRO).trailing, null);
    assert.equal(ler("ligar 6/009", SEIS_DE_SETEMBRO).trailing, null);
  });
});

describe("as duas ordens", () => {
  it("`08/21` é hoje para quem escreve mês na frente", () => {
    assert.deepEqual(ler("pay bill 08/21", HOJE, MES).trailing, {
      text: "08/21",
      today: true,
    });
  });

  it("a mesma data é lida ao contrário nas duas ordens", () => {
    // A prova de que a ordem vem de fora e não está fixada no código. Note que
    // as duas continuam sendo DATA nos dois casos — o que muda é só o `today`, e
    // portanto só a cor da pílula. É consequência de toda data ser marcada: a
    // ordem errada não esconde mais a data, só pinta a pílula errada.
    assert.equal(ler("pagar 21/08", HOJE, DIA).trailing?.today, true);
    assert.equal(ler("pagar 21/08", HOJE, MES).trailing?.today, false);
    assert.equal(ler("pagar 08/21", HOJE, MES).trailing?.today, true);
    assert.equal(ler("pagar 08/21", HOJE, DIA).trailing?.today, false);
  });

  it("dia e mês iguais casam nas duas ordens", () => {
    // 8 de agosto. Serve de controle: é o dia em que a detecção de ordem não
    // pode ser culpada por uma pílula da cor errada.
    for (const ordem of [DIA, MES]) {
      assert.equal(
        ler("pagar 08/08", "2026-08-08", ordem).trailing?.today,
        true,
      );
    }
  });
});

describe("o preço aceito da forma curta, que agora é permanente", () => {
  it("`beber 3/4` extrai `3/4` como data, em qualquer dia", () => {
    // O custo declarado de aceitar um dígito só. Antes ele era cobrado num dia
    // por ano — o destaque só acendia em 3 de abril; agora a pílula é permanente,
    // porque toda data é marcada. Fica aqui para que o comportamento seja
    // conhecido em vez de descoberto: foi decisão explícita no Adendo 11.
    assert.deepEqual(ler("beber 3/4").trailing, { text: "3/4", today: false });
    assert.equal(ler("beber 3/4", "2026-04-03").trailing?.today, true);
  });

  it("no meio da frase ela fica inline, e não vai para a direita", () => {
    // "beber 3/4 de litro" mantém o texto intacto — a fração continua legível
    // onde estava, só com uma pílula em volta. É a extração conservadora
    // limitando o dano do falso positivo: ela não reescreve a frase.
    const r = ler("beber 3/4 de litro");
    assert.equal(r.trailing, null);
    assert.equal(r.rest, "beber 3/4 de litro");
    assert.deepEqual(r.inline[1], { data: "3/4", hoje: false });
  });
});

describe("invariantes de reconstrução", () => {
  const TITULOS = [
    "pagar boleto 21/08",
    "TESTE 19/10",
    "21/08",
    "reuniao 19/10 com o time",
    "de 19/10 a 25/10",
    "medico 21/08 e dentista 21/08",
    "pagar 21/08/2026",
    "sem data nenhuma",
    "  21/08  ",
    "tarefa 21/08 com acentuação — e travessão",
    "beber 3/4 de litro",
    "pagar boleto    21/08   ",
  ];

  it("os segmentos remontam exatamente o rest", () => {
    // A invariante que fecha todos os casos de forma de uma vez: o que a tela
    // desenha à esquerda tem que ser exatamente `rest`. Um `slice` com índice
    // trocado passaria por várias asserções de forma e cairia aqui.
    for (const titulo of TITULOS) {
      const { segments, rest } = splitTitle(titulo, HOJE, DIA);
      if (segments.length === 0) continue;
      assert.equal(
        segments.map((s) => s.text).join(""),
        rest,
        `os segmentos de ${JSON.stringify(titulo)} não remontam o rest`,
      );
    }
  });

  it("nada é perdido: rest + trailing cobrem o título", () => {
    // A parte que a extração poderia quebrar em silêncio — mover a data é a
    // única operação deste módulo que muda o texto que a pessoa vê, e o único
    // caractere que pode desaparecer é espaço em branco entre o texto e a data.
    for (const titulo of TITULOS) {
      const { rest, trailing } = splitTitle(titulo, HOJE, DIA);
      if (trailing === null) {
        assert.equal(rest, titulo, `rest mudou sem extração: ${titulo}`);
        continue;
      }
      assert.ok(
        titulo.startsWith(rest),
        `rest não é o começo do título: ${JSON.stringify({ titulo, rest })}`,
      );
      assert.ok(
        titulo.trimEnd().endsWith(trailing.text),
        `a data extraída não é o fim do título: ${titulo}`,
      );
      const meio = titulo
        .trimEnd()
        .slice(rest.length, -trailing.text.length);
      assert.equal(
        meio.trim(),
        "",
        `sobrou texto entre o rest e a data: ${JSON.stringify(meio)}`,
      );
    }
  });

  it("nenhum segmento é vazio", () => {
    // Vale junto com o teste de cima: dois segmentos que remontam o rest podem,
    // ainda assim, incluir um vazio no meio — e cada vazio é um elemento a mais
    // no DOM sem um caractere dentro.
    for (const titulo of TITULOS) {
      for (const s of splitTitle(titulo, HOJE, DIA).segments) {
        assert.notEqual(s.text, "", `segmento vazio em ${titulo}`);
      }
    }
  });

  it("rest nunca é vazio quando houve extração", () => {
    // É a terceira condição da extração, dita como invariante: uma linha nunca
    // fica com a esquerda vazia e um badge solto na direita.
    for (const titulo of TITULOS) {
      const { rest, trailing } = splitTitle(titulo, HOJE, DIA);
      if (trailing !== null) {
        assert.notEqual(rest, "", `extraiu deixando rest vazio: ${titulo}`);
      }
    }
  });

  it("no máximo uma data é extraída", () => {
    for (const titulo of TITULOS) {
      const { segments, trailing } = splitTitle(titulo, HOJE, DIA);
      // Se houve extração, não sobra data inline: as três condições exigem que a
      // data extraída seja a única do título.
      if (trailing !== null) {
        assert.equal(
          segments.filter((s) => s.date).length,
          0,
          `extraiu e ainda deixou data inline: ${titulo}`,
        );
      }
    }
  });
});

describe("a ordem vem de fora, e o módulo não adivinha", () => {
  it("nada no módulo lê o ambiente", async () => {
    // O teste que impede a volta do defeito do Adendo 11. Se alguém
    // reintroduzir uma leitura de `navigator`, de `Intl` ou de `process.env` na
    // carga, a resposta passa a depender da máquina — e o import abaixo, feito
    // com o `navigator` arrancado do global, quebraria ou mudaria de
    // comportamento.
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
    });
    // O especificador sai de uma variável porque o `?sufixo` é para o cache de
    // módulos do Node, e não um arquivo: o `tsc` resolve especificador literal e
    // reprovaria `./dates.ts?sem-navigator` como módulo inexistente. Numa
    // variável ele não é resolvido em tempo de compilação, e o Node continua
    // enxergando o `.ts` no caminho.
    const especificador = "./dates.ts?sem-navigator";
    const recarregado: typeof import("./dates.ts") = await import(especificador);
    assert.equal(
      recarregado.splitTitle("pagar 21/08", HOJE, DIA).trailing?.today,
      true,
    );
    assert.equal(
      recarregado.splitTitle("pagar 21/08", HOJE, MES).trailing?.today,
      false,
    );
  });
});

/**
 * `soleDate` (Adendo 14) é a mesma leitura de `splitTitle` devolvendo NÚMEROS em
 * vez de posições, e é a única porta pela qual uma data do título vira um
 * instante gravado. Um erro aqui não pinta nada errado na tela — ele agenda um
 * aviso para o dia errado, ou deixa de agendar em silêncio, que são exatamente os
 * dois defeitos que este arquivo existe para pegar.
 */
describe("soleDate", () => {
  it("lê a data única nas duas ordens, com mês humano", () => {
    assert.deepEqual(soleDate("pagar boleto 03/09", HOJE, DIA), {
      year: 2026,
      month: 9,
      day: 3,
    });
    assert.deepEqual(soleDate("pay bill 03/09", HOJE, MES), {
      year: 2026,
      month: 3,
      day: 9,
    });
  });

  it("sem ano, o ano é o de hoje — e vem de `today`, não de um relógio próprio", () => {
    assert.deepEqual(soleDate("20/08", "2031-01-02", DIA), {
      year: 2031,
      month: 8,
      day: 20,
    });
  });

  it("dois dígitos são deste século; quatro passam inteiros", () => {
    assert.deepEqual(soleDate("evento 20/08/27", HOJE, DIA), {
      year: 2027,
      month: 8,
      day: 20,
    });
    assert.deepEqual(soleDate("evento 20/08/2029", HOJE, DIA), {
      year: 2029,
      month: 8,
      day: 20,
    });
  });

  it("a posição no título não importa — só a quantidade", () => {
    // `splitTitle` só EXTRAI a data que está no fim; o lembrete não tem essa
    // condição, porque não move texto nenhum.
    assert.deepEqual(soleDate("reunião 19/10 com o time", HOJE, DIA), {
      year: 2026,
      month: 10,
      day: 19,
    });
  });

  it("título sem data, ou com mais de uma, não dá lembrete", () => {
    assert.equal(soleDate("comprar leite", HOJE, DIA), null);
    assert.equal(soleDate("de 19/10 a 25/10", HOJE, DIA), null);
    // A guarda da regex continua valendo: aqui não há data nenhuma a achar.
    assert.equal(soleDate("versão 1/2/3/4", HOJE, DIA), null);
  });

  it("data impossível não vira instante — mas continua ganhando pílula", () => {
    // As duas metades da decisão, no mesmo teste: `soleDate` recusa e
    // `splitTitle` não. Separá-las deixaria a contradição aparente sem o
    // contexto que a explica.
    assert.equal(soleDate("prazo 31/02", HOJE, DIA), null);
    assert.equal(soleDate("prazo 32/01", HOJE, DIA), null);
    assert.equal(soleDate("prazo 20/13", HOJE, DIA), null);
    assert.equal(ler("prazo 31/02").trailing?.text, "31/02");
  });

  it("o fim de fevereiro segue o ano bissexto, e não uma tabela fixa", () => {
    assert.deepEqual(soleDate("29/02/2028", HOJE, DIA), {
      year: 2028,
      month: 2,
      day: 29,
    });
    assert.equal(soleDate("29/02/2027", HOJE, DIA), null);
    // 2100 não é bissexto — a regra do século, que uma checagem de `% 4` sozinha
    // erraria.
    assert.equal(soleDate("29/02/2100", HOJE, DIA), null);
    assert.deepEqual(soleDate("29/02/2000", HOJE, DIA), {
      year: 2000,
      month: 2,
      day: 29,
    });
  });

  it("os meses de 30 dias são recusados no 31", () => {
    for (const mes of ["04", "06", "09", "11"]) {
      assert.equal(soleDate(`prazo 31/${mes}`, HOJE, DIA), null, mes);
    }
    for (const mes of ["01", "03", "05", "07", "08", "10", "12"]) {
      assert.ok(soleDate(`prazo 31/${mes}`, HOJE, DIA), mes);
    }
  });
});
