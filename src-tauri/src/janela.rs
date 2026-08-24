//! Posição da janela entre execuções.
//!
//! Fica em arquivo próprio, ao lado de `todos.json` e nunca dentro dele: são dois
//! estados com tempos de vida e riscos diferentes, e um JSON de tarefas truncado
//! não pode levar junto a posição — nem o contrário.
//!
//! Falha de gravação aqui é **silenciosa**, ao contrário do que acontece com as
//! tarefas. Perder a posição custa uma janela no centro na próxima abertura;
//! interromper o gesto do usuário com um erro por causa disso custaria mais.

use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};

use crate::persistencia;

/// O arrastar emite um evento de movimento por quadro. Gravar em todos seria uma
/// centena de idas ao disco por gesto; o intervalo transforma isso em duas ou
/// três, e o que ficar de fora é recuperado pelo `gravar_agora` da saída.
const INTERVALO: Duration = Duration::from_millis(500);

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub struct Posicao {
    pub x: i32,
    pub y: i32,
}

/// Retângulo em pixels físicos. É o formato que a regra de visibilidade entende,
/// e existe para ela poder ser testada sem um monitor de verdade.
#[derive(Clone, Copy, Debug)]
pub struct Retangulo {
    pub x: i32,
    pub y: i32,
    pub largura: i32,
    pub altura: i32,
}

pub struct Janela {
    estado: Mutex<Estado>,
    arquivo: PathBuf,
}

struct Estado {
    atual: Option<Posicao>,
    gravada: Option<Posicao>,
    ultima_gravacao: Option<Instant>,
}

impl Janela {
    pub fn abrir(arquivo: PathBuf) -> Self {
        let gravada: Option<Posicao> = persistencia::ler_opcional(&arquivo);
        Self {
            estado: Mutex::new(Estado {
                atual: gravada,
                gravada,
                ultima_gravacao: None,
            }),
            arquivo,
        }
    }

    /// A posição pedida pelo disco, ainda **sem** validação de visibilidade:
    /// quem restaura precisa passá-la por `posicao_visivel` antes de usar.
    pub fn desejada(&self) -> Option<Posicao> {
        self.estado.lock().ok()?.atual
    }

    /// Anota o movimento sempre; toca no disco no máximo a cada `INTERVALO`.
    pub fn registrar(&self, posicao: Posicao) {
        let Ok(mut estado) = self.estado.lock() else {
            return;
        };
        estado.atual = Some(posicao);
        let vencido = estado
            .ultima_gravacao
            .map(|momento| momento.elapsed() >= INTERVALO)
            .unwrap_or(true);
        if vencido {
            gravar(&self.arquivo, &mut estado);
        }
    }

    /// Descarrega o que o intervalo tiver segurado. Chamado ao esconder e ao
    /// sair, que são os dois momentos em que o último movimento do usuário ainda
    /// não passou pelo disco e o processo pode não existir mais depois.
    pub fn gravar_agora(&self) {
        let Ok(mut estado) = self.estado.lock() else {
            return;
        };
        gravar(&self.arquivo, &mut estado);
    }
}

fn gravar(arquivo: &Path, estado: &mut Estado) {
    let Some(atual) = estado.atual else {
        return;
    };
    if estado.gravada == Some(atual) {
        return;
    }
    // O relógio anda mesmo se a gravação falhar: com o disco cheio, tentar de
    // novo a cada quadro do arrasto só multiplicaria a falha.
    estado.ultima_gravacao = Some(Instant::now());
    if persistencia::gravar(arquivo, &atual).is_ok() {
        estado.gravada = Some(atual);
    }
}

/// **A trava que torna a feature segura.** Devolve a posição já contida na área
/// útil de um monitor existente, ou `None` para "centralize".
///
/// Uma janela sem decoração, fora da barra de tarefas e restaurada fora da tela
/// não tem gesto nenhum que a alcance — nem barra de título para arrastar, nem
/// ícone na taskbar. Por isso a regra não é "aproxime", é: se a posição gravada
/// não encosta em nenhum monitor conectado (o usuário desplugou a tela em que a
/// janela estava), ela é descartada; se encosta, é puxada para dentro daquele
/// monitor **inteira**, e não só o bastante para aparecer um canto.
///
/// As áreas são as `work_area` dos monitores, não as resoluções: a barra de menu
/// do macOS e a barra de tarefas do Windows ficam de fora, senão o topo da janela
/// nasceria por baixo delas.
pub fn posicao_visivel(
    desejada: Posicao,
    tamanho: (i32, i32),
    areas: &[Retangulo],
) -> Option<Posicao> {
    let (largura, altura) = tamanho;
    let janela = Retangulo {
        x: desejada.x,
        y: desejada.y,
        largura,
        altura,
    };
    // O monitor de maior sobreposição, e não o primeiro que encosta: com a janela
    // a cavalo entre duas telas, ela pertence à que mostra mais dela.
    let melhor = areas
        .iter()
        .max_by_key(|area| sobreposicao(&janela, area))?;
    if sobreposicao(&janela, melhor) == 0 {
        return None;
    }
    Some(Posicao {
        x: prender(desejada.x, melhor.x, melhor.x + melhor.largura - largura),
        y: prender(desejada.y, melhor.y, melhor.y + melhor.altura - altura),
    })
}

