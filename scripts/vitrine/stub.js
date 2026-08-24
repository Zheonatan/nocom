// O outro lado do IPC, falso, para a interface real do NoCom rodar num navegador
// e posar para as fotos do README (`assets/telas/`). Ver `captura.mjs` ao lado.
//
// Isto NÃO entra no app: nada em `src/` importa este arquivo, e ele só é servido
// pela entrada `scripts/vitrine/index.html`, que existe fora do `index.html` do
// build justamente para não viajar dentro de um instalador.

// A versão vem do manifesto, e não de um literal: ver `plugin:app|version` no
// fim deste arquivo.
import { version as VERSAO } from "../../package.json";

// -------------------------------------------------------------------- idioma
//
// O app escolhe o idioma por `navigator.languages` (ver `src/lib/i18n.ts`).
// Fixar aqui é o que faz o mesmo comando produzir o mesmo espécime em duas
// máquinas — sem isto ele sai no idioma do Chrome de quem regerou.
//
// **É `?lang=` e não uma constante, porque a folha tem duas línguas.** Enquanto o
// espécime era um PNG havia um só, em português, servido também para a página em
// inglês — a `alt` dela chegava a nomear as abas "Trabalho" e "Casa" em texto
// inglês. Extrair o DOM custa alguns kB por língua, então cada página passa a
// mostrar a janela na língua dela.
const IDIOMA = new URLSearchParams(location.search).get("lang") || "pt-BR";
Object.defineProperty(navigator, "languages", { get: () => [IDIOMA] });
Object.defineProperty(navigator, "language", { get: () => IDIOMA });

// --------------------------------------------------------------------- datas
//
// **A data de hoje é CALCULADA, e não escrita à mão.** O destaque vermelho é a
// coisa que o espécime mais precisa mostrar, e ele acende comparando a data do
// título com o dia de verdade (`src/hooks/use-today.ts`). Uma data fixa aqui
// funcionaria no dia em que foi escrita e sairia cinza em todos os outros.
//
// **Calcular aqui não basta para o espécime da folha, e isso é novo.** No app o
// `useToday` vira a data à meia-noite; num PNG ela congelava no dia da captura, e
// a folha publicada passou a marcar ANTEONTEM em vermelho enquanto a chamada 3
// prometia "vermelha no dia". Quem fecha esse buraco é `site/folha.js`, que
// reescreve estes dois números no navegador de quem visita — e o único motivo de
// isso ser possível é o espécime ter deixado de ser raster. Os `data-especime-*`
// que a extração marca são o contrato entre os dois lados.
const doisDigitos = (n) => String(n).padStart(2, "0");
/** A ordem de dia e mês acompanha a língua, como `date_day_first` declara abaixo. */
const DIA_PRIMEIRO = IDIOMA !== "en";
const escrever = (d) => {
  const dia = doisDigitos(d.getDate());
  const mes = doisDigitos(d.getMonth() + 1);
  return DIA_PRIMEIRO ? `${dia}/${mes}` : `${mes}/${dia}`;
};
const agora = new Date();
const HOJE = escrever(agora);
/**
 * Uma data futura, para a pílula cinza aparecer ao lado da vermelha no mesmo
 * espécime: é a comparação que ensina que o vermelho quer dizer "é hoje" e não
 * "tem data". Três dias à frente, que nunca cai no mesmo dia que `HOJE`.
 */
const FUTURO = escrever(new Date(agora.getTime() + 3 * 86400000));

