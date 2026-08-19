import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  acceleratorFrom,
  hasGlobalModifier,
  isModifierKey,
  MODIFIER_RULE,
  modifiersPreview,
} from "@/lib/shortcut";
import {
  errorDetail,
  isMac,
  pauseShortcut,
  setShortcut,
  type GlobalShortcut,
} from "@/lib/todos";

/**
 * O painel que troca o atalho global (Adendo 9).
 *
 * **Ocupa o lugar da lista, e não uma camada por cima dela.** O DESIGN.md não tem
 * modal, popover nem sombra interna: profundidade neste app é tom e linha, e uma
 * janela de 360x480 não tem espaço para uma segunda superfície flutuando dentro da
 * primeira. O painel entra onde a lista estava, do mesmo jeito que os dois estados
 * vazios entram — mesma área elástica, mesma animação de chegada, zero altura
 * permanente gasta (Regra do Custo de Altura).
 *
 * **A captura é a interface.** Não há campo de texto onde escrever "Ctrl+Alt+T",
 * nem menus de modificador: o gesto é apertar a combinação que se quer usar, que é
 * o único gesto que não exige aprendizado nenhum (Princípio 3) e o único que prova,
 * na hora, que a tecla existe naquele teclado.
 *
 * **Toda resposta é imediata e no lugar.** Combinação aceita, combinação já tomada
 * por outro aplicativo, combinação sem modificador, combinação que vale agora mas
 * não será lembrada: as quatro são frases aqui embaixo do campo, e não avisos na
 * faixa lá em cima — o painel é onde a pessoa está olhando, e a faixa é
 * passageira demais para uma decisão que ela acabou de tomar.
 */
