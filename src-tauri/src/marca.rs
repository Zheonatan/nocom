//! A marca do app desenhada para a **barra de menus do macOS**, e só para ela.
//!
//! O ícone empacotado é um campo preto com um anel branco de fio fino (a
//! geometria canônica está em `assets/marca/nocom.svg`, e todo raster do bundle
//! sai de `scripts/marca.mjs`). Na barra de menus esse arquivo não serve, e a
//! razão é o `icon_as_template(true)` que `montar_tray` liga no macOS: um ícone
//! template é uma **silhueta**, o sistema descarta a cor e usa só o canal alfa
//! para pintar a forma na tinta certa de cada tema. O alfa do ícone do app é o
//! quadrado inteiro, opaco de ponta a ponta — a barra de menus mostraria um
//! **retângulo cheio**, e o anel, que é a marca, desapareceria dentro dele.
//!
//! Então a bandeja recebe o anel **sozinho**, escrito no alfa. Windows e Linux
//! continuam com o ícone do app: lá a bandeja desenha com as cores do arquivo, e
//! o campo preto é justamente o que dá contraste próprio ao anel branco.
//!
//! **Por que desenhado aqui e não empacotado como PNG.** Um PNG de 36x36 no
//! repositório seria mais um arquivo a manter em acordo com as frações da marca,
//! e um arquivo que ninguém abre para conferir. Um anel é meia dúzia de linhas de
//! aritmética; desenhá-lo deixa os números visíveis, dispensa asset, dispensa
//! configuração de bundle, e — o que mais importa — deixa a geometria **testável**
//! (ver os testes no fim do arquivo).
//!
//! **Por que 36x36.** O `tray-icon` fixa a altura do `NSImage` em **18 pontos**
//! (`platform_impl/macos`: `icon_height: f64 = 18.0`) e escala a largura por
//! proporção. Um fonte de 36px é exatamente @2x desses 18pt, então em tela Retina
//! cada pixel do desenho cai num pixel físico. Um fonte de 44 ou de 64 seria
//! reduzido por interpolação, e um anel de fio fino não sobrevive a isso.
//!
//! **Por que o traço é proporcionalmente mais grosso que no ícone do app.** No
//! ícone o anel é ~40:1 de diâmetro por traço. Em 18pt essa razão daria um traço
//! de 0,75px: o antialias repartiria a tinta entre dois pixels, nenhum dos dois
//! ficaria opaco, e a via de volta garantida do app seria um borrão cinza. Aqui o
//! traço é 1,5pt — a mesma espessura dos ícones que a Apple põe nessa barra, que
//! é a vizinhança contra a qual este desenho é julgado.

use tauri::image::Image;

/// Lado do desenho, em pixels. @2x dos 18pt que o `tray-icon` impõe.
const LADO: u32 = 36;
/// Raio externo do anel: 15px = 7,5pt, num quadro de 18pt.
const RAIO_EXTERNO: f64 = 15.0;
/// Traço de 3px = 1,5pt, a espessura dos ícones nativos da barra de menus.
const TRACO: f64 = 3.0;
/// Raio interno, derivado. Com o centro em 18,0 e os dois raios inteiros, as
/// quatro pontas cardinais do anel caem cravadas na grade de pixel.
const RAIO_INTERNO: f64 = RAIO_EXTERNO - TRACO;

/// Amostras por eixo dentro de um pixel. 8x8 num quadro de 36px são 82 mil
/// amostras — instantâneo, e roda uma vez na vida do processo.
const AMOSTRAS: u32 = 8;

/// Folga que cobre a diagonal de um pixel com sobra: fora desta faixa em volta do
/// anel o pixel está inteiramente vazio e não precisa de amostra nenhuma.
const MARGEM: f64 = 1.5;

/// **O traço é fino o bastante para não ter interior.** Com traço de 3px e margem
/// de 1,5px, as faixas de antialias das duas bordas se encostam exatamente: não
/// existe pixel dentro do anel que esteja longe das duas, e por isso o atalho
/// abaixo só tem o caso "fora". Um traço mais grosso que `2 x MARGEM` passaria a
/// ter miolo sólido, e sem um terceiro caso o desenho ficaria correto e lento —
/// amostrando 64 vezes um pixel que já se sabe cheio.
const _: () = assert!(
    TRACO <= 2.0 * MARGEM,
    "traço com miolo sólido: acrescente o caso do interior ao atalho de `bandeja`"
);

/// O anel da barra de menus, pronto para `TrayIconBuilder::icon`.
///
/// RGB é preto e a forma vive no alfa, que é a convenção de imagem template do
/// macOS. O alfa **não** passa por correção de gama: ele é cobertura linear por
/// definição, e é o sistema que compõe a tinta do tema por cima.
pub fn bandeja() -> Image<'static> {
    let mut rgba = vec![0u8; (LADO * LADO * 4) as usize];
    let meio = f64::from(LADO) / 2.0;
    let passo = 1.0 / f64::from(AMOSTRAS);

    for y in 0..LADO {
        for x in 0..LADO {
            let dx = f64::from(x) + 0.5 - meio;
            let dy = f64::from(y) + 0.5 - meio;
            let d = dx.hypot(dy);

            let cobertura = if !(RAIO_INTERNO - MARGEM..=RAIO_EXTERNO + MARGEM).contains(&d) {
                0.0
            } else {
                let mut dentro = 0u32;
                for sy in 0..AMOSTRAS {
                    for sx in 0..AMOSTRAS {
                        let ax = dx - 0.5 + (f64::from(sx) + 0.5) * passo;
                        let ay = dy - 0.5 + (f64::from(sy) + 0.5) * passo;
                        let ad = ax.hypot(ay);
                        if (RAIO_INTERNO..=RAIO_EXTERNO).contains(&ad) {
                            dentro += 1;
                        }
                    }
                }
                f64::from(dentro) / f64::from(AMOSTRAS * AMOSTRAS)
            };

            let i = ((y * LADO + x) * 4 + 3) as usize;
            rgba[i] = (cobertura * 255.0).round() as u8;
        }
    }

    Image::new(&rgba, LADO, LADO).to_owned()
}

