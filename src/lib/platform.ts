/**
 * Em que sistema a webview está rodando — e só isso.
 *
 * Módulo sem imports de propósito, como `dates.ts`: é o que deixa `shortcut.ts`
 * (que precisa destas respostas) carregável sob `node --test` — o Node não
 * resolve o alias `@/`, e `todos.ts`, onde estas funções moravam, puxa o
 * `@tauri-apps/api` junto. O `navigator` é lido na chamada, não na carga, então
 * um teste pode trocá-lo no global e ver a outra plataforma.
 */

/**
 * Se o app está rodando num Mac. Decide toda escrita de tecla da interface — o
 * macOS escreve modificadores como símbolos e todo menu do sistema faz assim,
 * enquanto Windows e Linux escrevem por extenso, e "⌃⌥T" numa tela de Windows não
 * significa nada.
 *
 * **O atalho global não passa mais por aqui.** A combinação é escolha do usuário
 * (Adendo 9) e quem escreve o rótulo dela é o backend, que também escreve o do
 * tray: duas escritas do mesmo dado divergiriam no primeiro atalho que não fosse o
 * padrão. O que sobrou aqui são os atalhos da janela em foco, que são constantes.
 */
export function isMac(): boolean {
  // Sniffing de user agent é aceitável aqui e só aqui: o app roda numa webview
  // que nós mesmos embarcamos, e o custo de errar é um glifo fora de convenção,
  // não uma função quebrada. `navigator.platform` está obsoleto e
  // `userAgentData` não existe no WebKit, que é justamente o motor do Mac.
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Se o app está rodando em Linux. Existe por uma decisão só: o padrão de fábrica
 * do atalho é outro lá (Adendo 12 — `Ctrl+Alt+T` é o atalho canônico de terminal
 * em GNOME/KDE/Ubuntu), e o `DEFAULT_SHORTCUT_LABEL` precisa acompanhar o
 * `PADRAO` de `atalho.rs` antes de o backend responder a primeira vez.
 */
export function isLinux(): boolean {
  return !isMac() && /Linux/i.test(navigator.userAgent);
}

/**
 * O modificador de comando de aplicativo apertado, para os atalhos com a janela
 * em foco. `⌘` no Mac e `Ctrl` fora dele — a convenção de cada sistema, do lado
 * do teclado e não só do letreiro.
 *
 * Recusa a combinação com os DOIS apertados: `⌃⌘1` não é `⌘1`, e tratar como se
 * fosse tornaria imprevisível qualquer atalho de sistema que use as duas teclas.
 */
export function hasModKey(evento: {
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return isMac()
    ? evento.metaKey && !evento.ctrlKey
    : evento.ctrlKey && !evento.metaKey;
}
