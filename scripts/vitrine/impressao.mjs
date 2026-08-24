/* A impressão do código da interface: um resumo do conteúdo de `src/`.
 *
 * POR QUE ELA EXISTE. O espécime da folha (`assets/especime/`) é um retrato do que
 * `src/` monta. Se alguém mexe num componente e não roda `npm run vitrine`, a
 * página publicada passa a mostrar uma janela que o app não tem mais — e nada
 * quebra: ela só mente. Foi exatamente o que aconteceu entre o Adendo 13 e a
 * 0.4.0, quando `scripts/vitrine/stub.js` ficou no formato antigo, a extração
 * passou a falhar e o desenho publicado congelou numa versão anterior.
 *
 * POR QUE CONTEÚDO, E NÃO DATA DE MODIFICAÇÃO. A primeira versão desta trava
 * comparava `mtime`: o `src/` mais recente contra o `assets/especime/` mais antigo.
 * Funciona na máquina de quem desenvolve e é INÚTIL na CI — o git não guarda
 * `mtime`, então um checkout limpo dá a todo arquivo o horário do próprio
 * checkout, em ordem arbitrária. A trava viraria uma moeda ao ar, e `site.yml`
 * publica a página justamente a partir de um checkout limpo.
 *
 * Comparar o resumo do conteúdo funciona nos dois lugares, e responde à pergunta
 * certa: não "o que é mais novo", mas "este espécime foi extraído DESTE código".
 *
 * A ordem dos arquivos é fixada na varredura, porque `readdirSync` não promete
 * ordem entre sistemas — sem isso o mesmo `src/` daria resumos diferentes no mac e
 * no Linux, e a CI reprovaria todo mundo.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** O arquivo, dentro de `assets/especime/`, que guarda a impressão da extração. */
export const ARQUIVO_IMPRESSAO = "fonte.txt";

export function impressaoDaFonte(raizDoProjeto) {
  const raiz = join(raizDoProjeto, "src");
  const arquivos = [];

  const varrer = (dir) => {
    const itens = readdirSync(dir, { withFileTypes: true });
    itens.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const item of itens) {
      const cheio = join(dir, item.name);
      if (item.isDirectory()) varrer(cheio);
      else arquivos.push(cheio);
    }
  };
  varrer(raiz);

  const resumo = createHash("sha256");
  for (const arquivo of arquivos) {
    /* O caminho relativo entra no resumo junto do conteúdo: renomear um arquivo
       sem mudar uma linha dele também muda o que o app monta. `/` fixo para o
       resumo não depender do separador do sistema. */
    resumo.update(arquivo.slice(raiz.length).split("\\").join("/"));
    resumo.update("\0");
    resumo.update(readFileSync(arquivo));
    resumo.update("\0");
  }
  return resumo.digest("hex").slice(0, 16);
}
