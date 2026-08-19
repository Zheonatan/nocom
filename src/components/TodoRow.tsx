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
      className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60"
    >
      <Checkbox
        checked={todo.done}
        onCheckedChange={() => onToggle(todo.id)}
        // O nome acessível vem do título ao lado. Antes vinha de um `htmlFor`,
        // que também fazia o clique no título alternar a tarefa — ver abaixo.
        aria-labelledby={`todo-title-${todo.id}`}
        // O quadrado continua com 16px, mas a área de clique não: concluir é a
        // ação mais frequente do app e virou o único alvo depois que o título
        // parou de alternar. O pseudo-elemento do Radix vai daqui até a borda
        // interna do cartão (`-left-4` cobre os dois `px-2` à esquerda) e ocupa a
        // altura inteira da linha. Para a direita fica em `-right-3`, de propósito:
        // mais do que isso comeria o título e roubaria o duplo clique de editar.
        className="shrink-0 after:-inset-y-3 after:-left-4 after:-right-3"
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
