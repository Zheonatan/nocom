import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  checkUpdate,
  currentVersion,
  errorDetail,
  installUpdate,
  type Update,
} from "@/lib/todos";

/**
 * Versão instalada e atualização pelo próprio app (Adendo 10).
 *
 * **Fica dentro do painel da engrenagem, embaixo do atalho, e não no cabeçalho.**
 * A janela tem 360x480 e a Regra do Custo de Altura vale aqui como em todo o
 * resto: um indicador permanente de versão gastaria altura das tarefas para dizer
 * um número que ninguém precisa ver enquanto trabalha. O painel já é o lugar onde
 * se olha quando a pergunta é sobre o app em vez de sobre a lista.
 *
 * **Nada acontece sozinho.** Não há verificação na abertura nem temporizador: a
 * consulta é a única requisição de rede do app, e ela sai deste botão. O produto
 * promete que nada sai desta máquina, e a promessa é mantida por construção — é
 * por isso que `update.explain` diz isso na tela, e não só no README.
 *
 * **Dois cliques, e o segundo nomeia o que vai instalar.** Verificar e instalar
 * são separados porque baixar alguns megabytes e reiniciar o app é o tipo de coisa
 * que precisa ser pedida, não descoberta. O backend guarda o resultado da
 * verificação para que o botão instale exatamente a versão que esta tela anunciou.
 *
 * **Não existe estado de sucesso.** A instalação troca o processo por dentro: no
 * caminho bom este componente deixa de existir junto com a janela, e o que o
 * usuário vê é o app voltar já na versão nova. O que sobra para desenhar é a
 * espera e a falha.
 */
export function UpdateCheck() {
  /** A versão instalada. `null` só até a leitura chegar, no primeiro quadro. */
  const [versao, setVersao] = useState<string | null>(null);
  const [fase, setFase] = useState<
    "parado" | "verificando" | "atual" | "disponivel" | "instalando" | "falhou"
  >("parado");
  const [nova, setNova] = useState<Update | null>(null);
  const [erro, setErro] = useState<{ text: string; detail: string } | null>(null);

  /**
   * O painel pode fechar no meio de uma chamada — ele é a camada de fora do
   * `Escape`, e sair dele é um gesto de uma tecla. A marca evita escrever estado
   * num componente que já saiu da árvore.
   */
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  // A versão instalada não custa rede: é o número do `tauri.conf.json` embutido no
  // binário. Por isso ela pode ser lida na montagem, ao contrário da verificação.
  useEffect(() => {
    void currentVersion()
      .then((v) => {
        if (vivo.current) setVersao(v);
      })
      .catch(() => {
        // Sem número na tela, e nada mais: a linha de status simplesmente não
        // anuncia a versão atual. Um erro aqui seria um aviso sobre a falha de ler
        // um rótulo, num painel que a pessoa abriu para outra coisa.
      });
  }, []);

  const verificar = useCallback(() => {
    setFase("verificando");
    setErro(null);
    void checkUpdate()
      .then((resultado) => {
        if (!vivo.current) return;
        setNova(resultado);
        setFase(resultado === null ? "atual" : "disponivel");
      })
      .catch((err: unknown) => {
        if (!vivo.current) return;
        // Sem rede, endpoint fora, ou `latest.json` sem entrada para esta
        // plataforma — o caso do `.deb` e do `.rpm`, onde o updater não atua. A
        // frase é a mesma nos três porque a consequência é a mesma: nada mudou.
        setErro({ text: t("error.updateCheck"), detail: errorDetail(err) });
        setFase("falhou");
      });
  }, []);

  const instalar = useCallback(() => {
    setFase("instalando");
    setErro(null);
    void installUpdate().catch((err: unknown) => {
      if (!vivo.current) return;
      // A assinatura é validada antes de qualquer escrita, então falhar aqui é
      // falhar ANTES de mexer no app — e é isso que a frase diz.
      setErro({
        text: t("error.updateInstall", { version: versao ?? "" }),
        detail: errorDetail(err),
      });
      // Volta para "falhou", e não para "disponivel": o backend consumiu a
      // atualização guardada ao tentar instalar, então o gesto que faz sentido
      // agora é verificar de novo — e o botão precisa oferecer esse, não um
      // "Atualizar" que responderia "nenhuma atualização verificada".
      setNova(null);
      setFase("falhou");
    });
  }, [versao]);

  const instalando = fase === "instalando";
  const ocupado = fase === "verificando" || instalando;
  /** O botão só oferece instalar enquanto existe uma atualização já verificada. */
  const oferecerInstalar = nova !== null;

  /**
   * A linha viva do bloco, e a única coisa que ele diz. Em repouso anuncia a versão
   * instalada — o mesmo desenho da linha do painel do atalho, que em repouso diz a
   * regra da combinação: o espaço já está reservado, então usá-lo para o dado mais
   * útil do momento não custa altura nenhuma.
   */
  const situacao = (() => {
    if (fase === "verificando") return t("update.checking");
    if (instalando) return t("update.installing");
    if (fase === "falhou") return erro?.text ?? "";
    if (fase === "atual") return t("update.upToDate");
    if (fase === "disponivel" && nova !== null) {
      return t("update.available", { version: nova.version });
    }
    return versao === null ? "" : t("update.current", { version: versao });
  })();

  return (
    <div>
      <p className="text-xs font-medium text-foreground">{t("update.title")}</p>
      <p className="mt-1 text-micro text-muted-foreground">
        {t("update.explain")}
      </p>

      {/* Mesma decisão do painel do atalho: `status` e não `alert`, inclusive no
          erro. O bloco está aberto e sob os olhos, e cortar o leitor de tela no
          meio de outra frase custaria mais do que a espera. */}
      <p
        role="status"
        aria-live="polite"
        title={erro !== null && erro.detail !== "" ? erro.detail : undefined}
        className={[
          "mt-1.5 min-h-[1.25rem] text-micro wrap-anywhere",
          fase === "falhou" ? "text-destructive" : "text-muted-foreground",
        ].join(" ")}
      >
        {situacao}
      </p>

      <div className="mt-2">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={ocupado}
          onClick={oferecerInstalar ? instalar : verificar}
          className="text-xs"
        >
          {oferecerInstalar ? t("update.install") : t("update.check")}
        </Button>
      </div>
    </div>
  );
}
