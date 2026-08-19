//! Gravação e leitura do estado local em JSON.
//!
//! Duas coisas persistem — a lista de tarefas e a posição da janela — e as duas
//! querem a mesma garantia: uma gravação interrompida não pode deixar um arquivo
//! pela metade, e um arquivo ilegível não pode derrubar o app. O caminho é único
//! aqui para as duas não divergirem no dia em que uma delas mudar.

use std::fs;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;
use serde::Serialize;

/// Lê o que estiver no disco, ou `None`. **Ausente e corrompido são o mesmo
/// caso**: estado local é descartável, e recusar-se a abrir por causa de um JSON
/// truncado deixaria o usuário sem app.
pub fn ler<T: DeserializeOwned>(arquivo: &Path) -> Option<T> {
    let conteudo = fs::read_to_string(arquivo).ok()?;
    serde_json::from_str(&conteudo).ok()
}

/// Grava num temporário do mesmo diretório e renomeia por cima. Um `write`
/// direto interrompido no meio deixa o JSON truncado, e um JSON truncado é
/// descartado na próxima abertura — o preço de uma gravação interrompida seria o
/// arquivo inteiro.
pub fn gravar<T: Serialize>(arquivo: &Path, valor: &T) -> Result<(), String> {
    if let Some(pai) = arquivo.parent() {
        fs::create_dir_all(pai).map_err(|erro| format!("Falha ao criar {}: {erro}", pai.display()))?;
    }
    let json = serde_json::to_string_pretty(valor)
        .map_err(|erro| format!("Falha ao serializar o estado: {erro}"))?;
    let temporario = temporario_de(arquivo);
    fs::write(&temporario, json)
        .map_err(|erro| format!("Falha ao gravar {}: {erro}", temporario.display()))?;
    fs::rename(&temporario, arquivo)
        .map_err(|erro| format!("Falha ao gravar {}: {erro}", arquivo.display()))
}

fn temporario_de(arquivo: &Path) -> PathBuf {
    let mut nome = arquivo.file_name().unwrap_or_default().to_os_string();
    nome.push(".tmp");
    arquivo.with_file_name(nome)
}
