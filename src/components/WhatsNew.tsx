import { locale, t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Release } from "@/lib/releases";

/**
 * A tela de novidades: o que mudou, mostrada uma vez depois de uma atualização
 * (Adendo 17).
 *
 * **Ocupa o lugar da lista, e não uma camada por cima dela.** É a mesma regra do
 * painel da engrenagem e dos dois estados vazios: o app não tem modal nem
 * popover, profundidade é tom e linha, e a área da lista é o único lugar com
 * espaço para uma vista que não gasta altura permanente (Regra do Custo de
 * Altura). `arrive` porque este bloco entra exatamente onde a lista estava, como
 * tudo que passa a ocupar aquela área.
 *
 * **Não trava o trabalho.** Ao contrário do painel do atalho — que escuta teclas
 * e por isso tira o campo de `inert` —, esta tela é só informação: o campo de
 * nova tarefa continua vivo, e escrever nela é o sinal de "já voltei ao
 * trabalho" que faz a tela sair (ver `handleAdd` no `App`). Uma novidade que
 * bloqueia o gesto mais frequente do app seria o oposto de uma novidade.
 *
 * **O texto é dado, não código.** A manchete e os tópicos vêm de `lib/releases.ts`,
 * já no idioma resolvido na carga do módulo; este arquivo só desenha a forma —
 * uma manchete em peso forte e tópicos em névoa, a mesma hierarquia de peso e
 * cinza que o app usa em todo lugar para não introduzir um quarto tom.
 */
export function WhatsNew({
  release,
  onDismiss,
}: {
  release: Release;
  onDismiss: () => void;
}) {
  const copy = release.copy[locale];
  // `aria-labelledby` em vez de um nome solto: a região precisa de um cabeçalho
  // que a nomeie, e o parágrafo da manchete já é esse cabeçalho.
  const titleId = "whats-new-title";

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="arrive px-2 py-3"
    >
      <p id={titleId} className="text-xs font-medium text-foreground">
        {t("whatsNew.title")}
      </p>
      <p className="mt-1 text-micro text-muted-foreground">
        {t("whatsNew.version", { version: release.version })}
      </p>

      {/* A manchete em tinta e peso 500; os tópicos em névoa. É a mesma
          hierarquia de peso e cinza do resto do app — sem um terceiro tamanho de
          fonte e sem uma cor nova para uma tela que aparece uma vez por versão. */}
      <p className="mt-3 text-xs font-medium text-foreground">{copy.headline}</p>
      <ul className="mt-1.5 space-y-1.5">
        {copy.items.map((item, i) => (
          <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
            {/* O marcador é decorativo: o leitor de tela lê os itens de uma lista
                já contada pelo `<li>`, e um "•" anunciado seria ruído. */}
            <span aria-hidden="true" className="select-none text-foreground/40">
              •
            </span>
            <span className="min-w-0 wrap-anywhere">{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onDismiss}
          className="text-xs"
        >
          {t("whatsNew.dismiss")}
        </Button>
      </div>
    </section>
  );
}
