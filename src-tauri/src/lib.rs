//! Os comandos do contrato. Cada um que pode falhar devolve `Result<T, String>`,
//! porque a rejeição da Promise é o canal que o frontend usa para mostrar o erro
//! sem quebrar a UI.
//!
//! Os argumentos chegam do webview em camelCase (`tabId`) e são recebidos aqui em
//! snake_case (`tab_id`): é a conversão que o `#[tauri::command]` faz sozinho, e
//! é por isso que o contrato descreve `{ tabId }` do lado do JS e `tab_id` do
//! lado do Rust sem nenhum `rename` no meio.

mod idioma;
mod janela;
mod persistencia;
mod store;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, State, WebviewWindow, WindowEvent};

use idioma::Idioma;
use janela::{Janela, Posicao, Retangulo};
use store::{AbaFechada, Store, Tab, Todo};

/// Rótulo da única janela, fixado no `tauri.conf.json`. O tray precisa achá-la
/// pelo nome, e depender do padrão implícito deixaria o ícone virar um botão que
/// não faz nada se alguém renomeasse a janela.
const JANELA: &str = "main";

/// Combinação do atalho global, num lugar só para trocar sem caçar string.
///
/// `Control+Option+T` é `⌃⌥T`, escolhido por eliminação no Adendo 2: `⌘Space` e
/// `⌘⌥Space` são do Spotlight, `⌃Space` alterna fonte de entrada no macOS, e
/// `⌘⇧T` reabre a última aba do navegador — um atalho **global** vence o do app
/// em foco, então sequestrá-lo tiraria do usuário uma função que ele usa o dia
/// inteiro. O teste de unidade prende essa decisão: trocar a constante por algo
/// com `⌘` quebra a suíte de propósito.
#[cfg(desktop)]
const ATALHO_GLOBAL: &str = "Control+Option+T";

/// A mesma combinação escrita para os olhos do usuário, no menu do tray. O macOS
/// escreve modificadores como símbolos; escrever "Control+Option+T" numa tela de
/// Mac destoaria de todos os outros menus do sistema.
#[cfg(target_os = "macos")]
const ATALHO_VISIVEL: &str = "\u{2303}\u{2325}T";
#[cfg(not(target_os = "macos"))]
const ATALHO_VISIVEL: &str = "Ctrl+Alt+T";

// --- abas ---

// Os comandos que tocam a `Store` são `async` de propósito: comando síncrono
// roda na thread principal, e toda mutação grava em disco segurando o cadeado —
// um disco lento seguraria junto o event loop (arrasto de janela, tray, tudo).
// `async` os manda para o pool de tarefas, e a thread principal nunca espera
// I/O. As leituras vão junto porque disputam o mesmo cadeado de uma mutação em
// curso, e esperariam a gravação dela do mesmo jeito.

#[tauri::command]
async fn list_tabs(store: State<'_, Store>) -> Result<Vec<Tab>, String> {
    store.listar_abas()
}

#[tauri::command]
async fn create_tab(name: String, app: AppHandle, store: State<'_, Store>) -> Result<Tab, String> {
    mutar(&app, || store.criar_aba(&name))
}

