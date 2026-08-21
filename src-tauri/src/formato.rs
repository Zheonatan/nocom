//! O formato de data do sistema — e dele, só uma coisa: **o dia vem antes do
//! mês?**
//!
//! Existe porque a webview não sabe responder isso, e a descoberta custou duas
//! medições. Elas estão registradas no Adendo 11 do `CONTRACT.md`; o resumo é:
//!
//! 1. `navigator.language` é o **idioma da interface**, não a região. Num Mac com
//!    idioma inglês e região Brasil ele responde `en-US`, enquanto o formato de
//!    data do sistema é `dd/MM/yy`. Perguntar a ele dava mês-primeiro para quem
//!    digita `20/08`.
//! 2. Nem entregando a etiqueta certa o `Intl` resolveria: ele escolhe a ordem
//!    pela **língua**, e não pela região. `Intl.DateTimeFormat("en-BR")` devolve
//!    mês-primeiro, e a extensão `-u-rg-brzzzz`, que existe no BCP-47 justamente
//!    para isso, é ignorada pelo motor.
//!
//! O que sobra é perguntar ao sistema operacional o **padrão de data curta** que
//! ele mesmo usa — `dd/MM/y` no Brasil, `M/d/yy` nos Estados Unidos — e ler a
//! ordem dali. Cada plataforma tem uma API própria para isso, e nenhuma delas
//! atravessa a webview.
//!
//! É o mesmo argumento de `idioma.rs`, aplicado a outra pergunta: aquele módulo
//! lê o sistema porque o tray é desenhado antes de a webview existir; este lê
//! porque a webview **nunca** teve a informação. Nos dois casos a leitura é do
//! Rust e a resposta atravessa a fronteira já decidida.
//!
//! **A leitura do sistema é a única parte que não tem teste**, porque ela é uma
//! chamada de FFI cujo valor depende da máquina. O que tem teste é o que fazemos
//! com o padrão depois de recebê-lo, que é onde um erro seria silencioso: a ordem
//! errada não quebra nada, só deixa de acender um destaque.

use std::sync::OnceLock;

/// Dia-primeiro é o fallback de toda falha de leitura.
///
/// Não é moeda ao ar: é a ordem da maior parte do mundo, a do dicionário
/// canônico do app, e a única das duas em que um erro de leitura **não inventa**
/// um destaque. Sob dia-primeiro, `08/20` procura o mês 20 e nunca casa com nada
/// — a pessoa fica sem o destaque, que é o estado de qualquer tarefa sem data.
/// Sob mês-primeiro, `20/08` procuraria o dia 08 do mês 20 e também não casaria,
/// mas `12/05` casaria no dia errado. Errar para o lado que cala é melhor que
/// errar para o lado que afirma.
const FALLBACK: bool = true;

/// O dia vem antes do mês neste sistema?
///
/// Resolvido **uma vez por execução**, como `idioma::atual()` e pela mesma razão:
/// ninguém troca a região do sistema com o app aberto, e o valor é consultado a
/// cada abertura da janela.
pub fn dia_primeiro() -> bool {
    static CACHE: OnceLock<bool> = OnceLock::new();
    *CACHE.get_or_init(|| {
        sistema::padrao_curto()
            .as_deref()
            .and_then(ordem)
            .unwrap_or(FALLBACK)
    })
}

/// A ordem que um padrão de data declara: `Some(true)` para dia-primeiro,
/// `Some(false)` para mês-primeiro, `None` quando o padrão não fala de dia nem de
/// mês.
///
/// **Duas gramáticas, porque as três plataformas não usam a mesma.** macOS e
/// Windows devolvem o padrão do ICU/CLDR (`dd/MM/y`, `M/d/yy`), onde a letra é o
/// campo. O Linux devolve o do `strftime` (`%d/%m/%Y`), onde o campo é o `%` mais
/// a letra — e ali as letras soltas são texto literal. Ler um com a gramática do
/// outro é o erro que este módulo mais precisa não cometer: em `%d/%m/%Y`, um
/// leitor de ICU veria o `d` do `%d` e acertaria por acidente, mas em
/// `%Y-%m-%d` ele veria o `Y`, depois o `m`... e num padrão com texto literal
/// (`%d de %m`) o `d` de "de" chegaria antes do mês.
///
/// **Só a ordem relativa de dia e mês importa.** O ano pode vir na frente sem
/// mudar nada: o japonês escreve `y/MM/dd`, e entre os dois campos que este
/// módulo lê o mês vem primeiro — que é a resposta certa para quem digita
/// `08/20`.
pub fn ordem(padrao: &str) -> Option<bool> {
    if padrao.contains('%') {
        ordem_strftime(padrao)
    } else {
        ordem_icu(padrao)
    }
}