/// Monitor menor que a janela deixa o intervalo invertido. Aí o canto superior
/// esquerdo é o menos ruim: prender ao máximo empurraria para fora pelo outro
/// lado, e é no canto superior esquerdo que está a barra de título arrastável.
fn prender(valor: i32, minimo: i32, maximo: i32) -> i32 {
    if maximo < minimo {
        return minimo;
    }
    valor.clamp(minimo, maximo)
}

fn sobreposicao(a: &Retangulo, b: &Retangulo) -> i64 {
    let largura = (a.x + a.largura).min(b.x + b.largura) - a.x.max(b.x);
    let altura = (a.y + a.altura).min(b.y + b.altura) - a.y.max(b.y);
    if largura <= 0 || altura <= 0 {
        return 0;
    }
    largura as i64 * altura as i64
}

#[cfg(test)]
mod tests {
    use super::*;

    const TAMANHO: (i32, i32) = (360, 480);

    fn tela_principal() -> Retangulo {
        Retangulo {
            x: 0,
            y: 0,
            largura: 1920,
            altura: 1080,
        }
    }

    /// Uma tela à direita da principal, como um monitor externo plugado.
    fn tela_secundaria() -> Retangulo {
        Retangulo {
            x: 1920,
            y: 0,
            largura: 1440,
            altura: 900,
        }
    }

    #[test]
    fn posicao_inteiramente_visivel_passa_intacta() {
        let pedida = Posicao { x: 300, y: 200 };
        let obtida = posicao_visivel(pedida, TAMANHO, &[tela_principal()]);
        assert_eq!(obtida, Some(pedida));
    }

    /// O caso do monitor desplugado: a posição gravada não encosta em nada do que
    /// resta, e a janela precisa voltar ao centro em vez de nascer invisível.
    #[test]
    fn posicao_fora_de_todos_os_monitores_manda_centralizar() {
        let orfa = Posicao { x: 2400, y: 300 };
        assert_eq!(posicao_visivel(orfa, TAMANHO, &[tela_principal()]), None);
    }

    #[test]
    fn sem_monitor_nenhum_manda_centralizar() {
        assert_eq!(posicao_visivel(Posicao { x: 0, y: 0 }, TAMANHO, &[]), None);
    }

    /// Meio corpo para fora da borda direita: encosta, então é puxada para
    /// dentro — e por inteiro, não só o bastante para aparecer um canto.
    #[test]
    fn janela_meio_para_fora_e_puxada_inteira_para_dentro() {
        let obtida = posicao_visivel(Posicao { x: 1800, y: 900 }, TAMANHO, &[tela_principal()])
            .expect("encosta na tela, logo deve ser corrigida");
        assert_eq!(obtida, Posicao { x: 1560, y: 600 });
        assert!(obtida.x + TAMANHO.0 <= 1920 && obtida.y + TAMANHO.1 <= 1080);
    }

    /// Coordenada negativa é legítima num monitor à esquerda do principal, mas
    /// não fora dele: o topo esquerdo é o limite.
    #[test]
    fn borda_superior_esquerda_e_respeitada() {
        let obtida = posicao_visivel(Posicao { x: -200, y: -150 }, TAMANHO, &[tela_principal()])
            .expect("encosta na tela");
        assert_eq!(obtida, Posicao { x: 0, y: 0 });
    }

    /// A `work_area` começa abaixo da barra de menu; restaurar em y=0 colocaria o
    /// topo arrastável por baixo dela.
    #[test]
    fn area_util_desloca_o_topo_para_baixo_da_barra_de_menu() {
        let com_barra = Retangulo {
            x: 0,
            y: 38,
            largura: 1920,
            altura: 1042,
        };
        let obtida =
            posicao_visivel(Posicao { x: 100, y: 0 }, TAMANHO, &[com_barra]).expect("encosta");
        assert_eq!(obtida, Posicao { x: 100, y: 38 });
    }

