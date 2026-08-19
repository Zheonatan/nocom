//! Gravação e leitura do estado local em JSON.
//!
//! Três coisas persistem — a lista de tarefas, a posição da janela e o atalho
//! global — e as três querem a mesma garantia: uma gravação interrompida não pode
//! deixar um arquivo pela metade, e um arquivo ilegível não pode derrubar o app. O
//! caminho é único aqui para elas não divergirem no dia em que uma delas mudar.

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;
use serde::Serialize;

/// O que a leitura encontrou. **Ausente e ilegível são casos DIFERENTES**, e
/// separá-los é o que impede a pior falha que este app pode ter.
///
/// Enquanto os dois eram o mesmo `None`, um `todos.json` que o desserializador
/// não entendia abria como instalação nova — lista vazia, nenhum aviso — e a
/// primeira tarefa digitada gravava por cima do arquivo, levando junto a única
/// cópia da lista do usuário. "Nenhum caminho pode apagar tarefa antiga" é a
/// falha declarada inaceitável no PRODUCT.md, e aquele era um caminho.
///
/// Com a distinção, quem chama pode fazer o que ausente não pede e ilegível
/// exige: guardar o arquivo de lado antes de escrever, e contar ao usuário.
pub enum Leitura<T> {
    Lido(T),
    /// Não há arquivo, ou ele está vazio. É a primeira execução.
    Ausente,
    /// O arquivo existe, tem conteúdo, e não foi entendido.
    Ilegivel,
}

/// Lê o que estiver no disco. Erro de leitura do sistema de arquivos conta como
/// ausente: sem conteúdo em mãos não há nada a preservar, e o app precisa abrir.
pub fn ler<T: DeserializeOwned>(arquivo: &Path) -> Leitura<T> {
    let Ok(conteudo) = fs::read_to_string(arquivo) else {
        return Leitura::Ausente;
    };
    // Um arquivo de zero byte é o que sobra de uma gravação que morreu antes de
    // escrever qualquer coisa. Não há nada nele para preservar nem para relatar.
    if conteudo.trim().is_empty() {
        return Leitura::Ausente;
    }
    match serde_json::from_str(&conteudo) {
        Ok(valor) => Leitura::Lido(valor),
        Err(_) => Leitura::Ilegivel,
    }
}

/// Igual, para quem não tem o que fazer com a diferença: a posição da janela e o
/// atalho global são descartáveis — um `janela.json` torto custa uma janela no
/// centro, e um `atalho.json` torto custa o atalho voltar ao padrão.
pub fn ler_opcional<T: DeserializeOwned>(arquivo: &Path) -> Option<T> {
    match ler(arquivo) {
        Leitura::Lido(valor) => Some(valor),
        _ => None,
    }
}

/// Move para o lado um arquivo que não foi entendido, **antes** de qualquer
/// gravação passar por cima dele, e devolve onde ele foi guardado.
///
/// O arquivo sai do caminho em vez de ser copiado: o original deixa de existir,
/// então a próxima mutação cria um novo em branco sem destruir nada. Um JSON que
/// este app não entende ainda pode ser lido por uma pessoa, ou por uma versão
/// futura — é a lista do usuário.
///
/// **Um backup existente nunca é sobrescrito.** Se já houver um, ele é o que tem
/// mais chance de conter a lista inteira; o caminho devolvido continua sendo o
/// dele, porque é para lá que o usuário precisa ser mandado.
pub fn preservar(arquivo: &Path) -> Option<PathBuf> {
    let destino = arquivo.with_extension("corrupt.json");
    if destino.exists() {
        return Some(destino);
    }
    fs::rename(arquivo, &destino).ok().map(|_| destino)
}

/// Grava num temporário do mesmo diretório e renomeia por cima. Um `write`
/// direto interrompido no meio deixa o JSON truncado, e um JSON truncado é
/// descartado na próxima abertura — o preço de uma gravação interrompida seria o
/// arquivo inteiro.
///
/// **O `sync_all` antes do rename é o que torna o rename uma garantia de fato.**
/// Renomear é atômico quanto ao *nome*, e não quanto ao conteúdo: sem o `fsync`,
/// o sistema pode ter publicado o nome novo com os blocos de dados ainda em
/// cache, e uma queda de energia nesse instante deixaria um `todos.json`
/// existente, válido para o sistema de arquivos e **vazio** — exatamente a perda
/// que o temporário existe para evitar.
pub fn gravar<T: Serialize>(arquivo: &Path, valor: &T) -> Result<(), String> {
    if let Some(pai) = arquivo.parent() {
        fs::create_dir_all(pai)
            .map_err(|erro| format!("Falha ao criar {}: {erro}", pai.display()))?;
    }
    let json = serde_json::to_string_pretty(valor)
        .map_err(|erro| format!("Falha ao serializar o estado: {erro}"))?;
    let temporario = temporario_de(arquivo);

    {
        let mut destino = File::create(&temporario)
            .map_err(|erro| format!("Falha ao gravar {}: {erro}", temporario.display()))?;
        destino
            .write_all(json.as_bytes())
            .map_err(|erro| format!("Falha ao gravar {}: {erro}", temporario.display()))?;
        destino
            .sync_all()
            .map_err(|erro| format!("Falha ao gravar {}: {erro}", temporario.display()))?;
    }

    fs::rename(&temporario, arquivo)
        .map_err(|erro| format!("Falha ao gravar {}: {erro}", arquivo.display()))?;

    // O diretório também é um arquivo, e a entrada nova nele quer o mesmo
    // tratamento. **Melhor esforço de propósito:** abrir um diretório para
    // sincronizar não é possível no Windows, e o dado já está em disco pelo
    // `sync_all` acima — o que se perde aqui é a durabilidade do *nome*, não a do
    // conteúdo, e falhar a gravação por causa disso seria trocar uma garantia
    // menor por um erro na tela.
    if let Some(pai) = arquivo.parent() {
        let _ = File::open(pai).and_then(|diretorio| diretorio.sync_all());
    }

    Ok(())
}

fn temporario_de(arquivo: &Path) -> PathBuf {
    let mut nome = arquivo.file_name().unwrap_or_default().to_os_string();
    nome.push(".tmp");
    arquivo.with_file_name(nome)
}