#[cfg(test)]
mod testes {
    use super::*;

    fn alfa(img: &Image<'_>, x: u32, y: u32) -> u8 {
        img.rgba()[((y * LADO + x) * 4 + 3) as usize]
    }

    /// O desenho tem o tamanho que o `tray-icon` espera receber. Se o
    /// `icon_height` de 18pt daquela crate mudar, este número precisa mudar com
    /// ele — e a única forma de alguém lembrar é um teste que fala do assunto.
    #[test]
    fn tem_o_tamanho_de_2x_de_18_pontos() {
        let img = bandeja();
        assert_eq!(img.width(), 36);
        assert_eq!(img.height(), 36);
        assert_eq!(img.rgba().len(), 36 * 36 * 4);
    }

    /// **O anel tem buraco.** É a diferença entre a marca do app e um disco, e é
    /// o defeito que um erro de sinal em `RAIO_INTERNO` produziria sem quebrar
    /// mais nada: um círculo cheio na barra de menus, que continua parecendo
    /// intencional.
    #[test]
    fn o_centro_e_transparente_e_a_faixa_e_opaca() {
        let img = bandeja();
        // Centro do quadro: dentro do buraco.
        assert_eq!(alfa(&img, 18, 18), 0, "o centro do anel deveria ser vazado");
        // Meio do traço à direita do centro: 18 + (15 + 12) / 2 = 31,5 -> pixel 31.
        assert_eq!(alfa(&img, 31, 18), 255, "o meio do traço deveria ser opaco");
        // Meio do traço acima do centro: 18 - 13,5 -> pixel 4.
        assert_eq!(alfa(&img, 18, 4), 255, "o traço deveria fechar em toda a volta");
    }

    /// Nada encosta na borda do quadro. Um desenho que sangra até o limite é
    /// colado no texto vizinho da barra de menus, sem folga nenhuma.
    #[test]
    fn as_bordas_do_quadro_ficam_vazias() {
        let img = bandeja();
        for i in 0..LADO {
            assert_eq!(alfa(&img, i, 0), 0);
            assert_eq!(alfa(&img, i, LADO - 1), 0);
            assert_eq!(alfa(&img, 0, i), 0);
            assert_eq!(alfa(&img, LADO - 1, i), 0);
        }
    }

    /// Grava a silhueta como PGM no caminho de `NOCOM_MARCA_PGM`, para conferir a
    /// olho o que a barra de menus vai receber.
    ///
    /// Os testes acima medem o desenho; nenhum deles vê a forma. É a mesma razão
    /// pela qual `scripts/marca.mjs` tem `--contato`: um anel pontilhado ou torto
    /// passa por qualquer asserção pontual e é óbvio na hora em que alguém olha.
    /// PGM porque são três linhas de cabeçalho e o `sips` converte para PNG — não
    /// vale trazer um codificador para dentro do binário por causa disto.
    ///
    /// ```sh
    /// NOCOM_MARCA_PGM=/tmp/bandeja.pgm cargo test grava_a_silhueta -- --ignored
    /// sips -s format png /tmp/bandeja.pgm --out /tmp/bandeja.png
    /// ```
    #[test]
    #[ignore = "só roda quando NOCOM_MARCA_PGM aponta para onde gravar"]
    fn grava_a_silhueta_para_conferencia() {
        let destino = std::env::var("NOCOM_MARCA_PGM")
            .expect("defina NOCOM_MARCA_PGM com o caminho do arquivo");
        let img = bandeja();
        let mut pgm = format!("P5\n{LADO} {LADO}\n255\n").into_bytes();
        pgm.extend(img.rgba().iter().skip(3).step_by(4));
        std::fs::write(&destino, pgm).expect("gravar o PGM");
    }

    /// **O traço é opaco em algum pixel de toda a volta, e não só nas cardinais.**
    /// É este o teste que pega o defeito real desta classe de desenho: um traço
    /// fino demais fica cinza na diagonal, o anel parece pontilhado, e em 18pt
    /// isso se lê como sujeira na barra e não como um círculo.
    #[test]
    fn o_traco_e_opaco_em_toda_a_circunferencia() {
        let img = bandeja();
        let meio = f64::from(LADO) / 2.0;
        let raio_medio = (RAIO_EXTERNO + RAIO_INTERNO) / 2.0;
        for grau in 0..360 {
            let rad = f64::from(grau).to_radians();
            let x = (meio + raio_medio * rad.cos()).floor() as u32;
            let y = (meio + raio_medio * rad.sin()).floor() as u32;
            assert!(
                alfa(&img, x, y) >= 245,
                "o traço esmaeceu em {grau}° (alfa {}) — anel pontilhado na barra de menus",
                alfa(&img, x, y)
            );
        }
    }
}
