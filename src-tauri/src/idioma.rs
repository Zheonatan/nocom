//! Idioma do **tray**, e só dele.
//!
//! A janela já é bilíngue: `src/lib/i18n.ts` escolhe pelo locale do sistema e o
//! português é o dicionário canônico, com o inglês tipado contra ele. O tray
//! ficou de fora porque as strings dele são desenhadas aqui, no Rust, **antes de
//! a webview existir** — o ícone sobe no `setup`, e nesse instante não há
//! `navigator.languages` a quem perguntar. O resultado era um app que num sistema
//! em inglês mostrava "3 pending" na janela e "3 tarefas pendentes" na bandeja.
//!
//! Isso importa mais aqui que em qualquer outra tela: o tray é a **via de volta**
//! de uma janela que passa a maior parte do tempo escondida, e é o primeiro lugar
//! onde alguém procura o app depois de esconder a janela pela primeira vez.
//!
//! Duas línguas e cinco frases não pedem uma biblioteca de i18n, pelo mesmo
//! motivo que o frontend não usa uma. O que este módulo precisa garantir é outra
//! coisa: **a mesma decisão de idioma dos dois lados**. A regra de escolha é a do
//! `detectLocale` do frontend, transcrita — percorre os idiomas na ordem de
//! preferência e fica no primeiro que o app fala, com inglês como fallback.

use std::sync::OnceLock;

/// Inglês é o fallback, e não o português — a mesma escolha do frontend, e pela
/// mesma razão: o app é distribuído, e um sistema em alemão ou japonês tem muito
/// mais chance de ler inglês do que português.
const FALLBACK: Idioma = Idioma::En;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Idioma {
    Pt,
    En,
}

/// O idioma resolvido, **uma vez por execução**.
///
/// Espelha o `export const locale` do frontend: trocar o idioma do sistema com o
/// app aberto é raro o bastante para custar um reinício, e um valor constante
/// dispensa recalcular a cada redesenho do tooltip — que acontece a cada mutação.
pub fn atual() -> Idioma {
    static CACHE: OnceLock<Idioma> = OnceLock::new();
    *CACHE.get_or_init(|| detectar(sys_locale::get_locales()))
}

/// Percorre os idiomas do sistema **na ordem de preferência** e fica no primeiro
/// que o app fala. Alguém com `["de-DE", "pt-BR", "en"]` recebe português, e não
/// o fallback: a segunda opção dele é melhor que o palpite.
///
/// Recebe os idiomas em vez de ir buscá-los para poder ser testado — o locale da
/// máquina que roda a suíte não pode decidir o resultado de um teste.
pub fn detectar<I, S>(tags: I) -> Idioma
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    for tag in tags {
        // `pt_BR.UTF-8` é o formato que sai de `LANG` no Linux, e `pt-BR` o da
        // API do macOS e do Windows. A `sys-locale` normaliza, mas normalizar de
        // novo aqui custa duas linhas e protege de a fonte mudar: um `_` no lugar
        // do `-` faria a comparação falhar em silêncio e o app inteiro cair no
        // inglês num sistema em português.
        let tag = tag.as_ref().to_ascii_lowercase().replace('_', "-");
        let tag = tag.split('.').next().unwrap_or_default();

        if tag == "pt" || tag.starts_with("pt-") {
            return Idioma::Pt;
        }
        if tag == "en" || tag.starts_with("en-") {
            return Idioma::En;
        }
    }
    FALLBACK
}

/// O texto do tooltip: quantas faltam, legível sem abrir a janela.
///
/// **Zero pendentes não é "0 pendentes".** A leitura boa de uma lista vazia é que
/// não falta nada, e é isso que o usuário quer saber de relance. As frases são as
/// mesmas do rodapé da janela (`footer.allDone` e `pending.count`) nas duas
/// línguas, de propósito: o app fala uma língua só, e o mesmo estado não pode
/// mudar de nome quando muda de superfície.
pub fn tooltip(pendentes: usize, idioma: Idioma) -> String {
    match (idioma, pendentes) {
        (Idioma::Pt, 0) => "NoCom — tudo em dia".to_owned(),
        (Idioma::Pt, 1) => "NoCom — 1 tarefa pendente".to_owned(),
        (Idioma::Pt, muitas) => format!("NoCom — {muitas} tarefas pendentes"),
        (Idioma::En, 0) => "NoCom — all clear".to_owned(),
        (Idioma::En, 1) => "NoCom — 1 task pending".to_owned(),
        (Idioma::En, muitas) => format!("NoCom — {muitas} tasks pending"),
    }
}

/// O item que mostra e esconde a janela, com a combinação no rótulo.
///
/// O atalho entra escrito porque é aqui que ele fica **descobrível**: quem achou
/// o ícone na bandeja aprende, no mesmo gesto, o atalho que dispensa o ícone.
pub fn menu_alternar(atalho: &str, idioma: Idioma) -> String {
    match idioma {
        Idioma::Pt => format!("Mostrar/Esconder ({atalho})"),
        Idioma::En => format!("Show/Hide ({atalho})"),
    }
}

/// O único caminho de saída do app — a janela não tem botão que encerre o
/// processo, então este item é a diferença entre esconder e sair de verdade.
pub fn menu_sair(idioma: Idioma) -> &'static str {
    match idioma {
        Idioma::Pt => "Sair",
        Idioma::En => "Quit",
    }
}

#[cfg(test)]
mod tests_deteccao {
    use super::*;

