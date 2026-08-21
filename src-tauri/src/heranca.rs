//! Adoção dos arquivos deixados pela pasta de dados anterior ao nome NoCom.
//!
//! Até a 0.1.0 o app se chamava "Mini To-Do" e o identificador do bundle era
//! `com.minitodo.app`. É o identificador que nomeia a pasta de dados, então
//! trocar o nome do app muda o endereço de `todos.json`, `janela.json` e
//! `atalho.json` — e quem atualizasse abriria o app **vazio**, com a lista
//! inteira intacta num diretório que ele não tem motivo nenhum para procurar.
//!
//! "Nenhum caminho pode apagar tarefa antiga" é a única falha declarada
//! inaceitável no PRODUCT.md, e o Princípio 5 proíbe a confusão que sobraria: um
//! app que abre vazio é indistinguível de um app que perdeu tudo. Este módulo
//! fecha esse caminho, e é a única razão de ele existir — um renomeio não pode
//! custar a lista de ninguém.
//!
//! **Copia, nunca move, nunca sobrescreve.** As três regras são o que torna a
//! migração segura de rodar em toda abertura:
//!
//! - *Copia* em vez de mover porque a pasta antiga é a única cópia da lista
//!   enquanto a nova não existe. Se a energia cair no meio, o original continua
//!   lá — uma migração pela metade não é uma perda, é uma tentativa perdida.
//! - *Nunca sobrescreve* porque o arquivo novo, quando existe, é o mais recente
//!   por definição: o usuário já usou a versão nova. A pasta antiga a partir daí
//!   é história, e história não vence o presente.
//!
//! **Falha silenciosa, de propósito.** Contar ao usuário exigiria um sinal novo
//! atravessando a fronteira IPC, e o PRODUCT.md manda isso entrar no
//! `CONTRACT.md` antes do código. O silêncio custa pouco justamente porque nada
//! é apagado: uma cópia que falhou deixa a pasta antiga completa, e o app abre
//! vazio com a lista recuperável à mão.

use std::fs;
use std::path::{Path, PathBuf};

/// O identificador do bundle até a 0.1.0. Fica escrito por extenso e não montado
/// a partir de constante nenhuma: é um endereço no disco de outra versão, e o dia
/// em que o nome do app mudar de novo ele **não** pode mudar junto.
const PASTA_ANTIGA: &str = "com.minitodo.app";

/// Os três arquivos de estado, na ordem de importância. A lista é explícita para
/// não arrastar o que não é estado — um `todos.corrupt.json` de resgate pertence
/// à pasta onde foi criado, e um `.tmp` de gravação interrompida não pertence a
/// lugar nenhum.
const ARQUIVOS: [&str; 3] = ["todos.json", "janela.json", "atalho.json"];

/// Traz para `nova` o que a pasta antiga tiver e a nova ainda não. Roda antes de
/// qualquer `abrir`, porque depois já seria tarde: a primeira leitura de um
/// arquivo ausente é o que define o app como instalação nova.
pub fn adotar(nova: &Path) {
    let Some(antiga) = pasta_antiga(nova) else {
        return;
    };
    if !antiga.is_dir() {
        return;
    }

    for nome in ARQUIVOS {
        let origem = antiga.join(nome);
        let destino = nova.join(nome);
        if !origem.is_file() || destino.exists() {
            continue;
        }
        // Só aqui, e não na entrada: sem nada a copiar, criar a pasta nova seria
        // deixar um diretório vazio no disco de quem nunca teve a versão antiga.
        if fs::create_dir_all(nova).is_err() {
            return;
        }
        let _ = fs::copy(&origem, &destino);
    }
}

