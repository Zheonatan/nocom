import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

/** Uma linha que muda de lugar leva isto para chegar lá. */
const TRAVEL_MS = 180;

/**
 * A viagem começa DEPOIS da tinta.
 *
 * Concluir uma tarefa são três batidas — o check se desenha, o título desbota,
 * a linha vai para o fim da lista — e sem esta pausa as três caem no mesmo
 * instante: a linha sai debaixo do olho no meio do gesto que a marcou, e a
 * marca que a pessoa acabou de fazer é a coisa que ela menos consegue ver. 70ms
 * não se lê como espera; se lê como consequência.
 */
const TRAVEL_DELAY_MS = 70;

/**
 * Precisa bater com a duração de `.arrive` no index.css, que é quem de fato
 * anima. Aqui ela serve só para saber quando uma chegada já acabou — ver
 * `arriving`.
 */
const ARRIVE_MS = 150;

/**
 * A mesma curva do `ease-settle` do CSS (`--motion-settle`). Escrita aqui
 * também porque a Web Animations API não lê variável de tema — e mudar uma sem
 * a outra deixaria a chegada e a viagem com físicas diferentes.
 */
const SETTLE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * O movimento da lista, que é a única região do app onde o conteúdo troca.
 *
 * Duas coisas, e a diferença entre elas é o que este hook existe para decidir:
 *
 * - **Chegar.** Uma linha que ainda não estava aqui não desliza de lugar
 *   nenhum — ela aparece, com a mesma animação `arrive` do estado vazio e da
 *   lista inteira ao trocar de aba (index.css). Um vocabulário só para tudo que
 *   passa a ocupar esta área.
 * - **Viajar.** FLIP: antes do reflow guarda onde cada linha estava; depois
 *   dele, anima do lugar antigo até o novo. Marcar uma tarefa a manda para o fim
 *   da lista (Adendo 4), e um salto seco de várias linhas no instante do clique
 *   desorienta — some do lugar onde o olho estava e aparece em outro. Deslizando,
 *   o olho acompanha. Vale igual para o buraco que uma remoção deixa: as linhas
 *   de baixo sobem em vez de pular.
 *
 * `signature` é o que identifica uma mudança de posição possível: enquanto ela
 * não muda, o efeito não roda e ninguém lê layout à toa (digitar no campo de
 * nova tarefa re-renderiza o App inteiro).
 *
 * `offsetTop` em vez de `getBoundingClientRect`: é relativo ao contêiner
 * posicionado, então rolar a lista não conta como movimento.
 *
 * Devolve `carryOver`, que passa uma linha inteira — posição e chegada em curso
 * — de um id para outro. Ver o uso em `handleAdd`.
 */