/// `%d/%m/%Y` — só o caractere depois de um `%` é campo; todo o resto é literal.
fn ordem_strftime(padrao: &str) -> Option<bool> {
    let mut chars = padrao.chars();
    while let Some(c) = chars.next() {
        if c != '%' {
            continue;
        }
        // Modificadores do POSIX (`%-d`, `%_d`, `%Ed`, `%Od`) ficam ENTRE o `%` e
        // a letra do campo, e podem se acumular. Precisam ser consumidos aqui: se
        // o laço voltasse ao topo depois de ver o `-`, o `d` que vem em seguida
        // não estaria mais precedido de `%` e seria lido como texto literal — o
        // padrão inteiro passaria em branco e a leitura cairia no fallback.
        let mut campo = chars.next();
        while matches!(campo, Some('-' | '_' | '0' | '^' | '#' | 'E' | 'O')) {
            campo = chars.next();
        }
        match campo {
            // `%%` é um literal `%`, e não um especificador. O segundo `%` já foi
            // consumido, então um `d` depois dele é texto.
            Some('%') => {}
            // `%e` é o dia alinhado com espaço, e vale como dia.
            Some('d' | 'e') => return Some(true),
            // `%b`, `%B` e `%h` são o mês por nome. Aparecem em padrão curto de
            // alguns locales, e um mês por nome é um mês.
            Some('m' | 'b' | 'B' | 'h') => return Some(false),
            Some(_) => {}
            None => break,
        }
    }
    None
}

/// `dd/MM/y` — a letra é o campo, e o que está entre apóstrofos é literal.
fn ordem_icu(padrao: &str) -> Option<bool> {
    // Texto literal dentro de um padrão do CLDR vai entre apóstrofos, e ele pode
    // conter as letras que procuramos: o espanhol escreve `d 'de' MMMM` e o `d`
    // de "de" seria lido como um campo de dia. Padrão curto raramente tem
    // literal, mas "raramente" não é uma garantia sobre a qual valha a pena
    // escrever um destaque errado.
    let mut dentro_de_literal = false;
    let mut chars = padrao.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '\'' {
            // `''` é um apóstrofo escapado, e não uma troca de estado.
            if chars.peek() == Some(&'\'') {
                chars.next();
                continue;
            }
            dentro_de_literal = !dentro_de_literal;
            continue;
        }
        if dentro_de_literal {
            continue;
        }
        match c {
            // `d` é o dia do mês. `D` de propósito fora: no CLDR ele é o dia do
            // ANO, e tratá-lo como dia seria ler `D/MM` como dia-primeiro quando
            // ali não há dia do mês nenhum.
            'd' => return Some(true),
            // `M` é o mês, `L` é o mês na forma isolada (usada por locales
            // eslavos). As duas contam.
            'M' | 'L' => return Some(false),
            _ => {}
        }
    }
    None
}

#[cfg(target_os = "macos")]
mod sistema {
    //! `CFDateFormatter` com o locale corrente e estilo curto: é literalmente o
    //! formato que o Finder e o resto do sistema usam para escrever uma data
    //! numérica, e é o que a pessoa tem na cabeça quando digita `20/08`.
    //!
    //! As declarações são escritas à mão em vez de vir de `core-foundation-sys`
    //! pelo mesmo motivo que a `sys-locale` faz igual: são cinco funções, e uma
    //! dependência nova para cinco assinaturas é um mau negócio num projeto que
    //! conta as suas.

    use core::ffi::c_void;

    type CFIndex = isize;
    type Boolean = u8;
    type CFStringEncoding = u32;
    type CFTypeRef = *const c_void;
    type CFAllocatorRef = *const c_void;
    type CFDateFormatterStyle = CFIndex;

    #[repr(C)]
    struct __CFString(c_void);
    type CFStringRef = *const __CFString;

    #[repr(C)]
    struct __CFLocale(c_void);
    type CFLocaleRef = *const __CFLocale;

    #[repr(C)]
    struct __CFDateFormatter(c_void);
    type CFDateFormatterRef = *const __CFDateFormatter;

