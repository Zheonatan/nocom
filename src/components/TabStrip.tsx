import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { InlineEdit } from "@/components/InlineEdit";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { TAB_NAME_MAX_LENGTH, type Tab } from "@/lib/todos";

type TabStripProps = {
  tabs: Tab[];
  activeTabId: string | null;
  /** Id da aba em edição de nome, ou null. Vive no App: criar já entra em edição. */
  editingTabId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onClose: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onRename: (id: string, name: string) => void;
};

/**
 * Faixa de abas: uma linha só, ~28px de altura, logo abaixo da barra de título.
 *
 * A regra de layout que manda em tudo aqui é a do Adendo 1/5: **nada pode vazar
 * dos limites da janela**. Daí a divisão em duas partes — os chips ficam num
 * contêiner que rola na horizontal (`min-w-0` para ele poder ser menor que o
 * conteúdo), e o "+" fica FORA dele, fixo à direita. Com o "+" dentro da rolagem,
 * seis abas de nome longo o empurrariam para fora da vista, e criar uma aba
 * exigiria rolar até achar o botão.
 */
export function TabStrip({
  tabs,
  activeTabId,
  editingTabId,
  onSelect,
  onCreate,
  onClose,
  onStartEdit,
  onCancelEdit,
  onRename,
}: TabStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Fechar é escondido quando só há uma aba: o backend recusa fechar a última, e
  // oferecer um gesto que sempre falha é pior do que não oferecer.
  const closable = tabs.length > 1;

  // A aba ativa pode estar fora da parte visível da faixa — ao trocar pelo
  // teclado, e principalmente ao criar, que já entra em edição do nome: um campo
  // com foco fora da vista deixaria a digitação sem destino visível.
  useEffect(() => {
    if (activeTabId === null) return;
    const chip = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    chip?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTabId, editingTabId, tabs.length]);

  return (
    <div className="flex h-7 shrink-0 items-center gap-1 px-3">
      {/* `no-scrollbar`: rola sem barra visível — uma barra numa faixa de 28px
          roubaria a altura do texto do chip; a rolagem acontece por gesto de
          trackpad ou pelo `scrollIntoView` acima.

          `role="group"`, e não `role="tablist"`: o padrão ARIA de abas promete
          navegação por setas e um painel associado, e prometer isso sem cumprir é
          pior para quem usa leitor de tela do que um grupo de botões honesto —
          que o Tab do teclado já percorre. */}
      <div
        ref={scrollerRef}
        role="group"
        aria-label={t("tabs.label")}
        // `h-full py-0.5`: o scroller ocupa os 28px da faixa e reserva 2px
        // acima e abaixo do chip de 24px. Não é estética — `overflow-x: auto`
        // faz o `overflow-y` computar como `auto` junto, e um scroller com a
        // altura exata do chip RECORTA o anel de foco, que é desenhado 2px por
        // fora da caixa. O anel existia no CSS e nunca aparecia na faixa de
        // abas; agora ele cabe dentro da área que rola.
        className="no-scrollbar flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          const editing = tab.id === editingTabId;

          return (
            // `data-tab-id` também no ramo de edição: é a âncora do
            // `scrollIntoView`, e é justamente ao criar (que entra em edição) que
            // a aba precisa ser trazida à vista.
            <div
              key={tab.id}
              data-tab-id={tab.id}
              className={
                editing
                  ? "shrink-0"
                  : [
                      "group/tab flex h-6 max-w-[8.5rem] shrink-0 items-center rounded-md pl-2 text-xs transition-colors",
                      closable ? "pr-1.5" : "pr-2",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50",
                    ].join(" ")
              }
            >
              {editing ? (
                // Mesmo componente da edição de tarefa: Enter confirma, Escape
                // cancela, blur confirma, texto já selecionado.
                <InlineEdit
                  key={tab.id}
                  initial={tab.name}
                  maxLength={TAB_NAME_MAX_LENGTH}
                  label={t("tabs.rename")}
                  onCommit={(name) => onRename(tab.id, name)}
                  onCancel={onCancelEdit}
                  className="h-6 w-32 px-1.5 text-xs"
                />
              ) : (
                <>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelect(tab.id)}
                    onDoubleClick={() => onStartEdit(tab.id)}
                    // F2 é o duplo clique do teclado. Sem isto, renomear uma aba
                    // era gesto exclusivo de mouse — o mesmo que o DESIGN.md
                    // proíbe ("esconder é permitido; tornar exclusivo de mouse,
                    // nunca"). `Enter` não serve aqui: ele já ativa o `onClick`
                    // que troca de aba.
                    onKeyDown={(e) => {
                      if (e.key === "F2") {
                        e.preventDefault();
                        onStartEdit(tab.id);
                      }
                    }}
                    // Nome inteiro no `title`: o chip trunca com reticências, e
                    // sem isto um nome de 40 caracteres ficaria ilegível.
                    title={tab.name}
                    // `h-full`: o botão ocupa a altura inteira do chip. Antes
                    // ele media só a altura do texto (16px) dentro de um chip de
                    // 24px, e os 4px de cima e de baixo eram zona morta — clicar
                    // na borda visível da aba não fazia nada. Inverte a Regra do
                    // Alvo Maior que o Desenho, que o resto do app cumpre.
                    className="flex h-full min-w-0 items-center truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {tab.name}
                  </button>
                  {closable && (
                    // Sempre visível na ativa; nas outras, no hover ou com foco
                    // de teclado — senão fechar viraria gesto só de mouse.
                    <button
                      type="button"
                      aria-label={t("tabs.close", { name: tab.name })}
                      title={t("tabs.close", { name: tab.name })}
                      onClick={() => onClose(tab.id)}
                      className={[
                        // 16px DESENHADOS, 24px de alvo pelo pseudo-elemento —
                        // o mesmo recurso do checkbox, e o que a Regra do Alvo
                        // Maior que o Desenho manda. Com `size-6` o botão media
                        // os 24px inteiros do chip, então o fundo do hover
                        // cobria a altura toda da aba e o `×` parecia um bloco.
                        //
                        // `ml-1` (4px) e não `ml-0.5`: é a folga que o alvo
                        // invisível consome à esquerda. Com 2px, ele avançaria
                        // 2px sobre o botão do nome, e clicar na beirada direita
                        // do nome fecharia a aba em vez de selecioná-la.
                        "relative ml-1 flex size-4 shrink-0 items-center justify-center rounded outline-none transition-opacity after:absolute after:-inset-1 hover:bg-background/60 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "opacity-70 hover:opacity-100"
                          : "opacity-0 group-hover/tab:opacity-70 group-hover/tab:hover:opacity-100",
                      ].join(" ")}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t("tabs.new")}
        title={t("tabs.new")}
        onClick={onCreate}
        className="shrink-0"
      >
        <Plus />
      </Button>
    </div>
  );
}
