import { t } from "@/lib/i18n";
import { isLinux, TRAY_PLACE } from "@/lib/todos";

/**
 * No Linux, a via de volta que o sistema garante é a barra de tarefas (Adendo
 * 12: `skipTaskbar: false` lá) — a bandeja pode nem existir (GNOME sem a
 * extensão AppIndicator). As três frases de volta trocam de chave por
 * plataforma, resolvido uma vez na carga do módulo como `TRAY_PLACE` faz.
 */
const LINUX = isLinux();

/**
 * A lista vazia — o único lugar da janela com espaço de sobra, e o único que pode
 * gastar os 24px de respiro que o resto da interface não tem.
 *
 * **São dois estados vazios, não um.** A diferença não é cosmética: eles falam
 * com pessoas que sabem coisas diferentes.
 *
 * - `firstRun`: acabou de instalar e não leu nada sobre o app. Precisa sair
 *   daqui sabendo as duas vias de volta, porque a janela vive escondida e uma
 *   janela sem decoração, fora da taskbar, é irrecuperável para quem não sabe
 *   trazê-la de volta.
 * - Depois: limpou a lista, ou criou uma aba. Já acrescentou tarefa antes, então
 *   repetir "escreva acima e aperte Enter" seria explicar o óbvio. Fica só o
 *   atalho, que é a única coisa que ainda vale ser lembrada.
 *
 * **E cada um tem uma segunda forma, para quando o atalho está morto (Adendo
 * 12).** `shortcutActive: false` significa que o sistema recusou a combinação —
 * outro aplicativo a tomou, ou a sessão não registra atalho global. Ensinar a
 * tecla em tinta e peso 500 nesse estado seria ensinar exatamente a instrução
 * que falha no primeiro Escape. A hierarquia inverte: a via em tinta passa a ser
 * o ícone da bandeja, e a frase em névoa diz o que houve e aponta a engrenagem.
 *
 * **Nada aqui ocupa altura permanente.** O bloco inteiro desaparece na primeira
 * tarefa, e é essa a razão de o ensino da volta continuar na faixa de aviso
 * (`onboarding.roundTrip`): a instrução tem que sobreviver ao instante em que
 * este componente sai da tela.
 *
 * `arrive` nos dois ramos: este bloco entra no lugar exato de onde a última
 * tarefa acabou de sair, e é a mesma animação com que uma linha nova aparece
 * (`useFlipRows`) e com que a lista de outra aba se instala. Tudo que passa a
 * ocupar a área da lista chega igual — ver o bloco MOVIMENTO em index.css.
 */
/**
 * `shortcut` chega por prop, e não de uma constante importada: a combinação é
 * escolha do usuário desde o Adendo 9, e quem a conhece é o `App` (que a pediu ao
 * backend na carga inicial). Uma constante aqui voltaria a prometer `⌃⌥T` a quem
 * trocou a tecla — e é justamente esta a tela que ensina a via de volta.
 * `shortcutActive` vem da mesma leitura, pela mesma razão.
 */
export function EmptyList({
  firstRun,
  shortcut,
  shortcutActive,
}: {
  firstRun: boolean;
  shortcut: string;
  shortcutActive: boolean;
}) {
  if (!firstRun) {
    return (
      <p className="arrive px-2 py-6 text-center text-xs text-muted-foreground">
        {t("empty.title")}
        <span className="mt-1.5 block">
          {shortcutActive
            ? t("empty.hint", { shortcut })
            : t(LINUX ? "empty.hintInactiveLinux" : "empty.hintInactive", {
                place: TRAY_PLACE,
              })}
        </span>
      </p>
    );
  }

  return (
    // `text-balance` é herdado, então vale para as três frases de uma vez. Sem
    // ele, a linha de cima quebrava com "Enter." sozinho embaixo e a do meio
    // quebrava depois de "de", pendurando a preposição no fim da linha. Uma
    // largura menor não resolvia — só mudava onde o rio ficava feio.
    <div className="arrive px-2 py-6 text-center text-balance">
      {/* Cinza, e não tinta: é a frase que menos precisa ser dita nesta tela.
          O cursor já está piscando no campo logo acima — o campo convida
          sozinho, e a instrução aqui só confirma o que fazer com o Enter. */}
      <p className="text-xs text-muted-foreground">{t("empty.firstRunAction")}</p>

      {/* Os 24px do estado vazio, e o único lugar do app que os gasta. Não é
          espaçamento: é o corte entre "o que fazer agora" e "como voltar
          depois", que são dois assuntos e não uma lista de três dicas. */}
      {/* A hierarquia se faz com peso e com cinza, e não com um quarto tamanho:
          a linha de cima é tinta em peso 500 porque é a que decide se o app
          sobrevive ao primeiro Escape; a segunda é a rede de segurança, em névoa.
          Com o atalho morto, os papéis trocam de frase: a bandeja é a única via
          que existe e sobe para a tinta, e a névoa explica e aponta a engrenagem
          — nunca as duas vias em tinta, porque duas linhas de peso 500 são
          nenhuma. */}
      {shortcutActive ? (
        <>
          <p className="mt-6 text-xs font-medium text-foreground">
            {t("empty.wayBackShortcut", { shortcut })}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t(LINUX ? "empty.wayBackTrayLinux" : "empty.wayBackTray", {
              place: TRAY_PLACE,
            })}
          </p>
        </>
      ) : (
        <>
          <p className="mt-6 text-xs font-medium text-foreground">
            {t(
              LINUX ? "empty.wayBackTrayPrimaryLinux" : "empty.wayBackTrayPrimary",
              { place: TRAY_PLACE },
            )}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("empty.shortcutTaken", { shortcut })}
          </p>
        </>
      )}
    </div>
  );
}