    #[test]
    fn portugues_e_ingles_sao_reconhecidos_com_e_sem_regiao() {
        for tag in ["pt", "pt-BR", "pt-PT", "PT-br"] {
            assert_eq!(detectar([tag]), Idioma::Pt, "{tag}");
        }
        for tag in ["en", "en-US", "en-GB", "EN-us"] {
            assert_eq!(detectar([tag]), Idioma::En, "{tag}");
        }
    }

    /// O formato que sai de `LANG` no Linux. Sem a normalização, `pt_BR.UTF-8`
    /// não casaria com nada e um sistema em português cairia no inglês.
    #[test]
    fn o_formato_posix_do_lang_e_entendido() {
        assert_eq!(detectar(["pt_BR.UTF-8"]), Idioma::Pt);
        assert_eq!(detectar(["en_US.UTF-8"]), Idioma::En);
    }

    /// **A ordem de preferência do usuário vale mais que o fallback.** Quem tem
    /// alemão em primeiro e português em segundo pediu, explicitamente, para
    /// receber português antes de qualquer palpite nosso.
    #[test]
    fn a_ordem_de_preferencia_e_respeitada() {
        assert_eq!(detectar(["de-DE", "pt-BR", "en"]), Idioma::Pt);
        assert_eq!(detectar(["ja-JP", "en-US", "pt-BR"]), Idioma::En);
    }

    #[test]
    fn idioma_desconhecido_ou_lista_vazia_cai_no_fallback() {
        assert_eq!(detectar(["de-DE", "ja-JP"]), FALLBACK);
        assert_eq!(detectar(Vec::<String>::new()), FALLBACK);
    }
}

#[cfg(test)]
mod tests_textos {
    use super::*;

    /// "0 pendentes" é tecnicamente certo e péssimo de ler: quem passa o olho no
    /// ícone quer saber se sobrou algo, e a resposta boa para nenhuma é que não
    /// falta nada. Vale nas duas línguas — o defeito não é do português.
    #[test]
    fn zero_pendentes_nao_vira_zero_no_texto() {
        for idioma in [Idioma::Pt, Idioma::En] {
            let texto = tooltip(0, idioma);
            assert!(
                !texto.contains('0'),
                "o tooltip mostrou um zero em vez da leitura boa: {texto}"
            );
        }
        assert!(tooltip(0, Idioma::Pt).contains("tudo em dia"));
        assert!(tooltip(0, Idioma::En).contains("all clear"));
    }

    /// Singular e plural corretos: "1 tarefas pendentes" é o tipo de detalhe que
    /// faz um app parecer descuidado justamente no lugar que o usuário mais olha.
    #[test]
    fn uma_pendente_fica_no_singular() {
        let pt = tooltip(1, Idioma::Pt);
        assert!(pt.contains("1 tarefa pendente"), "{pt}");
        assert!(!pt.contains("tarefas"), "plural indevido: {pt}");

        let en = tooltip(1, Idioma::En);
        assert!(en.contains("1 task pending"), "{en}");
        assert!(!en.contains("tasks"), "plural indevido: {en}");
    }

    #[test]
    fn varias_pendentes_ficam_no_plural() {
        assert!(tooltip(2, Idioma::Pt).contains("2 tarefas pendentes"));
        assert!(tooltip(37, Idioma::Pt).contains("37 tarefas pendentes"));
        assert!(tooltip(2, Idioma::En).contains("2 tasks pending"));
        assert!(tooltip(37, Idioma::En).contains("37 tasks pending"));
    }

    /// O nome do app fica no tooltip em qualquer contagem e em qualquer idioma: é
    /// ele que identifica o ícone numa bandeja cheia.
    #[test]
    fn o_nome_do_app_aparece_em_qualquer_contagem() {
        for idioma in [Idioma::Pt, Idioma::En] {
            for pendentes in [0, 1, 2, 99] {
                assert!(
                    tooltip(pendentes, idioma).starts_with("NoCom"),
                    "contagem {pendentes} perdeu o nome do app em {idioma:?}"
                );
            }
        }
    }

    /// **Nenhuma string do tray pode ficar sem tradução.** O defeito que este
    /// módulo existe para corrigir era exatamente este: uma janela em inglês ao
    /// lado de uma bandeja em português. Um item de menu esquecido num `match`
    /// futuro traria o mesmo problema de volta pela mesma porta.
    #[test]
    fn nenhum_texto_do_tray_repete_a_outra_lingua() {
        assert_ne!(tooltip(0, Idioma::Pt), tooltip(0, Idioma::En));
        assert_ne!(tooltip(3, Idioma::Pt), tooltip(3, Idioma::En));
        assert_ne!(
            menu_alternar("Ctrl+Alt+T", Idioma::Pt),
            menu_alternar("Ctrl+Alt+T", Idioma::En)
        );
        assert_ne!(menu_sair(Idioma::Pt), menu_sair(Idioma::En));
    }

    /// A combinação precisa sobreviver ao rótulo nas duas línguas: é o menu do
    /// tray que torna o atalho descobrível, e um rótulo que a perdesse deixaria a
    /// via de volta principal sem ensinar a via de volta rápida.
    #[test]
    fn o_rotulo_do_menu_carrega_o_atalho_nas_duas_linguas() {
        for idioma in [Idioma::Pt, Idioma::En] {
            assert!(menu_alternar("⌃⌥T", idioma).contains("⌃⌥T"), "{idioma:?}");
        }
    }
}