// ---------------------------------------------------------------------- dados
//
// Sete tarefas, e não seis nem oito: seis deixam um vazio de três linhas no pé da
// lista, e oito passam da altura da janela e a última sai cortada ao meio. Medido
// na janela de 360x480 que o `tauri.conf.json` declara.
// **`repeat` é obrigatório em toda tarefa, e a falta dele não falha calada.**
// O Adendo 13 pôs `repeat: Repeat` no `Todo` (`src/lib/todos.ts`) e a linha guarda
// o glifo com `todo.repeat !== "none"` (`TodoRow.tsx`). Sem o campo, `undefined
// !== "none"` passa, `REPEAT_TITLE[undefined]` é `undefined`, e `t(undefined)`
// estoura dentro do render — a página fica branca e a captura morre em
// "a interface não terminou de montar". Foi o que aconteceu entre o Adendo 13 e
// este arquivo: o stub ficou no formato de antes e a vitrine parou de subir.
// **O conteúdo de exemplo acompanha a língua.** Enquanto era um PNG só, a página
// em inglês mostrava uma janela em português — e a `alt` dela nomeava as abas
// "Trabalho" e "Casa" em texto inglês, admitindo por escrito o que não dava para
// consertar sem dobrar o peso em raster. Com o espécime em DOM, a segunda língua
// custa alguns kB, então ela existe.
//
// As sete frases são as MESMAS tarefas traduzidas, e não um exemplo novo: cada
// linha existe pelo caso que ela mostra (data no fim, data no meio, concluída), e
// trocar o caso trocaria o que a chamada ao lado promete.
const CONTEUDO = {
  "pt-BR": {
    abas: ["Trabalho", "Casa"],
    tarefas: [
      "revisar o PR do updater",
      `pagar o boleto da luz ${HOJE}`,
      "escrever o changelog da 0.4.0",
      `responder o Bruno ${FUTURO}`,
      "retro do time 19/10 às 15h",
      "responder o e-mail do contador",
      "atualizar o cask do Homebrew",
    ],
    outraAba: "trocar a resistência do chuveiro",
  },
  en: {
    abas: ["Work", "Home"],
    tarefas: [
      "review the updater PR",
      `pay the electricity bill ${HOJE}`,
      "write the 0.4.0 changelog",
      `get back to Bruno ${FUTURO}`,
      "team retro 10/19 at 3pm",
      "reply to the accountant",
      "update the Homebrew cask",
    ],
    outraAba: "replace the shower heater element",
  },
};
const texto = CONTEUDO[IDIOMA] ?? CONTEUDO["pt-BR"];

