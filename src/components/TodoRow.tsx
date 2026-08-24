import { memo } from "react";
import { Repeat as RepeatIcon, X } from "lucide-react";
import { InlineEdit } from "@/components/InlineEdit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { splitTitle } from "@/lib/dates";
import { t, type MessageKey } from "@/lib/i18n";
import { TITLE_MAX_LENGTH, type Repeat, type Tab, type Todo } from "@/lib/todos";

/**
 * A frase de cada período, para o `title` e o `aria-label` do glifo: a tinta
 * sozinha diz "repete", mas não diz quando.
 */
const REPEAT_TITLE: Record<Exclude<Repeat, "none">, MessageKey> = {
  daily: "task.repeatsDaily",
  weekly: "task.repeatsWeekly",
  monthly: "task.repeatsMonthly",
};

type TodoRowProps = {
  todo: Todo;
  /**
   * Todas as abas, para o "Mover para" do menu de contexto (Adendo 13). A linha
   * filtra as outras — a própria aba num menu de mover seria um item que não
   * move nada. Identidade estável entre teclas digitadas (o estado `tabs` do App
   * só muda em mutação de aba), então o `memo` continua valendo.
   */
  tabs: Tab[];
  /**
   * O dia de hoje (`2026-08-19`), para achar no título a data que é hoje. Vem de
   * cima, do `useToday`, e não de um `new Date()` aqui: um relógio por linha
   * daria leituras diferentes na mesma lista se a virada da meia-noite caísse no
   * meio de um render, e nenhum deles viraria de dia sozinho.
   */
  today: string;
  /**
   * O dia vem antes do mês no formato deste sistema? Vem do backend, uma vez na
   * abertura — a webview não sabe responder isso (ver `lib/dates.ts` e o Adendo
   * 11). Booleano e não etiqueta de locale: a decisão já chega tomada, e um
   * primitivo atravessa o `memo` sem custo.
   */
  dayFirst: boolean;
  /** Linha ainda sem id real do backend: não dá para renomear o que não existe. */
  pending: boolean;
  editing: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onRename: (id: string, title: string) => void;
  /** Adendo 13: os dois gestos do menu de contexto. */
  onMove: (id: string, tabId: string) => void;
  onSetRepeat: (id: string, repeat: Repeat) => void;
};

/**
 * `memo`: o App re-renderiza a cada tecla digitada no campo de nova tarefa, e
 * sem isto cada tecla re-renderizava todas as linhas da lista junto. Os
 * handlers vêm do App com identidade estável (`useCallback`) justamente para
 * esta comparação rasa de props funcionar — um wrapper inline lá anula o memo
 * daqui.
 */
/**
 * A pílula de uma data.
 *
 * **`mark` e não `span`:** é exatamente o que o elemento quer dizer — trecho
 * realçado por ser relevante no contexto de agora. Os dois valores padrão do
 * navegador (fundo amarelo de sistema, texto preto) são substituídos, porque sem
 * isso `mark` traria uma terceira cor para um app que tem duas.
 *
 * **Duas intensidades, e a diferença entre elas é a informação.** Uma data
 * qualquer fica em cinza (`foreground/10`, croma 0 — a Bruma Densa); a data de
 * hoje fica no vermelho pastel do token `today`. O que o olho compara não é a
 * pílula contra o fundo, é uma pílula contra as outras da mesma lista — e matiz
 * contra ausência de matiz é a diferença mais fácil que existe de ver, o que
 * permite ao vermelho ser fraco o bastante para não competir com a faixa de erro.
 * Os dois pares foram medidos, e os números estão no `index.css`.
 *
 * `rounded-sm` (6px) contra os 8px da linha, pela Regra do Raio Decrescente.
 * `font-medium` é a segunda metade do destaque e a mais importante: hierarquia
 * aqui se faz com peso e com cinza, e o peso é o que ainda se lê se o tom se
 * perder na tela de alguém — inclusive para quem não distingue vermelho de cinza,
 * que é a razão de o vermelho **nunca** ser o único sinal (a pílula já está lá).
 *
 * `box-decoration-clone`: inline, a data pode cair na quebra entre as duas linhas
 * do título, e sem isto a pílula ficaria com padding só nas pontas de fora.
 */
