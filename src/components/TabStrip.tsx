import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { InlineEdit } from "@/components/InlineEdit";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  NEW_TAB_SHORTCUT,
  TAB_NAME_MAX_LENGTH,
  TAB_SHORTCUT_LIMIT,
  tabShortcut,
  type Tab,
} from "@/lib/todos";

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
  /**
   * De que lados a faixa continua além da vista: `""`, `"start"`, `"end"` ou
   * `"both"`.
   *
   * **Abas invisíveis sem nenhuma pista era um defeito de descobribilidade, não de
   * estética.** O scroller tem ~306px úteis e um chip vai até 136px: com três ou
   * quatro abas de nome longo, as outras existem, respondem por atalho e por
   * clique — e nada na tela diz que elas estão lá. A barra de rolagem foi tirada de
   * propósito (ela comeria a altura do texto do chip numa faixa de 28px), então o
   * lugar dela precisava ser ocupado por outra coisa.
   *
   * O que ocupa é um esmaecimento nas beiradas (`mask-image` em index.css): sem
   * cor, sem sombra, sem borda e sem um pixel de altura a mais — as três coisas
   * que o DESIGN.md não deixa gastar aqui. Um chip cortado ao meio pelo degradê é
   * exatamente a leitura que se quer: "a faixa continua".
   */
  const [overflow, setOverflow] = useState("");

  // Fechar é escondido quando só há uma aba: o backend recusa fechar a última, e
  // oferecer um gesto que sempre falha é pior do que não oferecer.
  const closable = tabs.length > 1;

  /**
   * Mede o transbordo. Chamado no scroll, na troca de abas e no redimensionamento.
   *
   * A folga de 1px absorve a fração de pixel que a rolagem deixa no fim em telas
   * com escala não inteira: sem ela, uma faixa rolada até o limite ficaria com um
   * degradê à direita prometendo um chip que não existe.
   */
  const measure = useCallback(() => {
    const box = scrollerRef.current;
    if (!box) return;
    const start = box.scrollLeft > 1;
    const end = box.scrollLeft + box.clientWidth < box.scrollWidth - 1;
    setOverflow(start && end ? "both" : start ? "start" : end ? "end" : "");
  }, []);

  // `tabs` inteiro nas dependências, e não só o tamanho: renomear uma aba muda a
  // largura do chip, e com ela se a faixa transborda ou não.
  useEffect(measure, [measure, tabs, editingTabId]);

  useEffect(() => {
    const box = scrollerRef.current;
    if (!box) return;
    // `ResizeObserver` e não `window.resize`: a janela não é redimensionável, mas o
    // scroller encolhe sozinho quando o `+` ou um chip mudam de largura.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [measure]);

  // A aba ativa pode estar fora da parte visível da faixa — ao trocar pelo
  // teclado, e principalmente ao criar, que já entra em edição do nome: um campo
  // com foco fora da vista deixaria a digitação sem destino visível.
  useEffect(() => {
    if (activeTabId === null) return;
    const chip = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    chip?.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Rolar até a aba ativa muda de que lados a faixa continua.
    measure();
  }, [activeTabId, editingTabId, tabs.length, measure]);

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
        data-overflow={overflow || undefined}
        onScroll={measure}
        // `h-full py-0.5`: o scroller ocupa os 28px da faixa e reserva 2px
        // acima e abaixo do chip de 24px. Não é estética — `overflow-x: auto`
        // faz o `overflow-y` computar como `auto` junto, e um scroller com a
        // altura exata do chip RECORTA o anel de foco, que é desenhado 2px por
        // fora da caixa. O anel existia no CSS e nunca aparecia na faixa de
        // abas; agora ele cabe dentro da área que rola.
        className="tab-scroller no-scrollbar flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeTabId;
          const editing = tab.id === editingTabId;
          // A tecla que salta até esta aba, se ela estiver entre as nove
          // primeiras. Vai para o `title` do chip: o atalho existe desde que a
          // faixa tem teclado, e um atalho que não aparece em lugar nenhum é um
          // atalho que só quem escreveu conhece.
          const shortcut =
            index < TAB_SHORTCUT_LIMIT ? tabShortcut(index + 1) : null;

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
                    // sem isto um nome de 40 caracteres ficaria ilegível. O atalho
                    // pega carona no mesmo lugar — o `title` já tinha que existir,
                    // e é onde alguém procura quando quer saber o que é um chip.
                    title={
                      shortcut === null
                        ? tab.name
                        : t("tabs.withShortcut", {
                            name: tab.name,
                            shortcut,
                          })
                    }
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
        // O `aria-label` continua sendo só a ação; o atalho vive no `title`, que é
        // dica visual. Um nome acessível com a combinação dentro faria o leitor de
        // tela soletrar "⌘T" a cada passada de foco pelo botão.
        aria-label={t("tabs.new")}
        title={t("tabs.newHint", { shortcut: NEW_TAB_SHORTCUT })}
        onClick={onCreate}
        className="shrink-0"
      >
        <Plus />
      </Button>
    </div>
  );
}
