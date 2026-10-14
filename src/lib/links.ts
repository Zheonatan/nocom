/**
 * Links escritos no meio do título — `google::google.com` (Adendo 16).
 *
 * É o mesmo desenho de `dates.ts`, e não por coincidência: este app não tem
 * campo de link, nem coluna nova, nem nada no `todos.json`. O que existe é o que
 * a pessoa escreveu no título, e este módulo só LÊ. `palavra::endereço` faz a
 * palavra virar o link e o endereço sumir da tela — ele volta no `title` da
 * linha, e inteiro na edição inline —, do mesmo jeito que uma data vira pílula.
 *
 * Sem imports de propósito, como `text.ts` e `dates.ts`: é a fronteira mais fina
 * desta leitura, e o `node --test` precisa carregá-lo sem resolver o alias `@/`.
 */

/**
 * Um pedaço de texto: ou texto comum, ou o rótulo de um link. `href` é o
 * endereço já normalizado (`https://google.com/`); **`null` quer dizer "texto
 * comum"**, que é o caso da esmagadora maioria dos pedaços.
 */
export type LinkSegment = { text: string; href: string | null };

/**
 * `rótulo::endereço`, com o rótulo colado no `::` e espaço opcional depois.
 *
 * **O rótulo é UMA palavra, e a guarda da esquerda explica o porquê.** Ele só
 * começa no início do título ou depois de um caractere que não seja letra,
 * número, `_`, `-` ou `:` — a mesma ideia da guarda de `dates.ts`, recusar o que
 * é pedaço de outra coisa. Sem ela, `meu-atalho::x.com` seria lido como o link do
 * "atalho", e `std::vector` (anotação comum de quem programa) viraria um link.
 *
 * **Espaço antes do `::` não vale.** O `::` colado no rótulo é o que separa a
 * sintaxe de pontuação solta; exigir a colagem é o que faz `google :: x.com`
 * continuar sendo só texto, que é o desfecho certo para quem não quis um link.
 * Depois do `::` o espaço é tolerado (`google:: google.com`), porque aí ele não
 * muda o que foi pedido.
 *
 * `\p{L}` com a flag `u` aceita acento no rótulo (`café::x.com`), e a webview do
 * macOS (WebKit) entende isso desde muito antes das versões que o app exige — ao
 * contrário do lookbehind, que `dates.ts` evita pela mesma razão.
 */
const LINK_PATTERN = /(^|[^\p{L}\p{N}_:-])([\p{L}\p{N}_-]+)::\s*([^\s]+)/gu;

/**
 * A pontuação que a frase cola no fim do endereço e que não faz parte dele:
 * "veja google::google.com." — o ponto final é da frase, não do domínio.
 */
const PONTUACAO_FINAL = /[.,;:!?'")\]}]+$/;

/**
 * Um esquema explícito COM autoridade (`https://`). Sem o `//` não é esquema
 * nosso: `google.com:8080` tem `:` e não é `http:`, e tratá-lo como esquema
 * perderia a porta — que é parte do endereço.
 */
const COM_AUTORIDADE = /^([a-z][a-z0-9+.-]*):\/\//i;

/**
 * O endereço que o navegador vai abrir — ou `null` quando o que veio depois do
 * `::` não é um link, e então não há link nenhum (o texto inteiro continua
 * texto).
 *
 * **Sem esquema, ganha `https://`.** `google::google.com` é o que a pessoa
 * escreve; cobrar dela o `https://` seria pedir do teclado o que o app pode
 * decidir. O padrão é `https`, e não `http`: quem não diz o esquema quer o link
 * que funciona hoje.
 *
 * **Só `http` e `https` passam.** Um `javascript:` ou `file:` escrito no título
 * (ou vindo de um arquivo importado) não vira clique — o gesto entrega o
 * endereço ao navegador do SISTEMA, e aceitar qualquer esquema seria decidir por
 * quem escreveu. O `mailto:` fica de fora pelo mesmo motivo: se um dia fizer
 * falta, entra com a validação que merece, e não colado nesta.
 *
 * **Nada de `usuário@host`.** Um `mailto:x@y.com` sem o `mailto` reconhecido
 * viraria `https://mailto:x@y.com/` — um endereço válido que abre `y.com` e
 * descarta o `x`. Recusar o que tem userinfo evita transformar um e-mail mal
 * digitado num clique para outro lugar; o `mailto:` de verdade fica para o dia
 * em que entrar com validação própria.
 *
 * **O ponto no host é a guarda contra código.** Sem ele, `std::vector` daria um
 * link para `https://vector/` — a regex aceitaria e o `new URL` também. Um host
 * sem ponto é válido (uma intranet, um `localhost`), e é justamente por ser
 * válido que a recusa precisa ser explícita: numa lista de tarefas o segundo
 * significado de `palavra::palavra` é código, e código não é link.
 */
export function linkHref(bruto: string): string | null {
  const alvo = bruto.replace(PONTUACAO_FINAL, "");
  if (alvo === "") return null;

  const esquema = COM_AUTORIDADE.exec(alvo);
  if (esquema !== null) {
    const nome = (esquema[1] ?? "").toLowerCase();
    if (nome !== "http" && nome !== "https") return null;
  }
  const candidato = esquema === null ? `https://${alvo}` : alvo;

  let url: URL;
  try {
    url = new URL(candidato);
  } catch {
    // Tudo o que o navegador recusaria abrir: host malformado, porta não
    // numérica, endereço pela metade. Não é erro a mostrar — é um `::` que não
    // era link, e o texto fica onde está.
    return null;
  }
  if (url.username !== "" || url.password !== "") return null;
  if (!url.hostname.includes(".")) return null;
  return url.href;
}

/**
 * Reparte um texto nos pedaços que a linha desenha: texto comum e rótulos de
 * link. A invariante é a de `dates.ts` — **os textos concatenados devolvem o
 * original**, menos o `::` e o endereço, que a sintaxe esconde de propósito.
 *
 * Um `::` cujo endereço não passa por `linkHref` é deixado como texto: o trecho
 * inteiro sai no segmento comum, e nada é reescrito. É a mesma escolha
 * conservadora de `splitTitle` — na dúvida, não mexer no que a pessoa escreveu.
 */
export function segmentLinks(text: string): LinkSegment[] {
  const segmentos: LinkSegment[] = [];
  let cursor = 0;

  for (const casamento of text.matchAll(LINK_PATTERN)) {
    const [inteiro, guarda = "", rotulo = "", alvo = ""] = casamento;
    const href = linkHref(alvo);
    // `::` que não é link: o casamento é ignorado inteiro, e o texto segue no
    // segmento comum que o laço fecha no fim.
    if (href === null) continue;

    const inicio = casamento.index + guarda.length;
    if (inicio > cursor) {
      segmentos.push({ text: text.slice(cursor, inicio), href: null });
    }
    segmentos.push({ text: rotulo, href });
    cursor = casamento.index + inteiro.length;
  }

  if (cursor < text.length) {
    segmentos.push({ text: text.slice(cursor), href: null });
  }
  return segmentos;
}