function DatePill({
  text,
  today,
  id,
  className = "",
}: {
  text: string;
  today: boolean;
  /** Só a data extraída tem id: é ele que entra no nome acessível do checkbox. */
  id?: string;
  className?: string;
}) {
  return (
    <mark
      id={id}
      className={[
        "box-decoration-clone rounded-sm px-1 font-medium",
        today
          ? "bg-today text-today-foreground"
          : "bg-foreground/10 text-foreground",
        className,
      ].join(" ")}
    >
      {text}
      {/* O destaque é tinta, e tinta não é lida por leitor de tela. A palavra vai
          junto do trecho, e não da linha inteira, para cair no lugar certo da
          frase: "pagar boleto 20/08 (hoje)". Só a data de HOJE ganha a palavra —
          uma data qualquer já se lê como data, e anunciar "data" em cada uma
          seria ruído em cima do texto que a pessoa escreveu. */}
      {today && <span className="sr-only"> ({t("task.today")})</span>}
    </mark>
  );
}

export const TodoRow = memo(function TodoRow({
  todo,
  tabs,
  today,
  dayFirst,
  pending,
  editing,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onRename,
  onMove,
  onSetRepeat,
}: TodoRowProps) {
  // As abas para onde esta tarefa PODE ir. A própria fica de fora: um item de
  // "mover" que não move nada só ensinaria desconfiança do menu.
  const outrasAbas = tabs.filter((tab) => tab.id !== todo.tab_id);
  // As datas escritas no título: as que ficam inline e a que vai para a direita
  // — ver `splitTitle`. `segments` vazio é o caso normal, e é o sinal para o
  // título sair como sempre saiu: um nó de texto, sem elemento nenhum em volta.
  //
  // **Concluída não destaca, e nem extrai.** Pela Regra do Desbotamento,
  // resolvido é estado com menos contraste; uma pílula acesa dentro de uma linha
  // riscada diria as duas coisas opostas na mesma linha. E mover a data para a
  // direita numa linha concluída faria o texto mudar de forma no instante do
  // clique — o título andaria debaixo do olho de quem acabou de marcar, o que a
  // Regra da Batida em Três Tempos já cuida de não fazer.
  const partes = todo.done
    ? { segments: [], rest: todo.title, trailing: null }
    : splitTitle(todo.title, today, dayFirst);

  return (
    // O menu de contexto (Adendo 13) envolve a linha SEM tocar no DOM dela: o
    // Root do Radix não renderiza nó nenhum e o Trigger com `asChild` é a
    // própria `li` — a `ul` continua tendo `li` como filhas diretas, e o FLIP
    // continua achando a linha pelo `data-todo-id` de sempre. Pelo teclado, o
    // gesto é o nativo do navegador (`Shift+F10` / tecla de menu) com o foco em
    // qualquer parada da linha. Linha otimista não abre menu: não dá para mover
    // nem repetir o que o backend ainda não confirmou.
    <ContextMenu>
    <ContextMenuTrigger asChild disabled={pending}>
    {/* `data-todo-id` é a âncora do FLIP em `useFlipRows`: é por ele que a
        animação sabe de onde para onde esta linha andou. */}
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
        //
        // **Dois ids, e o segundo não é opcional.** Quando a data é extraída para a
        // direita, ela sai do elemento do título — e um `aria-labelledby` só nele
        // faria o checkbox se chamar "pagar boleto", sem a data que a pessoa
        // digitou. `aria-labelledby` concatena os ids na ordem em que aparecem,
        // então a leitura volta a ser o título inteiro: "pagar boleto 20/08
        // (hoje)". Um id que não existe no DOM é ignorado, o que cobre de graça o
        // caso comum de tarefa sem data.
        aria-labelledby={`todo-title-${todo.id} todo-date-${todo.id}`}
        // Com a edição inline aberta, o span do título SAI do DOM e o
        // `aria-labelledby` fica apontando para ids que não existem — checkbox
        // sem nome acessível. O `aria-label` cobre só esse instante; fora dele
        // o `labelledby` (que concatena título + data) continua mandando.
        aria-label={editing ? todo.title : undefined}
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
          // `-my-0.5` é o que impede a linha de mudar de altura ao entrar em edição.
          // O título mede 20px (`leading-5`) e o editor mede 24px, então ele crescia
          // a linha em 4px e empurrava tudo abaixo dela no instante do duplo clique.
          // Os 2px negativos de cada lado fazem a caixa EXTERNA do editor medir os
          // mesmos 20px do texto que ele substitui — a Regra do Editor que Cabe pede
          // "mesma altura", e é a altura ocupada que conta, não a desenhada. Sobra
          // padding de linha de sobra (8px) para os 2px avançarem sem encostar em nada.
          //
          // Subir a altura do título para 24px também resolveria, e custaria 4px em
          // TODA linha da lista — cerca de uma linha inteira das oito que caibem. Numa
          // janela onde a altura é o orçamento, é o lado errado da troca.
          className="-my-0.5 h-6 min-w-0 flex-1 px-1.5 text-body"
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
          // Título é texto do usuário: um em árabe ou hebraico renderiza na
          // direção dele, em vez de embaralhar números e pontuação na direção
          // da interface (Adendo 12).
          dir="auto"
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
          {partes.segments.length === 0
            ? partes.rest
            : // **`key` por índice, e aqui ele é identidade de verdade.** É a única
              // `key` do arquivo que não é um id, num arquivo escrito com identidade
              // de nó de propósito (ver a Regra da Chegada que Sobrevive à Troca de
              // Id), então ela merece a justificativa em vez da suspeita: estes nós
              // são derivados **sincronamente** do título por `splitTitle`, não
              // guardam estado nenhum, não recebem foco, não animam, e não são
              // reordenados nem inseridos no meio — o título muda e a lista inteira
              // de segmentos é recalculada junto. Nesse arranjo o índice é estável
              // por construção, e compor uma chave a partir do deslocamento no texto
              // custaria código para dizer exatamente a mesma coisa.
              partes.segments.map((segment, i) =>
                segment.date ? (
                  <DatePill key={i} text={segment.text} today={segment.today} />
                ) : (
                  segment.text
                ),
              )}
        </span>
      )}
      {/* O glifo de repetição (Adendo 13): a única marca permanente de que esta
          tarefa volta sozinha. Em névoa e com 12px — é metadado, não alarme — e
          fica visível também na concluída, porque é justamente ali que ele
          responde a pergunta que a linha riscada levanta ("acabou?": não, volta).
          A frase do período vai no `title` e no `aria-label`; some na edição,
          como a data, para devolver a largura ao campo. */}
      {todo.repeat !== "none" && !editing && (
        <span
          role="img"
          title={t(REPEAT_TITLE[todo.repeat])}
          aria-label={t(REPEAT_TITLE[todo.repeat])}
          className="shrink-0 text-muted-foreground"
        >
          <RepeatIcon className="size-3" />
        </span>
      )}
      {/* A data que saiu do fim do título, alinhada à direita.

          **Entre o título e o `×`, e não no lugar dele.** O botão de remover já
          ocupa largura fixa em repouso (ele só troca de opacidade, nunca de
          layout), então a data entra ao lado sem que nada ande quando o mouse
          chega — o que a Regra do Movimento que se Paga exige de tudo que não se
          mexe sozinho.

          `shrink-0` com o título em `min-w-0 flex-1`: quem cede largura é o
          texto, que já sabe se truncar em duas linhas. A data nunca quebra nem
          encolhe, porque uma data pela metade não é uma data. */}
      {partes.trailing !== null && !editing && (
        <DatePill
          id={`todo-date-${todo.id}`}
          text={partes.trailing.text}
          today={partes.trailing.today}
          className="shrink-0 whitespace-nowrap tabular-nums"
        />
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
    </ContextMenuTrigger>
    <ContextMenuContent>
      {/* "Mover para" desabilita com uma aba só, em vez de sumir: o menu que
          muda de tamanho conforme o estado ensina a procurar opções que não
          estão lá. O submenu limita a largura e trunca o nome — a Regra do
          Texto que Não Vaza vale também na superfície nova. */}
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={outrasAbas.length === 0}>
          {t("menu.moveTo")}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-w-[10rem]">
          {outrasAbas.map((tab) => (
            <ContextMenuItem key={tab.id} onSelect={() => onMove(todo.id, tab.id)}>
              {/* Nome de aba é texto do usuário: direção dele, truncado. */}
              <span dir="auto" className="min-w-0 truncate">
                {tab.name}
              </span>
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger>{t("menu.repeat")}</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {/* Escolha única com o estado atual marcado: o menu também é onde se
              CONFERE a recorrência, não só onde se escolhe. */}
          <ContextMenuRadioGroup
            value={todo.repeat}
            onValueChange={(valor) => onSetRepeat(todo.id, valor as Repeat)}
          >
            <ContextMenuRadioItem value="none">
              {t("menu.repeatNone")}
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="daily">
              {t("menu.repeatDaily")}
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="weekly">
              {t("menu.repeatWeekly")}
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="monthly">
              {t("menu.repeatMonthly")}
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>
    </ContextMenu>
  );
});