    #[allow(non_upper_case_globals)]
    const kCFStringEncodingUTF8: CFStringEncoding = 0x0800_0100;
    /// `kCFDateFormatterNoStyle` — sem parte de hora no padrão.
    const SEM_ESTILO: CFDateFormatterStyle = 0;
    /// `kCFDateFormatterShortStyle` — a data toda numérica, que é a forma que
    /// alguém digita numa lista de tarefas.
    const ESTILO_CURTO: CFDateFormatterStyle = 1;

    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFLocaleCopyCurrent() -> CFLocaleRef;
        fn CFDateFormatterCreate(
            allocator: CFAllocatorRef,
            locale: CFLocaleRef,
            dateStyle: CFDateFormatterStyle,
            timeStyle: CFDateFormatterStyle,
        ) -> CFDateFormatterRef;
        fn CFDateFormatterGetFormat(formatter: CFDateFormatterRef) -> CFStringRef;
        fn CFStringGetCString(
            theString: CFStringRef,
            buffer: *mut u8,
            bufferSize: CFIndex,
            encoding: CFStringEncoding,
        ) -> Boolean;
        fn CFRelease(cf: CFTypeRef);
    }

    pub(super) fn padrao_curto() -> Option<String> {
        // SAFETY: as cinco chamadas seguem o contrato do CoreFoundation. A regra
        // de posse é a do nome: `Copy`/`Create` devolvem algo que é nosso e
        // precisa de `CFRelease`; `Get` devolve emprestado e liberá-lo seria um
        // over-release. Por isso o `CFStringRef` do `GetFormat` não aparece em
        // nenhum `CFRelease` abaixo — ele pertence ao formatador, e é lido antes
        // de o formatador morrer.
        unsafe {
            let locale = CFLocaleCopyCurrent();
            if locale.is_null() {
                return None;
            }
            let formatador = CFDateFormatterCreate(
                core::ptr::null(),
                locale,
                ESTILO_CURTO,
                SEM_ESTILO,
            );
            CFRelease(locale.cast());
            if formatador.is_null() {
                return None;
            }

            let padrao = CFDateFormatterGetFormat(formatador);
            let texto = if padrao.is_null() {
                None
            } else {
                // Um padrão de data curta tem uma dúzia de caracteres; 128 bytes
                // são folga de sobra, e um buffer fixo dispensa a dança de medir,
                // alocar e medir de novo. Se algum dia não couber,
                // `CFStringGetCString` devolve falso e a leitura falha inteira —
                // o que cai no fallback em vez de num padrão truncado, que seria
                // pior: `dd/M` cortado em `dd/` ainda pareceria válido.
                let mut buffer = [0u8; 128];
                let ok = CFStringGetCString(
                    padrao,
                    buffer.as_mut_ptr(),
                    buffer.len() as CFIndex,
                    kCFStringEncodingUTF8,
                );
                if ok == 0 {
                    None
                } else {
                    let fim = buffer.iter().position(|b| *b == 0).unwrap_or(0);
                    std::str::from_utf8(&buffer[..fim]).ok().map(str::to_owned)
                }
            };

            CFRelease(formatador.cast());
            texto
        }
    }
}

#[cfg(target_os = "windows")]
mod sistema {
    //! `LOCALE_SSHORTDATE` do **locale do usuário**, que no Windows é a
    //! configuração de "Formato regional" — separada do idioma de exibição, que é
    //! `GetUserDefaultUILanguage`. É exatamente a separação que derrubou a leitura
    //! pela webview, e aqui as duas têm nomes diferentes na API.

    /// `LOCALE_NAME_USER_DEFAULT` é o ponteiro nulo.
    const USUARIO: *const u16 = core::ptr::null();
    const LOCALE_SSHORTDATE: u32 = 0x0000_001F;

    #[link(name = "kernel32")]
    extern "system" {
        fn GetLocaleInfoEx(
            lpLocaleName: *const u16,
            LCType: u32,
            lpLCData: *mut u16,
            cchData: i32,
        ) -> i32;
    }

