import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { clampLength } from "@/lib/todos";
import { cn } from "@/lib/utils";

type InlineEditProps = {
  initial: string;
  maxLength: number;
  /** Nome acessível do campo — "Editar tarefa", "Renomear aba". */
  label: string;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

/**
 * Edição inline: um campo que substitui o texto no lugar dele. `Enter` confirma,
 * `Escape` cancela, blur confirma.
 *
 * Componente único de propósito. Tarefa e aba se editam com o mesmo gesto, e o
 * comportamento é cheio de arestas (o ferrolho abaixo, o `stopPropagation` do
 * Escape, o `select()` no foco) — duas cópias divergiriam na primeira correção
 * feita só em uma delas.
 *
 * Quem chama monta com `key` no id da coisa editada: trocar de item remonta o
 * campo com o texto certo, sem sincronizar estado via efeito.
 */
export function InlineEdit({
  initial,
  maxLength,
  label,
  className,
  onCommit,
  onCancel,
}: InlineEditProps) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  // Enter e Escape desmontam o campo, e desmontar dispara o blur — que salvaria
  // de novo (ou salvaria o que o Escape acabou de descartar). Este ferrolho faz
  // valer só o primeiro desfecho.
  const settled = useRef(false);

  function finish(save: boolean) {
    if (settled.current) return;
    settled.current = true;
    const next = value.trim();
    // Texto vazio cancela: apagar não é gesto de edição — tarefa tem botão de
    // remover, aba tem o `×`.
    if (!save || next === "" || next === initial.trim()) {
      onCancel();
      return;
    }
    onCommit(next);
  }

  // A seleção acontece aqui, e não num `onFocus`, porque o `onFocus` não estava
  // cumprindo: medido nos dois caminhos de abertura (duplo clique e F2), o campo
  // abria com o cursor no fim e ZERO caractere selecionado. Com `autoFocus`, o
  // foco chega durante o commit e o `select()` daquele handler se perde no
  // remonte do StrictMode. Um efeito de montagem roda com o DOM já no lugar.
  //
  // Não é detalhe: criar uma aba já entra em edição com um nome padrão que é
  // palpite para ser sobrescrito digitando. Sem a seleção, o usuário precisa
  // apagar "Lista 2" tecla por tecla.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      // O corte em pontos de código, e não o atributo `maxLength` (Adendo 12): o
      // atributo conta unidades UTF-16 e o backend conta `chars()` — a mesma
      // régua do campo de nova tarefa, pela mesma razão. Sem aviso de colagem
      // aqui: o texto editado já existia dentro do limite, e a faixa pertence à
      // lista, não a um editor que vive dentro dela.
      onChange={(e) => {
        if ((e.nativeEvent as InputEvent).isComposing) {
          setValue(e.target.value);
          return;
        }
        setValue(clampLength(e.target.value, maxLength).text);
      }}
      onCompositionEnd={(e) =>
        setValue(clampLength(e.currentTarget.value, maxLength).text)
      }
      // Texto do usuário: renderiza na direção dele (árabe, hebraico).
      dir="auto"
      onKeyDown={(e) => {
        // Enter e Escape dentro de composição de IME confirmam ou cancelam a
        // COMPOSIÇÃO, não a edição: sem a guarda, o Enter da conversão salvava
        // o texto pela metade e o Escape descartava a edição inteira.
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          // Só cancela a edição. O App já ignora o Escape enquanto há edição
          // inline em curso (ele escuta na captura); parar a propagação aqui é a
          // segunda tranca para a janela não sumir junto.
          e.preventDefault();
          e.stopPropagation();
          finish(false);
        }
      }}
      onBlur={() => finish(true)}
      aria-label={label}
      // Duas correções de forma, as duas pela mesma razão: **um editor que
      // substitui algo no lugar não pode ocupar mais espaço nem ter forma
      // diferente do que substituiu.**
      //
      // `rounded-md` (8px): o raio de 10px do `Input` é dimensionado para o
      // campo de 32px da nova tarefa. Num campo de 24px ele consome 83% da
      // altura em curva — sobram 4px de borda reta —, e o editor fica mais
      // redondo que o chip de 8px que ele cobre. É a Regra do Raio Decrescente:
      // elemento menor, raio menor.
      //
      // `ring-inset`: o anel de foco desenhado por fora precisaria de 2px que
      // a faixa de abas não tem de sobra — o editor abre dentro de um contêiner
      // que rola, e contêiner que rola recorta. Por dentro, ele nunca é cortado
      // e nunca empurra o layout.
      className={cn("rounded-md ring-inset", className)}
    />
  );
}
