/**
 * A única coisa que o app precisa lembrar sobre a primeira execução: se esta
 * pessoa já acrescentou uma tarefa alguma vez.
 *
 * **Mora no `localStorage`, e não no `todos.json`, de propósito.** O arquivo é
 * atravessado pelos comandos IPC do `CONTRACT.md`, e a fronteira entre backend e
 * frontend é rígida: um campo novo lá seria mudança de contrato antes de ser
 * mudança de código. Isto não é estado do produto — é estado da tela, sobre
 * quanto a tela ainda precisa explicar — e não vale reabrir o contrato por ele.
 * O preço assumido: quem troca de máquina vê o estado vazio de primeira vez de
 * novo, o que é exatamente o que se quer numa instalação nova.
 *
 * Uma chave só responde às duas perguntas que existem, e é por isso que ela
 * guarda "já acrescentou" em vez de "já vi o onboarding": o mesmo fato decide
 * qual estado vazio mostrar e se a faixa de boas-vindas ainda deve aparecer.
 */
const CHAVE = "minitodo.hasAddedTask";

/**
 * **Falha para o lado de não ensinar.** Uma webview com armazenamento bloqueado
 * faz `localStorage` lançar em vez de devolver `null`; se isso virasse "é a
 * primeira vez", o app mostraria o estado vazio de primeira execução em toda
 * abertura, para sempre, sem jeito de dispensar.
 *
 * Dizer "já acrescentou" no escuro degrada para o estado vazio normal — que
 * continua trazendo o atalho no `empty.hint` — e não tem laço nenhum. Ensinar de
 * menos uma vez é recuperável; ensinar a mesma coisa toda vez não é.
 */
export function hasAddedTask(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return true;
  }
}

/** Sem `catch` que reclame: não poder lembrar não é um erro que o usuário resolva. */
export function markTaskAdded(): void {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    // Armazenamento indisponível. `hasAddedTask` já devolve `true` nesse caso,
    // então o efeito é o mesmo que ter gravado.
  }
}
