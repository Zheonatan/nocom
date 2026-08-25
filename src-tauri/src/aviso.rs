//! O aviso do sistema — a notificação nativa dos lembretes (Adendo 14), e o
//! único lugar do backend que sabe que existe mais de um sistema operacional
//! para notificar.
//!
//! # Por que há duas implementações aqui
//!
//! **Não é preciosismo, é a diferença entre uma API viva e uma morta**, e a
//! medição está registrada porque ela custou uma rodada inteira de depuração.
//!
//! A primeira versão usava `tauri-plugin-notification` nos três sistemas, e no
//! macOS **ela não entregava nada**. O caminho do plugin, lido no código dele:
//! `NotificationBuilder::show` → `notify-rust` → `mac-notification-sys` →
//! `NSUserNotification`. Essa última é a API que a Apple aposentou, e num macOS
//! 27 ela **aceita a chamada, devolve `Ok`, e descarta em silêncio**.
//!
//! Três fatos foram medidos, nesta ordem, e cada um matou uma hipótese:
//!
//! 1. Os alarmes chegavam ao fim do funil: as tarefas do teste ficaram com
//!    `reminder` marcado e `remind_at` nulo, e `remind_at` só vira nulo dentro de
//!    `lembretes_vencidos`. O agendamento estava certo; o que falhava era a última
//!    linha.
//! 2. Chamar `mac_notification_sys::set_application` + `send_notification` direto,
//!    fora do app, devolveu `Ok` nos dois — **e o `com.nocom.app` não entrou na
//!    lista de apps do Notification Center**. "Ok" ali só quer dizer que a
//!    chamada foi aceita, não que alguém a entregou.
//! 3. A mesma notificação pelo `UNUserNotificationCenter`, de um `.app` assinado
//!    com o mesmo bundle identifier, **apareceu na tela**.
//!
//! O sintoma que fecha o argumento: o app **nem aparecia** em Ajustes do Sistema
//! › Notificações. Um app só entra naquela lista quando pede autorização pela API
//! corrente — e a API antiga não pede nada.
//!
//! **Fora do macOS o plugin continua servindo**, e por isso ele fica: por baixo
//! dele o `notify-rust` fala WinRT no Windows e D-Bus no Linux, que são as APIs
//! correntes dos dois sistemas. Trocar o que funciona por interop escrita à mão
//! seria custo sem ganho.
//!
//! # A autorização é real deste lado, e isso muda o que o app pode prometer
//!
//! O Adendo 14 nasceu registrando que o app "não sabe se a notificação chegou, e
//! não finge saber", porque `request_permission` do plugin devolve `Granted` sem
//! consultar o sistema — está no código dele, sem ramo nenhum. Com o
//! `UNUserNotificationCenter` existe um estado de autorização de verdade: o
//! sistema responde se concedeu, e uma recusa vira uma linha no stderr em vez de
//! um silêncio.
//!
//! # Nada aqui falha para cima
//!
//! Tudo neste módulo é chamado fora de qualquer gesto do usuário — pelo vigia,
//! que roda sozinho a cada trinta segundos. Não há Promise a rejeitar nem tela
//! esperando resposta, e um sistema que recusa a notificação custa o aviso, não o
//! app. É a mesma régua de `atualizar_tooltip`.

use tauri::AppHandle;

/// Pede ao sistema autorização para notificar.
///
/// **É este pedido que faz o app aparecer em Ajustes do Sistema › Notificações**,
/// e é ele que abre o diálogo de permissão — uma vez na vida da instalação; as
/// chamadas seguintes devolvem a decisão já tomada, sem diálogo nenhum.
///
/// **Chamado com preguiça, e de propósito.** Não roda na abertura do app: quem
/// nunca armou um lembrete não deve receber um diálogo de permissão de um
/// aplicativo de lista de tarefas — seria cobrar uma configuração de quem não
/// pediu nada, que é justamente o que este app evita em toda outra decisão. Os
/// dois gatilhos são o gesto e a herança dele: armar um lembrete, e abrir o app
/// com algum lembrete já armado de uma execução anterior.
pub fn preparar(app: &AppHandle) {
    imp::preparar(app);
}

/// Mostra uma notificação. `titulo` é o título da tarefa; `corpo`, a distância
/// até a data.
pub fn mostrar(app: &AppHandle, titulo: &str, corpo: &str) {
    imp::mostrar(app, titulo, corpo);
}

#[cfg(target_os = "macos")]
mod imp {
    use block2::RcBlock;
    use objc2::runtime::Bool;
    use objc2_foundation::{NSBundle, NSError, NSString};
    use objc2_user_notifications::{
        UNAuthorizationOptions, UNMutableNotificationContent, UNNotificationRequest,
        UNUserNotificationCenter,
    };
    use tauri::AppHandle;

    pub fn preparar(_app: &AppHandle) {
        if !dentro_de_um_bundle() {
            return;
        }
        // `Alert | Sound`, e não `Badge`: o app não tem contador no ícone do Dock
        // (ele nem fica no Dock), e pedir uma permissão que não vai ser usada é
        // pedir a mais.
        let resposta = RcBlock::new(|concedido: Bool, erro: *mut NSError| {
            if !concedido.as_bool() {
                eprintln!(
                    "[lembretes] o sistema não autorizou as notificações; \
                     os lembretes ficam armados e não vão aparecer na tela"
                );
            }
            relatar(erro, "autorização");
        });
        UNUserNotificationCenter::currentNotificationCenter()
            .requestAuthorizationWithOptions_completionHandler(
                UNAuthorizationOptions::Alert | UNAuthorizationOptions::Sound,
                &resposta,
            );
    }