const ms = (i) => 1755000000000 + i * 60000;
const abas = [
  { id: "trabalho", name: texto.abas[0], created_at: ms(0) },
  { id: "casa", name: texto.abas[1], created_at: ms(1) },
];
const tarefa = (t) => ({ done: false, repeat: "none", tab_id: "trabalho", ...t });
const tarefas = [
  // As cinco primeiras: título simples, data NO FIM (vai para a coluna da direita
  // e acende em vermelho por ser hoje), título simples, data no fim mas futura (a
  // pílula cinza que ensina o que o vermelho quer dizer), e — a quinta — data no
  // MEIO da frase, que é o caso em que o app não move nada. Esta última está aqui
  // de propósito: é a regra que o README leva três parágrafos para explicar, e no
  // espécime ela se explica ao lado do caso oposto.
  ...texto.tarefas.slice(0, 6).map((title, i) => tarefa({ id: String(i + 1), title, created_at: ms(i + 2) })),
  // Concluída, para o espécime mostrar o risco no texto e o rodapé com o contador
  // e o "Limpar concluídas". `created_at` bem à frente porque a ordem de exibição
  // manda as concluídas para o fim.
  tarefa({ id: "7", title: texto.tarefas[6], done: true, created_at: ms(20) }),
  // A segunda aba não aparece no espécime, mas precisa ter conteúdo: uma aba vazia
  // mudaria o estado da faixa se alguém trocar de aba para olhar outra coisa.
  tarefa({ id: "8", title: texto.outraAba, created_at: ms(8), tab_id: "casa" }),
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
  // A mesma ordem que `escrever` acima usou para montar `HOJE` e `FUTURO`. No app
  // ela vem do sistema operacional; aqui acompanha a língua, que é o que faz o
  // espécime inglês não mostrar 24/08 para quem lê month-first.
  date_day_first: () => DIA_PRIMEIRO,
  get_shortcut: () => ({
    accelerator: "control+alt+KeyT",
    label: "⌃⌥T",
    default_accelerator: "control+alt+KeyT",
    active: true,
    remembered: true,
  }),
  list_todos: ({ tabId }) => tarefas.filter((t) => t.tab_id === tabId),
  add_todo: ({ title, tabId }) => {
    const novo = tarefa({ id: String(tarefas.length + 1), title, created_at: ms(90), tab_id: tabId });
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
  // O desfazer devolve as tarefas como estavam, e o backend as regrava inteiras.
  restore_todos: ({ todos }) => {
    todos.forEach((t) => { if (!acha(t.id)) tarefas.push({ ...t }); });
    return todos;
  },

  // --------------------------------------------------------------- Adendo 13
  //
  // Estes seis existem porque o app os CHAMA, e não porque a foto os mostra.
  // `list_pending_counts` e `list_recurring` rodam na montagem; sem eles o
  // `invoke` devolvia `undefined`, e um `undefined` onde o App espera lista é a
  // mesma classe de falha que o `repeat` ausente lá em cima.
  set_repeat: ({ id, repeat }) => {
    const t = acha(id);
    t.repeat = repeat;
    return t;
  },
  move_todo: ({ id, tabId }) => {
    const t = acha(id);
    t.tab_id = tabId;
    return t;
  },
  /** Nenhuma tarefa da vitrine repete, então nada vence e nada é revivido. */
  list_recurring: () => tarefas.filter((t) => t.repeat !== "none"),
  revive_todos: ({ ids }) => {
    const voltam = ids.map(acha).filter(Boolean);
    voltam.forEach((t) => { t.done = false; });
    return voltam;
  },
  list_pending_counts: () =>
    abas.map((a) => ({
      tab_id: a.id,
      pending: tarefas.filter((t) => t.tab_id === a.id && !t.done).length,
    })),
  // Exportar e importar mexem no disco, que numa aba de navegador não existe.
  // Resolvem calados e sem efeito — a alternativa seria a faixa de erro
  // vermelha, que é o único estado que a vitrine não pode mostrar.
  export_data: () => undefined,
  import_data: () => ({ tabs: 0, todos: 0 }),

  // ------------------------------------------------------------------ as abas
  create_tab: ({ name }) => {
    const nova = { id: `aba-${abas.length + 1}`, name, created_at: ms(50 + abas.length) };
    abas.push(nova);
    return nova;
  },
  rename_tab: ({ id, name }) => {
    const a = abas.find((x) => x.id === id);
    a.name = name;
    return a;
  },
  close_tab: ({ id }) => {
    const a = abas.find((x) => x.id === id);
    const dentro = tarefas.filter((t) => t.tab_id === id);
    abas.splice(abas.indexOf(a), 1);
    dentro.forEach((t) => tarefas.splice(tarefas.indexOf(t), 1));
    if (ativa === id) ativa = abas[0].id;
    return { tab: a, todos: dentro };
  },
  restore_tab: ({ tab, todos }) => {
    abas.push(tab);
    todos.forEach((t) => tarefas.push({ ...t }));
    return abas;
  },

  // ------------------------------------------------------------ o atalho e o app
  set_shortcut: ({ accelerator }) => ({
    accelerator,
    label: "⌃⌥T",
    default_accelerator: "control+alt+KeyT",
    active: true,
    remembered: true,
  }),
  pause_shortcut: ({ paused }) => ({
    accelerator: "control+alt+KeyT",
    label: "⌃⌥T",
    default_accelerator: "control+alt+KeyT",
    active: !paused,
    remembered: true,
  }),
  // Sem versão nova: o painel da engrenagem não aparece na foto, e uma
  // verificação de rede numa vitrine offline só teria como resultado um erro.
  check_update: () => null,
  install_update: () => undefined,
  hide_window: () => undefined,
  // A versão instalada. Aparece SÓ no painel da engrenagem, que o espécime não
  // mostra — e vem do `package.json` em vez de escrita à mão, para a vitrine não
  // ser o único lugar do repositório que diz um número de versão antigo. Era o
  // que estava acontecendo, com a vitrine uma versão atrás do projeto.
  //
  // O texto acima não cita nenhum número de propósito: o `publicar.mjs` faz uma
  // troca GLOBAL da versão neste arquivo, então um número escrito aqui para
  // ilustrar o problema antigo seria reescrito junto, e a frase passaria a
  // descrever algo que nunca aconteceu.
  "plugin:app|version": () => VERSAO,
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
