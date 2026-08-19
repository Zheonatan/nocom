import { memo } from "react";
import { X } from "lucide-react";
import { InlineEdit } from "@/components/InlineEdit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { t } from "@/lib/i18n";
import { TITLE_MAX_LENGTH, type Todo } from "@/lib/todos";

type TodoRowProps = {
  todo: Todo;
  /** Linha ainda sem id real do backend: não dá para renomear o que não existe. */
  pending: boolean;
  editing: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onRename: (id: string, title: string) => void;
};

/**
 * `memo`: o App re-renderiza a cada tecla digitada no campo de nova tarefa, e
 * sem isto cada tecla re-renderizava todas as linhas da lista junto. Os
 * handlers vêm do App com identidade estável (`useCallback`) justamente para
 * esta comparação rasa de props funcionar — um wrapper inline lá anula o memo
 * daqui.
 */
export const TodoRow = memo(function TodoRow({
  todo,
  pending,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onRename,
}: TodoRowProps) {
  return (
    // `data-todo-id` é a âncora do FLIP em `useFlipRows`: é por ele que a
    // animação sabe de onde para onde esta linha andou.
    <li
      data-todo-id={todo.id}
      // F2 é o duplo clique do teclado, e o handler fica na LINHA, não no
      // título: assim ele funciona com o foco no checkbox ou no botão de
      // remover — as duas paradas de tabulação que a linha já tem — sem
      // acrescentar uma terceira. Renomear era, até aqui, gesto exclusivo de
      // mouse; o mesmo `title` que o DESIGN.md proíbe tornar exclusivo.
      onKeyDown={(e) => {
        if (e.key !== "F2" || editing || pending) return;
        e.preventDefault();
        onStartEdit(todo.id);
      }}
      // String literal, e precisa continuar sendo: `useFlipRows` põe a classe
      // `arrive` nesta `li` por fora do React quando a linha é nova. O React só
      // reescreve `className` quando o VALOR da prop muda — com uma string
      // constante ele nunca toca no atributo. Montar esta classe a partir de
      // estado apagaria a chegada no meio da animação.
      // `relative`: é esta caixa que dá altura ao alvo do checkbox — ver o
      // comentário dele abaixo. A classe continua sendo uma string literal, que é
      // o que o `useFlipRows` exige.
      className="group relative flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60"
    >
      <Checkbox
        checked={todo.done}
        onCheckedChange={() => onToggle(todo.id)}
        // O nome acessível vem do título ao lado. Antes vinha de um `htmlFor`,
        // que também fazia o clique no título alternar a tarefa — ver abaixo.
        aria-labelledby={`todo-title-${todo.id}`}
        // O quadrado continua com 16px, mas a área de clique não: concluir é a
        // ação mais frequente do app e virou o único alvo depois que o título
        // parou de alternar.
        //
        // **O alvo é medido pela LINHA, e não pelo quadrado.** `static` aqui tira o
        // checkbox de contexto posicionado, então o `::after` resolve contra a `li`
        // (que é `relative`): `inset-y-0` passa a significar "exatamente a altura
        // desta linha", qualquer que seja ela.
        //
        // Antes era `-inset-y-3` — 40px fixos, medidos do quadrado. Isso acertava a
        // linha de uma altura por coincidência e errava a de duas por 6px em cima e
        // 6px embaixo: numa tarefa de título longo, a beirada da linha não alternava
        // nada, invertendo a Regra do Alvo Maior que o Desenho justamente onde a
        // linha é maior. E na linha de uma altura os 40px passavam 2px para dentro
        // do vão entre as linhas, encostando no alvo da vizinha.
        //
        // Horizontal: `-left-2` cobre o `px-2` da lista e leva o alvo até a borda
        // interna do cartão; `w-11` (44px) termina 12px depois do quadrado. **Para
        // na direita de propósito** — mais que isso comeria o título e roubaria o
        // duplo clique de editar.
        className="static shrink-0 after:inset-y-0 after:-left-2 after:right-auto after:w-11"
      />
      {editing ? (
        // `key` no id: trocar de linha em edição remonta o editor com o texto
        // certo, sem precisar sincronizar estado via efeito.
        <InlineEdit
          key={todo.id}
          initial={todo.title}
          maxLength={TITLE_MAX_LENGTH}
          label={t("task.edit")}
          onCommit={(title) => onRename(todo.id, title)}
          onCancel={onCancelEdit}
          className="h-6 min-w-0 flex-1 px-1.5 text-body"
        />
      ) : (
        // Era uma `label` com `htmlFor` para o checkbox, e isso brigava com o
        // duplo clique desta mesma área: cada clique ativava a label, então
        // abrir o editor disparava DOIS `toggle_todo` — invisível na tela,
        // porque alternava duas vezes, mas eram duas gravações no disco por
        // edição, e uma falha na segunda deixaria a tarefa marcada errado. O
        // `preventDefault` no `dblclick` não resolvia: ele só corre depois de os
        // dois cliques já terem ativado a label. Alternar é gesto do checkbox e
        // editar é gesto do título, como o contrato divide.
        <span
          id={`todo-title-${todo.id}`}
          onDoubleClick={() => {
            if (pending) return;
            onStartEdit(todo.id);
          }}
          className={[
            // `wrap-anywhere` quebra até uma palavra de 200 caracteres sem
            // espaços; `line-clamp-2` limita a altura da linha. Juntos, o texto
            // nunca alarga a janela nem some sob a borda. O título completo fica
            // no `title` e na edição inline.
            "min-w-0 flex-1 text-body leading-5 wrap-anywhere line-clamp-2",
            // O desbotamento é a segunda batida de concluir, e leva o mesmo
            // tempo que a tinta do checkbox: os dois são a mesma frase dita em
            // dois lugares ("isto está resolvido"), e chegando juntos se leem
            // como um gesto só. O risco continua caindo seco, no instante do
            // clique — ele é o carimbo, não o assentamento; e `line-through`
            // não é animável em texto de duas linhas sem trocar a decoração por
            // um pseudo-elemento, que riscaria só a primeira delas.
            "transition-colors duration-150 ease-settle",
            todo.done ? "text-muted-foreground line-through" : "text-foreground",
          ].join(" ")}
          title={todo.title}
        >
          {todo.title}
        </span>
      )}
      {/* Some por padrão; aparece no hover da linha e sempre que recebe foco
          por teclado — senão o botão fica inalcançável sem mouse. */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={t("task.remove", { title: todo.title })}
        onClick={() => onDelete(todo.id)}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X />
      </Button>
    </li>
  );
});
