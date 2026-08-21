//! Os comandos do contrato. Cada um que pode falhar devolve `Result<T, String>`,
//! porque a rejeição da Promise é o canal que o frontend usa para mostrar o erro
//! sem quebrar a UI.
//!
//! Os argumentos chegam do webview em camelCase (`tabId`) e são recebidos aqui em
//! snake_case (`tab_id`): é a conversão que o `#[tauri::command]` faz sozinho, e
//! é por isso que o contrato descreve `{ tabId }` do lado do JS e `tab_id` do
//! lado do Rust sem nenhum `rename` no meio.

mod atalho;
mod atualizacao;
mod formato;
mod heranca;
mod idioma;
mod janela;
#[cfg(target_os = "macos")]
mod marca;
mod persistencia;
mod store;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, PhysicalPosition, State, WebviewWindow, WindowEvent};
use tauri_plugin_global_shortcut::Shortcut;

use atalho::Atalho;
use atualizacao::{Disponivel, Pendente};
use idioma::Idioma;
use janela::{Janela, Posicao, Retangulo};
use store::{AbaFechada, Store, Tab, Todo};

/// Rótulo da única janela, fixado no `tauri.conf.json`. O tray precisa achá-la
/// pelo nome, e depender do padrão implícito deixaria o ícone virar um botão que
/// não faz nada se alguém renomeasse a janela.
const JANELA: &str = "main";

/// O item "Mostrar/Esconder" do menu do tray, guardado para poder ser reescrito.
///
/// O rótulo dele carrega a combinação (é ali que o atalho fica descobrível), e a
/// combinação agora é escolha do usuário: sem o handle, o menu continuaria
/// anunciando a tecla que valia quando o ícone nasceu, e um menu que anuncia um
/// atalho que não existe é pior que menu nenhum.
struct ItemAlternar(MenuItem<tauri::Wry>);

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

/// Onde o `todos.json` ilegível da abertura foi guardado, ou `None` — que é a
/// resposta em toda abertura normal.
///
/// **Existe porque abrir vazio em silêncio é indistinguível de perder tudo.** Um
/// arquivo que o desserializador não entende faz o app abrir com uma aba vazia;
/// sem este comando, a tela não tem como saber a diferença entre isso e uma
/// instalação nova, e o usuário veria a lista dele simplesmente desaparecida. A
/// `Store` já move o arquivo para o lado antes de qualquer gravação; isto é a
/// metade que conta o fato.
///
/// Devolve **caminho, não frase**: as mensagens são do frontend desde o Adendo 6.
/// Não devolve `Result` porque não há falha possível — é a leitura de um campo
/// decidido na abertura.
#[tauri::command]
async fn get_startup_rescue(store: State<'_, Store>) -> Result<Option<String>, String> {
    Ok(store.resgate())
}

// --- atalho global ---

/// A combinação que mostra e esconde a janela, como ela está agora.
///
/// A janela precisa dela para **três frases que ensinam a via de volta** (o estado
/// vazio, a faixa da primeira tarefa e a dica do botão de esconder) e para o painel
/// da engrenagem. Vem do backend já escrita para os olhos (`label`) porque é o
/// backend quem também escreve o rótulo do tray: duas escritas do mesmo dado
/// divergiriam no primeiro atalho que não fosse o padrão.
#[tauri::command]
async fn get_shortcut(atalho: State<'_, Atalho>) -> Result<atalho::Descricao, String> {
    Ok(atalho.descrever())
}

// --- formato de data ---

/// O dia vem antes do mês no formato deste sistema?
///
/// A janela usa isto para achar no título de uma tarefa a data que é hoje
/// (Adendo 11). **Não pode ser lido na webview:** `navigator.language` é o idioma
/// da interface e não a região, e o `Intl` escolhe a ordem pela língua — um Mac
/// com idioma inglês e região Brasil responde `en-US` e formata `dd/MM/yy`. Ver
/// `formato.rs`, que registra as duas medições.
///
/// **Não falha.** Uma leitura que não dá certo cai em dia-primeiro, e não há erro
/// a mostrar: nada aconteceu com os dados do usuário e não existe gesto dele para
/// tentar de novo. O único efeito visível de um fallback é um destaque que não
/// acende, que é o estado de qualquer tarefa sem data.
#[tauri::command]
async fn date_day_first() -> bool {
    formato::dia_primeiro()
}

