/**
 * As novidades de cada versão, para a tela que aparece depois de uma atualização
 * (Adendo 17).
 *
 * **Por que um módulo, e não o `CHANGELOG.md` lido direto.** Dois motivos, os
 * dois decisivos: o `CHANGELOG.md` é markdown e é português, enquanto a interface
 * é bilíngue (PRODUCT.md) e a tela precisa falar a língua do sistema — o mesmo
 * motivo de o resto da cópia viver no dicionário. O que mora aqui é a versão de
 * LEITURA RÁPIDA da mesma nota: o `CHANGELOG.md` continua sendo o texto da
 * release, e é ele que este módulo acompanha quando uma versão sai.
 *
 * Estado da tela, e não do produto: nada disto atravessa o IPC nem entra no
 * `todos.json` — a mesma decisão de `lib/onboarding.ts`, pela mesma razão (o
 * contrato não se reabre por uma coisa que a tela precisa contar).
 */

import type { Locale } from "@/lib/i18n";

/** O que a tela mostra de uma versão, num idioma. */
export type ReleaseCopy = {
  /** A frase de manchete, em peso forte — o "o quê" em uma linha. */
  headline: string;
  /** Os tópicos, em névoa, abaixo da manchete. */
  items: string[];
};

export type Release = {
  version: string;
  /** `AAAA-MM-DD`, casando com a seção do `CHANGELOG.md`. */
  date: string;
  copy: Record<Locale, ReleaseCopy>;
};

/**
 * Da mais nova para a mais antiga. Uma versão que não está aqui atualiza em
 * silêncio: a tela não aparece, e a versão é gravada como vista do mesmo jeito —
 * o app não inventa novidades que não tem para contar.
 */
export const RELEASES: readonly Release[] = [
  {
    version: "0.7.0",
    date: "2026-10-14",
    copy: {
      "pt-BR": {
        headline: "Links dentro do título.",
        items: [
          "Escreva palavra::endereço — google::google.com — e a palavra vira um link que abre no navegador.",
          "Sem esquema, o app usa https://. Só http e https abrem; std::vector continua sendo std::vector.",
        ],
      },
      en: {
        headline: "Links in the title.",
        items: [
          "Type word::address — google::google.com — and the word becomes a link that opens in your browser.",
          "With no scheme the app uses https://. Only http and https open; std::vector stays std::vector.",
        ],
      },
    },
  },
  {
    version: "0.6.0",
    date: "2026-09-14",
    copy: {
      "pt-BR": {
        headline: "Busca e ordem por data.",
        items: [
          "Tarefas com data sobem na lista — da mais próxima para a mais distante.",
          "⌘F / Ctrl+F abre a busca e mostra também os resultados das outras abas.",
        ],
      },
      en: {
        headline: "Search and date order.",
        items: [
          "Tasks with a date rise to the top — nearest first.",
          "⌘F / Ctrl+F opens search and also shows matches from other tabs.",
        ],
      },
    },
  },
];

/** As notas desta versão, ou `null` se ela não tem o que anunciar. */
export function releaseFor(version: string): Release | null {
  return RELEASES.find((release) => release.version === version) ?? null;
}

/**
 * A tela deve aparecer?
 *
 * **Duas condições, e a primeira é a que evita o pior erro.** `lastSeen === null`
 * é a instalação nova: não há "antes" com que comparar, e quem está abrindo o app
 * pela primeira vez já recebe o estado vazio que o apresenta. Mostrar "novidades"
 * a quem nunca teve o velho seria anunciar uma mudança que não houve.
 *
 * A segunda é a mudança em si: uma versão diferente da última vista. Comparação
 * de texto exato, e não de maior/menor: uma reinstalação de uma versão ANTIGA não
 * é atualização, e anunciar as novidades dela seria mentir sobre a direção.
 */
export function shouldAnnounce(lastSeen: string | null, version: string): boolean {
  return lastSeen !== null && lastSeen !== version;
}

/**
 * A última versão que esta pessoa já viu. `null` cobre dois casos que a tela
 * trata igual: instalação nova E armazenamento bloqueado.
 *
 * **Falha para o lado de não anunciar**, como `hasAddedTask`: uma webview com
 * `localStorage` bloqueado lança em vez de devolver `null`, e tratar isso como
 * "primeira vez" mostraria a tela em toda abertura, para sempre, sem jeito de
 * dispensar. Não anunciar é recuperável uma vez; repetir a mesma tela toda vez
 * não é.
 */
const CHAVE = "nocom.lastSeenVersion";

export function seenVersion(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

/** Grava a versão como vista. Sem `catch` que reclame: não poder lembrar não é erro do usuário. */
export function rememberVersion(version: string): void {
  try {
    localStorage.setItem(CHAVE, version);
  } catch {
    // Armazenamento indisponível. `seenVersion` já devolve `null`, então o efeito
    // é o mesmo de não haver o que lembrar.
  }
}
