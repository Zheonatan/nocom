import { t } from "@/lib/i18n";
import { isLinux, isMac } from "@/lib/todos";

/**
 * A captura de teclas do painel de atalho (Adendo 9): transforma a combinação que
 * o usuário aperta no acelerador que o backend entende.
 *
 * **O formato é o `event.code`, e não o `event.key`.** `code` é a posição física da
 * tecla (`KeyT`, `Digit1`, `Space`) e é a mesma língua que o parser do plugin de
 * atalho global fala do outro lado do IPC — então não há tabela de conversão no
 * meio. `key` seria a letra *produzida*, que muda com o layout e com os
 * modificadores apertados: em teclado ABNT, `⌥T` produz um caractere diferente do
 * que produz num ANSI, e o atalho gravado dependeria de qual estava plugado.
 *
 * A escrita para os olhos NÃO nasce aqui: quem descreve a combinação é o backend,
 * que também escreve o rótulo do menu do tray (ver `atalho.rs`). O que este módulo
 * escreve é só a prévia dos modificadores **enquanto a tecla principal ainda não
 * chegou** — um estado que o backend nunca vê, porque não é atalho nenhum ainda.
 */

/**
 * As teclas que não podem ser a tecla principal: são os modificadores em si.
 *
 * Sem esta lista, apertar `⌃` para começar uma combinação seria lido como "o atalho
 * é Control", e o painel tentaria gravar uma combinação por cada dedo que encosta
 * numa tecla morta. `CapsLock` entra porque ele é uma tecla de estado, e um atalho
 * que só funciona com o caps ligado é um atalho que não funciona.
 */
const MODIFICADORES = new Set([
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
  "MetaLeft",
  "MetaRight",
  "CapsLock",
  "Fn",
  "FnLock",
  "NumLock",
]);

export function isModifierKey(code: string): boolean {
  return MODIFICADORES.has(code);
}

/** Os modificadores apertados, na ordem canônica em que o atalho é escrito. */
type Evento = Pick<
  KeyboardEvent,
  "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
>;

/**
 * Tem `⌃`, `⌥` ou `⌘`? É a única regra de validação que existe, e ela é checada
 * aqui **e** no backend.
 *
 * Uma tecla sozinha registrada globalmente sequestra a digitação normal do sistema
 * inteiro — apertar `T` em qualquer campo de qualquer aplicativo mostraria o To-Do
 * —, e `⇧` com uma letra é a mesma coisa com maiúscula. A checagem daqui existe
 * para o painel poder dizer o que falta **sem** ir e voltar do backend; a de lá é a
 * que garante que nenhum caminho grave uma combinação impossível, na mesma relação
 * que o `maxLength` do campo tem com o limite de 200 caracteres.
 */
export function hasGlobalModifier(evento: Evento): boolean {
  return evento.ctrlKey || evento.altKey || evento.metaKey;
}

/**
 * O acelerador canônico da combinação apertada, ou `null` se a tecla principal
 * ainda não chegou.
 *
 * A ordem dos modificadores é fixa (Control, Alt, Shift, Super): o backend
 * normaliza de novo ao gravar, mas mandar sempre na mesma ordem é o que faz duas
 * combinações iguais gerarem a mesma string aqui — e é essa string que o painel
 * compara com a atual para não regravar o que já vale.
 */
export function acceleratorFrom(evento: Evento): string | null {
  if (isModifierKey(evento.code)) return null;
  const partes: string[] = [];
  if (evento.ctrlKey) partes.push("Control");
  if (evento.altKey) partes.push("Alt");
  if (evento.shiftKey) partes.push("Shift");
  if (evento.metaKey) partes.push("Super");
  partes.push(evento.code);
  return partes.join("+");
}

/**
 * A prévia do que está sendo apertado, só com os modificadores.
 *
 * Existe porque a captura tem um instante de vida em que não há atalho: os dedos
 * estão em `⌃⌥` e a tecla principal não chegou. Sem a prévia, o campo fica parado
 * dizendo "aperte as teclas" enquanto o usuário já está apertando — e a dúvida de
 * "ele está me ouvindo?" é o que faz alguém desistir de um capturador de atalho.
 *
 * A ordem é a da Apple no Mac (`⌃⌥⇧⌘`) e a mesma ordem escrita por extenso fora
 * dele — as duas são as ordens que o backend usa no rótulo final, então a prévia
 * não muda de forma quando a combinação fecha.
 */
export function modifiersPreview(evento: Evento): string {
  const mac = isMac();
  let texto = "";
  if (evento.ctrlKey) texto += mac ? "⌃" : "Ctrl+";
  if (evento.altKey) texto += mac ? "⌥" : "Alt+";
  if (evento.shiftKey) texto += mac ? "⇧" : "Shift+";
  if (evento.metaKey) texto += mac ? "⌘" : "Win+";
  return texto;
}

/**
 * A regra da combinação escrita na convenção do sistema — a mesma decisão do
 * `TRAY_PLACE`, e por isso a mesma forma: duas frases no dicionário e a escolha
 * aqui. "⌃, ⌥ ou ⌘" numa tela de Windows não nomeia tecla nenhuma.
 */
export const MODIFIER_RULE: string = isMac()
  ? t("shortcut.needsModifierMac")
  : t("shortcut.needsModifierOther");

/**
 * O rótulo do atalho antes de o backend responder a primeira vez.
 *
 * É o **padrão** escrito à mão, e é a resposta certa em toda instalação nova. Vale
 * por alguns milissegundos: a carga inicial pede o atalho junto das abas e das
 * tarefas, e a lista só sai do "Carregando…" quando as três chegaram. O que este
 * valor cobre é o erro que aparece ANTES disso — uma falha de IPC na abertura, cuja
 * mensagem também ensina a via de volta e não pode dizer "{shortcut}".
 *
 * Precisa continuar de acordo com `PADRAO`, em `atalho.rs` — que desde o Adendo 12
 * é por plataforma: no Linux `Ctrl+Alt+T` é o atalho canônico de terminal, e o
 * padrão de lá é `Ctrl+Alt+Space`.
 */
export const DEFAULT_SHORTCUT_LABEL: string = isMac()
  ? "⌃⌥T"
  : isLinux()
    ? "Ctrl+Alt+Space"
    : "Ctrl+Alt+T";