/// Troca a combinação. Recebe o acelerador (`control+alt+KeyT`), que é o formato
/// que o `event.code` da webview monta e que o parser do plugin entende.
///
/// **A ordem é registrar o novo, e só depois soltar o antigo.** Se o sistema
/// recusar a combinação nova — outro aplicativo já a tomou —, o `?` volta com erro
/// e o atalho anterior continua registrado e funcionando. Soltar primeiro deixaria
/// o usuário sem atalho nenhum como preço de uma tentativa.
#[tauri::command]
async fn set_shortcut(
    accelerator: String,
    app: AppHandle,
    atalho: State<'_, Atalho>,
) -> Result<atalho::Descricao, String> {
    let novo = atalho::interpretar(&accelerator)?;
    let antes = atalho.situacao();
    // Repetir a combinação atual não é no-op: ela pode não estar na mão do sistema —
    // porque o painel a suspendeu para poder ouvir as teclas, ou porque o registro da
    // abertura falhou. Insistir é justamente o gesto de quem acabou de fechar o
    // aplicativo que a tinha tomado.
    if novo != antes.combinacao || !antes.registrada {
        registrar_atalho(&app, novo)?;
    }
    // Só solta o que de fato estava registrado: pedir a liberação de uma combinação
    // que o sistema não tem na mão devolveria um erro que não significa nada.
    if novo != antes.combinacao && antes.registrada {
        desregistrar_atalho(&app, antes.combinacao);
    }
    atalho.definir(novo);
    // O menu do tray anuncia a tecla; sem isto ele seguiria anunciando a antiga.
    atualizar_rotulo_tray(&app);
    Ok(atalho.descrever())
}

/// Suspende e devolve o atalho enquanto o painel captura teclas.
///
/// **Um atalho global é consumido pelo sistema antes de chegar à webview.** Com
/// `⌃⌥T` registrado, apertar `⌃⌥T` no capturador esconderia a janela em vez de
/// escolher a combinação — o painel não conseguiria nem reconfirmar a tecla que já
/// está valendo, que é justamente o gesto de quem quer testá-la. Então o registro
/// sai da mão do sistema enquanto o painel escuta, e volta quando ele para.
///
/// **Nunca falha para cima**, e devolve o estado completo: uma suspensão que
/// terminasse em erro deixaria a tela sem saber se o atalho voltou. Se a combinação
/// tiver sido tomada por outro aplicativo nesses segundos, quem conta isso é o
/// `active` do retorno — e a mesma frase que já existe para esse caso.
///
/// O tray continua sendo a via de volta garantida durante a suspensão, que é o
/// papel que ele tem desde o Adendo 2.
#[tauri::command]
async fn pause_shortcut(
    paused: bool,
    app: AppHandle,
    atalho: State<'_, Atalho>,
) -> Result<atalho::Descricao, String> {
    let antes = atalho.situacao();
    if paused {
        if antes.registrada {
            desregistrar_atalho(&app, antes.combinacao);
        }
        atalho.pausar();
        return Ok(atalho.descrever());
    }

    atalho.retomar();
    // Já está na mão do sistema (a troca pelo painel registrou a nova), ou nunca
    // esteve porque outro aplicativo a tomou — nos dois casos não há o que devolver.
    if antes.registrada || !antes.valendo {
        return Ok(atalho.descrever());
    }
    match registrar_atalho(&app, antes.combinacao) {
        Ok(()) => atalho.marcar(true),
        Err(erro) => {
            // Alguém tomou a combinação nesses segundos. O estado passa a dizer a
            // verdade, e a tela avisa com a frase que já existe para isso.
            atalho.marcar(false);
            eprintln!("[atalho] {erro}");
        }
    }
    Ok(atalho.descrever())
}

// --- atualização (Adendo 10) ---

