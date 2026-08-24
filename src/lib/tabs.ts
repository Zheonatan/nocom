/**
 * As duas decisões puras sobre a faixa de abas: o nome padrão da próxima e quem
 * herda o lugar da que fecha.
 *
 * Vivem fora de `todos.ts` para serem testáveis sob `node --test` (que não
 * resolve o alias `@/` nem carrega o `@tauri-apps/api` de lá). O import do tipo
 * é `import type` de propósito: o Node o apaga e nunca chega a carregar o
 * módulo; o do `i18n` é relativo com extensão, que é o que o runner resolve.
 */

import { t } from "./i18n.ts";
import type { Tab } from "./todos.ts";

/**
 * Nome padrão da aba nova (`Lista 2`, `Lista 3`, …). A primeira aba é a "Tarefas"
 * criada na migração, então a contagem começa em 2 naturalmente.
 *
 * Nome repetido é permitido pelo contrato, mas um nome PADRÃO repetido só cria
 * confusão — se `Lista 3` já existe, sobe para `Lista 4`. Continua sendo um
 * palpite descartável: o gesto de criar já entra em edição do nome.
 */
export function nextTabName(tabs: Tab[]): string {
  const taken = new Set(tabs.map((tab) => tab.name));
  // Piso em 2: a primeira aba é a "Tarefas" da migração, então "Lista 1" nunca é
  // o nome certo — nem no instante entre abrir a janela e a lista de abas chegar.
  let n = Math.max(2, tabs.length + 1);
  // A comparação usa o nome JÁ traduzido: quem roda em inglês tem "List 2" na
  // faixa, e é contra esses que a colisão precisa ser checada.
  while (taken.has(t("tabs.defaultName", { n }))) n += 1;
  return t("tabs.defaultName", { n });
}

/**
 * Qual aba fica ativa quando a atual é fechada (Esclarecimento 5.2): a VIZINHA —
 * a próxima na ordem canônica, ou a anterior se a fechada era a última da faixa.
 *
 * Não é a primeira restante: fechar a aba 4 de 5 e cair na aba 1 teleporta o
 * usuário para longe de onde ele estava. E a regra tem que ser exatamente a
 * mesma dos dois lados — o frontend troca a ativa de forma otimista e o backend
 * persiste; destinos diferentes fariam a tela piscar de uma aba para a outra
 * quando a resposta chegasse.
 *
 * Recebe a lista JÁ na ordem canônica (`created_at` crescente), que é como o
 * estado é mantido — "próxima" aqui é a próxima da faixa, na tela.
 */
export function neighbourTabId(tabs: Tab[], closingId: string): string | null {
  const index = tabs.findIndex((tab) => tab.id === closingId);
  if (index === -1) return null;
  const neighbour = tabs[index + 1] ?? tabs[index - 1];
  return neighbour?.id ?? null;
}
