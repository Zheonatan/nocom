import { useCallback, useEffect, useRef, useState } from "react";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as autostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { UpdateCheck } from "@/components/UpdateCheck";
import {
  acceleratorFrom,
  hasGlobalModifier,
  isModifierKey,
  MODIFIER_RULE,
  modifiersPreview,
} from "@/lib/shortcut";
import {
  errorDetail,
  exportData,
  importData,
  isMac,
  pauseShortcut,
  setShortcut,
  type GlobalShortcut,
} from "@/lib/todos";

/**
 * A linha de resposta de uma seção do painel: a mesma forma do status do
 * atalho, agora compartilhada pelas seções novas (Adendo 13). O detalhe cru —
 * caminho de arquivo, frase do backend — vai no `title`, como sempre.
 */
type SectionStatus = {
  tone: "ok" | "error";
  text: string;
  detail?: string;
} | null;

/**
 * O painel da engrenagem: o atalho global (Adendo 9) e a versão (Adendo 10).
 *
 * **Os dois assuntos são o mesmo assunto — o app, e não a lista.** Foi por isso que
 * a verificação de versão entrou aqui em vez de ganhar lugar próprio: este já era o
 * único lugar do app onde se olha quando a pergunta não é sobre as tarefas, e uma
 * segunda vista custaria altura permanente no cabeçalho para um número que ninguém
 * precisa ver enquanto trabalha. Uma linha separa os dois; o rodapé é do painel.
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
/**
 * Quanto tempo uma captura armada PELO TECLADO precisa existir antes de um combo
 * completo salvar. É o que separa escolha de reflexo (Adendo 12): com o painel
 * aberto, um `⌘C` de memória muscular chega como `Meta` (que armava a captura) e
 * `C` uns 50ms depois — e salvava o atalho global na hora. Abaixo deste tempo o
 * combo é engolido: a captura fica de pé, a prévia mostra os modificadores, e
 * repetir a tecla com o modificador ainda seguro salva — agora com a espera
 * cumprida. O clique no capturador não espera nada: clicar é intenção explícita.
 */
const ARMED_DELAY_MS = 300;