/// Existe versão mais nova? `None` é a resposta boa: o app já está na última.
///
/// **A única requisição de rede do app, e ela sai de um clique.** Não há checagem
/// na abertura nem temporizador: o produto promete que nada sai desta máquina, e a
/// promessa é mantida por construção — sem gesto, não há pacote saindo daqui.
///
/// O resultado fica guardado no estado para que `install_update` instale exatamente
/// a versão que o painel acabou de nomear. Ver `atualizacao`.
#[tauri::command]
async fn check_update(
    app: AppHandle,
    pendente: State<'_, Pendente>,
) -> Result<Option<Disponivel>, String> {
    atualizacao::verificar(&app, &pendente).await
}

/// Baixa a versão verificada, valida a assinatura, substitui o app e reinicia.
///
/// **Só responde quando falha**: no caminho de sucesso o processo é trocado dentro
/// da chamada e esta Promise nunca resolve. O painel não tem estado de "pronto" por
/// isso — ele não estaria vivo para desenhá-lo.
#[tauri::command]
async fn install_update(app: AppHandle, pendente: State<'_, Pendente>) -> Result<(), String> {
    atualizacao::instalar(&app, &pendente).await
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
    // **Minimizada conta como escondida.** O menu padrão do macOS traz ⌘M, e uma
    // janela sem decoração e fora da barra de tarefas minimizada não tem gesto que
    // a alcance. Sem esta checagem, `is_visible` respondia `true` para ela e o
    // atalho a "escondia" — o usuário apertava ⌃⌥T duas vezes para trazer de volta
    // o que ele achava que estava fora da tela uma vez.
    let minimizada = janela.is_minimized().unwrap_or(false);
    if janela.is_visible().unwrap_or(false) && !minimizada {
        descarregar_posicao(app);
        let _ = janela.hide();
    } else {
        // Antes do `show`: mostrar uma janela minimizada a deixa minimizada.
        if minimizada {
            let _ = janela.unminimize();
        }
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

/// Os dois eventos de janela que este app precisa interceptar. Um handler só de
/// propósito: `on_window_event` aceita vários, e dois registros separados
/// esconderiam de quem lê que o mesmo evento pode ter dois donos.
fn acompanhar_janela(janela: &WebviewWindow) {
    let app = janela.app_handle().clone();
    janela.on_window_event(move |evento| match evento {
        // **Fechar é esconder, sempre.** A janela é a ÚNICA do app, e destruí-la
        // deixa `alternar_janela` sem nada para achar: o atalho global e o clique
        // no tray param de fazer qualquer coisa, e o app fica vivo, invisível e
        // inalcançável — só "Sair" e relançar.
        //
        // Não é hipótese. O Tauri instala o menu padrão do macOS quando nenhum
        // menu é definido, e esse menu traz `close_window` em dois lugares (⌘W nos
        // submenus File e Window). O botão × que o frontend desenha já chamava
        // `hide_window`; este é o mesmo desfecho para todo caminho de fechamento
        // que não passa por ele, incluindo os que o sistema oferece sem avisar.
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            descarregar_posicao(&app);
            if let Some(alvo) = app.get_webview_window(JANELA) {
                let _ = alvo.hide();
            }
        }
        WindowEvent::Moved(posicao) => {
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
        }
        _ => {}
    });
}

/// Sobe o plugin de atalho global e registra a combinação escolhida. **Não devolve
/// `Result` de propósito.**
///
/// A combinação pode já pertencer a outro aplicativo, e nesse caso o registro
/// falha. Deixar essa falha subir pelo `setup` trocaria uma conveniência por um
/// app que não abre — enquanto o tray, que é o caminho garantido, continua ali
/// funcionando. Então tudo aqui é registrado em `stderr` e seguido em frente.
///
/// O que a falha **não** faz mais é passar em silêncio pela janela: ela fica no
/// estado (`Atalho::marcar`), e é dela que o painel da engrenagem tira o aviso de
/// que a combinação não está valendo. Uma tela que ensina um atalho morto é a pior
/// versão deste app.
#[cfg(desktop)]
fn montar_atalho_global(app: &AppHandle) {
    if let Err(erro) = app.plugin(tauri_plugin_global_shortcut::Builder::new().build()) {
        eprintln!("[atalho] o plugin de atalho global não subiu: {erro}");
        if let Some(estado) = app.try_state::<Atalho>() {
            estado.marcar(false);
        }
        return;
    }

    let Some(estado) = app.try_state::<Atalho>() else {
        return;
    };
    let combinacao = estado.atual();
    match registrar_atalho(app, combinacao) {
        Ok(()) => estado.marcar(true),
        Err(erro) => {
            estado.marcar(false);
            eprintln!(
                "[atalho] {erro}. Provavelmente a combinação já está em uso por outro \
                 aplicativo. O app segue funcionando pelo tray, e a engrenagem da janela \
                 permite escolher outra."
            );
        }
    }
}

/// O registro em si, num lugar só: a abertura e a troca pela engrenagem precisam
/// registrar exatamente o mesmo comportamento, e dois caminhos divergiriam no dia
/// em que um deles precisasse fazer algo a mais.
fn registrar_atalho(app: &AppHandle, combinacao: Shortcut) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    app.global_shortcut()
        .on_shortcut(combinacao, |app, _, evento| {
            // **Uma pressionada, uma alternância.** O plugin entrega `Pressed` e
            // `Released`; reagir aos dois mostraria e esconderia a janela no mesmo
            // gesto, e o atalho pareceria não funcionar.
            if evento.state == ShortcutState::Pressed {
                // A mesma função do clique esquerdo no tray, e não um segundo
                // caminho: dois caminhos divergem no dia em que um precisar fazer
                // algo a mais.
                alternar_janela(app);
            }
        })
        .map_err(|erro| {
            format!(
                "não foi possível registrar {}: {erro}",
                combinacao.into_string()
            )
        })
}

