//! A combinação que mostra e esconde a janela — **escolhida pelo usuário**.
//!
//! Até o Adendo 8 isto era uma constante (`⌃⌥T`), escolhida por eliminação contra
//! os atalhos do macOS. A escolha por eliminação continua sendo o **padrão**, e é
//! o que vale em toda instalação nova; o que mudou é que ela deixou de ser a
//! única possível. Um atalho global disputa teclas com o sistema inteiro do
//! usuário, e quem sabe o que já está ocupado na máquina dele é ele.
//!
//! Fica em arquivo próprio (`atalho.json`), ao lado de `todos.json` e de
//! `janela.json` e nunca dentro deles: são estados com tempos de vida e riscos
//! diferentes, e um JSON de tarefas truncado não pode levar junto o atalho.
//!
//! **O rótulo para os olhos nasce aqui, e só aqui.** Antes havia duas versões da
//! mesma frase — `ATALHO_VISIVEL` no Rust, para o tray, e `TOGGLE_SHORTCUT` no
//! TypeScript, para a janela — e as duas eram constantes que alguém tinha que
//! lembrar de trocar juntas. Com a combinação virando dado, duas escritas do
//! mesmo dado divergem no primeiro atalho que não for `⌃⌥T`: o menu do tray
//! anunciaria uma tecla e a janela outra. Então o backend descreve, e o frontend
//! mostra o que recebeu.

use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

use crate::persistencia;

/// O padrão de fábrica: `⌃⌥T`, a combinação do Adendo 2.
///
/// Escrita em `Code` (`KeyT`) e não em letra (`T`) porque é a forma que atravessa
/// o IPC: o `event.code` do teclado da webview fala esta língua, e o parser do
/// plugin entende as duas — usar uma só evita duas grafias para a mesma tecla.
///
/// A justificativa da escolha continua valendo e está no Adendo 2: `⌘Space` é
/// Spotlight, `⌃Space` alterna fonte de entrada, `⌘⇧T` reabre aba do navegador —
/// e um atalho **global** vence o do app em foco, então sequestrá-lo tiraria do
/// usuário uma função que ele usa o dia inteiro. O que o Adendo 9 acrescenta é
/// que isso é o argumento para o **padrão**, e não uma proibição para a escolha
/// de quem está na frente da máquina.
///
/// **No Linux o mesmo método dá outro resultado (Adendo 12):** `Ctrl+Alt+T` abre
/// terminal em GNOME, KDE e Ubuntu há mais de uma década — o padrão de fábrica
/// chegava garantidamente morto na plataforma inteira, e o estado vazio o ensinava
/// como se valesse. `Ctrl+Alt+Space` não é reservado por nenhum dos grandes
/// ambientes. Quem muda esta constante muda junto o `DEFAULT_SHORTCUT_LABEL` de
/// `lib/shortcut.ts`, que é a mesma decisão do outro lado da fronteira.
#[cfg(target_os = "linux")]
pub const PADRAO: &str = "Control+Alt+Space";
#[cfg(not(target_os = "linux"))]
pub const PADRAO: &str = "Control+Alt+KeyT";

/// O que vai para o disco. Objeto, e não a string crua: um campo com nome sobrevive
/// a um segundo campo no futuro, e um JSON que é só `"control+alt+KeyT"` não.
#[derive(Serialize, Deserialize)]
struct Gravado {
    accelerator: String,
}