export function ShortcutSettings({
  shortcut,
  onChange,
  onImported,
  onClose,
}: {
  shortcut: GlobalShortcut;
  onChange: (next: GlobalShortcut) => void;
  /** A importação mudou abas e lista por baixo do painel: o App relê as duas. */
  onImported: () => void;
  onClose: () => void;
}) {
  const [capturing, setCapturing] = useState(false);
  /** Os modificadores já apertados, enquanto a tecla principal não chegou. */
  const [held, setHeld] = useState("");
  /**
   * Quando a captura foi armada pelo teclado, o instante em que isso aconteceu;
   * `null` = armada pelo clique no capturador. Ver `ARMED_DELAY_MS`.
   */
  const armedByKeyAt = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    tone: "ok" | "error";
    text: string;
    /** A frase crua do backend, no `title` — o Adendo 3 e o 6 mandam preservá-la. */
    detail?: string;
  } | null>(null);
  const captureRef = useRef<HTMLButtonElement>(null);

  /**
   * O interruptor de iniciar com o sistema (Adendo 13). `null` é "ainda não
   * sei": entre a montagem e a resposta do plugin, e depois de uma leitura que
   * falhou — nos dois casos o controle desabilita, porque um interruptor que
   * mostra um estado chutado é pior que um que espera.
   */
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [autostartStatus, setAutostartStatus] = useState<SectionStatus>(null);
  /** A resposta de exportar/importar, na linha da seção de dados. */
  const [dataStatus, setDataStatus] = useState<SectionStatus>(null);
  /** Um gesto de dados por vez: exportar e importar disputam o mesmo estado. */
  const [dataBusy, setDataBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    autostartEnabled()
      .then((ligado) => {
        if (alive) setAutostart(ligado);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setAutostartStatus({
          tone: "error",
          text: t("error.autostartRead"),
          detail: errorDetail(err),
        });
      });
    return () => {
      alive = false;
    };
  }, []);

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
   * Liga e desliga o início com o sistema (Adendo 13). Otimista como o resto do
   * app: o quadrado muda no clique e volta se o plugin recusar — com a frase de
   * erro dizendo que nada mudou.
   */
  async function toggleAutostart(ligado: boolean) {
    const anterior = autostart;
    setAutostart(ligado);
    setAutostartStatus(null);
    try {
      if (ligado) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
    } catch (err: unknown) {
      setAutostart(anterior);
      setAutostartStatus({
        tone: "error",
        text: t("error.autostart"),
        detail: errorDetail(err),
      });
    }
  }

  /**
   * Exportar (Adendo 13): o diálogo de salvar do sistema escolhe o caminho, o
   * backend grava — a mesma gravação atômica do `todos.json`. Cancelar o diálogo
   * é silêncio: a pessoa desistiu, e não falhou nada.
   */
  async function exportar() {
    setDataStatus(null);
    setDataBusy(true);
    try {
      const caminho = await saveDialog({
        // Do dicionário como toda palavra da interface: "tarefas" num sistema
        // em inglês seria a única string fora dele.
        defaultPath: t("data.exportFileName"),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (caminho === null) return;
      await exportData(caminho);
      // O caminho completo fica no `title` da linha, como todo detalhe cru.
      setDataStatus({ tone: "ok", text: t("data.exported"), detail: caminho });
    } catch (err: unknown) {
      setDataStatus({
        tone: "error",
        text: t("error.export"),
        detail: errorDetail(err),
      });
    } finally {
      setDataBusy(false);
    }
  }

  /**
   * Importar (Adendo 13): mescla sem nunca remover — a frase do desfecho diz
   * quantos ENTRARAM, porque é a única coisa que mudou. O App relê abas e lista
   * por `onImported`, já que as duas podem ter crescido por baixo do painel.
   */
  async function importar() {
    setDataStatus(null);
    setDataBusy(true);
    try {
      const escolhido = await openDialog({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (escolhido === null) return;
      const caminho = Array.isArray(escolhido) ? escolhido[0] : escolhido;
      if (caminho === undefined) return;
      const resumo = await importData(caminho);
      setDataStatus({
        tone: "ok",
        text:
          resumo.tabs === 0 && resumo.todos === 0
            ? t("data.importedNothing")
            : t("data.imported", {
                todos: t("data.importedTodos", { n: resumo.todos }),
                tabs: t("data.importedTabs", { n: resumo.tabs }),
              }),
      });
      onImported();
    } catch (err: unknown) {
      setDataStatus({
        tone: "error",
        text: t("error.import"),
        detail: errorDetail(err),
      });
    } finally {
      setDataBusy(false);
    }
  }

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
   * segue chegando ao campo. E um combo que fecha logo depois de a captura se armar
   * pelo teclado não salva — ver `ARMED_DELAY_MS`: era o `⌘A` de memória muscular
   * virando atalho global, a única configuração do app trocada por um reflexo.
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
        // Armada pelo teclado: o relógio do reflexo começa aqui. Não é regravado
        // nos eventos seguintes de propósito — segurar o modificador acumula o
        // tempo, que é exatamente o gesto de quem quer salvar de novo.
        armedByKeyAt.current = performance.now();
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
      // **Reflexo não rebinda.** Um combo que fecha a menos de `ARMED_DELAY_MS`
      // de uma armada por teclado é o `⌘C`/`⌘W` de memória muscular, não uma
      // escolha: engole, mantém a captura de pé e mostra os modificadores — quem
      // quis mesmo salvar repete a tecla com o modificador seguro e passa. A
      // armada por clique (`null`) salva de primeira.
      const armadaHa =
        armedByKeyAt.current === null
          ? Infinity
          : performance.now() - armedByKeyAt.current;
      if (armadaHa < ARMED_DELAY_MS) {
        setHeld(modifiersPreview(evento));
        return;
      }
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
    <div className="arrive px-2 py-3">
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
          // Armada por clique: intenção explícita, salva de primeira — ver
          // `ARMED_DELAY_MS`.
          armedByKeyAt.current = null;
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
          "mt-1.5 linha-de-status text-micro wrap-anywhere",
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

      {/* "Restaurar padrão" só existe quando há o que restaurar: um botão que não
          faz nada é mobília, e esta janela não tem espaço para mobília. Ele fica
          nesta seção e não no rodapé do painel porque é um gesto SOBRE O ATALHO —
          desde o Adendo 10 o rodapé é do painel inteiro, e "restaurar padrão"
          embaixo do bloco de versão pareceria oferecer desinstalar a atualização. */}
      {!isDefault && (
        <div className="mt-3">
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
        </div>
      )}

      {/* A linha é o que separa os assuntos do painel — e é linha, e não sombra
          nem cartão: profundidade neste app é tom e traço (Regra da Sombra Externa). */}
      <Separator className="my-3" />

      {/* --- Início com o sistema (Adendo 13) --- */}
      <p className="text-xs font-medium text-foreground">{t("autostart.title")}</p>
      <p className="mt-1 text-micro text-muted-foreground">
        {t("autostart.explain")}
      </p>
      {/* `label` em volta: o texto inteiro é alvo de clique, não só o quadrado
          de 16px — a Regra do Alvo Maior que o Desenho, com HTML e sem
          pseudo-elemento. Desabilita enquanto a leitura não chegou (ou falhou):
          um interruptor mostrando estado chutado é pior que um que espera. */}
      <label className="mt-2 flex w-fit items-center gap-2 text-xs text-foreground">
        <Checkbox
          checked={autostart === true}
          disabled={autostart === null}
          onCheckedChange={(marcado) => void toggleAutostart(marcado === true)}
        />
        {t("autostart.label")}
      </label>
      {autostartStatus !== null && (
        <p
          role="status"
          aria-live="polite"
          title={autostartStatus.detail}
          className="mt-1.5 text-micro wrap-anywhere text-destructive"
        >
          {autostartStatus.text}
        </p>
      )}

      <Separator className="my-3" />

      {/* --- Seus dados (Adendo 13) --- */}
      <p className="text-xs font-medium text-foreground">{t("data.title")}</p>
      <p className="mt-1 text-micro text-muted-foreground">{t("data.explain")}</p>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={dataBusy}
          onClick={() => void exportar()}
          className="text-xs"
        >
          {t("data.export")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={dataBusy}
          onClick={() => void importar()}
          className="text-xs"
        >
          {t("data.import")}
        </Button>
      </div>
      {dataStatus !== null && (
        <p
          role="status"
          aria-live="polite"
          title={dataStatus.detail}
          className={[
            "mt-1.5 text-micro wrap-anywhere",
            dataStatus.tone === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          ].join(" ")}
        >
          {dataStatus.text}
        </p>
      )}

      <Separator className="my-3" />

      <UpdateCheck />

      {/* "Concluir" fecha o painel INTEIRO, então é o último e está sozinho: com um
          segundo botão do lado, ele pareceria concluir só o bloco de cima. */}
      <div className="mt-3 flex justify-end">
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