    pub(super) fn padrao_curto() -> Option<String> {
        // SAFETY: `GetLocaleInfoEx` escreve no máximo `cchData` unidades UTF-16 no
        // buffer e devolve quantas escreveu (contando o terminador), ou 0 em erro.
        // O buffer é nosso e o tamanho passado é o dele.
        let mut buffer = [0u16; 128];
        let escritos = unsafe {
            GetLocaleInfoEx(
                USUARIO,
                LOCALE_SSHORTDATE,
                buffer.as_mut_ptr(),
                buffer.len() as i32,
            )
        };
        if escritos <= 1 {
            return None;
        }
        // O retorno inclui o `\0` do fim, que não faz parte do padrão.
        let fim = (escritos as usize) - 1;
        String::from_utf16(&buffer[..fim]).ok()
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod sistema {
    //! `nl_langinfo(D_FMT)` — o padrão de data curta do locale de `LC_TIME`, na
    //! gramática do `strftime`.
    //!
    //! A `libc` entra como dependência só deste alvo, e ela não acrescenta um
    //! pacote à compilação: já está na árvore, por baixo de meia dúzia de
    //! dependências do Tauri. O que ela dá em troca é o valor certo de `D_FMT`
    //! para cada libc — glibc e musl não usam o mesmo número, e escrevê-lo à mão
    //! seria trocar uma dependência que já existe por um inteiro mágico que
    //! quebra em silêncio na libc errada.

    use std::ffi::CStr;

    pub(super) fn padrao_curto() -> Option<String> {
        // SAFETY: `setlocale(LC_TIME, "")` adota o locale do ambiente — sem ele o
        // processo fica no `C`, cujo `D_FMT` é `%m/%d/%y` para todo mundo, e a
        // leitura responderia "mês-primeiro" em qualquer máquina Linux. O
        // ponteiro do `nl_langinfo` é para memória estática da libc, válida até a
        // próxima chamada; ele é copiado para uma `String` aqui mesmo.
        unsafe {
            libc::setlocale(libc::LC_TIME, c"".as_ptr());
            let padrao = libc::nl_langinfo(libc::D_FMT);
            if padrao.is_null() {
                return None;
            }
            CStr::from_ptr(padrao).to_str().ok().map(str::to_owned)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Os padrões que as três plataformas realmente devolvem. Os do macOS foram
    /// **medidos** nesta máquina, forçando `AppleLocale` por argumento de
    /// processo: é de onde vem a certeza de que `en_BR` responde `dd/MM/yy` e
    /// `pt_US` responde `M/d/yy` — os dois casos que a leitura pela webview errava.
    #[test]
    fn padroes_reais_do_icu() {
        // Brasil, com o sistema em português OU em inglês: a região decide.
        assert_eq!(ordem("dd/MM/y"), Some(true));
        assert_eq!(ordem("dd/MM/yy"), Some(true));
        // Estados Unidos, com o sistema em inglês OU em português.
        assert_eq!(ordem("M/d/yy"), Some(false));
        assert_eq!(ordem("MM/dd/yyyy"), Some(false));
        // Reino Unido e Alemanha.
        assert_eq!(ordem("dd/MM/y"), Some(true));
        assert_eq!(ordem("dd.MM.yy"), Some(true));
    }

    /// **Ano na frente não muda a resposta.** É o caso do japonês e do coreano, e
    /// o que importa é só qual dos dois campos que lemos vem primeiro.
    #[test]
    fn ano_primeiro_nao_confunde_dia_com_mes() {
        assert_eq!(ordem("y/MM/dd"), Some(false));
        assert_eq!(ordem("yyyy-MM-dd"), Some(false));
        assert_eq!(ordem("y. M. d."), Some(false));
    }

    /// `D` é o dia do ANO no CLDR, e não o dia do mês. Tratá-lo como dia faria
    /// `D/MM` ser lido como dia-primeiro sem que houvesse dia do mês no padrão.
    #[test]
    fn d_maiusculo_nao_e_dia_do_mes() {
        assert_eq!(ordem("D/MM"), Some(false));
    }

    /// `L` é o mês na forma isolada, usado por locales eslavos.
    #[test]
    fn l_conta_como_mes() {
        assert_eq!(ordem("LL/dd/y"), Some(false));
        assert_eq!(ordem("dd/LL/y"), Some(true));
    }

    /// Texto entre apóstrofos é literal, e pode conter justamente as letras que
    /// procuramos. Sem tratar o literal, o `d` de "de" chegaria antes do mês e
    /// inverteria a resposta.
    #[test]
    fn literal_entre_apostrofos_nao_e_campo() {
        assert_eq!(ordem("MM 'de' dd"), Some(false));
        assert_eq!(ordem("'day' MM/dd"), Some(false));
        assert_eq!(ordem("dd 'de' MM"), Some(true));
    }

    /// `''` é um apóstrofo escapado e não abre nem fecha literal. Sem isto, o
    /// estado de "dentro de literal" ficaria invertido pelo resto do padrão.
    #[test]
    fn apostrofo_escapado_nao_abre_literal() {
        assert_eq!(ordem("''dd/MM"), Some(true));
        assert_eq!(ordem("''MM/dd"), Some(false));
    }

    /// A gramática do `strftime`, que é a que o Linux devolve.
    #[test]
    fn padroes_reais_do_strftime() {
        assert_eq!(ordem("%d/%m/%Y"), Some(true));
        assert_eq!(ordem("%d.%m.%Y"), Some(true));
        assert_eq!(ordem("%m/%d/%Y"), Some(false));
        assert_eq!(ordem("%Y-%m-%d"), Some(false));
        assert_eq!(ordem("%e/%m/%Y"), Some(true));
    }

    /// **O teste que separa as duas gramáticas.** Em `%d de %m`, um leitor de ICU
    /// veria o `d` do `%d` primeiro e acertaria por sorte; em `%Y-%m-%d` ele veria
    /// o `m` de... nada, porque `Y` e `m` são letras soltas para ele. O que não
    /// pode acontecer é a letra de um texto literal virar campo.
    #[test]
    fn letra_solta_nao_e_campo_no_strftime() {
        // "de" tem um `d`, e ele vem antes do `%m`. Na gramática certa, o
        // primeiro campo é o `%m`.
        assert_eq!(ordem("%m de %Y"), Some(false));
        // O mesmo padrão com o dia: o campo é o `%d`, não o `d` de "dia".
        assert_eq!(ordem("dia %m/%d"), Some(false));
    }

    /// `%%` é um `%` literal, e o caractere seguinte não é campo.
    #[test]
    fn porcento_escapado_nao_consome_o_campo() {
        assert_eq!(ordem("%%d/%m/%Y"), Some(false));
    }

    /// Modificadores do POSIX ficam entre o `%` e a letra do campo.
    #[test]
    fn modificadores_do_posix_nao_escondem_o_campo() {
        assert_eq!(ordem("%-d/%-m/%Y"), Some(true));
        assert_eq!(ordem("%Om/%Od/%Y"), Some(false));
    }

    /// `%b`/`%B` são o mês por nome, e continuam sendo mês.
    #[test]
    fn mes_por_nome_conta_como_mes() {
        assert_eq!(ordem("%b %d, %Y"), Some(false));
        assert_eq!(ordem("%d %B %Y"), Some(true));
    }

    /// Um padrão que não fala de dia nem de mês devolve `None`, e quem chama cai
    /// no fallback. Nunca um palpite disfarçado de leitura.
    #[test]
    fn padrao_sem_dia_nem_mes_nao_responde() {
        assert_eq!(ordem(""), None);
        assert_eq!(ordem("yyyy"), None);
        assert_eq!(ordem("%Y"), None);
        assert_eq!(ordem("'dd/MM'"), None);
    }

    /// O fallback é dia-primeiro, e a razão é assimétrica: sob dia-primeiro uma
    /// leitura errada **cala**, sob mês-primeiro ela pode **afirmar**. Este teste
    /// existe para que trocar a constante exija trocar a justificativa junto.
    #[test]
    fn o_fallback_e_dia_primeiro() {
        assert!(FALLBACK, "o fallback silencioso é dia-primeiro");
    }

    /// A leitura do sistema não pode entrar em pânico nem devolver um padrão que
    /// o parser não entenda. Não asserta a ordem — ela depende da máquina que roda
    /// a suíte, e um teste que dependesse disso falharia em metade do mundo.
    #[test]
    fn a_leitura_do_sistema_responde_algo_utilizavel() {
        if let Some(padrao) = sistema::padrao_curto() {
            assert!(
                !padrao.is_empty(),
                "o sistema devolveu um padrão vazio: {padrao:?}"
            );
            assert!(
                ordem(&padrao).is_some(),
                "o padrão do sistema não fala de dia nem de mês: {padrao:?}"
            );
        }
        // Chamar duas vezes tem que dar a mesma resposta — é o `OnceLock`.
        assert_eq!(dia_primeiro(), dia_primeiro());
    }
}

