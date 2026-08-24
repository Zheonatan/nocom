/**
 * A régua de texto do contrato: **pontos de código**, como o `chars().count()`
 * do backend (Adendo 12).
 *
 * Módulo sem imports de propósito, como `dates.ts`: é a fronteira mais fina do
 * contrato (um emoji não pode valer 2 de um lado e 1 do outro) e precisa ser
 * testável sob `node --test`, que não resolve o alias `@/` nem carrega o
 * `@tauri-apps/api` que `todos.ts` importa.
 */

/**
 * Corta um texto em `max` **pontos de código** — a mesma régua do
 * `chars().count()` que o backend usa no limite de 200 (Adendo 12).
 *
 * O `maxLength` nativo conta unidades UTF-16: um emoji vale 2, o campo parava de
 * aceitar antes do limite do contrato, e o contador "restam N" mentia por fator 2
 * para quem pensa em caracteres. Devolve quanto foi cortado, porque colar além do
 * limite deixou de ser truncamento silencioso — quem chama avisa quando `cut > 1`.
 */
export function clampLength(
  text: string,
  max: number,
): { text: string; cut: number } {
  const pontos = Array.from(text);
  if (pontos.length <= max) return { text, cut: 0 };
  return { text: pontos.slice(0, max).join(""), cut: pontos.length - max };
}

/** O comprimento na régua do contrato: pontos de código, não unidades UTF-16. */
export function lengthOf(text: string): number {
  return Array.from(text).length;
}