export function useFlipRows(
  container: RefObject<HTMLElement | null>,
  signature: string,
) {
  const previous = useRef(new Map<string, number>());
  /**
   * Chegadas em curso: id → instante em que a animação começou.
   *
   * Existe por causa de uma coisa medida: quando `add_todo` responde, a linha
   * otimista troca de id, e o `key` do React troca junto — então o `<li>` não é
   * atualizado, é DESTRUÍDO e refeito. A chegada morria no meio, e a linha
   * definitiva aparecia seca. Guardando o começo, o nó novo continua de onde o
   * antigo parou em vez de recomeçar (que piscaria) ou de nada (que é o que
   * acontecia).
   */
  const arriving = useRef(new Map<string, number>());

  /**
   * A linha otimista entra com um id temporário e o troca pelo id real assim
   * que `add_todo` responde. Para o FLIP são dois ids: um que sumiu e um que
   * nasceu — e sem isto a linha viajaria de lugar nenhum e chegaria de novo, no
   * gesto mais frequente do app.
   *
   * Chamado antes do `setTodos` da troca: é uma escrita síncrona em ref, e o
   * efeito de layout deste render lê os mapas já corrigidos.
   */
  const carryOver = useCallback((from: string, to: string) => {
    const at = previous.current.get(from);
    if (at !== undefined) {
      previous.current.delete(from);
      previous.current.set(to, at);
    }
    const since = arriving.current.get(from);
    if (since !== undefined) {
      arriving.current.delete(from);
      arriving.current.set(to, since);
    }
  }, []);

  useLayoutEffect(() => {
    const root = container.current;
    // Sem lista na tela não há posição a lembrar, e guardar as antigas seria
    // pior que esquecer: é o que faz o desfazer de "Limpar concluídas" REPOR as
    // tarefas — elas chegam, como qualquer coisa que passa a ocupar esta área —
    // em vez de deslizarem de onde estavam antes de sumir.
    if (!root) {
      previous.current = new Map();
      arriving.current = new Map();
      return;
    }

    const now = performance.now();
    // Chegada que já terminou sai do mapa aqui, e não no `animationend`: o nó
    // que a começou pode ter sido destruído no meio (ver `arriving`), e nesse
    // caso o evento nunca chega. Sem esta varredura o mapa só cresce.
    for (const [id, since] of arriving.current) {
      if (now - since >= ARRIVE_MS) arriving.current.delete(id);
    }

    const rows = root.querySelectorAll<HTMLElement>("[data-todo-id]");
    const next = new Map<string, number>();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Duas passadas de propósito: primeiro só LEITURA de layout, depois só
    // escrita. Intercalar `offsetTop` com `animate()` no mesmo laço pede ao
    // motor que recalcule o layout a cada linha; separando, ele lê tudo de uma
    // vez. Com dez linhas a diferença é imperceptível — a razão de escrever
    // assim é que o laço não vira uma armadilha quando a lista crescer.
    for (const row of rows) {
      const id = row.dataset.todoId;
      if (id !== undefined) next.set(id, row.offsetTop);
    }

    /**
     * Põe a linha para chegar, opcionalmente já no meio do caminho.
     *
     * A classe é posta e tirada aqui, fora do React, porque a `li` está sendo
     * montada neste mesmo commit: um efeito de LAYOUT roda antes da pintura,
     * então a animação começa do primeiro quadro. Tirar no fim não é higiene —
     * é o que impede a chegada de tocar de novo se o React mover a `li` de
     * lugar no DOM ao reordenar a lista.
     *
     * O `className` da `li` é uma string literal, então o React nunca reescreve
     * o atributo e não apaga esta classe (ver `TodoRow`).
     */
    const arrive = (row: HTMLElement, id: string, elapsed: number) => {
      arriving.current.set(id, now - elapsed);
      // Atraso NEGATIVO: a animação nasce já adiantada, no ponto exato em que a
      // do nó anterior parou. É isto que costura a troca de id otimista → real
      // numa chegada só, em vez de duas metades.
      if (elapsed > 0) row.style.animationDelay = `-${Math.round(elapsed)}ms`;
      row.classList.add("arrive");
      row.addEventListener(
        "animationend",
        () => {
          row.classList.remove("arrive");
          row.style.removeProperty("animation-delay");
          arriving.current.delete(id);
        },
        { once: true },
      );
    };

    for (const row of rows) {
      const id = row.dataset.todoId;
      if (id === undefined) continue;
      const top = next.get(id);
      const before = previous.current.get(id);

      if (before === undefined) {
        // Linha que ainda não estava aqui: chega do começo.
        arrive(row, id, 0);
        continue;
      }

      const since = arriving.current.get(id);
      // Mesma linha, nó novo, chegada ainda em curso: retoma. A classe ausente
      // é o que denuncia o nó recém-criado — no nó original ela ainda está lá.
      if (since !== undefined && !row.classList.contains("arrive")) {
        arrive(row, id, now - since);
      }

      // `prefers-reduced-motion`: a viagem é puro deslocamento espacial e sai
      // inteira — a linha troca de lugar sem animação. O que NÃO sai é a
      // chegada acima: ela vira uma esmaecida sem deslocamento (index.css),
      // porque avisar que algo apareceu é informação, não enfeite.
      if (reduced || top === undefined || before === top) continue;

      row.animate(
        [{ transform: `translateY(${before - top}px)` }, { transform: "none" }],
        {
          duration: TRAVEL_MS,
          delay: TRAVEL_DELAY_MS,
          easing: SETTLE,
          // `backwards`: sem isto a linha salta para o lugar novo, espera os
          // 70ms lá e só então volta para animar — o atraso viraria justamente
          // o pulo que o FLIP existe para tirar.
          fill: "backwards",
        },
      );
    }

    previous.current = next;
  }, [container, signature]);

  return carryOver;
}
