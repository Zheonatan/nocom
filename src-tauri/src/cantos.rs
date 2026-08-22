//! Os cantos da janela, no Windows.
//!
//! A janela é `decorations: false` + `transparent: true`, e quem desenha a
//! superfície visível — fundo, borda e cantos de 14px — é o `Card` do App. Só
//! que no Windows 11 quem tem a última palavra sobre a forma da janela não é o
//! app: o DWM recorta **toda** janela de nível superior num retângulo de cantos
//! arredondados próprios (8px) e ainda passa um fio de 1px por essa curva.
//!
//! O resultado é a quina que se vê na captura: dois arcos concorrentes no mesmo
//! canto, o do sistema mais fechado que o do app, e o fio claro do sistema
//! cortando por cima do desenho. Nada disso é corrigível em CSS — o recorte
//! acontece depois de a webview ter pintado.
//!
//! São dois atributos do DWM, e os dois precisam ser ditos:
//!
//! - **não arredondar**, porque a janela já tem cantos próprios e o que o
//!   sistema faz por cima só pode brigar com eles;
//! - **borda sem cor**, porque o fio de 1px é desenhado mesmo com o recorte
//!   desligado, e aí ele viraria um retângulo claro em volta do card.
//!
//! Nos outros sistemas isto é um no-op declarado: o macOS respeita o alfa da
//! janela sem intervenção, e no Linux quem arredonda é o compositor a partir do
//! próprio conteúdo. A função existe nos três para o `setup` não precisar saber
//! em qual está rodando.

use tauri::WebviewWindow;

#[cfg(target_os = "windows")]
pub fn assentar(janela: &WebviewWindow) {
    use core::ffi::c_void;

    /// `DWMWA_WINDOW_CORNER_PREFERENCE`.
    const PREFERENCIA_DE_CANTO: u32 = 33;
    /// `DWMWCP_DONOTROUND` — o canto fica reto e o recorte sai da frente.
    const NAO_ARREDONDAR: u32 = 1;
    /// `DWMWA_BORDER_COLOR`.
    const COR_DA_BORDA: u32 = 34;
    /// `DWMWA_COLOR_NONE` — não é uma cor transparente, é a ausência do fio.
    const SEM_COR: u32 = 0xFFFF_FFFE;

    // Declarada à mão, como o `GetLocaleInfoEx` do `formato.rs`: é uma função de
    // uma assinatura só, e a crate `windows` inteira entraria na árvore para
    // trazer justamente ela. O `HWND` do Tauri é um `*mut c_void` embrulhado, o
    // que deixa a declaração independente da versão da crate que ele usa por
    // dentro.
    #[link(name = "dwmapi")]
    extern "system" {
        fn DwmSetWindowAttribute(
            hwnd: *mut c_void,
            dwAttribute: u32,
            pvAttribute: *const c_void,
            cbAttribute: u32,
        ) -> i32;
    }

    let Ok(hwnd) = janela.hwnd() else {
        return;
    };

    // Sem `?` e sem log: os dois atributos nasceram no Windows 11 (build 22000),
    // e no Windows 10 a chamada volta `E_INVALIDARG` **em toda abertura**. Lá o
    // DWM não arredonda nem passa fio nenhum, então a falha é exatamente o
    // comportamento desejado — reportá-la seria ruído garantido num sistema onde
    // não há nada a corrigir.
    for (atributo, valor) in [
        (PREFERENCIA_DE_CANTO, NAO_ARREDONDAR),
        (COR_DA_BORDA, SEM_COR),
    ] {
        unsafe {
            DwmSetWindowAttribute(
                hwnd.0,
                atributo,
                core::ptr::addr_of!(valor).cast(),
                core::mem::size_of::<u32>() as u32,
            );
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn assentar(_janela: &WebviewWindow) {}