    /// A cavalo entre duas telas, ela pertence à que mostra mais dela — e é para
    /// dentro dessa que é puxada.
    #[test]
    fn janela_entre_duas_telas_vai_para_a_que_mostra_mais() {
        let obtida = posicao_visivel(
            Posicao { x: 1830, y: 100 },
            TAMANHO,
            &[tela_principal(), tela_secundaria()],
        )
        .expect("encosta nas duas");
        // 90px na principal contra 270px na secundária: a secundária ganha.
        assert_eq!(obtida, Posicao { x: 1920, y: 100 });
    }

    /// Monitor menor que a janela não tem posição que a contenha; o canto superior
    /// esquerdo mantém a barra de título alcançável.
    #[test]
    fn monitor_menor_que_a_janela_ancora_no_canto() {
        let minusculo = Retangulo {
            x: 0,
            y: 0,
            largura: 200,
            altura: 200,
        };
        let obtida = posicao_visivel(Posicao { x: 50, y: 50 }, TAMANHO, &[minusculo])
            .expect("encosta na tela");
        assert_eq!(obtida, Posicao { x: 0, y: 0 });
    }

    /// Encostar por um pixel ainda conta como "existe uma tela para ela", e o
    /// resultado é uma janela inteiramente visível.
    #[test]
    fn um_pixel_de_sobreposicao_ainda_recupera_a_janela() {
        let obtida = posicao_visivel(Posicao { x: 1919, y: 1079 }, TAMANHO, &[tela_principal()])
            .expect("um pixel ainda encosta");
        assert_eq!(obtida, Posicao { x: 1560, y: 600 });
    }

    #[test]
    fn posicao_ausente_no_disco_nao_inventa_nada() {
        let arquivo = std::env::temp_dir()
            .join(format!("nocom-janela-{}", std::process::id()))
            .join("janela.json");
        let _ = std::fs::remove_dir_all(arquivo.parent().expect("pai"));
        assert_eq!(Janela::abrir(arquivo).desejada(), None);
    }

    /// Ida e volta pelo disco: o que foi registrado é o que a próxima execução lê.
    #[test]
    fn posicao_registrada_sobrevive_a_reabertura() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-janela-ok-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("janela.json");

        let janela = Janela::abrir(arquivo.clone());
        janela.registrar(Posicao { x: 640, y: 480 });
        janela.gravar_agora();

        assert_eq!(
            Janela::abrir(arquivo).desejada(),
            Some(Posicao { x: 640, y: 480 })
        );
        let _ = std::fs::remove_dir_all(&diretorio);
    }

    /// O intervalo segura o disco, mas não a memória: o último movimento do gesto
    /// precisa estar lá para o `gravar_agora` da saída encontrá-lo.
    #[test]
    fn movimento_segurado_pelo_intervalo_e_descarregado_na_saida() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-janela-fl-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("janela.json");

        let janela = Janela::abrir(arquivo.clone());
        // A primeira grava na hora; as seguintes caem dentro do intervalo.
        janela.registrar(Posicao { x: 10, y: 10 });
        janela.registrar(Posicao { x: 20, y: 20 });
        janela.registrar(Posicao { x: 30, y: 30 });
        assert_eq!(
            Janela::abrir(arquivo.clone()).desejada(),
            Some(Posicao { x: 10, y: 10 }),
            "o intervalo deveria ter segurado os movimentos seguintes"
        );

        janela.gravar_agora();
        assert_eq!(
            Janela::abrir(arquivo).desejada(),
            Some(Posicao { x: 30, y: 30 }),
            "a saída deveria ter descarregado o último movimento"
        );
        let _ = std::fs::remove_dir_all(&diretorio);
    }

    /// Disco que não aceita gravação não pode derrubar o app nem o gesto: a
    /// posição segue valendo em memória.
    #[test]
    fn falha_de_gravacao_e_silenciosa_e_nao_perde_a_memoria() {
        let pai = std::env::temp_dir().join(format!("nocom-janela-ro-{}", std::process::id()));
        std::fs::write(&pai, b"nao sou diretorio").expect("criar o falso pai");

        let janela = Janela::abrir(pai.join("janela.json"));
        janela.registrar(Posicao { x: 77, y: 88 });
        janela.gravar_agora();
        assert_eq!(janela.desejada(), Some(Posicao { x: 77, y: 88 }));

        let _ = std::fs::remove_file(&pai);
    }
}