    pub fn mostrar(_app: &AppHandle, titulo: &str, corpo: &str) {
        if !dentro_de_um_bundle() {
            return;
        }
        let conteudo = UNMutableNotificationContent::new();
        conteudo.setTitle(&NSString::from_str(titulo));
        conteudo.setBody(&NSString::from_str(corpo));

        // Identificador único por aviso. **Reaproveitar um identificador SUBSTITUI
        // a notificação anterior** em vez de somar — duas tarefas vencendo no mesmo
        // tique virariam um aviso só, e a segunda sumiria sem nunca ter sido vista.
        let identificador = uuid::Uuid::new_v4().to_string();
        // `trigger: None` quer dizer "entregue agora". O agendamento é nosso, do
        // vigia — passar um gatilho de data aqui seria um segundo agendador, no
        // sistema, competindo com o que já decide a hora.
        let pedido = UNNotificationRequest::requestWithIdentifier_content_trigger(
            &NSString::from_str(&identificador),
            &conteudo,
            None,
        );

        let entrega = RcBlock::new(|erro: *mut NSError| relatar(erro, "entrega"));
        UNUserNotificationCenter::currentNotificationCenter()
            .addNotificationRequest_withCompletionHandler(&pedido, Some(&entrega));
    }

    /// O processo está rodando de dentro de um `.app`?
    ///
    /// **Esta guarda existe porque a ausência dela derrubava o app inteiro.** O
    /// `+[UNUserNotificationCenter currentNotificationCenter]` não devolve erro
    /// quando não há bundle: ele **lança** `NSInternalInconsistencyException`
    /// ("bundleProxyForCurrentProcess is nil"), e exceção de Objective-C
    /// atravessando Rust é `abort` — o app morria na abertura, antes da janela.
    ///
    /// E o caso não é exótico, é o **dia a dia de quem desenvolve**: `tauri dev`
    /// roda o binário solto em `target/debug/`, sem `.app` em volta. A primeira
    /// versão desta implementação foi escrita e testada só na build empacotada, e
    /// quebrou o `dev` de quem a escreveu.
    ///
    /// **A pergunta é feita ao bundle, e não ao perfil de compilação.** Um
    /// `cfg!(debug_assertions)` ou o `tauri::is_dev()` responderiam ao caso do
    /// `tauri dev` e continuariam derrubando quem roda `target/release/nocom`
    /// direto — o que é exatamente o mesmo problema com outro nome. O que decide
    /// é haver bundle identifier, que é o que o framework foi buscar e não achou.
    ///
    /// O silêncio aqui é o comportamento certo, e é o que estava documentado
    /// desde o começo: no macOS, notificação exige app empacotado. O que faltava
    /// era o app **saber disso** em vez de descobrir do jeito difícil.
    fn dentro_de_um_bundle() -> bool {
        let dentro = NSBundle::mainBundle().bundleIdentifier().is_some();
        if !dentro {
            // Uma vez por execução: o vigia chama `mostrar` a cada lembrete que
            // vence, e uma linha por aviso encheria o terminal do `dev` com o
            // mesmo recado.
            static AVISADO: std::sync::Once = std::sync::Once::new();
            AVISADO.call_once(|| {
                eprintln!(
                    "[lembretes] processo fora de um .app — no macOS a notificação \
                     exige o app empacotado, então os lembretes ficam armados e \
                     não vão aparecer na tela. Normal em `tauri dev`."
                );
            });
        }
        dentro
    }

    /// Põe no stderr o erro que o sistema devolveu, se devolveu algum.
    ///
    /// Existe porque o silêncio foi exatamente o que fez esta implementação
    /// demorar a ser encontrada: a versão anterior engolia o resultado com um
    /// `let _ =`, e não havia como distinguir "o sistema recusou" de "o alarme
    /// nunca chegou aqui".
    fn relatar(erro: *mut NSError, etapa: &str) {
        if erro.is_null() {
            return;
        }
        // Seguro: o bloco de callback só é chamado pelo framework com um ponteiro
        // válido ou nulo, e o nulo já saiu acima.
        let erro = unsafe { &*erro };
        eprintln!("[lembretes] {etapa} recusada pelo sistema: {}", erro.localizedDescription());
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    use tauri::AppHandle;
    use tauri_plugin_notification::NotificationExt;

    /// No Windows e no Linux não existe pedido de autorização a fazer: quem
    /// decide se a notificação aparece é o assistente de foco e o daemon de
    /// notificação, e nenhum dos dois tem uma porta para o app bater antes.
    pub fn preparar(_app: &AppHandle) {}

    pub fn mostrar(app: &AppHandle, titulo: &str, corpo: &str) {
        if let Err(erro) = app.notification().builder().title(titulo).body(corpo).show() {
            eprintln!("[lembretes] o sistema recusou a notificação: {erro}");
        }
    }
}