/// Solta a combinação antiga depois que a nova já está valendo. Falha aqui é
/// **silenciosa**: o que o usuário pediu (a tecla nova) já aconteceu, e uma tecla
/// velha que continuou registrada não tira nada dele — ela só continua alternando a
/// janela até o próximo reinício, que é o desfecho menos ruim possível.
fn desregistrar_atalho(app: &AppHandle, combinacao: Shortcut) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    if let Err(erro) = app.global_shortcut().unregister(combinacao) {
        eprintln!(
            "[atalho] a combinação antiga {} não foi liberada: {erro}",
            combinacao.into_string()
        );
    }
}

/// Reescreve o rótulo do item do tray com a combinação que vale agora.
///
/// **Nada aqui pode falhar para cima.** O atalho novo já está registrado e gravado
/// quando esta função roda; transformar "não consegui reescrever um rótulo de menu"
/// em erro de `set_shortcut` faria a tela dizer que a troca não aconteceu.
fn atualizar_rotulo_tray(app: &AppHandle) {
    let Some(item) = app.try_state::<ItemAlternar>() else {
        return;
    };
    let Some(estado) = app.try_state::<Atalho>() else {
        return;
    };
    let etiqueta = atalho::etiqueta(&estado.atual());
    let _ = item
        .0
        .set_text(idioma::menu_alternar(&etiqueta, idioma::atual()));
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
    // A combinação sai do estado, e não de uma constante: ela é escolha do usuário
    // desde o Adendo 9, e o `atalho.json` dele pode ter outra.
    let etiqueta = app
        .try_state::<Atalho>()
        .map(|estado| atalho::etiqueta(&estado.atual()))
        .unwrap_or_default();
    let rotulo = idioma::menu_alternar(&etiqueta, lingua);
    let alternar = MenuItem::with_id(app, "alternar", &rotulo, true, None::<&str>)?;
    let sair = MenuItem::with_id(app, "sair", idioma::menu_sair(lingua), true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&alternar, &sair])?;

    let mut builder = TrayIconBuilder::new()
        // Nome próprio, igual nas duas línguas — e substituído pelo texto com a
        // contagem no `atualizar_tooltip` que roda logo depois do `montar_tray`.
        .tooltip("NoCom")
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
    // Windows e Linux desenham o ícone da bandeja **com as cores do arquivo**, e
    // por isso recebem o ícone do app: o campo preto é o que dá contraste próprio
    // ao anel branco, numa barra de tarefas que pode ser clara ou escura. O
    // `default_window_icon` é o `.ico` no Windows (que traz um raster calibrado
    // para cada tamanho pequeno) e o `32x32.png` no Linux — em nenhum dos dois a
    // bandeja está reduzindo o desenho de 1024.
    //
    // Sem ícone nenhum o tray subiria como um espaço vazio e clicável, que é pior
    // que não ter tray.
    #[cfg(not(target_os = "macos"))]
    if let Some(icone) = app.default_window_icon().cloned() {
        builder = builder.icon(icone);
    }
    // **Na barra de menus do macOS, ícone é silhueta.** Sem `icon_as_template` o
    // desenho entra com as cores dele no meio de um cromo monocromático — e no
    // tema escuro tinta escura sobre barra escura simplesmente desaparece, levando
    // com ela a via de volta GARANTIDA da janela.
    //
    // E ser silhueta é o que impede o ícone do app de servir aqui: template usa só
    // o canal alfa, e o alfa daquele arquivo é o quadrado inteiro — a barra
    // mostraria um retângulo cheio, com o anel sumido dentro dele. Por isso o
    // macOS recebe o anel desenhado sozinho, no alfa. Ver `marca.rs`.
    #[cfg(target_os = "macos")]
    {
        builder = builder.icon(marca::bandeja()).icon_as_template(true);
    }
    // Os dois handles ficam no estado porque o ícone é reescrito depois de nascer: o
    // tooltip a cada mutação (a contagem muda) e o rótulo do item a cada troca de
    // atalho. Sem guardá-los, o tray só saberia o que valia no `setup`.
    app.manage(ItemAlternar(alternar));
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
            // Antes de qualquer `abrir`: é a leitura de um arquivo ausente que
            // define o app como instalação nova, e quem vem do nome antigo tem os
            // arquivos na pasta ao lado. Ver `heranca`.
            heranca::adotar(&diretorio);
            app.manage(Store::abrir(diretorio.join("todos.json")));
            // Arquivo próprio, ao lado das tarefas e não dentro delas: um JSON de
            // tarefas corrompido não pode levar junto a posição, nem o contrário.
            app.manage(Janela::abrir(diretorio.join("janela.json")));
            // Mesma regra, terceiro arquivo. Antes do tray de propósito: o rótulo do
            // item "Mostrar/Esconder" anuncia a combinação, e ele nasce ali.
            app.manage(Atalho::abrir(diretorio.join("atalho.json")));

            if let Some(janela) = app.get_webview_window(JANELA) {
                // Nesta ordem: restaurar antes de acompanhar evita que o próprio
                // reposicionamento seja registrado como movimento do usuário.
                restaurar_posicao(&janela);
                acompanhar_janela(&janela);
            }

            montar_tray(app.handle())?;
            // A contagem que já estava no disco, antes da primeira mutação.
            atualizar_tooltip(app.handle());
            // Depois do tray, e sem `?`: se a combinação estiver ocupada, o app
            // ainda sobe com o tray inteiro no lugar.
            #[cfg(desktop)]
            montar_atalho_global(app.handle());
            // Atualização (Adendo 10). Por último porque não participa da abertura:
            // o plugin não faz requisição nenhuma ao subir, só quando o painel pede.
            // Sem `?` pela mesma razão do atalho — um plugin que não sobe custa o
            // botão de verificar, e não o app inteiro.
            #[cfg(desktop)]
            {
                app.manage(Pendente::nova());
                if let Err(erro) = app.handle().plugin(tauri_plugin_updater::Builder::new().build())
                {
                    eprintln!("[atualização] o plugin de atualização não subiu: {erro}");
                }
            }
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
            get_startup_rescue,
            get_shortcut,
            set_shortcut,
            date_day_first,
            pause_shortcut,
            check_update,
            install_update,
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
            std::env::temp_dir().join(format!("nocom-tray-abas-{}", std::process::id()));
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