/// O atalho como o frontend precisa dele.
///
/// Campos em inglês porque cruzam o IPC, como `Todo` e `Tab` — o contrato do lado
/// do JS é escrito nesta língua desde o começo.
#[derive(Serialize, Clone, PartialEq, Eq, Debug)]
pub struct Descricao {
    /// A combinação canônica (`control+alt+KeyT`). É o que volta em `set_shortcut`
    /// e o que o frontend compara com `default_accelerator` para saber se ainda
    /// está no padrão — não é texto de tela.
    pub accelerator: String,
    /// A mesma combinação para os olhos, na convenção do sistema (`⌃⌥T` no Mac,
    /// `Ctrl+Alt+T` fora dele). É o único texto de atalho que a interface mostra.
    pub label: String,
    /// O padrão de fábrica, para o frontend poder oferecer "restaurar" sem ter uma
    /// segunda cópia da constante.
    pub default_accelerator: String,
    /// O sistema aceitou o registro? `false` significa que a combinação **não faz
    /// nada** — outro aplicativo a tomou — e é a diferença entre a janela ensinar
    /// um atalho que funciona e ensinar um que não funciona.
    pub active: bool,
    /// A escolha chegou ao disco? `false` é o caso sutil: o atalho vale nesta
    /// execução e a próxima abertura volta ao anterior. A mensagem na tela diz
    /// exatamente isso, como a de `set_active_tab` faz com a aba.
    pub remembered: bool,
}

pub struct Atalho {
    estado: Mutex<Estado>,
    arquivo: PathBuf,
}

struct Estado {
    atual: Shortcut,
    valendo: bool,
    gravado: bool,
    /// O atalho está **suspenso** porque o painel está capturando teclas.
    ///
    /// Um atalho global é consumido pelo sistema antes de chegar à webview: com
    /// `⌃⌥T` registrado, apertar `⌃⌥T` no capturador esconderia a janela em vez de
    /// escolher a combinação — o painel não conseguiria nem confirmar a tecla que já
    /// está valendo. Enquanto ele captura, o registro é soltado e devolvido depois.
    ///
    /// É separado de `valendo` de propósito: suspenso não é "não está valendo". A
    /// janela avisa quando a combinação foi tomada por outro aplicativo, e um aviso
    /// desses aparecendo por dois segundos a cada captura seria mentira.
    pausado: bool,
}

/// O que o sistema tem na mão **agora** — o que quem registra e quem solta precisa
/// saber, e que a `Descricao` não diz.
pub struct Situacao {
    pub combinacao: Shortcut,
    /// O sistema está com esta combinação registrada neste instante. `false` tanto
    /// para "outro aplicativo a tomou" quanto para "o painel a suspendeu".
    pub registrada: bool,
    /// A combinação é a que deve valer quando nada estiver suspenso.
    pub valendo: bool,
}

impl Atalho {
    /// Lê a escolha do disco, ou fica no padrão.
    ///
    /// **Um `atalho.json` que não é entendido cai no padrão em silêncio**, ao
    /// contrário do `todos.json` (que é preservado e relatado). A diferença é o que
    /// se perde: ali é a lista do usuário, aqui é uma preferência de uma linha que
    /// ele refaz em dois segundos pela engrenagem. O que não pode acontecer é o app
    /// subir sem atalho nenhum por causa de um arquivo torto.
    pub fn abrir(arquivo: PathBuf) -> Self {
        let escolhido = persistencia::ler_opcional::<Gravado>(&arquivo)
            .and_then(|gravado| interpretar(&gravado.accelerator).ok());
        // O padrão é constante do código e é validado pelos testes: se ele não
        // interpretar, é bug de digitação nossa, e `expect` aqui grita no primeiro
        // teste em vez de deixar o app abrir sem via de volta pelo teclado.
        let atual = escolhido.unwrap_or_else(|| {
            interpretar(PADRAO).expect("o padrão precisa ser uma combinação válida")
        });
        Self {
            estado: Mutex::new(Estado {
                atual,
                // Otimista até o registro dizer o contrário: quem sabe se o sistema
                // aceitou é `montar_atalho_global`, que roda depois disto.
                valendo: true,
                gravado: true,
                pausado: false,
            }),
            arquivo,
        }
    }

    pub fn atual(&self) -> Shortcut {
        // Cadeado envenenado não pode deixar o app sem atalho conhecido: o padrão é
        // a resposta certa para "não sei qual é".
        match self.estado.lock() {
            Ok(estado) => estado.atual,
            Err(_) => interpretar(PADRAO).expect("o padrão precisa ser uma combinação válida"),
        }
    }

