import { useLayoutEffect, useRef, type RefObject } from "react";

const DURATION_MS = 180;

/**
 * FLIP: antes do reflow guarda onde cada linha estava; depois dele, anima do
 * lugar antigo até o novo.
 *
 * Marcar uma tarefa como concluída a manda para o fim da lista (Adendo 4), e um
 * salto seco de várias linhas no instante do clique desorienta — some do lugar
 * onde o olho estava e aparece em outro. Animando, o olho acompanha.
 *
 * `signature` é o que identifica uma mudança de posição possível: enquanto ela
 * não muda, o efeito não roda e ninguém lê layout à toa (digitar no campo de
 * nova tarefa re-renderiza o App inteiro).
 *
 * `offsetTop` em vez de `getBoundingClientRect`: é relativo ao contêiner
 * posicionado, então rolar a lista não conta como movimento.
 */
export function useFlipRows(
  container: RefObject<HTMLElement | null>,
  signature: string,
) {
  const previous = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

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

    if (!reduced) {
      for (const row of rows) {
        const id = row.dataset.todoId;
        if (id === undefined) continue;
        const top = next.get(id);
        const before = previous.current.get(id);
        // Linha nova entra no lugar, sem deslizar de lugar nenhum.
        if (top === undefined || before === undefined || before === top) continue;

        row.animate(
          [{ transform: `translateY(${before - top}px)` }, { transform: "none" }],
          { duration: DURATION_MS, easing: "ease-out" },
        );
      }
    }

    previous.current = next;
  }, [container, signature]);
}