#[tauri::command]
async fn rename_tab(
    id: String,
    name: String,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Tab, String> {
    mutar(&app, || store.renomear_aba(&id, &name))
}

/// Devolve o que apagou — a aba e as tarefas dela — porque fechar uma aba destrói
/// várias tarefas de uma vez, e o desfazer curto do Adendo 4 só é possível se o
/// frontend receber exatamente o que precisa repor.
#[tauri::command]
async fn close_tab(id: String, app: AppHandle, store: State<'_, Store>) -> Result<AbaFechada, String> {
    mutar(&app, || store.fechar_aba(&id))
}

/// O desfazer do fechamento. Passa por `mutar` porque as tarefas repostas voltam
/// a contar no tooltip.
#[tauri::command]
async fn restore_tab(
    tab: Tab,
    todos: Vec<Todo>,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Vec<Tab>, String> {
    mutar(&app, move || store.restaurar_aba(tab, todos))
}

/// Persiste qual aba a janela mostra, para a próxima execução abrir onde o
/// usuário parou. Não muda contagem nenhuma, mas passa por `mutar` como as outras
/// mutações: a regra "toda mutação funila por aqui" é fácil de manter certa, e
/// "estas seis sim, aquela não" é a que alguém quebra ao acrescentar a próxima.
#[tauri::command]
async fn set_active_tab(id: String, app: AppHandle, store: State<'_, Store>) -> Result<(), String> {
    mutar(&app, || store.definir_aba_ativa(&id))
}

#[tauri::command]
async fn get_active_tab(store: State<'_, Store>) -> Result<String, String> {
    store.aba_ativa()
}

// --- tarefas ---

#[tauri::command]
async fn list_todos(tab_id: String, store: State<'_, Store>) -> Result<Vec<Todo>, String> {
    store.listar(&tab_id)
}

#[tauri::command]
async fn add_todo(
    title: String,
    tab_id: String,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Todo, String> {
    mutar(&app, || store.acrescentar(&title, &tab_id))
}

/// Renomear não mexe na contagem, mas passa por `mutar` como as outras: a regra
/// "toda mutação funila por aqui" é fácil de manter certa, e "estas cinco sim,
/// aquela não" é a que alguém quebra ao acrescentar o próximo comando.
#[tauri::command]
async fn rename_todo(
    id: String,
    title: String,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Todo, String> {
    mutar(&app, || store.renomear(&id, &title))
}

#[tauri::command]
async fn toggle_todo(id: String, app: AppHandle, store: State<'_, Store>) -> Result<Todo, String> {
    mutar(&app, || store.alternar(&id))
}

#[tauri::command]
async fn delete_todo(id: String, app: AppHandle, store: State<'_, Store>) -> Result<(), String> {
    mutar(&app, || store.remover(&id))
}

/// Limpa as concluídas **da aba onde o botão está**, e devolve o que restou nela.
/// Apagar as concluídas das outras abas seria destruir o que não está na tela.
#[tauri::command]
async fn clear_completed(
    tab_id: String,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Vec<Todo>, String> {
    mutar(&app, || store.limpar_concluidas(&tab_id))
}

/// Desfazer uma remoção. Recebe as tarefas como o frontend as tinha e as devolve
/// à lista com o `id` e o `created_at` originais.
///
/// **Lote vazio é `Err`** (Esclarecimento 5.3). Antes das abas era no-op, porque a
/// resposta era a lista inteira e não havia como um lote vazio mentir. Com o
/// retorno passando a ser a lista da aba do lote, um lote vazio não tem aba de onde
/// tirar a lista, e um `Ok(vec![])` **pareceria sucesso e esvaziaria a tela** — a
/// lista da aba desapareceria sem nada ter sido apagado no disco. Falha silenciosa
/// indistinguível de perda de dados é o que este app foi escrito para nunca fazer.
///
/// Desfazer de zero tarefa não é gesto que a interface ofereça, então um lote vazio
/// aqui é bug de quem chamou: o frontend segue tratando o caso como no-op **do lado
/// dele**, sem chamar o backend, e a rejeição é rede de segurança — a mesma relação
/// que o limite de 200 caracteres tem com o `maxLength` do input.
///
/// **A assinatura não mudou com as abas**, porque a tarefa já carrega a sua aba no
/// `tab_id`. O que mudou é o escopo (Esclarecimento 5.1): a aba de cada tarefa
/// restaurada precisa existir — restaurar para uma aba já fechada criaria uma
/// tarefa órfã, no arquivo e na contagem do tray mas em nenhuma lista da tela —, e
/// **todas as tarefas de uma chamada são da mesma aba**, porque os dois desfazeres
/// que este comando atende acontecem dentro de uma aba só. Um lote misturado
/// reprova a chamada inteira.
///
/// A resposta é a lista completa **daquela aba**, em ordem canônica: o mesmo
/// escopo que `list_todos` devolve, para a tela não ter que filtrar um payload que
/// não pediu.
#[tauri::command]
async fn restore_todos(
    todos: Vec<Todo>,
    app: AppHandle,
    store: State<'_, Store>,
) -> Result<Vec<Todo>, String> {
    mutar(&app, || store.restaurar(todos))
}

/// **Ponto único de atualização do tray.** Toda mutação passa por aqui, então o
/// tooltip não depende de alguém lembrar de acrescentar uma chamada no comando
/// novo — comando que não funila por `mutar` simplesmente não existe.
///
/// A atualização vem **depois** do `?`: se a mutação falhou, não há contagem nova
/// para mostrar.
fn mutar<T>(app: &AppHandle, operacao: impl FnOnce() -> Result<T, String>) -> Result<T, String> {
    let resultado = operacao()?;
    atualizar_tooltip(app);
    Ok(resultado)
}

/// Quantas faltam, no tooltip do ícone — a informação que o app existe para dar,
/// legível sem abrir a janela.
///
/// **Soma as pendentes de todas as abas**, e não só as da aba ativa: é o trabalho
/// que resta no app inteiro. Contando só a ativa, o número mudaria ao trocar de
/// aba sem nada ter sido concluído, e o ícone deixaria de responder à pergunta
/// que ele existe para responder.
///
/// **Nada aqui pode falhar para cima.** A tarefa já está gravada quando esta
/// função roda; transformar "não consegui redesenhar um tooltip" em erro de
/// `add_todo` faria o frontend desfazer na tela uma escrita que o disco aceitou.
fn atualizar_tooltip(app: &AppHandle) {
    let Some(store) = app.try_state::<Store>() else {
        return;
    };
    let Ok(pendentes) = store.pendentes() else {
        return;
    };
    let Some(bandeja) = app.try_state::<TrayIcon>() else {
        return;
    };
    let _ = bandeja.set_tooltip(Some(texto_do_tooltip(pendentes, idioma::atual())));
}

/// O texto do tooltip, na língua do sistema.
///
/// A frase mora em `idioma::tooltip` junto do resto da cópia do tray; o que fica
/// aqui é a ligação com a contagem. **O idioma é parâmetro e não é lido aqui
/// dentro**: um teste de cópia não pode depender do locale da máquina que roda a
/// suíte, senão a mesma asserção passa no laptop de quem escreveu e falha na CI.
fn texto_do_tooltip(pendentes: usize, lingua: Idioma) -> String {
    idioma::tooltip(pendentes, lingua)
}

/// Esconde em vez de fechar: a janela é flutuante e sem decoração, então o botão
/// de fechar que o frontend desenha some da tela sem encerrar o processo.
#[tauri::command]
async fn hide_window(window: tauri::Window) -> Result<(), String> {
    // Esconder é o "terminei por agora" do usuário, e é o último instante em que
    // a posição ainda vale alguma coisa se o processo for morto sem aviso.
    descarregar_posicao(window.app_handle());
    window
        .hide()
        .map_err(|erro| format!("Falha ao esconder a janela: {erro}"))
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    encerrar(&app);
}

/// Único caminho de saída, compartilhado pelo comando e pelo item "Sair" do tray:
/// dois caminhos divergiriam no dia em que um deles precisar gravar algo antes.
/// Hoje já precisa — a posição segurada pelo intervalo sai por aqui.
fn encerrar(app: &AppHandle) {
    descarregar_posicao(app);
    app.exit(0);
}

fn descarregar_posicao(app: &AppHandle) {
    if let Some(estado) = app.try_state::<Janela>() {
        estado.gravar_agora();
    }
}

/// Mostra e dá foco, ou esconde. Mostrar sem focar deixaria a janela atrás da que
/// estava na frente, e o gesto pareceria não ter funcionado.
fn alternar_janela(app: &AppHandle) {
    let Some(janela) = app.get_webview_window(JANELA) else {
        return;
    };
    if janela.is_visible().unwrap_or(false) {
        descarregar_posicao(app);
        let _ = janela.hide();
    } else {
        let _ = janela.show();
        let _ = janela.set_focus();
    }
}

/// Devolve a janela ao lugar onde o usuário a deixou, **se aquele lugar ainda
/// existir**. Quando não existir, não faz nada: o `center: true` do
/// `tauri.conf.json` já colocou a janela no meio da tela, e o meio da tela é
/// exatamente o destino que a regra pede nesse caso.
fn restaurar_posicao(janela: &WebviewWindow) {
    let Some(estado) = janela.try_state::<Janela>() else {
        return;
    };
    let Some(desejada) = estado.desejada() else {
        return;
    };
    let Ok(tamanho) = janela.outer_size() else {
        return;
    };
    // `work_area` e não `size`: a barra de menu do macOS e a barra de tarefas do
    // Windows não são área utilizável, e restaurar por baixo delas esconderia
    // justamente a barra de título arrastável.
    let areas: Vec<Retangulo> = janela
        .available_monitors()
        .unwrap_or_default()
        .iter()
        .map(|monitor| {
            let area = monitor.work_area();
            Retangulo {
                x: area.position.x,
                y: area.position.y,
                largura: area.size.width as i32,
                altura: area.size.height as i32,
            }
        })
        .collect();

    if let Some(segura) =
        janela::posicao_visivel(desejada, (tamanho.width as i32, tamanho.height as i32), &areas)
    {
        let _ = janela.set_position(PhysicalPosition::new(segura.x, segura.y));
    }
}

fn acompanhar_movimento(janela: &WebviewWindow) {
    let app = janela.app_handle().clone();
    janela.on_window_event(move |evento| {
        let WindowEvent::Moved(posicao) = evento else {
            return;
        };
        // Uma janela escondida pode reportar posições artificiais em algumas
        // plataformas, e gravá-las trocaria o lugar escolhido pelo usuário por
        // um valor que ele nunca viu.
        let visivel = app
            .get_webview_window(JANELA)
            .and_then(|alvo| alvo.is_visible().ok())
            .unwrap_or(false);
        if !visivel {
            return;
        }
        if let Some(estado) = app.try_state::<Janela>() {
            estado.registrar(Posicao {
                x: posicao.x,
                y: posicao.y,
            });
        }
    });
}

/// Registra `⌃⌥T` como atalho de sistema. **Não devolve `Result` de propósito.**
///
/// A combinação pode já pertencer a outro aplicativo, e nesse caso o registro
/// falha. Deixar essa falha subir pelo `setup` trocaria uma conveniência por um
/// app que não abre — enquanto o tray, que é o caminho garantido, continua ali
/// funcionando. Então tudo aqui é registrado em `stderr` e seguido em frente.
#[cfg(desktop)]
fn montar_atalho_global(app: &AppHandle) {
    use std::str::FromStr;
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

    let atalho = match Shortcut::from_str(ATALHO_GLOBAL) {
        Ok(atalho) => atalho,
        Err(erro) => {
            eprintln!("[atalho] '{ATALHO_GLOBAL}' não é uma combinação válida: {erro}");
            return;
        }
    };

    if let Err(erro) = app.plugin(tauri_plugin_global_shortcut::Builder::new().build()) {
        eprintln!("[atalho] o plugin de atalho global não subiu: {erro}");
        return;
    }

    let registro = app.global_shortcut().on_shortcut(atalho, |app, _, evento| {
        // **Uma pressionada, uma alternância.** O plugin entrega `Pressed` e
        // `Released`; reagir aos dois mostraria e esconderia a janela no mesmo
        // gesto, e o atalho pareceria não funcionar.
        if evento.state == ShortcutState::Pressed {
            // A mesma função do clique esquerdo no tray, e não um segundo
            // caminho: dois caminhos divergem no dia em que um precisar fazer
            // algo a mais.
            alternar_janela(app);
        }
    });

    if let Err(erro) = registro {
        eprintln!(
            "[atalho] não foi possível registrar {ATALHO_GLOBAL}, provavelmente já está \
             em uso por outro aplicativo: {erro}. O app segue funcionando pelo tray."
        );
    }
}

/// **A via de volta da janela escondida.** Sem decoração do sistema e fora da
/// barra de tarefas, uma janela escondida por `hide_window` ou pelo `Escape` não
/// tinha gesto nenhum que a trouxesse de volta — só encerrar o processo pelo
/// Monitor de Atividade. O tray é descobrível e, ao contrário de um atalho
/// global, não disputa combinação de teclas com nada do usuário.
fn montar_tray(app: &AppHandle) -> tauri::Result<()> {
    // A combinação vai no rótulo, e não no campo de acelerador do item: o
    // acelerador de um menu de tray registraria a mesma tecla por um segundo
    // caminho, e o atalho global já é quem cuida disso. Aqui ela é só o letreiro
    // que torna o atalho descobrível.
    let lingua = idioma::atual();
    let rotulo = idioma::menu_alternar(ATALHO_VISIVEL, lingua);
    let alternar = MenuItem::with_id(app, "alternar", &rotulo, true, None::<&str>)?;
    let sair = MenuItem::with_id(app, "sair", idioma::menu_sair(lingua), true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&alternar, &sair])?;

    let mut builder = TrayIconBuilder::new()
        // Nome próprio, igual nas duas línguas — e substituído pelo texto com a
        // contagem no `atualizar_tooltip` que roda logo depois do `montar_tray`.
        .tooltip("Mini To-Do")
        .menu(&menu)
        // O clique esquerdo alterna a janela, então o menu fica no direito; com o
        // padrão, o clique esquerdo abriria o menu e o gesto principal sumiria.
        .show_menu_on_left_click(false)
        .on_menu_event(|app, evento| match evento.id().as_ref() {
            "alternar" => alternar_janela(app),
            "sair" => encerrar(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, evento| {
            // Só no soltar do botão esquerdo: `Down` e `Up` chegam os dois, e
            // reagir aos dois alternaria a janela duas vezes por clique.
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = evento
            {
                alternar_janela(tray.app_handle());
            }
        });
    // O ícone do app já está em `icons/`; sem ele o tray subiria como um espaço
    // vazio e clicável, que é pior que não ter tray.
    if let Some(icone) = app.default_window_icon().cloned() {
        builder = builder.icon(icone);
    }
    // O handle fica no estado porque o tooltip é redesenhado a cada mutação, e
    // sem guardá-lo o ícone só saberia a contagem que existia quando ele nasceu.
    app.manage(builder.build(app)?);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        // O caminho só existe com o `AppHandle` na mão, então o estado nasce aqui
        // e não em `default()`.
        .setup(|app| {
            let diretorio = app.path().app_data_dir()?;
            app.manage(Store::abrir(diretorio.join("todos.json")));
            // Arquivo próprio, ao lado das tarefas e não dentro delas: um JSON de
            // tarefas corrompido não pode levar junto a posição, nem o contrário.
            app.manage(Janela::abrir(diretorio.join("janela.json")));

            if let Some(janela) = app.get_webview_window(JANELA) {
                // Nesta ordem: restaurar antes de acompanhar evita que o próprio
                // reposicionamento seja registrado como movimento do usuário.
                restaurar_posicao(&janela);
                acompanhar_movimento(&janela);
            }

            montar_tray(app.handle())?;
            // A contagem que já estava no disco, antes da primeira mutação.
            atualizar_tooltip(app.handle());
            // Depois do tray, e sem `?`: se a combinação estiver ocupada, o app
            // ainda sobe com o tray inteiro no lugar.
            #[cfg(desktop)]
            montar_atalho_global(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_tabs,
            create_tab,
            rename_tab,
            close_tab,
            restore_tab,
            set_active_tab,
            get_active_tab,
            list_todos,
            add_todo,
            rename_todo,
            toggle_todo,
            delete_todo,
            clear_completed,
            restore_todos,
            hide_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(all(test, desktop))]
mod tests_atalho {
    use super::*;
    use std::str::FromStr;
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

    fn atalho() -> Shortcut {
        Shortcut::from_str(ATALHO_GLOBAL).expect("a constante precisa ser uma combinação válida")
    }

    /// A constante é lida por um parser, então um erro de digitação nela só
    /// apareceria em execução — e apareceria como "o atalho não faz nada", que é
    /// exatamente o sintoma difícil de diagnosticar.
    #[test]
    fn a_constante_do_atalho_e_control_option_t() {
        assert_eq!(
            atalho(),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyT)
        );
    }

    /// **Prende a decisão do Adendo 2.** Um atalho global vence o do app em foco,
    /// então uma combinação com `⌘` roubaria do navegador coisas como `⌘⇧T`
    /// (reabrir aba) pelo sistema inteiro. Trocar a constante por algo com
    /// Command quebra este teste de propósito, e não em silêncio no uso.
    #[test]
    fn o_atalho_nao_sequestra_combinacoes_de_command() {
        assert!(
            !atalho().mods.contains(Modifiers::SUPER),
            "combinação com Command rouba atalhos do app em foco pelo sistema inteiro"
        );
    }

    /// Sem modificador, a tecla sozinha ficaria capturada globalmente: digitar
    /// "t" em qualquer lugar abriria o To-Do.
    #[test]
    fn o_atalho_tem_modificadores() {
        assert!(
            !atalho().mods.is_empty(),
            "uma tecla sozinha como atalho global sequestraria a digitação normal"
        );
    }

    /// O letreiro do tray e a combinação registrada precisam falar da mesma
    /// tecla: um menu que anuncia um atalho que não existe é pior que menu nenhum.
    #[test]
    fn o_letreiro_do_tray_combina_com_a_tecla_registrada() {
        assert!(
            ATALHO_VISIVEL.to_uppercase().ends_with('T'),
            "o letreiro '{ATALHO_VISIVEL}' não termina na tecla registrada"
        );
    }
}

#[cfg(test)]
mod tests_tooltip {
    use super::*;

    /// **O texto do tray fala do app inteiro, não da aba ativa.** Este é o teste
    /// que liga as duas metades: a contagem que a store devolve e a frase que o
    /// ícone mostra. Se `pendentes` passasse a olhar só uma aba, o tooltip diria
    /// "1 tarefa pendente" com três espalhadas pelas abas, e quem passa o olho no
    /// ícone tomaria decisão com o número errado.
    ///
    /// As asserções são em português porque o idioma é fixado no argumento: o que
    /// está sob teste aqui é a contagem, e um teste de contagem que mudasse de
    /// resultado com o locale da máquina não testaria contagem nenhuma. A cópia
    /// nas duas línguas tem os testes dela em `idioma`.
    #[test]
    fn o_tooltip_conta_as_pendentes_de_todas_as_abas_somadas() {
        let diretorio =
            std::env::temp_dir().join(format!("minitodo-tray-abas-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&diretorio);
        let store = Store::abrir(diretorio.join("todos.json"));

        let primeira = store.listar_abas().expect("listar abas")[0].id.clone();
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        store.acrescentar("na primeira", &primeira).expect("acrescentar");
        store.acrescentar("na segunda", &segunda.id).expect("acrescentar");
        let concluida = store
            .acrescentar("também na segunda", &segunda.id)
            .expect("acrescentar");

        let texto = |store: &Store| {
            texto_do_tooltip(store.pendentes().expect("contar"), Idioma::Pt)
        };

        assert!(
            texto(&store).contains("3 tarefas pendentes"),
            "o tooltip parou de somar as abas"
        );

        store.alternar(&concluida.id).expect("alternar");
        assert!(texto(&store).contains("2 tarefas pendentes"));

        // Uma aba fechada leva as pendentes dela: não são mais trabalho que resta.
        store.fechar_aba(&segunda.id).expect("fechar aba");
        assert!(texto(&store).contains("1 tarefa pendente"));

        let _ = std::fs::remove_dir_all(&diretorio);
    }
}