    /// Guarda a escolha nova e a manda para o disco. O registro no sistema é de
    /// quem chama — este módulo não conhece o `AppHandle`.
    pub fn definir(&self, novo: Shortcut) {
        let Ok(mut estado) = self.estado.lock() else {
            return;
        };
        estado.atual = novo;
        estado.valendo = true;
        // Quem chama já registrou a combinação nova, então a suspensão do painel
        // terminou aqui: deixá-la de pé faria o `retomar` seguinte registrar de novo
        // o que já está registrado, e o sistema devolveria um erro que a tela leria
        // como "a combinação foi tomada".
        estado.pausado = false;
        estado.gravado = persistencia::gravar(
            &self.arquivo,
            &Gravado {
                accelerator: novo.into_string(),
            },
        )
        .is_ok();
    }

    /// O que o sistema respondeu ao registro. Chamado na abertura e a cada troca:
    /// é o que faz a janela poder avisar que a combinação não está valendo.
    pub fn marcar(&self, valendo: bool) {
        if let Ok(mut estado) = self.estado.lock() {
            estado.valendo = valendo;
        }
    }

    /// Marca que o registro foi soltado para o painel poder ouvir as teclas.
    pub fn pausar(&self) {
        if let Ok(mut estado) = self.estado.lock() {
            estado.pausado = true;
        }
    }

    /// Marca o fim da suspensão. Quem devolve o registro ao sistema é quem chama —
    /// este módulo não conhece o `AppHandle`.
    pub fn retomar(&self) {
        if let Ok(mut estado) = self.estado.lock() {
            estado.pausado = false;
        }
    }

    pub fn situacao(&self) -> Situacao {
        match self.estado.lock() {
            Ok(estado) => Situacao {
                combinacao: estado.atual,
                registrada: estado.valendo && !estado.pausado,
                valendo: estado.valendo,
            },
            Err(_) => Situacao {
                combinacao: interpretar(PADRAO)
                    .expect("o padrão precisa ser uma combinação válida"),
                registrada: false,
                valendo: false,
            },
        }
    }

    pub fn descrever(&self) -> Descricao {
        let (atual, valendo, gravado) = match self.estado.lock() {
            Ok(estado) => (estado.atual, estado.valendo, estado.gravado),
            Err(_) => (
                interpretar(PADRAO).expect("o padrão precisa ser uma combinação válida"),
                false,
                false,
            ),
        };
        Descricao {
            accelerator: atual.into_string(),
            label: etiqueta(&atual),
            default_accelerator: interpretar(PADRAO)
                .expect("o padrão precisa ser uma combinação válida")
                .into_string(),
            active: valendo,
            remembered: gravado,
        }
    }
}

/// Lê uma combinação escrita e diz por que ela não serve, quando não serve.
///
/// **A única regra que sobra é ter modificador.** Uma tecla sozinha registrada
/// globalmente sequestra a digitação normal do sistema — apertar `T` em qualquer
/// campo de qualquer aplicativo mostraria o To-Do —, e `⇧` com uma letra é a mesma
/// coisa com maiúscula. Então é exigido pelo menos um de `⌃`, `⌥` ou `⌘`.
///
/// **`⌘` passa, e isso é o Adendo 9 relaxando o Adendo 2.** A proibição continua
/// escrita, mas onde ela nasceu: no argumento do padrão. Uma combinação com `⌘`
/// escolhida pelo usuário rouba do navegador em foco a tecla equivalente, e a tela
/// avisa isso na hora — mas quem decide o que vale mais na máquina dele é ele, e
/// recusar a escolha seria decidir por cima de quem sabe mais.
///
/// A frase de erro é crua e em português, como todo `Err` deste backend desde o
/// Adendo 6: ela vai para o `title` do aviso, e o texto que o usuário lê é
/// escolhido pelo frontend.
pub fn interpretar(texto: &str) -> Result<Shortcut, String> {
    let atalho = Shortcut::from_str(texto)
        .map_err(|erro| format!("'{texto}' não é uma combinação válida: {erro}"))?;
    if !atalho
        .mods
        .intersects(Modifiers::CONTROL | Modifiers::ALT | Modifiers::SUPER)
    {
        return Err(format!(
            "'{texto}' não tem Control, Option/Alt nem Command: uma tecla sem esses \
             modificadores registrada globalmente sequestraria a digitação normal"
        ));
    }
    Ok(atalho)
}

