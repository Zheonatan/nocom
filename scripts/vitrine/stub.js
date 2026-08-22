// O outro lado do IPC, falso, para a interface real do NoCom rodar num navegador
// e posar para as fotos do README (`assets/telas/`). Ver `captura.mjs` ao lado.
//
// Isto NÃO entra no app: nada em `src/` importa este arquivo, e ele só é servido
// pela entrada `scripts/vitrine/index.html`, que existe fora do `index.html` do
// build justamente para não viajar dentro de um instalador.

// -------------------------------------------------------------------- idioma
//
// O app escolhe o idioma por `navigator.languages` (ver `src/lib/i18n.ts`), e o
// README é em português. Sem esta fixação a foto sai no idioma do Chrome de quem
// regerou, e o mesmo comando produziria uma imagem diferente em duas máquinas.
Object.defineProperty(navigator, "languages", { get: () => ["pt-BR"] });
Object.defineProperty(navigator, "language", { get: () => "pt-BR" });

// --------------------------------------------------------------------- datas
//
// **A data de hoje é CALCULADA, e não escrita à mão.** O destaque vermelho é a
// coisa que a foto mais precisa mostrar, e ele acende comparando a data do título
// com o dia de verdade (`src/hooks/use-today.ts`). Uma data fixa aqui funcionaria
// no dia em que foi escrita e sairia cinza em todos os outros — a foto perderia
// calada o recurso que ela existe para anunciar. `captura.mjs` confere que o
// destaque acendeu antes de gravar o PNG.
const doisDigitos = (n) => String(n).padStart(2, "0");
const agora = new Date();
/** Hoje em `dd/mm` — a ordem que `date_day_first` abaixo declara. */
const HOJE = `${doisDigitos(agora.getDate())}/${doisDigitos(agora.getMonth() + 1)}`;
/**
 * Uma data futura, para a pílula cinza aparecer ao lado da vermelha na mesma
 * foto: é a comparação que ensina que o vermelho quer dizer "é hoje" e não
 * "tem data". Três dias à frente, que nunca cai no mesmo dia que `HOJE`.
 */
const daquiTresDias = new Date(agora.getTime() + 3 * 86400000);
const FUTURO = `${doisDigitos(daquiTresDias.getDate())}/${doisDigitos(daquiTresDias.getMonth() + 1)}`;

// ---------------------------------------------------------------------- dados
//
// Sete tarefas, e não seis nem oito: seis deixam um vazio de três linhas no pé da
// lista, e oito passam da altura da janela e a última sai cortada ao meio. Medido
// na janela de 360x480 que o `tauri.conf.json` declara.
const ms = (i) => 1755000000000 + i * 60000;
const abas = [
  { id: "trabalho", name: "Trabalho", created_at: ms(0) },
  { id: "casa", name: "Casa", created_at: ms(1) },
];
const tarefas = [
  { id: "1", title: "revisar o PR do updater", done: false, created_at: ms(2), tab_id: "trabalho" },
  { id: "2", title: `pagar o boleto da luz ${HOJE}`, done: false, created_at: ms(3), tab_id: "trabalho" },
  { id: "3", title: "escrever o changelog da 0.3.0", done: false, created_at: ms(4), tab_id: "trabalho" },
  { id: "4", title: `responder o Bruno ${FUTURO}`, done: false, created_at: ms(5), tab_id: "trabalho" },
  // Data no MEIO da frase, que é o caso em que o app não move nada para a coluna
  // da direita. Está na foto de propósito: é a regra que o README leva três
  // parágrafos para explicar, e aqui ela se explica ao lado do caso oposto.
  { id: "5", title: "retro do time 19/10 às 15h", done: false, created_at: ms(6), tab_id: "trabalho" },
  { id: "6", title: "responder o e-mail do contador", done: false, created_at: ms(7), tab_id: "trabalho" },
  // Concluída, para a foto mostrar o risco no texto e o rodapé com o contador e o
  // "Limpar concluídas". `created_at` bem à frente porque a ordem de exibição
  // manda as concluídas para o fim.
  { id: "7", title: "atualizar o cask do Homebrew", done: true, created_at: ms(20), tab_id: "trabalho" },
  // A segunda aba não aparece na foto, mas precisa ter conteúdo: uma aba vazia
  // mudaria o estado da faixa se alguém trocar de aba para tirar outra foto.
  { id: "8", title: "trocar a resistência do chuveiro", done: false, created_at: ms(8), tab_id: "casa" },
];

let ativa = "trabalho";
const acha = (id) => tarefas.find((t) => t.id === id);

/**
 * Os comandos que o front chama. Espelham `src/lib/todos.ts`, em memória.
 *
 * As mutações estão aqui — e não só as leituras da carga inicial — para a página
 * ser navegável à mão: dá para abrir a vitrine no navegador, criar e concluir
 * tarefas, e escolher o estado que a foto deve mostrar antes de capturar.
 */
const COMANDOS = {
  list_tabs: () => abas,
  get_active_tab: () => ativa,
  set_active_tab: ({ id }) => void (ativa = id),
  // Nenhum arquivo foi resgatado: a faixa de erro vermelha não pode aparecer na
  // foto de divulgação do app.
  get_startup_rescue: () => null,
  // Dia antes de mês, como o `HOJE` acima é montado.
  date_day_first: () => true,
  get_shortcut: () => ({
    accelerator: "control+alt+KeyT",
    label: "⌃⌥T",
    default_accelerator: "control+alt+KeyT",
    active: true,
    remembered: true,
  }),
  list_todos: ({ tabId }) => tarefas.filter((t) => t.tab_id === tabId),
  add_todo: ({ title, tabId }) => {
    const novo = { id: String(tarefas.length + 1), title, done: false, created_at: ms(90), tab_id: tabId };
    tarefas.push(novo);
    return novo;
  },
  toggle_todo: ({ id }) => {
    const t = acha(id);
    t.done = !t.done;
    return t;
  },
  rename_todo: ({ id, title }) => {
    const t = acha(id);
    t.title = title;
    return t;
  },
  delete_todo: ({ id }) => void tarefas.splice(tarefas.indexOf(acha(id)), 1),
  clear_completed: ({ tabId }) => {
    const fora = tarefas.filter((t) => t.tab_id === tabId && t.done);
    fora.forEach((t) => tarefas.splice(tarefas.indexOf(t), 1));
    return fora;
  },
  // Sem versão nova: o painel da engrenagem não aparece na foto, e uma
  // verificação de rede numa vitrine offline só teria como resultado um erro.
  check_update: () => null,
  "plugin:app|version": () => "0.2.0",
};

window.__TAURI_INTERNALS__ = {
  // **`metadata` é obrigatório, e falha antes de qualquer IPC.**
  // `getCurrentWindow()` (usado em `App.tsx` para foco e arrasto) lê
  // `metadata.currentWindow.label` de forma síncrona no primeiro render. Sem esta
  // linha o render lança `Cannot read properties of undefined` e a página fica
  // branca — sem erro no console que aponte para cá.
  metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  transformCallback: (cb) => cb,
  // Comandos de janela (esconder, focar, arrastar) resolvem calados: numa aba de
  // navegador não existe janela para mover, e o `catch` de quem chama trataria a
  // rejeição como erro de verdade, pintando a faixa vermelha na foto.
  invoke: (cmd, args) => Promise.resolve(COMANDOS[cmd] ? COMANDOS[cmd](args ?? {}) : undefined),
  convertFileSrc: (p) => p,
};