/// Onde a pasta antiga estaria: irmã da nova, porque as duas são
/// `<base do sistema>/<identificador>` e só o último trecho mudou.
///
/// Devolve `None` quando as duas seriam a mesma — o que acontece se alguém rodar
/// isto com o identificador antigo ainda em vigor. Copiar uma pasta sobre si
/// mesma não é destrutivo, mas o `is_file`/`exists` de cada arquivo já daria a
/// resposta errada, e uma guarda vale mais que um comentário.
fn pasta_antiga(nova: &Path) -> Option<PathBuf> {
    let antiga = nova.parent()?.join(PASTA_ANTIGA);
    (antiga != nova).then_some(antiga)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Cada teste ganha um par de pastas irmãs, como as de verdade.
    fn pastas(nome: &str) -> (PathBuf, PathBuf) {
        let base =
            std::env::temp_dir().join(format!("nocom-heranca-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        (base.join(PASTA_ANTIGA), base.join("com.nocom.app"))
    }

    fn escrever(pasta: &Path, nome: &str, conteudo: &str) {
        fs::create_dir_all(pasta).expect("criar pasta");
        fs::write(pasta.join(nome), conteudo).expect("escrever");
    }

    fn ler(pasta: &Path, nome: &str) -> Option<String> {
        fs::read_to_string(pasta.join(nome)).ok()
    }

    /// **O teste que justifica o módulo.** Quem atualizou do nome antigo abre o
    /// app e encontra as tarefas dele.
    #[test]
    fn tarefas_da_pasta_antiga_atravessam_o_renomeio() {
        let (antiga, nova) = pastas("tarefas");
        escrever(&antiga, "todos.json", r#"{"abas":[]}"#);

        adotar(&nova);

        assert_eq!(ler(&nova, "todos.json").as_deref(), Some(r#"{"abas":[]}"#));
        // A origem continua onde estava: é cópia, não mudança de lugar.
        assert!(antiga.join("todos.json").is_file());
    }

    /// Os três arquivos, não só as tarefas — a posição da janela e o atalho
    /// escolhido também são coisas que o usuário configurou.
    #[test]
    fn os_tres_arquivos_de_estado_vem_juntos() {
        let (antiga, nova) = pastas("tres");
        escrever(&antiga, "todos.json", "1");
        escrever(&antiga, "janela.json", "2");
        escrever(&antiga, "atalho.json", "3");

        adotar(&nova);

        assert_eq!(ler(&nova, "todos.json").as_deref(), Some("1"));
        assert_eq!(ler(&nova, "janela.json").as_deref(), Some("2"));
        assert_eq!(ler(&nova, "atalho.json").as_deref(), Some("3"));
    }

    /// A regra que impede a migração de virar uma perda: quem já usou a versão
    /// nova tem o arquivo mais recente, e ele não é tocado. Sem esta guarda, toda
    /// abertura sobrescreveria o trabalho do dia com a lista de meses atrás.
    #[test]
    fn arquivo_novo_nunca_e_sobrescrito_pelo_antigo() {
        let (antiga, nova) = pastas("presente");
        escrever(&antiga, "todos.json", "passado");
        escrever(&nova, "todos.json", "presente");

        adotar(&nova);

        assert_eq!(ler(&nova, "todos.json").as_deref(), Some("presente"));
    }

    /// Instalação nova de verdade: nada a adotar, e nenhuma pasta criada por
    /// nada. O app decide "primeira execução" pela ausência do arquivo, e um
    /// diretório vazio plantado aqui não muda essa resposta — mas sujar o disco
    /// de quem nunca teve a versão antiga não tem defesa.
    #[test]
    fn sem_pasta_antiga_nao_deixa_rastro() {
        let (_antiga, nova) = pastas("limpa");

        adotar(&nova);

        assert!(!nova.exists());
    }

    /// O que não é estado fica onde está. Um resgate de arquivo ilegível é
    /// evidência de um problema daquela instalação, e arrastá-lo para a pasta
    /// nova faria o app novo relatar um susto que não foi dele.
    #[test]
    fn arquivos_fora_da_lista_nao_sao_arrastados() {
        let (antiga, nova) = pastas("extras");
        escrever(&antiga, "todos.json", "ok");
        escrever(&antiga, "todos.corrupt.json", "lixo");
        escrever(&antiga, "todos.json.tmp", "meio");

        adotar(&nova);

        assert!(nova.join("todos.json").is_file());
        assert!(!nova.join("todos.corrupt.json").exists());
        assert!(!nova.join("todos.json.tmp").exists());
    }

    /// Idempotência: a função roda em toda abertura, e a segunda vez não pode
    /// desfazer nem duplicar o que a primeira fez.
    #[test]
    fn adotar_duas_vezes_e_o_mesmo_que_uma() {
        let (antiga, nova) = pastas("idempotente");
        escrever(&antiga, "todos.json", "uma vez");

        adotar(&nova);
        fs::write(nova.join("todos.json"), "editado depois").expect("editar");
        adotar(&nova);

        assert_eq!(ler(&nova, "todos.json").as_deref(), Some("editado depois"));
    }

    /// A guarda do `pasta_antiga`: com o identificador antigo ainda em vigor, a
    /// origem e o destino seriam a mesma pasta, e a função não tem o que fazer.
    #[test]
    fn pasta_igual_a_si_mesma_e_recusada() {
        let base = std::env::temp_dir().join(format!("nocom-heranca-igual-{}", std::process::id()));
        assert_eq!(pasta_antiga(&base.join(PASTA_ANTIGA)), None);
    }
}