/// A combinação escrita para os olhos, na convenção do sistema.
///
/// O macOS escreve modificadores como símbolos e na ordem `⌃⌥⇧⌘` — é o que todo
/// menu do sistema faz, e "Control+Option+T" numa tela de Mac destoaria de tudo em
/// volta. Windows e Linux escrevem por extenso, e um `⌃⌥T` ali não significa nada.
pub fn etiqueta(atalho: &Shortcut) -> String {
    let mods = atalho.mods;
    let mut texto = String::new();

    #[cfg(target_os = "macos")]
    {
        // A ordem é a da Apple (`⌃⌥⇧⌘`), e não a de quem apertou: um mesmo atalho
        // escrito em duas ordens diferentes parece dois atalhos.
        if mods.contains(Modifiers::CONTROL) {
            texto.push('\u{2303}');
        }
        if mods.contains(Modifiers::ALT) {
            texto.push('\u{2325}');
        }
        if mods.contains(Modifiers::SHIFT) {
            texto.push('\u{21E7}');
        }
        if mods.contains(Modifiers::SUPER) {
            texto.push('\u{2318}');
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        if mods.contains(Modifiers::CONTROL) {
            texto.push_str("Ctrl+");
        }
        if mods.contains(Modifiers::ALT) {
            texto.push_str("Alt+");
        }
        if mods.contains(Modifiers::SHIFT) {
            texto.push_str("Shift+");
        }
        if mods.contains(Modifiers::SUPER) {
            // "Win" no Windows e "Super" no Linux: é o nome que cada sistema dá à
            // mesma tecla, e o teclado do usuário tem um deles escrito nela.
            #[cfg(target_os = "windows")]
            texto.push_str("Win+");
            #[cfg(not(target_os = "windows"))]
            texto.push_str("Super+");
        }
    }

    texto.push_str(&nome_da_tecla(atalho.key));
    texto
}

/// O nome da tecla principal, curto como num menu.
///
/// Sai do `Display` do `Code` (que fala "KeyT", "Digit1", "Space", "F5") e corta o
/// prefixo técnico: ninguém tem "KeyT" escrito no teclado. O que não tem nome
/// melhor sai como o `Code` o escreve — é feio para `NumpadDecimal` e é honesto
/// para todo o resto, inclusive para teclas que este `match` ainda não conhece.
fn nome_da_tecla(tecla: Code) -> String {
    let bruto = tecla.to_string();
    if let Some(letra) = bruto.strip_prefix("Key") {
        return letra.to_owned();
    }
    if let Some(digito) = bruto.strip_prefix("Digit") {
        return digito.to_owned();
    }
    match tecla {
        // As setas são glifo em qualquer sistema: é assim que elas aparecem no
        // teclado, e escrever "ArrowUp" seria a única palavra técnica da tela.
        Code::ArrowUp => "\u{2191}".to_owned(),
        Code::ArrowDown => "\u{2193}".to_owned(),
        Code::ArrowLeft => "\u{2190}".to_owned(),
        Code::ArrowRight => "\u{2192}".to_owned(),
        Code::Escape => "Esc".to_owned(),
        _ => bruto,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn padrao() -> Shortcut {
        interpretar(PADRAO).expect("o padrão precisa ser uma combinação válida")
    }

    /// A constante é lida por um parser, então um erro de digitação nela só
    /// apareceria em execução — e apareceria como "o atalho não faz nada", que é
    /// exatamente o sintoma difícil de diagnosticar.
    ///
    /// O padrão é por plataforma desde o Adendo 12: `Ctrl+Alt+T` é o atalho
    /// canônico de terminal no Linux, e um padrão morto de fábrica lá era o
    /// defeito que o adendo fechou.
    #[test]
    fn o_padrao_e_o_da_plataforma() {
        #[cfg(target_os = "linux")]
        assert_eq!(
            padrao(),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space)
        );
        #[cfg(not(target_os = "linux"))]
        assert_eq!(
            padrao(),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyT)
        );
    }

    /// **O argumento do Adendo 2, agora prendendo só o padrão.** Um atalho global
    /// vence o do app em foco, então o padrão de fábrica não pode chegar roubando
    /// `⌘⇧T` do navegador de ninguém. Quem escolhe isso de propósito é o usuário.
    #[test]
    fn o_padrao_nao_sequestra_combinacoes_de_command() {
        assert!(
            !padrao().mods.contains(Modifiers::SUPER),
            "o padrão com Command roubaria atalhos do app em foco pelo sistema inteiro"
        );
    }

    /// Sem `⌃`, `⌥` ou `⌘` a tecla fica capturada globalmente: digitar "t" em
    /// qualquer lugar abriria o To-Do. `⇧` sozinho é a mesma coisa com maiúscula.
    #[test]
    fn combinacao_sem_modificador_de_verdade_e_recusada() {
        for texto in ["KeyT", "T", "shift+KeyT", "Shift+F5"] {
            assert!(
                interpretar(texto).is_err(),
                "'{texto}' passou, e sequestraria a digitação normal"
            );
        }
    }

    /// **Prende o relaxamento do Adendo 9.** A escolha do usuário pode usar `⌘`,
    /// com o aviso que a tela dá — o que não pode é o app decidir por ele.
    #[test]
    fn command_e_aceito_como_escolha_do_usuario() {
        let escolhido = interpretar("super+shift+KeyK").expect("⌘⇧K é escolha legítima");
        assert!(escolhido.mods.contains(Modifiers::SUPER));
    }

    /// O que vai para o disco é `into_string`, e é `interpretar` quem lê de volta na
    /// próxima abertura. Se as duas grafias não casarem, a escolha do usuário
    /// silenciosamente volta ao padrão a cada reinício.
    #[test]
    fn o_acelerador_gravado_volta_a_ser_o_mesmo_atalho() {
        for texto in [PADRAO, "super+shift+KeyK", "control+ArrowUp", "alt+Space"] {
            let atalho = interpretar(texto).expect(texto);
            let ida_e_volta = interpretar(&atalho.into_string()).expect("o canônico não voltou");
            assert_eq!(atalho, ida_e_volta, "'{texto}' não sobreviveu ao disco");
        }
    }

    /// Um menu que anuncia um atalho que não existe é pior que menu nenhum: o
    /// rótulo tem que falar da tecla registrada.
    #[test]
    fn a_etiqueta_termina_na_tecla_registrada() {
        let com_letra = interpretar("control+alt+KeyT").unwrap();
        assert!(
            etiqueta(&com_letra).ends_with('T'),
            "a etiqueta '{}' não termina na tecla registrada",
            etiqueta(&com_letra)
        );
        assert!(etiqueta(&interpretar("control+Digit1").unwrap()).ends_with('1'));
        assert!(!etiqueta(&interpretar("control+ArrowUp").unwrap()).contains("Arrow"));
    }

    /// A convenção de cada sistema, do lado do letreiro. No Mac o modificador é
    /// símbolo; fora dele, palavra — e um `⌃` numa tela de Windows não diz nada.
    /// O padrão também é por sistema desde o Adendo 12, e o teste prende os dois.
    #[test]
    fn a_etiqueta_segue_a_convencao_do_sistema() {
        let texto = etiqueta(&padrao());
        if cfg!(target_os = "macos") {
            assert_eq!(texto, "\u{2303}\u{2325}T");
        } else if cfg!(target_os = "linux") {
            assert_eq!(texto, "Ctrl+Alt+Space");
        } else {
            assert_eq!(texto, "Ctrl+Alt+T");
        }
    }

    /// A escolha atravessa o fechamento do app — que é a razão de ela ir para o
    /// disco —, e um arquivo que não é entendido não pode deixar o app sem atalho.
    #[test]
    fn a_escolha_sobrevive_a_reabertura_e_um_arquivo_torto_cai_no_padrao() {
        let diretorio = std::env::temp_dir().join(format!(
            "nocom-atalho-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = std::fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("atalho.json");

        let escolhido = interpretar("super+shift+KeyK").expect("combinação válida");
        Atalho::abrir(arquivo.clone()).definir(escolhido);
        assert_eq!(Atalho::abrir(arquivo.clone()).atual(), escolhido);

        // O que uma versão futura, ou um editor de texto, pode deixar aqui.
        std::fs::write(&arquivo, "{\"accelerator\":\"não é atalho\"}").expect("escrever");
        assert_eq!(Atalho::abrir(arquivo.clone()).atual(), padrao());

        // Arquivo nenhum é a primeira execução, e ela também é o padrão.
        let _ = std::fs::remove_file(&arquivo);
        assert_eq!(Atalho::abrir(arquivo).atual(), padrao());

        let _ = std::fs::remove_dir_all(&diretorio);
    }

    /// **A suspensão não pode virar "não está valendo" na tela.** Ela dura o tempo de
    /// uma captura, e um aviso de "outro aplicativo tomou a combinação" aparecendo a
    /// cada abertura do painel seria mentira. E `definir` tem que encerrá-la: quem
    /// grava já registrou a combinação nova, e uma suspensão de pé faria o retomar
    /// seguinte registrar duas vezes a mesma tecla.
    #[test]
    fn suspender_solta_o_registro_sem_dizer_que_o_atalho_nao_vale() {
        let diretorio = std::env::temp_dir().join(format!(
            "nocom-atalho-pausa-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = std::fs::remove_dir_all(&diretorio);
        let atalho = Atalho::abrir(diretorio.join("atalho.json"));

        assert!(atalho.situacao().registrada);

        atalho.pausar();
        assert!(
            !atalho.situacao().registrada,
            "o registro precisa sair da mão do sistema"
        );
        assert!(
            atalho.situacao().valendo,
            "suspenso não é combinação perdida"
        );
        assert!(
            atalho.descrever().active,
            "a tela não pode avisar nada por causa da pausa"
        );

        atalho.retomar();
        assert!(atalho.situacao().registrada);

        // Trocar a combinação durante a captura encerra a suspensão.
        atalho.pausar();
        atalho.definir(interpretar("control+alt+KeyJ").expect("válida"));
        assert!(atalho.situacao().registrada);

        // Combinação tomada por outro aplicativo: aí sim a tela avisa, e a suspensão
        // não pode "curá-la".
        atalho.marcar(false);
        atalho.pausar();
        atalho.retomar();
        assert!(!atalho.situacao().registrada);
        assert!(!atalho.descrever().active);

        let _ = std::fs::remove_dir_all(&diretorio);
    }

    /// O que o frontend recebe. `remembered` e `active` são os dois campos que
    /// existem para a tela poder dizer a verdade quando algo não deu certo.
    #[test]
    fn a_descricao_carrega_o_padrao_para_o_frontend_poder_restaurar() {
        let diretorio = std::env::temp_dir().join(format!(
            "nocom-atalho-descricao-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        let _ = std::fs::remove_dir_all(&diretorio);
        let atalho = Atalho::abrir(diretorio.join("atalho.json"));

        let descricao = atalho.descrever();
        assert_eq!(descricao.accelerator, descricao.default_accelerator);
        assert_eq!(descricao.label, etiqueta(&padrao()));
        assert!(descricao.active);
        assert!(descricao.remembered);

        atalho.definir(interpretar("control+alt+KeyJ").expect("válida"));
        let trocado = atalho.descrever();
        assert_ne!(trocado.accelerator, trocado.default_accelerator);
        assert!(trocado.label.ends_with('J'));

        atalho.marcar(false);
        assert!(!atalho.descrever().active);

        let _ = std::fs::remove_dir_all(&diretorio);
    }
}
