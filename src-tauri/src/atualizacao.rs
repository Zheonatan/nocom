//! Atualização pelo próprio app (Adendo 10).
//!
//! O app pergunta ao GitHub qual é a versão mais recente, baixa o pacote assinado
//! e se substitui. O que desaparece do caminho do usuário não é o download — é o
//! resto: abrir o navegador, achar a release, escolher o arquivo certo para a
//! arquitetura certa, arrastar para `/Applications`, repetir o `xattr`.
//!
//! **Nenhuma verificação acontece sozinha.** A checagem é a única requisição de
//! rede que este app faz, e ela sai de um clique explícito no painel da
//! engrenagem — nunca da abertura, nunca de um temporizador. É a mesma promessa
//! do resto do produto (sem conta, sem nuvem, sem telemetria) mantida por
//! construção, e não por política: sem gesto, não há pacote saindo daqui nem
//! chegando.
//!
//! **A assinatura é o que torna isto seguro.** O `pubkey` do `tauri.conf.json` é
//! a metade pública de um par minisign, e o plugin recusa qualquer pacote que não
//! tenha sido assinado com a metade privada. Sem isso, um `latest.json` servido
//! por um intermediário seria execução remota de código com privilégio de
//! usuário: o endpoint é HTTPS, mas é a assinatura — e não o TLS — que decide o
//! que vira `/Applications/NoCom.app`.

use std::sync::Mutex;

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_updater::{Update, UpdaterExt};

/// A versão que está lá fora, quando existe uma mais nova que a instalada.
///
/// Espelhado em `lib/todos.ts` como `Update`. **Só a versão**, e é o suficiente:
/// o painel precisa nomear o que vai instalar antes de instalar — "0.3.0
/// disponível" seguido da instalação de outra coisa seria a tela mentindo sobre o
/// gesto que ela acabou de oferecer. As notas da release ficaram de fora porque o
/// corpo é escrito pelo workflow e é o mesmo em toda versão: um campo que a
/// interface não teria o que fazer com.
#[derive(Serialize, Clone)]
pub struct Disponivel {
    pub version: String,
}

/// A atualização encontrada, esperando o segundo gesto.
///
/// **Existe para que instalar seja a versão que foi anunciada.** Verificar e
/// instalar são dois cliques, e refazer a consulta no segundo abriria a janela
/// para instalar um pacote diferente do que o painel nomeou — improvável, mas é
/// exatamente o tipo de divergência que o Princípio 5 não deixa passar em
/// silêncio. Guardar o resultado também poupa a segunda requisição.
#[derive(Default)]
pub struct Pendente(Mutex<Option<Update>>);

impl Pendente {
    pub fn nova() -> Self {
        Self(Mutex::new(None))
    }

    fn guardar(&self, atualizacao: Update) {
        // Envenenamento do mutex não derruba nada: o preço é o botão de instalar
        // pedir uma nova verificação, e o mesmo `let ... else` dos vizinhos
        // (`janela.rs`, `atalho.rs`) mantém isso sendo uma inconveniência.
        let Ok(mut guardada) = self.0.lock() else {
            return;
        };
        *guardada = Some(atualizacao);
    }

    /// Tira a atualização de dentro do estado. **Tira, e não empresta**: um
    /// `MutexGuard` vivo atravessando o `await` do download travaria qualquer
    /// verificação seguinte pelo tempo inteiro da transferência.
    fn tomar(&self) -> Option<Update> {
        self.0.lock().ok()?.take()
    }
}

/// Pergunta ao endpoint se existe versão mais nova que a instalada.
///
/// `Ok(None)` é a resposta boa e comum: o app já está na última. O erro é para
/// quando a pergunta não pôde ser feita — sem rede, endpoint fora, `latest.json`
/// sem entrada para esta plataforma — e a frase que o usuário lê diz que **nada
/// mudou**, porque nada mudou mesmo.
pub async fn verificar(app: &AppHandle, pendente: &Pendente) -> Result<Option<Disponivel>, String> {
    let atualizador = app
        .updater()
        .map_err(|erro| format!("não foi possível preparar a verificação: {erro}"))?;

    // A comparação de versões é do plugin, contra a `version` do `tauri.conf.json`
    // embutida no binário. Uma versão publicada MENOR que a instalada não vira
    // "atualização" — quem compilou do código-fonte não é empurrado para trás.
    let Some(atualizacao) = atualizador
        .check()
        .await
        .map_err(|erro| format!("a verificação falhou: {erro}"))?
    else {
        return Ok(None);
    };

    let disponivel = Disponivel {
        version: atualizacao.version.clone(),
    };
    pendente.guardar(atualizacao);
    Ok(Some(disponivel))
}

/// Baixa, valida a assinatura, substitui o app e reinicia.
///
/// **Só devolve em caso de falha.** No caminho de sucesso o processo é trocado
/// aqui dentro, e a Promise do lado do JS nunca resolve — o que o usuário vê é a
/// janela sumir e voltar já na versão nova. É a razão de o painel não ter estado
/// de "instalado com sucesso": ele não estaria vivo para mostrá-lo.
///
/// A falha, quando vem, não deixa meio app instalado: o plugin baixa o pacote
/// inteiro e valida a assinatura **antes** de tocar no que está em disco.
pub async fn instalar(app: &AppHandle, pendente: &Pendente) -> Result<(), String> {
    let Some(atualizacao) = pendente.tomar() else {
        // O painel só oferece o botão depois de uma verificação com resposta, então
        // chegar aqui vazio é o caso que não deveria existir. Ainda assim é uma
        // frase, e não um `unwrap`: pedir para verificar de novo é um gesto, e
        // derrubar a janela do usuário por causa disto seria a resposta errada.
        return Err("nenhuma atualização verificada nesta sessão".to_string());
    };

    atualizacao
        .download_and_install(
            // Sem barra de progresso: o pacote deste app tem alguns megabytes e o
            // painel tem 360px de largura. A frase "Baixando…" cobre a espera
            // inteira, e uma barra custaria um canal de eventos que não existe em
            // nenhum outro lugar deste código.
            |_baixado, _total| {},
            || {},
        )
        .await
        .map_err(|erro| format!("a instalação falhou: {erro}"))?;

    // `restart()` é do próprio Tauri e não volta: encerra este processo e sobe o
    // binário novo. É o caminho do macOS e do Linux, onde o plugin trocou os
    // arquivos e devolveu o controle.
    //
    // **No Windows esta linha não é alcançada.** Lá a instalação é um instalador
    // separado: o plugin dispara o `-setup.exe` e chama `exit(0)` na hora, porque
    // um processo vivo não pode ser sobrescrito. Quem traz o app de volta é o
    // próprio instalador, pelo `/R` que o plugin passa junto — o efeito para o
    // usuário é o mesmo, e é por isso que o caminho de sucesso não tem resposta a
    // escrever na tela em nenhum dos três sistemas.
    app.restart();
}