export function ShortcutSettings({
  shortcut,
  onChange,
  onClose,
}: {
  shortcut: GlobalShortcut;
  onChange: (next: GlobalShortcut) => void;
  onClose: () => void;
}) {
  const [capturing, setCapturing] = useState(false);
  /** Os modificadores já apertados, enquanto a tecla principal não chegou. */
  const [held, setHeld] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    tone: "ok" | "error";
    text: string;
    /** A frase crua do backend, no `title` — o Adendo 3 e o 6 mandam preservá-la. */
    detail?: string;
  } | null>(null);
  const captureRef = useRef<HTMLButtonElement>(null);

  const isDefault = shortcut.accelerator === shortcut.default_accelerator;

  // O foco vai para o capturador na abertura: quem abriu o painel pelo teclado já
  // está com a mão no lugar, e um painel de atalho que cobra um clique antes de
  // ouvir teclas cobra justamente o gesto que ele existe para dispensar.
  useEffect(() => {
    captureRef.current?.focus();
  }, []);

  /**
   * **O atalho global sai da mão do sistema enquanto o capturador escuta.**
   *
   * Um atalho global é consumido antes de chegar à webview: com `⌃⌥T` registrado,
   * apertar `⌃⌥T` aqui esconderia a janela em vez de escolher a combinação — e
   * reconfirmar a tecla que já vale é justamente o gesto de quem quer testá-la.
   *
   * A devolução fica na **limpeza do efeito**, e não num handler: assim ela acontece
   * em todo caminho de saída da captura, inclusive nos que não existem ainda —
   * salvar, `Escape`, clicar fora, fechar o painel, desmontar a janela. Um caminho
   * que esquecesse de devolver deixaria o usuário sem atalho até reiniciar o app, o
   * que é a pior falha possível nesta tela. O ícone da bandeja continua sendo a via
   * de volta garantida nesses segundos.
   */
  useEffect(() => {
    if (!capturing) return;
    void pauseShortcut(true).catch(() => {
      // Suspender é conveniência: se falhar, o capturador continua funcionando para
      // toda combinação que não seja a que já está registrada.
    });
    return () => {
      // O retorno traz o estado do backend — inclusive o caso de outro aplicativo
      // ter tomado a combinação justamente nesses segundos.
      void pauseShortcut(false).then(onChange).catch(() => {});
    };
  }, [capturing, onChange]);

  /**
   * Perder o foco da janela encerra a captura.
   *
   * O `blur` do botão cobre o clique em outro lugar da janela; este cobre a janela
   * inteira saindo da frente — pelo tray, por `⌘Tab`, por outro app roubando o foco.
   * Sem ele, o atalho ficaria suspenso com a janela escondida, que é o único estado
   * em que a pessoa mais precisa dele.
   */
  useEffect(() => {
    if (!capturing) return;
    const encerrar = () => {
      setCapturing(false);
      setHeld("");
    };
    window.addEventListener("blur", encerrar);
    return () => window.removeEventListener("blur", encerrar);
  }, [capturing]);

  const salvar = useCallback(
    async (accelerator: string) => {
      setSaving(true);
      try {
        const proximo = await setShortcut(accelerator);
        onChange(proximo);
        setCapturing(false);
        setHeld("");
        // `remembered: false` é o caso sutil: a tecla vale agora e a próxima
        // abertura volta à anterior. É a mesma honestidade do `error.tabRemember`
        // — dizer que valeu quando só metade valeu seria uma falha silenciosa.
        setStatus({
          tone: "ok",
          text: proximo.remembered
            ? t("shortcut.saved", { shortcut: proximo.label })
            : t("shortcut.notRemembered", { shortcut: proximo.label }),
        });
      } catch (err: unknown) {
        // O atalho anterior continua registrado: o backend só solta o velho depois
        // que o novo é aceito. Então a mensagem diz o que ainda vale, e não só o
        // que falhou.
        setStatus({
          tone: "error",
          text: t("shortcut.taken", { shortcut: shortcut.label }),
          detail: errorDetail(err),
        });
        setCapturing(false);
        setHeld("");
      } finally {
        setSaving(false);
      }
    },
    [onChange, shortcut.label],
  );

  /**
   * **A captura escuta na JANELA, e não no elemento.** Esta é a correção do defeito
   * que fazia o painel não reconhecer nada: no WebKit do macOS um clique em `button`
   * **não** dá foco de teclado a ele (é o motivo de existir o "acesso completo por
   * teclado" nas preferências do sistema). Preso ao `onKeyDown` do capturador, o
   * painel dependia de um foco que o clique não entregava — e as teclas iam para o
   * campo de nova tarefa, que continua montado atrás do painel.
   *
   * Na janela, em fase de **captura**, o painel vê a tecla antes de qualquer campo,
   * de qualquer lugar da interface. E é o que também torna a abertura mais direta:
   * não há clique a cobrar antes de apertar a combinação.
   *
   * **Tecla sem modificador continua passando.** Só modificador (ou combinação com
   * `⌃`/`⌥`/`⌘`) começa a captura; digitar letras enquanto o painel está aberto
   * segue chegando ao campo. O preço assumido é que, com o painel aberto, um `⌘A`
   * vira escolha de atalho em vez de "selecionar tudo" — o painel existe para pegar
   * teclas, e ele fecha em um `Escape`.
   */
  useEffect(() => {
    const onKeyDown = (evento: KeyboardEvent) => {
      // O `Escape` é do `App`, que fecha o painel inteiro (ele escuta na mesma fase e
      // foi assinado antes, então roda primeiro). Aqui só encerra a captura.
      if (evento.key === "Escape") {
        setCapturing(false);
        setHeld("");
        return;
      }
      // `Tab` e `⇧Tab` continuam navegando: capturá-los deixaria o painel sem porta
      // de saída pelo teclado que não fosse o Escape. Com `⌃`/`⌥`/`⌘` eles voltam a
      // ser teclas capturáveis como quaisquer outras.
      if (evento.key === "Tab" && !hasGlobalModifier(evento)) {
        setCapturing(false);
        setHeld("");
        return;
      }

      const relevante = isModifierKey(evento.code) || hasGlobalModifier(evento);
      // Nem capturando, nem tecla que começa uma combinação: é digitação, e ela
      // pertence ao campo.
      if (!capturing && !relevante) return;

      // **Nada do que é apertado aqui vale como atalho da janela.** `⌘T` criaria uma
      // aba e `⌘1` trocaria de aba — as duas coisas enquanto a pessoa está dizendo
      // qual combinação quer. Os atalhos de aba escutam na bolha; parar a propagação
      // aqui os desliga sem que eles precisem saber que este painel existe.
      evento.stopPropagation();
      evento.preventDefault();

      if (!capturing) {
        setCapturing(true);
        setStatus(null);
      }

      // Só modificadores até agora: mostra o que já está apertado e espera a tecla.
      // É também o instante em que a suspensão do atalho global sai daqui para o
      // backend — e ela chega antes da tecla principal, porque a mão segura o
      // modificador por muito mais tempo do que um ida-e-volta de IPC.
      if (isModifierKey(evento.code)) {
        setHeld(modifiersPreview(evento));
        return;
      }

      // A regra única: sem `⌃`, `⌥` ou `⌘` a tecla ficaria capturada no sistema
      // inteiro e sequestraria a digitação normal. O painel diz o que falta e
      // continua ouvindo — recusar e fechar cobraria um clique por tentativa.
      if (!hasGlobalModifier(evento)) {
        setHeld("");
        setStatus({ tone: "error", text: MODIFIER_RULE });
        return;
      }

      const accelerator = acceleratorFrom(evento);
      if (accelerator === null) return;
      // Repetir a combinação que já vale não é no-op: se ela não estiver valendo
      // (outro app a tomou na abertura), insistir é o gesto certo — e é o backend
      // quem sabe disso.
      void salvar(accelerator);
    };

    // Soltar um modificador também é informação: a prévia acompanha a mão em vez de
    // acumular teclas que já não estão apertadas.
    const onKeyUp = (evento: KeyboardEvent) => {
      if (capturing && isModifierKey(evento.code)) {
        setHeld(modifiersPreview(evento));
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [capturing, salvar]);

  return (
    // `arrive`: este bloco entra no lugar exato de onde a lista saiu, com a mesma
    // animação de tudo que passa a ocupar a área da lista.
    <div className="arrive px-2 py-4">
      <p className="text-xs font-medium text-foreground">{t("shortcut.title")}</p>
      <p className="mt-1 text-micro text-muted-foreground">
        {t("shortcut.explain")}
      </p>

      {/* O capturador. Herda a forma do campo de nova tarefa — 32px de altura,
          `rounded-lg`, borda de controle — porque é o mesmo tipo de coisa: o lugar
          onde a pessoa põe algo dentro. Não é um `Input` porque não há texto a
          digitar; é um botão que ouve teclas, e por isso o nome acessível diz o que
          ele faz em vez de deixar o leitor de tela anunciar "botão ⌃⌥T". */}
      <button
        ref={captureRef}
        type="button"
        disabled={saving}
        aria-label={
          capturing
            ? t("shortcut.press")
            : t("shortcut.change", { shortcut: shortcut.label })
        }
        onClick={() => {
          setCapturing(true);
          setHeld("");
          setStatus(null);
          // O foco é pedido de propósito, e não herdado do clique: no WebKit do macOS
          // clicar num botão não dá foco a ele, e sem foco não haveria anel nenhum
          // dizendo de onde o painel está ouvindo. Quem escuta a tecla é o listener da
          // janela — isto é só o indicador.
          captureRef.current?.focus();
        }}
        className={[
          "mt-2 flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-2.5",
          "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          // Capturando, o campo fica em `muted`: é o único sinal de "estou ouvindo"
          // que não é uma sombra nem uma camada nova (Regra da Sombra Externa).
          capturing
            ? "border-ring bg-muted"
            : "border-control-border hover:bg-muted",
        ].join(" ")}
      >
        <span className="text-micro text-muted-foreground">
          {capturing ? t("shortcut.press") : t("shortcut.current")}
        </span>
        <span className="truncate text-body font-medium">
          {capturing ? held || "…" : shortcut.label}
        </span>
      </button>

      {/* Região viva: a resposta da troca chega aqui, e é a única coisa que o painel
          diz depois de um gesto. `role="status"` e não `alert` mesmo no erro — o
          painel está aberto e sob os olhos, então cortar o leitor de tela no meio de
          outra frase custaria mais do que espera. */}
      <p
        role="status"
        aria-live="polite"
        title={status?.detail !== undefined && status.detail !== "" ? status.detail : undefined}
        className={[
          "mt-1.5 min-h-[1.25rem] text-micro wrap-anywhere",
          status?.tone === "error" ? "text-destructive" : "text-muted-foreground",
        ].join(" ")}
      >
        {status !== null
          ? status.text
          : // Sem gesto nenhum ainda: a linha diz a regra da combinação — e, se o
            // atalho não estiver valendo, isso é o que mais importa na tela, porque
            // é a diferença entre ensinar uma tecla que funciona e uma que não.
            !shortcut.active
            ? t("shortcut.inactive", { shortcut: shortcut.label })
            : MODIFIER_RULE}
      </p>

      {/* Quando a combinação usa `⌘`/`Win`, ela deixa de existir para o app em foco
          no sistema inteiro — é o argumento do Adendo 2, dito como aviso em vez de
          como proibição: a escolha é do usuário, e o custo dela é dito na hora. */}
      {shortcut.accelerator.includes("super") && (
        <p className="mt-1 text-micro text-muted-foreground">
          {isMac() ? t("shortcut.stealsCommand") : t("shortcut.stealsSuper")}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {/* "Restaurar padrão" só existe quando há o que restaurar: um botão que não
            faz nada é mobília, e esta janela não tem espaço para mobília. */}
        {isDefault ? (
          <span />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={saving}
            onClick={() => void salvar(shortcut.default_accelerator)}
            className="text-xs"
          >
            {t("shortcut.reset")}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClose}
          className="text-xs"
        >
          {t("shortcut.done")}
        </Button>
      </div>
    </div>
  );
}
