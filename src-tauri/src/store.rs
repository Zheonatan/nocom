//! Estado em memória e persistência das abas e das tarefas.
//!
//! O `Mutex<Estado>` é a fonte da verdade em execução; o JSON em
//! `app_data_dir()/todos.json` é o que sobrevive ao fechamento. Cada mutação
//! grava, porque a janela é fechada por `hide_window` e o app pode ser encerrado
//! sem aviso — não há um momento "de saída" em que gravar uma vez só.
//!
//! **Abas e tarefas moram sob o mesmo cadeado de propósito.** `close_tab` remove
//! uma aba e as tarefas dela no mesmo gesto, e a aba ativa precisa apontar sempre
//! para uma aba que existe. Com dois estados separados haveria um instante em que
//! o disco tem a aba sem as tarefas, ou a ativa apontando para o que já saiu — e
//! esse instante é justamente o que o processo pode ser morto no meio.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::persistencia;

/// Teto do título, em **caracteres**. O frontend já impõe `maxLength` no input,
/// então na prática ninguém chega aqui: isto é a rede de segurança para o que
/// entrar por colagem, por um `invoke` direto ou por um `todos.json` editado à
/// mão.
const LIMITE_TITULO: usize = 200;

/// Teto do nome da aba, em **caracteres**. É nome de chip numa faixa de 360px,
/// não título de tarefa — daí ser um quinto do limite do título.
const LIMITE_NOME_ABA: usize = 40;

/// Nome da aba que recebe as tarefas de quem já usava o app antes das abas, e da
/// aba que nasce quando não há nenhuma. É o rótulo que o usuário vai ver no dia
/// em que atualizar, então não é "Aba 1" nem "default".
const ABA_PADRAO: &str = "Tarefas";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Tab {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}

/// A recorrência de uma tarefa (Adendo 13). No fio ela viaja como
/// `"none" | "daily" | "weekly" | "monthly"` — o formato que o contrato fixa e
/// que o TypeScript espelha; os nomes em português são só deste lado.
#[derive(Serialize, Deserialize, Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Recorrencia {
    #[default]
    #[serde(rename = "none")]
    Nenhuma,
    #[serde(rename = "daily")]
    Diaria,
    #[serde(rename = "weekly")]
    Semanal,
    #[serde(rename = "monthly")]
    Mensal,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Todo {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub created_at: i64,
    pub tab_id: String,
    /// `default` para o arquivo de qualquer versão anterior ler como sempre leu:
    /// campo faltando é `none`, que é o comportamento antigo (Adendo 13).
    #[serde(default)]
    pub repeat: Recorrencia,
    /// Quando foi concluída (epoch millis), ou `None`. Carimbado no toggle para
    /// done e limpo na volta — é a base de cálculo do "volta a pendente" da
    /// recorrência, e quem calcula o vencimento é o frontend (Adendo 13).
    #[serde(default)]
    pub done_at: Option<i64>,
}

/// O que `close_tab` devolve: a aba e as tarefas que saíram com ela.
///
/// Fechar uma aba destrói várias tarefas de uma vez — é o gesto mais destrutivo
/// do app. Seguindo a decisão do Adendo 4, o caminho é desfazer curto em vez de
/// caixa de confirmação, e um desfazer só existe se o backend disser exatamente o
/// que apagou: com ids e carimbos, `restore_tab` repõe o que havia, e não algo
/// parecido.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AbaFechada {
    pub tab: Tab,
    pub todos: Vec<Todo>,
}

/// O que `list_pending_counts` devolve por aba (Adendo 13): a contagem que o
/// `title` do chip mostra sem ninguém precisar trocar de aba para olhar.
#[derive(Serialize, Clone, Debug)]
pub struct ContagemAba {
    pub tab_id: String,
    pub pending: usize,
}

/// O resumo de `import_data` (Adendo 13): quantos entraram. O que já existia foi
/// pulado, e nada foi removido — o painel mostra estes números ao usuário.
#[derive(Serialize, Clone, Copy, Debug)]
pub struct Importado {
    pub tabs: usize,
    pub todos: usize,
}

/// O que fica no `todos.json` a partir das abas.
///
/// Todos os campos têm `default` **para não perder tarefa por causa de um campo
/// que falta**. Um arquivo com `tabs` e `todos` mas sem `active_tab` — de uma
/// versão intermediária, de uma edição à mão — falharia inteiro na desserialização
/// se `active_tab` fosse obrigatório, e "falhou" aqui significa "abriu vazio",
/// isto é, a lista do usuário no chão. Com `default`, o que faltar é reconstruído
/// por `normalizar`.
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
struct Estado {
    #[serde(default)]
    tabs: Vec<Tab>,
    #[serde(default)]
    todos: Vec<Todo>,
    /// Id da aba que a janela mostra. Persiste aqui, junto do estado que este
    /// arquivo já guardava, e não em `janela.json`: qual lista está aberta é
    /// estado da lista, não geometria de janela.
    #[serde(default)]
    active_tab: String,
}

/// O formato **antigo** do `todos.json`: uma lista de tarefas sem `tab_id`.
///
/// Existe só para ser lido uma vez, na primeira abertura depois da atualização.
/// É um tipo separado em vez de um `#[serde(default)]` no `tab_id` do `Todo`
/// porque as duas coisas se comportam diferente no caso que importa: com o
/// `default`, um arquivo novo com `tab_id` faltando viraria tarefa de aba `""`
/// — uma órfã silenciosa — enquanto aqui a ausência do campo é o próprio sinal
/// de que o arquivo é da versão anterior e precisa da aba padrão.
#[derive(Deserialize)]
struct TodoAntigo {
    id: String,
    title: String,
    done: bool,
    created_at: i64,
}

pub struct Store {
    estado: Mutex<Estado>,
    arquivo: PathBuf,
    /// Onde o arquivo ilegível da abertura foi guardado, se houve um. Lido uma
    /// vez pela tela, para o usuário saber que a lista não foi perdida e onde ela
    /// está. `None` na esmagadora maioria das aberturas.
    resgate: Option<String>,
}

impl Store {
    /// Abre o que estiver em disco, nos dois formatos que existem.
    ///
    /// A ordem das tentativas é o que faz a migração ser segura: o formato novo é
    /// um objeto JSON e o antigo é um array, então nenhum dos dois é aceito pelo
    /// desserializador do outro e não há como confundi-los.
    ///
    /// **Ausente vira uma aba "Tarefas" vazia. Ilegível vira a mesma aba, mas o
    /// arquivo sai do caminho primeiro** — e é aí que está a diferença que
    /// importa. Enquanto os dois casos eram o mesmo `None`, um `todos.json` que o
    /// desserializador não entendia abria como instalação nova, sem aviso nenhum,
    /// e a primeira tarefa digitada gravava por cima da única cópia da lista do
    /// usuário. Derrubar o app não é a resposta (ele é a única via de acesso às
    /// tarefas), mas abrir em silêncio e apagar em seguida é pior: o PRODUCT.md
    /// declara "nenhum caminho pode apagar tarefa antiga" como a única falha
    /// inaceitável.
    ///
    /// Então o ilegível é **preservado** ao lado, com o caminho guardado em
    /// `resgate` para a tela poder dizer o que aconteceu. Falha faz barulho.
    ///
    /// Nada é gravado aqui. Uma migração que gravasse na abertura trocaria o
    /// arquivo antigo pelo novo antes de o usuário ter feito nada — e se a
    /// gravação falhasse pela metade, o formato que ainda funcionava já teria
    /// sido substituído. Convertido em memória, o arquivo antigo continua
    /// intacto no disco até a primeira mutação de verdade.
    pub fn abrir(arquivo: PathBuf) -> Self {
        let (mut estado, resgate) = Self::carregar(&arquivo);
        normalizar(&mut estado);
        Self {
            estado: Mutex::new(estado),
            arquivo,
            resgate,
        }
    }

    /// As três respostas possíveis do disco, cada uma com o seu desfecho.
    ///
    /// O formato antigo só é tentado quando o novo saiu `Ilegivel`: um array de
    /// tarefas não é aceito pelo desserializador do `Estado`, então "ilegível como
    /// formato novo" é justamente o sinal de que talvez seja o formato anterior.
    /// `Ausente` não tenta nada — não há bytes para interpretar de duas maneiras.
    fn carregar(arquivo: &Path) -> (Estado, Option<String>) {
        match persistencia::ler::<Estado>(arquivo) {
            persistencia::Leitura::Lido(estado) => (estado, None),
            persistencia::Leitura::Ausente => (Estado::default(), None),
            persistencia::Leitura::Ilegivel => {
                if let persistencia::Leitura::Lido(antigos) =
                    persistencia::ler::<Vec<TodoAntigo>>(arquivo)
                {
                    return (migrar(antigos), None);
                }
                // Nenhum dos dois formatos. O arquivo sai do caminho ANTES de a
                // primeira mutação poder gravar por cima dele.
                let resgate =
                    persistencia::preservar(arquivo).map(|caminho| caminho.display().to_string());
                (Estado::default(), resgate)
            }
        }
    }

    /// Onde o arquivo ilegível da abertura foi guardado, ou `None`. A tela mostra
    /// isso uma vez, na carga inicial: um app que abriu vazio porque não entendeu
    /// o arquivo tem que dizer, senão ele é indistinguível de um app que perdeu
    /// tudo — e o Princípio 5 do produto proíbe exatamente essa confusão.
    ///
    /// Devolve o **caminho**, e não uma frase: as mensagens são do frontend desde
    /// o Adendo 6, e um texto em português vindo do Rust apareceria numa interface
    /// em inglês.
    pub fn resgate(&self) -> Option<String> {
        self.resgate.clone()
    }

    // --- abas ---

    pub fn listar_abas(&self) -> Result<Vec<Tab>, String> {
        Ok(self.travar()?.tabs.clone())
    }

    pub fn criar_aba(&self, nome: &str) -> Result<Tab, String> {
        let nova = nova_aba(validar_nome_aba(nome)?);
        let nova_para_devolver = nova.clone();
        self.transacao(move |estado| {
            // Nomes repetidos passam de propósito: o `id` é que distingue, e
            // recusar duplicata criaria um caminho de erro sem ganho real.
            estado.tabs.push(nova);
            ordenar_abas(&mut estado.tabs);
            Ok(nova_para_devolver)
        })
    }

    /// Troca só o nome. `id` e `created_at` ficam intactos: é o `created_at` que
    /// define a posição da aba na faixa, e corrigir um nome não é motivo para a
    /// aba pular de lugar debaixo do dedo do usuário.
    pub fn renomear_aba(&self, id: &str, nome: &str) -> Result<Tab, String> {
        let nome = validar_nome_aba(nome)?;
        self.transacao(move |estado| {
            let alvo = estado
                .tabs
                .iter_mut()
                .find(|aba| aba.id == id)
                .ok_or_else(|| format!("A aba {id} não existe."))?;
            alvo.name = nome;
            Ok(alvo.clone())
        })
    }

    /// Fecha a aba e leva as tarefas dela, devolvendo as duas coisas para o
    /// desfazer.
    ///
    /// **A última aba é recusada.** Sem nenhuma aba o app fica sem lugar onde
    /// escrever e a tela sem estado válido — não há lista para mostrar nem para
    /// onde mandar a próxima tarefa. O frontend nem oferece o gesto quando só há
    /// uma, e esta é a rede embaixo disso: a regra vale igual para um `invoke`
    /// direto.
    ///
    /// A verificação de existência vem antes da da última aba porque as duas
    /// podem ser verdade ao mesmo tempo, e "esta aba não existe" é a informação
    /// certa para um id errado — dizer "é a última" sobre uma aba que não está
    /// ali mandaria quem chamou procurar o problema no lugar errado.
    pub fn fechar_aba(&self, id: &str) -> Result<AbaFechada, String> {
        self.transacao(|estado| {
            let posicao = estado
                .tabs
                .iter()
                .position(|aba| aba.id == id)
                .ok_or_else(|| format!("A aba {id} não existe."))?;
            if estado.tabs.len() == 1 {
                return Err(
                    "Esta é a última aba e o app precisa de pelo menos uma; ela não pode ser \
                     fechada."
                        .to_owned(),
                );
            }

            let tab = estado.tabs.remove(posicao);
            let removidas: Vec<Todo> = estado
                .todos
                .iter()
                .filter(|todo| todo.tab_id == tab.id)
                .cloned()
                .collect();
            estado.todos.retain(|todo| todo.tab_id != tab.id);

            // Fechar a aba que está aberta na tela deixaria a ativa apontando
            // para o que acabou de sair, e `get_active_tab` passaria a devolver
            // um id inexistente.
            //
            // **Vai para a vizinha** (Esclarecimento 5.2): a próxima na ordem
            // canônica, ou a anterior se a fechada era a última da faixa. Não é a
            // primeira restante — fechar a aba 4 de 5 e cair na aba 1 jogaria o
            // usuário longe de onde ele estava, e a vizinha é o que qualquer barra
            // de abas faz. O frontend troca a ativa de forma otimista pela **mesma
            // regra**; um destino diferente aqui faria a tela piscar de uma aba
            // para a outra quando a resposta chegasse.
            //
            // O `remove` já encurtou o vetor, então a próxima ocupa o índice da que
            // saiu. `posicao` só chega a `len()` quando a fechada era a última, e aí
            // ela é no mínimo 1 — a última aba nunca é fechada, então sempre sobra
            // pelo menos uma.
            if estado.active_tab == tab.id {
                let vizinha = if posicao < estado.tabs.len() {
                    posicao
                } else {
                    posicao - 1
                };
                estado.active_tab = estado.tabs[vizinha].id.clone();
            }

            Ok(AbaFechada {
                tab,
                todos: removidas,
            })
        })
    }

    /// Desfaz um fechamento: repõe a aba e as tarefas dela com os `id` e
    /// `created_at` originais, e devolve a lista completa de abas em ordem
    /// canônica.
    ///
    /// **Tudo ou nada.** Se o id da aba ou de qualquer tarefa já existir, a
    /// chamada inteira falha sem aplicar nada: repor a aba sem as tarefas — ou
    /// com parte delas — deixaria a tela mostrando um desfazer que o disco só
    /// cumpriu pela metade, e é justamente esse estado que o desfazer existe
    /// para evitar.
    ///
    /// **Não muda a aba ativa.** Quem restaura decide para onde ir com
    /// `set_active_tab`; trocar o foco aqui teletransportaria o usuário para a
    /// aba reposta no meio do que ele estivesse fazendo depois de fechar.
    pub fn restaurar_aba(&self, mut tab: Tab, mut todos: Vec<Todo>) -> Result<Vec<Tab>, String> {
        // A entrada vem do webview, e dizer "isto já existiu" não é credencial:
        // um nome vazio ou um título de 5000 caracteres não pode entrar por esta
        // porta depois de ter sido recusado na outra.
        tab.name = validar_nome_aba(&tab.name)?;
        for todo in todos.iter_mut() {
            todo.title = validar_titulo(&todo.title)?;
        }

        // Uma tarefa de outra aba dentro do lote criaria exatamente a órfã que o
        // invariante proíbe — ou pior, entraria numa aba existente sem que
        // ninguém tivesse pedido isso.
        if let Some(intrusa) = todos.iter().find(|todo| todo.tab_id != tab.id) {
            return Err(format!(
                "A tarefa {} não pertence à aba {}; nada foi restaurado.",
                intrusa.id, tab.id
            ));
        }

        self.transacao(move |estado| {
            if estado.tabs.iter().any(|aba| aba.id == tab.id) {
                return Err(format!(
                    "A aba {} já está aberta; nada foi restaurado.",
                    tab.id
                ));
            }
            // Todos os ids são conferidos **antes** do primeiro `push`, então nem
            // a cópia da transação chega a ficar meio aplicada.
            //
            // O conjunto guarda `String` e não `&str` porque `todos` é movido
            // para dentro do estado logo abaixo: com os ids emprestados, o lote
            // continuaria emprestado no momento do move.
            let mut vistos: HashSet<String> = HashSet::new();
            for todo in todos.iter() {
                let repetida_no_lote = !vistos.insert(todo.id.clone());
                if repetida_no_lote || estado.todos.iter().any(|atual| atual.id == todo.id) {
                    return Err(format!(
                        "A tarefa {} já está na lista; nada foi restaurado.",
                        todo.id
                    ));
                }
            }

            estado.tabs.push(tab);
            ordenar_abas(&mut estado.tabs);
            estado.todos.extend(todos);
            ordenar(&mut estado.todos);
            Ok(estado.tabs.clone())
        })
    }

    /// Persiste qual aba a janela mostra, para a próxima execução abrir onde o
    /// usuário parou.
    pub fn definir_aba_ativa(&self, id: &str) -> Result<(), String> {
        self.transacao(|estado| {
            exigir_aba(estado, id)?;
            estado.active_tab = id.to_owned();
            Ok(())
        })
    }

    /// A aba ativa. Nunca devolve um id que não existe: `normalizar` conserta o
    /// que vier torto do disco na abertura, e `fechar_aba` remaneja a ativa
    /// quando fecha justamente ela.
    pub fn aba_ativa(&self) -> Result<String, String> {
        Ok(self.travar()?.active_tab.clone())
    }

    // --- tarefas ---

    /// As tarefas de uma aba, do mais antigo para o mais novo.
    ///
    /// Aba inexistente é `Err`, e não lista vazia: as duas respostas são
    /// indistinguíveis para quem chamou, e uma aba recém-fechada devolveria
    /// "vazia" como se fosse uma aba nova em branco — o frontend mostraria uma
    /// lista plausível de um lugar que não existe mais.
    pub fn listar(&self, tab_id: &str) -> Result<Vec<Todo>, String> {
        let estado = self.travar()?;
        exigir_aba(&estado, tab_id)?;
        Ok(estado
            .todos
            .iter()
            .filter(|todo| todo.tab_id == tab_id)
            .cloned()
            .collect())
    }

    /// Todas as tarefas de todas as abas, em ordem canônica. Nenhum comando usa
    /// isto — `restore_todos` devolve só a lista da aba do lote desde o
    /// Esclarecimento 5.1 —, mas os testes precisam enxergar o arquivo inteiro
    /// para provar que nada vazou de uma aba para outra.
    #[cfg(test)]
    pub fn listar_tudo(&self) -> Result<Vec<Todo>, String> {
        Ok(self.travar()?.todos.clone())
    }

    pub fn acrescentar(&self, titulo: &str, tab_id: &str) -> Result<Todo, String> {
        let titulo = validar_titulo(titulo)?;
        let tab_id = tab_id.to_owned();
        self.transacao(move |estado| {
            // Antes de criar, e não depois: uma tarefa numa aba que não existe é
            // a órfã que o invariante proíbe, e ela sairia daqui já gravada.
            exigir_aba(estado, &tab_id)?;
            let novo = Todo {
                id: uuid::Uuid::new_v4().to_string(),
                title: titulo,
                done: false,
                created_at: agora_em_millis(),
                tab_id,
                repeat: Recorrencia::Nenhuma,
                done_at: None,
            };
            let novo_para_devolver = novo.clone();
            estado.todos.push(novo);
            // O carimbo de um item novo é sempre o mais recente, mas a ordenação é
            // reaplicada porque dois itens criados no mesmo milissegundo empatam e
            // a ordenação estável é o que mantém a ordem entre as chamadas.
            ordenar(&mut estado.todos);
            Ok(novo_para_devolver)
        })
    }

    /// Troca só o título. `created_at`, `done` e `tab_id` ficam intactos de
    /// propósito — são eles que definem a posição na lista, o estado do checkbox
    /// e a aba, e corrigir um erro de digitação não é motivo para a tarefa pular
    /// de lugar, desmarcar nem mudar de aba.
    pub fn renomear(&self, id: &str, titulo: &str) -> Result<Todo, String> {
        let titulo = validar_titulo(titulo)?;
        self.transacao(|estado| {
            let alvo = estado
                .todos
                .iter_mut()
                .find(|todo| todo.id == id)
                .ok_or_else(|| format!("Tarefa {id} não existe."))?;
            alvo.title = titulo;
            Ok(alvo.clone())
        })
    }

    /// Devolve tarefas removidas ao lugar de onde saíram, com o `id` e o
    /// `created_at` que tinham. É o que separa "desfazer" de "criar de novo":
    /// `add_todo` daria carimbo e id novos, e a tarefa desfeita reapareceria no
    /// fim da lista — pareceria outro item, porque seria outro item.
    ///
    /// Serve aos dois desfazeres de tarefa com uma porta só, a remoção de uma e o
    /// "Limpar concluídas", que apaga várias. O desfazer de **aba** é outro
    /// comando, `restore_tab`: ali a aba também precisa voltar.
    ///
    /// **Tudo ou nada.** Um único id já presente reprova o lote inteiro: restaurar
    /// pela metade deixaria a tela mostrando um desfazer que o disco só cumpriu em
    /// parte. A `transacao` já dá essa semântica — o `Err` sai antes de qualquer
    /// escrita e a cópia é descartada.
    ///
    /// **A aba de destino precisa existir.** Restaurar para uma aba já fechada
    /// criaria uma tarefa órfã: ela voltaria ao arquivo sem nenhuma lista onde
    /// aparecer, invisível na tela e contada no tooltip.
    ///
    /// **Todas as tarefas de uma chamada são da mesma aba** (Esclarecimento 5.1).
    /// Os dois desfazeres que o comando atende acontecem dentro de uma aba só, e
    /// um `tab_id` divergente reprova a chamada inteira, junto com o resto do
    /// tudo-ou-nada. O retorno é a lista completa **daquela aba**, o mesmo escopo
    /// que `list_todos` devolve — devolver todas as abas obrigaria a tela a
    /// filtrar um payload que ela não pediu.
    ///
    /// **Limite conhecido:** entre tarefas que empatam no `created_at`, a posição
    /// original não é recuperável — `created_at` é a única ordem que existe, e o
    /// `id` não desempata porque é aleatório. Nesse caso a restaurada entra no fim
    /// do grupo empatado. Só alcança tarefas criadas no mesmo milissegundo; para
    /// voltar ao lugar exato mesmo aí, o comando precisaria receber o índice, e
    /// isso é mudança de contrato.
    pub fn restaurar(&self, mut restauradas: Vec<Todo>) -> Result<Vec<Todo>, String> {
        // **Lote vazio é erro, e não no-op** (Esclarecimento 5.3). Desde que o
        // retorno passou a ser a lista da aba do lote, um lote vazio não tem aba de
        // onde tirar a lista — e devolver `Ok(vec![])` seria o pior desfecho
        // possível: pareceria sucesso e **esvaziaria a tela**, com a lista da aba
        // desaparecendo sem nada ter sido apagado no disco. Falha silenciosa
        // indistinguível de perda de dados é exatamente o que este app foi escrito
        // para nunca fazer.
        //
        // Desfazer de zero tarefa não é gesto que a interface ofereça, então um
        // lote vazio chegando aqui é bug de quem chamou — e bug deve fazer barulho,
        // não limpar a tela. O `Err` sai antes de qualquer escrita, como no resto do
        // tudo-ou-nada.
        if restauradas.is_empty() {
            return Err("Não há nenhuma tarefa para restaurar; o lote chegou vazio.".to_owned());
        }

        for restaurada in restauradas.iter_mut() {
            restaurada.title = validar_titulo(&restaurada.title)?;
        }

        // A aba do lote inteiro, tirada da primeira tarefa. Uma tarefa de outra
        // aba reprova a chamada: os dois desfazeres que este comando atende
        // acontecem dentro de uma aba só, então um lote misturado é sinal de que
        // quem chamou juntou coisas que não vieram do mesmo gesto.
        let aba = restauradas[0].tab_id.clone();
        if let Some(intrusa) = restauradas.iter().find(|todo| todo.tab_id != aba) {
            return Err(format!(
                "A tarefa {} é da aba {} e o lote é da aba {aba}; nada foi restaurado.",
                intrusa.id, intrusa.tab_id
            ));
        }

        self.transacao(move |estado| {
            exigir_aba(estado, &aba)
                .map_err(|_| format!("A aba {aba} não existe mais; nada foi restaurado."))?;
            for restaurada in restauradas {
                // Pega tanto o id que ainda está na lista quanto o id repetido
                // dentro do próprio lote, porque a comparação é contra a cópia
                // que já recebeu os anteriores.
                if estado.todos.iter().any(|todo| todo.id == restaurada.id) {
                    return Err(format!(
                        "A tarefa {} já está na lista; nada foi restaurado.",
                        restaurada.id
                    ));
                }
                estado.todos.push(restaurada);
            }
            ordenar(&mut estado.todos);
            // A lista completa **daquela aba**, o mesmo escopo do `list_todos`.
            Ok(estado
                .todos
                .iter()
                .filter(|todo| todo.tab_id == aba)
                .cloned()
                .collect())
        })
    }

    /// Quantas ainda faltam **no app inteiro**, somando todas as abas. É o
    /// trabalho que resta, e é o que se quer saber sem abrir a janela: contar só
    /// a aba ativa faria o tooltip mudar de número ao trocar de aba, sem nada ter
    /// sido concluído.
    ///
    /// Conta sem clonar a lista, porque isto é lido a cada mutação só para
    /// redesenhar um tooltip.
    pub fn pendentes(&self) -> Result<usize, String> {
        Ok(self
            .travar()?
            .todos
            .iter()
            .filter(|todo| !todo.done)
            .count())
    }

    pub fn alternar(&self, id: &str) -> Result<Todo, String> {
        self.transacao(|estado| {
            let alvo = estado
                .todos
                .iter_mut()
                .find(|todo| todo.id == id)
                .ok_or_else(|| format!("Tarefa {id} não existe."))?;
            alvo.done = !alvo.done;
            // O carimbo de conclusão (Adendo 13). Para TODA tarefa, e não só as
            // recorrentes: quando alguém liga a recorrência numa tarefa que já
            // estava concluída, é este carimbo que dá a base de cálculo — e
            // condicionar a escrita ao `repeat` criaria justamente o caso sem base.
            alvo.done_at = if alvo.done {
                Some(agora_em_millis())
            } else {
                None
            };
            Ok(alvo.clone())
        })
    }

    /// Troca a recorrência de uma tarefa (Adendo 13). `done` e `created_at` ficam
    /// intactos: escolher "todo dia" não conclui nem move nada.
    ///
    /// **Concluída sem carimbo ganha o carimbo agora.** Uma tarefa concluída antes
    /// desta versão tem `done_at: None`; ligar a recorrência nela sem carimbar
    /// deixaria a volta sem base de cálculo — ela nunca voltaria, e a recorrência
    /// pareceria simplesmente não funcionar.
    pub fn definir_recorrencia(&self, id: &str, repeat: Recorrencia) -> Result<Todo, String> {
        self.transacao(|estado| {
            let alvo = estado
                .todos
                .iter_mut()
                .find(|todo| todo.id == id)
                .ok_or_else(|| format!("Tarefa {id} não existe."))?;
            alvo.repeat = repeat;
            if alvo.done && alvo.done_at.is_none() {
                alvo.done_at = Some(agora_em_millis());
            }
            Ok(alvo.clone())
        })
    }

    /// Move a tarefa para outra aba (Adendo 13), **preservando `created_at`**: ela
    /// entra na lista nova pela idade real, e não no fim como se fosse recém-criada.
    /// A aba de destino precisa existir — mover para uma aba fechada criaria a órfã
    /// que o invariante proíbe. Mover para a própria aba é no-op aceito: recusar
    /// criaria um caminho de erro sem ganho.
    pub fn mover(&self, id: &str, tab_id: &str) -> Result<Todo, String> {
        let tab_id = tab_id.to_owned();
        self.transacao(move |estado| {
            exigir_aba(estado, &tab_id)?;
            let alvo = estado
                .todos
                .iter_mut()
                .find(|todo| todo.id == id)
                .ok_or_else(|| format!("Tarefa {id} não existe."))?;
            alvo.tab_id = tab_id;
            Ok(alvo.clone())
        })
    }

    /// Toda tarefa com recorrência, de todas as abas (Adendo 13). É a leitura que o
    /// frontend faz na carga e na meia-noite para calcular quais concluídas
    /// venceram o período — o cálculo é dele, porque o calendário local mora lá.
    pub fn listar_recorrentes(&self) -> Result<Vec<Todo>, String> {
        Ok(self
            .travar()?
            .todos
            .iter()
            .filter(|todo| todo.repeat != Recorrencia::Nenhuma)
            .cloned()
            .collect())
    }

    /// Devolve a pendente as tarefas cujo período venceu: `done = false`,
    /// `done_at = None`. **Tudo ou nada**, como `restore_todos` e pela mesma razão:
    /// os ids vêm de `listar_recorrentes` no mesmo ciclo, então um id que não
    /// existe é bug de quem chamou, e bug faz barulho em vez de aplicar metade.
    /// Lote vazio é `Err` (Esclarecimento 5.3): não é gesto que a interface produza.
    pub fn reativar(&self, ids: &[String]) -> Result<Vec<Todo>, String> {
        if ids.is_empty() {
            return Err("Não há nenhuma tarefa para reativar; o lote chegou vazio.".to_owned());
        }
        let ids = ids.to_vec();
        self.transacao(move |estado| {
            for id in ids.iter() {
                if !estado.todos.iter().any(|todo| todo.id == *id) {
                    return Err(format!("Tarefa {id} não existe; nada foi reativado."));
                }
            }
            let mut reativadas = Vec::with_capacity(ids.len());
            for todo in estado.todos.iter_mut() {
                if ids.contains(&todo.id) {
                    todo.done = false;
                    todo.done_at = None;
                    reativadas.push(todo.clone());
                }
            }
            Ok(reativadas)
        })
    }

    /// Pendentes de cada aba, na ordem canônica das abas (Adendo 13). Alimenta o
    /// `title` do chip — a leitura é uma varredura em memória, barata de propósito,
    /// porque o frontend a repete depois de cada mutação que muda contagem.
    pub fn pendentes_por_aba(&self) -> Result<Vec<ContagemAba>, String> {
        let estado = self.travar()?;
        Ok(estado
            .tabs
            .iter()
            .map(|aba| ContagemAba {
                tab_id: aba.id.clone(),
                pending: estado
                    .todos
                    .iter()
                    .filter(|todo| todo.tab_id == aba.id && !todo.done)
                    .count(),
            })
            .collect())
    }

    /// Grava o estado inteiro no caminho escolhido pelo usuário (Adendo 13), no
    /// formato exato do `todos.json` e pela mesma gravação atômica: um arquivo
    /// exportado é um `todos.json` válido por construção — inclusive para a
    /// importação da outra máquina.
    pub fn exportar_para(&self, caminho: &Path) -> Result<(), String> {
        let copia = self.travar()?.clone();
        persistencia::gravar(caminho, &copia)
    }

    /// Importa um arquivo exportado (ou um `todos.json` de qualquer versão),
    /// **mesclando e nunca substituindo** (Adendo 13): aba ou tarefa cujo id já
    /// existe é pulada, o resto entra. Nenhum caminho daqui remove nada — a regra
    /// inaceitável do PRODUCT.md valendo também para a porta nova.
    ///
    /// O formato antigo (array sem abas) é aceito pela mesma leitura da migração:
    /// ele entra como uma aba "Tarefas" nova. Tarefa importada apontando para uma
    /// aba que não veio no arquivo é adotada pela primeira aba — a mesma regra do
    /// `normalizar`, que roda sobre o estado mesclado antes de gravar.
    pub fn importar_de(&self, caminho: &Path) -> Result<Importado, String> {
        let lido = match persistencia::ler::<Estado>(caminho) {
            persistencia::Leitura::Lido(estado) => estado,
            persistencia::Leitura::Ausente => {
                return Err(format!(
                    "O arquivo {} não existe ou está vazio; nada foi importado.",
                    caminho.display()
                ));
            }
            persistencia::Leitura::Ilegivel => {
                match persistencia::ler::<Vec<TodoAntigo>>(caminho) {
                    persistencia::Leitura::Lido(antigos) => migrar(antigos),
                    _ => {
                        return Err(format!(
                            "O arquivo {} não está num formato que o app entende; nada foi \
                             importado.",
                            caminho.display()
                        ));
                    }
                }
            }
        };

        self.transacao(move |estado| {
            // Título e nome NÃO são validados aqui, pela mesma razão da migração:
            // é a lista de alguém, e recusar na leitura seria descartá-la. O que o
            // limite protege é a digitação, e digitação não passa por esta porta.
            let abas_existentes: HashSet<String> =
                estado.tabs.iter().map(|aba| aba.id.clone()).collect();
            let tarefas_existentes: HashSet<String> =
                estado.todos.iter().map(|todo| todo.id.clone()).collect();

            let mut resumo = Importado { tabs: 0, todos: 0 };
            for aba in lido.tabs {
                if !abas_existentes.contains(&aba.id) {
                    estado.tabs.push(aba);
                    resumo.tabs += 1;
                }
            }
            for todo in lido.todos {
                if !tarefas_existentes.contains(&todo.id) {
                    estado.todos.push(todo);
                    resumo.todos += 1;
                }
            }
            // Reordena, adota órfãs e mantém a aba ativa válida — os mesmos
            // reparos da abertura, sobre o estado mesclado.
            normalizar(estado);
            Ok(resumo)
        })
    }

    pub fn remover(&self, id: &str) -> Result<(), String> {
        self.transacao(|estado| {
            let antes = estado.todos.len();
            estado.todos.retain(|todo| todo.id != id);
            if estado.todos.len() == antes {
                return Err(format!("Tarefa {id} não existe."));
            }
            Ok(())
        })
    }

    /// Limpa as concluídas **de uma aba** e devolve o que restou nela.
    ///
    /// O escopo é a aba porque o gesto está dentro dela: o botão fica no pé da
    /// lista que o usuário está vendo, e apagar as concluídas das outras abas
    /// seria destruir o que não está na tela.
    ///
    /// **As recorrentes ficam** (Adendo 13): uma recorrente concluída não está
    /// encerrada — está esperando o período para voltar a pendente, e levá-la
    /// junto cancelaria em silêncio uma recorrência configurada de propósito.
    /// Remover uma recorrente continua possível pelo `×` da linha, que é gesto
    /// explícito sobre ela.
    pub fn limpar_concluidas(&self, tab_id: &str) -> Result<Vec<Todo>, String> {
        let tab_id = tab_id.to_owned();
        self.transacao(move |estado| {
            exigir_aba(estado, &tab_id)?;
            estado.todos.retain(|todo| {
                todo.tab_id != tab_id || !todo.done || todo.repeat != Recorrencia::Nenhuma
            });
            Ok(estado
                .todos
                .iter()
                .filter(|todo| todo.tab_id == tab_id)
                .cloned()
                .collect())
        })
    }

    /// **A mutação só vale depois de o disco aceitá-la.** A alteração é aplicada
    /// numa cópia, a cópia é gravada, e só então ela substitui o estado em
    /// memória. Mutar o estado direto e gravar depois deixava o `Err` mentindo:
    /// com o disco cheio, `toggle_todo` rejeitava, o frontend desfazia na tela, e
    /// a memória ficava com a alteração — a tarefa voltava marcada sozinha no
    /// `list_todos` seguinte, e era o estado errado que persistia quando a
    /// gravação voltasse a funcionar.
    ///
    /// O cadeado é segurado do começo ao fim, então não há janela em que outra
    /// chamada leia o estado antigo depois da gravação ou grave por cima. Copiar
    /// abas e tarefas por mutação é irrelevante; divergência silenciosa entre
    /// tela, memória e disco não é.
    fn transacao<T>(
        &self,
        alterar: impl FnOnce(&mut Estado) -> Result<T, String>,
    ) -> Result<T, String> {
        let mut guard = self.travar()?;
        let mut copia = guard.clone();
        // Um erro aqui — id que não existe, título vazio, última aba — sai antes
        // de qualquer escrita, e nem o disco nem a memória são tocados.
        let devolucao = alterar(&mut copia)?;
        persistencia::gravar(&self.arquivo, &copia)?;
        *guard = copia;
        Ok(devolucao)
    }

    fn travar(&self) -> Result<std::sync::MutexGuard<'_, Estado>, String> {
        self.estado
            .lock()
            .map_err(|_| "Falha ao acessar a lista de tarefas.".to_string())
    }
}

/// Converte o `todos.json` da versão sem abas: cria a aba **"Tarefas"** e põe
/// todas as tarefas existentes nela.
///
/// **Nenhuma tarefa é descartada aqui, em nenhuma condição.** Perder a lista de
/// quem já usa o app é a única falha inaceitável desta mudança, então a conversão
/// é um `map` campo a campo: não há filtro, não há validação que rejeite, não há
/// caminho em que uma tarefa entre e não saia. Título vazio ou gigante do arquivo
/// antigo passa — ele já estava lá, e recusá-lo na leitura seria apagá-lo.
fn migrar(antigos: Vec<TodoAntigo>) -> Estado {
    let padrao = nova_aba(ABA_PADRAO.to_owned());
    let todos = antigos
        .into_iter()
        .map(|antigo| Todo {
            // `id` e `created_at` são preservados: é o carimbo que dá a ordem da
            // lista, e um id novo faria o desfazer e a tela perderem a
            // referência do que já estava aberto.
            id: antigo.id,
            title: antigo.title,
            done: antigo.done,
            created_at: antigo.created_at,
            tab_id: padrao.id.clone(),
            // O formato antigo não tinha recorrência: `none` É o valor fiel.
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        })
        .collect();
    Estado {
        active_tab: padrao.id.clone(),
        tabs: vec![padrao],
        todos,
    }
}

/// Conserta o estado lido do disco até ele satisfazer os invariantes, em vez de
/// recusá-lo. Roda em toda abertura, nos dois formatos e também no estado vazio.
///
/// Cada reparo aqui existe porque a alternativa era pior: recusar o arquivo
/// significa abrir sem as tarefas do usuário, e o invariante que sobrou intacto
/// não compensa a lista perdida.
fn normalizar(estado: &mut Estado) {
    ordenar_abas(&mut estado.tabs);
    // **Sempre existe pelo menos uma aba.** Vale para o arquivo ausente, para o
    // corrompido e para um `tabs: []` editado à mão: sem aba nenhuma não há lista
    // para mostrar nem lugar onde escrever.
    if estado.tabs.is_empty() {
        estado.tabs.push(nova_aba(ABA_PADRAO.to_owned()));
    }

    let primeira = estado.tabs[0].id.clone();
    let existentes: HashSet<String> = estado.tabs.iter().map(|aba| aba.id.clone()).collect();

    // Tarefa apontando para uma aba que não está no arquivo é adotada pela
    // primeira aba, **não apagada**. Uma órfã é invisível na tela e contada no
    // tooltip; descartá-la resolveria isso destruindo justamente o dado que o app
    // existe para guardar.
    for todo in estado.todos.iter_mut() {
        if !existentes.contains(&todo.tab_id) {
            todo.tab_id = primeira.clone();
        }
    }
    ordenar(&mut estado.todos);

    // Aba ativa que não existe mais cai na primeira, em vez de falhar: o app
    // abrindo numa aba é sempre uma resposta melhor do que o app não abrindo.
    if !existentes.contains(&estado.active_tab) {
        estado.active_tab = primeira;
    }
}

fn exigir_aba(estado: &Estado, id: &str) -> Result<(), String> {
    if estado.tabs.iter().any(|aba| aba.id == id) {
        Ok(())
    } else {
        Err(format!("A aba {id} não existe."))
    }
}

fn nova_aba(name: String) -> Tab {
    Tab {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        created_at: agora_em_millis(),
    }
}

/// Regra única de título, compartilhada por `add_todo` e `rename_todo`: as duas
/// portas de entrada precisam recusar exatamente a mesma coisa, senão renomear
/// vira o caminho para gravar o que criar recusa.
///
/// A contagem é de **caracteres, não de bytes**. Em UTF-8 um "ção" ocupa mais
/// bytes do que letras, e contar bytes rejeitaria um título acentuado bem antes
/// do limite anunciado — o usuário veria "o limite é 200" com 180 na tela.
fn validar_titulo(titulo: &str) -> Result<String, String> {
    let titulo = titulo.trim();
    if titulo.is_empty() {
        return Err("O título não pode estar vazio.".into());
    }
    let caracteres = titulo.chars().count();
    if caracteres > LIMITE_TITULO {
        return Err(format!(
            "O título tem {caracteres} caracteres e o limite é {LIMITE_TITULO}."
        ));
    }
    Ok(titulo.to_owned())
}

/// A mesma ideia do título, com o teto da aba: `create_tab`, `rename_tab` e a
/// aba que volta pelo `restore_tab` recusam exatamente a mesma coisa.
///
/// Contagem em caracteres pelo mesmo motivo — "Compras da família" tem acento, e
/// contar bytes gastaria o limite de 40 antes da conta que o usuário faz de
/// cabeça.
fn validar_nome_aba(nome: &str) -> Result<String, String> {
    let nome = nome.trim();
    if nome.is_empty() {
        return Err("O nome da aba não pode estar vazio.".into());
    }
    let caracteres = nome.chars().count();
    if caracteres > LIMITE_NOME_ABA {
        return Err(format!(
            "O nome da aba tem {caracteres} caracteres e o limite é {LIMITE_NOME_ABA}."
        ));
    }
    Ok(nome.to_owned())
}

/// Mais antigo primeiro. `sort_by_key` é **estável**, então tarefas que empatam
/// no carimbo mantêm a ordem em que entraram — e continuam mantendo depois de uma
/// ida e volta pelo disco, porque o arquivo é gravado nessa mesma ordem.
///
/// Desempatar por `id`, como se fazia antes, parecia dar estabilidade e dava o
/// contrário: o uuid é **aleatório**, então duas tarefas digitadas depressa caíam
/// no mesmo milissegundo e saíam em ordem sorteada — a recém-criada aparecia
/// acima da anterior, e a lista trocava de ordem entre uma execução e outra.
fn ordenar(todos: &mut [Todo]) {
    todos.sort_by_key(|todo| todo.created_at);
}

/// Ordem canônica das abas: `created_at` crescente, estável, pelo mesmo motivo
/// da lista. Não há reordenação por arrasto — seria superfície nova para um ganho
/// que não foi pedido —, então esta é a única ordem que a faixa de abas conhece.
fn ordenar_abas(abas: &mut [Tab]) {
    abas.sort_by_key(|aba| aba.created_at);
}

fn agora_em_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|desde| desde.as_millis() as i64)
        .unwrap_or_default()
}

#[cfg(test)]
mod auxiliares {
    use super::*;
    use std::fs;

    /// Uma store limpa num diretório só dela, para os testes não se atropelarem.
    pub fn store_limpa(nome: &str) -> (Store, PathBuf) {
        let diretorio = std::env::temp_dir().join(format!("nocom-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let _ = fs::remove_file(&diretorio);
        (Store::abrir(diretorio.join("todos.json")), diretorio)
    }

    /// O id da aba que a store criou sozinha na abertura. Quase todo teste de
    /// tarefa precisa dele, porque `add_todo` agora exige uma aba.
    pub fn aba_de(store: &Store) -> String {
        store.listar_abas().expect("listar abas")[0].id.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::auxiliares::*;
    use super::*;
    use std::fs;

    /// Um caminho cujo diretório-pai é um **arquivo**: `create_dir_all` falha, e
    /// com ele toda gravação. É o disco cheio do relato, de forma determinística.
    fn store_que_nao_grava(nome: &str) -> Store {
        let pai = std::env::temp_dir().join(format!("nocom-{}-{nome}", std::process::id()));
        let _ = fs::remove_dir_all(&pai);
        fs::write(&pai, b"nao sou diretorio").expect("criar o falso pai");
        Store::abrir(pai.join("todos.json"))
    }

    fn titulo_de(tamanho: usize) -> String {
        "a".repeat(tamanho)
    }

    /// O contrato do `Err`: se a gravação falhou, nada aconteceu — nem no disco,
    /// nem na memória. Antes da transação, o `push` já tinha entrado no estado e a
    /// tarefa reaparecia sozinha na chamada seguinte.
    #[test]
    fn gravacao_que_falha_nao_deixa_a_mutacao_na_memoria() {
        let store = store_que_nao_grava("acrescentar");
        let aba = aba_de(&store);
        assert!(store.acrescentar("comprar pão", &aba).is_err());
        assert!(
            store.listar(&aba).expect("listar").is_empty(),
            "a tarefa entrou na memória apesar de a gravação ter falhado"
        );
    }

    /// O caso que o revisor descreveu: o `toggle` rejeitado não pode deixar o
    /// `done` invertido em memória, senão a tela e o estado divergem em silêncio.
    #[test]
    fn alternar_rejeitado_nao_inverte_o_estado_em_memoria() {
        let diretorio = std::env::temp_dir().join(format!("nocom-ok-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let store = Store::abrir(diretorio.join("todos.json"));
        let aba = aba_de(&store);
        let criada = store.acrescentar("lavar louça", &aba).expect("acrescentar");
        assert!(!criada.done);

        // A partir daqui nenhuma gravação passa: o pai do arquivo vira um arquivo.
        fs::remove_dir_all(&diretorio).expect("limpar o diretório");
        fs::write(&diretorio, b"nao sou diretorio").expect("bloquear a gravação");

        assert!(store.alternar(&criada.id).is_err());
        let depois = store.listar(&aba).expect("listar");
        assert_eq!(depois.len(), 1);
        assert!(
            !depois[0].done,
            "o done ficou invertido em memória apesar do Err"
        );

        let _ = fs::remove_file(&diretorio);
    }

    /// Erro de regra sai antes de qualquer escrita: id inexistente não é falha de
    /// disco e não deve depender dele para ser recusado.
    #[test]
    fn id_inexistente_falha_sem_tocar_no_disco() {
        let diretorio = std::env::temp_dir().join(format!("nocom-id-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let store = Store::abrir(diretorio.join("todos.json"));
        assert!(store.alternar("nao-existe").is_err());
        assert!(store.remover("nao-existe").is_err());
        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- listar, remover e limpar_concluidas ---

    /// `list_todos` e `clear_completed` devolvem do mais antigo para o mais novo.
    #[test]
    fn a_lista_sai_do_mais_antigo_para_o_mais_novo() {
        let (store, diretorio) = store_limpa("ordem");
        let aba = aba_de(&store);
        let primeira = store.acrescentar("primeira", &aba).expect("acrescentar");
        let segunda = store.acrescentar("segunda", &aba).expect("acrescentar");

        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 2);
        assert!(lista[0].created_at <= lista[1].created_at);
        assert_eq!(lista[0].id, primeira.id);
        assert_eq!(lista[1].id, segunda.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn remover_tira_so_a_tarefa_pedida() {
        let (store, diretorio) = store_limpa("remover");
        let aba = aba_de(&store);
        let fica = store.acrescentar("fica", &aba).expect("acrescentar");
        let sai = store.acrescentar("sai", &aba).expect("acrescentar");

        store.remover(&sai.id).expect("remover");
        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].id, fica.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Devolve o que restou, na ordem, e leva embora só as concluídas.
    #[test]
    fn limpar_concluidas_devolve_o_que_restou_em_ordem() {
        let (store, diretorio) = store_limpa("limpar");
        let aba = aba_de(&store);
        let pendente = store.acrescentar("pendente", &aba).expect("acrescentar");
        let concluida = store.acrescentar("concluída", &aba).expect("acrescentar");
        let ultima = store.acrescentar("última", &aba).expect("acrescentar");
        store.alternar(&concluida.id).expect("alternar");

        let restantes = store.limpar_concluidas(&aba).expect("limpar");
        let ids: Vec<&str> = restantes.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(ids, vec![pendente.id.as_str(), ultima.id.as_str()]);
        assert_eq!(restantes.len(), store.listar(&aba).expect("listar").len());

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- renomear ---

    /// O que o rename existe para não estragar: o título muda, e mais nada.
    #[test]
    fn renomear_preserva_created_at_done_e_a_ordem() {
        let (store, diretorio) = store_limpa("renomear");
        let aba = aba_de(&store);
        let primeira = store.acrescentar("primeira", &aba).expect("acrescentar");
        let segunda = store.acrescentar("segunda", &aba).expect("acrescentar");
        store.alternar(&primeira.id).expect("alternar");

        let renomeada = store
            .renomear(&primeira.id, "  primeira, corrigida  ")
            .expect("renomear");
        assert_eq!(renomeada.title, "primeira, corrigida", "o título é trimado");
        assert_eq!(renomeada.created_at, primeira.created_at, "o carimbo mudou");
        assert!(renomeada.done, "o rename desmarcou a tarefa");
        assert_eq!(renomeada.id, primeira.id);
        assert_eq!(renomeada.tab_id, aba, "o rename mudou a aba da tarefa");

        let lista = store.listar(&aba).expect("listar");
        let ids: Vec<&str> = lista.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec![primeira.id.as_str(), segunda.id.as_str()],
            "a tarefa mudou de lugar na lista"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn renomear_id_inexistente_falha_e_nao_muda_nada() {
        let (store, diretorio) = store_limpa("renomear-id");
        let aba = aba_de(&store);
        let criada = store.acrescentar("intacta", &aba).expect("acrescentar");

        assert!(store.renomear("nao-existe", "novo título").is_err());
        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].title, "intacta");
        assert_eq!(lista[0].id, criada.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Vazio e só-espaços são o mesmo caso, porque o `trim` vem antes.
    #[test]
    fn renomear_com_titulo_vazio_ou_so_espacos_falha() {
        let (store, diretorio) = store_limpa("renomear-vazio");
        let aba = aba_de(&store);
        let criada = store.acrescentar("original", &aba).expect("acrescentar");

        assert!(store.renomear(&criada.id, "").is_err());
        assert!(store.renomear(&criada.id, "   ").is_err());
        assert!(store.renomear(&criada.id, " \t\n ").is_err());
        assert_eq!(
            store.listar(&aba).expect("listar")[0].title,
            "original",
            "um rename recusado alterou o título"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Um rename recusado não pode deixar o título novo em memória — mesmo
    /// contrato do `Err` que vale para o `alternar`.
    #[test]
    fn renomear_rejeitado_pela_gravacao_nao_altera_a_memoria() {
        let diretorio = std::env::temp_dir().join(format!("nocom-ren-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let store = Store::abrir(diretorio.join("todos.json"));
        let aba = aba_de(&store);
        let criada = store
            .acrescentar("título original", &aba)
            .expect("acrescentar");

        fs::remove_dir_all(&diretorio).expect("limpar o diretório");
        fs::write(&diretorio, b"nao sou diretorio").expect("bloquear a gravação");

        assert!(store.renomear(&criada.id, "título novo").is_err());
        assert_eq!(
            store.listar(&aba).expect("listar")[0].title,
            "título original",
            "o título novo ficou em memória apesar do Err"
        );

        let _ = fs::remove_file(&diretorio);
    }

    // --- limite de 200 caracteres ---

    #[test]
    fn duzentos_caracteres_passam_nas_duas_portas() {
        let (store, diretorio) = store_limpa("limite-ok");
        let aba = aba_de(&store);
        let no_limite = titulo_de(LIMITE_TITULO);

        let criada = store
            .acrescentar(&no_limite, &aba)
            .expect("200 deve ser aceito");
        assert_eq!(criada.title.chars().count(), LIMITE_TITULO);
        let renomeada = store
            .renomear(&criada.id, &no_limite)
            .expect("200 deve ser aceito no rename");
        assert_eq!(renomeada.title.chars().count(), LIMITE_TITULO);

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn duzentos_e_um_caracteres_falham_nas_duas_portas() {
        let (store, diretorio) = store_limpa("limite-nao");
        let aba = aba_de(&store);
        let criada = store.acrescentar("base", &aba).expect("acrescentar");
        let longo = titulo_de(LIMITE_TITULO + 1);

        let erro = store
            .acrescentar(&longo, &aba)
            .expect_err("201 deve ser recusado");
        assert!(
            erro.contains("200"),
            "a mensagem precisa dizer o limite: {erro}"
        );
        assert!(store.renomear(&criada.id, &longo).is_err());
        assert_eq!(
            store.listar(&aba).expect("listar").len(),
            1,
            "a tarefa longa entrou na lista"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Caracteres, não bytes.** 200 acentuadas ocupam 400 bytes em UTF-8; se a
    /// contagem fosse por byte, este título seria recusado pela metade do limite.
    #[test]
    fn titulo_acentuado_no_limite_nao_e_recusado_por_contagem_de_bytes() {
        let (store, diretorio) = store_limpa("limite-acento");
        let aba = aba_de(&store);
        let acentuado = "á".repeat(LIMITE_TITULO);
        assert_eq!(acentuado.len(), LIMITE_TITULO * 2, "premissa do teste");

        let criada = store
            .acrescentar(&acentuado, &aba)
            .expect("200 acentuadas devem ser aceitas");
        assert_eq!(criada.title.chars().count(), LIMITE_TITULO);
        store
            .renomear(&criada.id, &acentuado)
            .expect("200 acentuadas devem ser aceitas no rename");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O `trim` vem antes da contagem: espaços em volta não gastam o limite.
    #[test]
    fn espacos_em_volta_nao_gastam_o_limite() {
        let (store, diretorio) = store_limpa("limite-trim");
        let aba = aba_de(&store);
        let com_espacos = format!("   {}   ", titulo_de(LIMITE_TITULO));

        let criada = store
            .acrescentar(&com_espacos, &aba)
            .expect("os espaços deveriam ter sido descartados antes da contagem");
        assert_eq!(criada.title.chars().count(), LIMITE_TITULO);

        let _ = fs::remove_dir_all(&diretorio);
    }
}

#[cfg(test)]
mod tests_ordem {
    use super::*;

    fn todo_em(id: &str, created_at: i64) -> Todo {
        Todo {
            id: id.to_owned(),
            title: id.to_owned(),
            done: false,
            created_at,
            tab_id: "aba".to_owned(),
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        }
    }

    /// **Regressão.** O desempate por `id` sorteava a ordem de tarefas criadas no
    /// mesmo milissegundo: com uuid aleatório, "comprar pão" digitado antes de
    /// "lavar louça" tinha metade de chance de aparecer depois dele. A ordenação
    /// estável mantém quem entrou primeiro na frente, empate ou não.
    #[test]
    fn carimbos_empatados_mantem_a_ordem_de_entrada() {
        let mut todos = vec![
            todo_em("zzz-entrou-primeiro", 1_000),
            todo_em("aaa-entrou-depois", 1_000),
        ];
        ordenar(&mut todos);
        let ids: Vec<&str> = todos.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["zzz-entrou-primeiro", "aaa-entrou-depois"],
            "o id voltou a mandar na ordem quando os carimbos empatam"
        );
    }

    /// A mesma lista, ordenada de novo, não muda — é o que garante que a ordem na
    /// tela sobreviva à ida e volta pelo `todos.json`.
    #[test]
    fn ordenar_duas_vezes_nao_muda_nada() {
        let mut todos = vec![
            todo_em("a", 1_000),
            todo_em("b", 1_000),
            todo_em("c", 900),
            todo_em("d", 1_000),
        ];
        ordenar(&mut todos);
        let primeira: Vec<String> = todos.iter().map(|todo| todo.id.clone()).collect();
        ordenar(&mut todos);
        let segunda: Vec<String> = todos.iter().map(|todo| todo.id.clone()).collect();
        assert_eq!(primeira, segunda);
        assert_eq!(primeira, vec!["c", "a", "b", "d"]);
    }

    /// Carimbo menor vem antes, empatado ou não: a regra do contrato continua de pé.
    #[test]
    fn mais_antigo_continua_vindo_primeiro() {
        let mut todos = vec![todo_em("novo", 2_000), todo_em("velho", 1_000)];
        ordenar(&mut todos);
        assert_eq!(todos[0].id, "velho");
    }

    /// A faixa de abas tem a mesma ordem canônica da lista, pelo mesmo motivo: a
    /// aba criada primeiro fica à esquerda e não troca de lugar entre execuções.
    #[test]
    fn as_abas_saem_da_mais_antiga_para_a_mais_nova_e_o_empate_e_estavel() {
        let aba_em = |id: &str, created_at: i64| Tab {
            id: id.to_owned(),
            name: id.to_owned(),
            created_at,
        };
        let mut abas = vec![
            aba_em("nova", 3_000),
            aba_em("empatada-primeiro", 1_000),
            aba_em("empatada-depois", 1_000),
        ];
        ordenar_abas(&mut abas);
        let ids: Vec<&str> = abas.iter().map(|aba| aba.id.as_str()).collect();
        assert_eq!(ids, vec!["empatada-primeiro", "empatada-depois", "nova"]);
    }
}

#[cfg(test)]
mod tests_restaurar {
    use super::auxiliares::*;
    use super::*;
    use std::fs;

    /// Uma tarefa com carimbo escolhido a dedo, na aba dada. Os testes de posição
    /// semeiam a lista por aqui em vez de por `acrescentar`, porque `acrescentar`
    /// carimba com o relógio: três chamadas seguidas caem no mesmo milissegundo, e
    /// o teste passaria a medir a velocidade da máquina em vez da regra.
    fn todo_em(id: &str, created_at: i64, tab_id: &str) -> Todo {
        Todo {
            id: id.to_owned(),
            title: format!("tarefa {id}"),
            done: false,
            created_at,
            tab_id: tab_id.to_owned(),
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        }
    }

    /// **O ponto inteiro do comando.** Se o id e o carimbo não voltassem iguais,
    /// o frontend podia ter usado `add_todo` — e a tarefa desfeita apareceria no
    /// fim da lista, como um item novo parecido com o que sumiu.
    #[test]
    fn restaurar_devolve_o_mesmo_id_e_carimbo_ao_mesmo_lugar() {
        let (store, diretorio) = store_limpa("rest-mesmo");
        let aba = aba_de(&store);
        let meio = todo_em("meio", 2_000, &aba);
        store
            .restaurar(vec![
                todo_em("primeira", 1_000, &aba),
                meio.clone(),
                todo_em("ultima", 3_000, &aba),
            ])
            .expect("semear");

        store.remover(&meio.id).expect("remover");
        let lista = store.restaurar(vec![meio.clone()]).expect("restaurar");

        let ids: Vec<&str> = lista.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["primeira", "meio", "ultima"],
            "a tarefa restaurada não voltou para o lugar de onde saiu"
        );
        let voltou = &lista[1];
        assert_eq!(voltou.id, meio.id);
        assert_eq!(voltou.created_at, meio.created_at, "o carimbo foi recriado");
        assert_eq!(voltou.title, meio.title);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **O limite conhecido da restauração, fixado por escrito.** Entre tarefas
    /// que empatam no carimbo, `created_at` não distingue quem vinha antes — a
    /// posição original dentro do empate não é recuperável, e a restaurada entra
    /// no fim do grupo empatado. Não é regressão: é o que a informação disponível
    /// permite, e o `id` não serve de desempate porque é aleatório (ver
    /// `tests_ordem`). Só acontece com tarefas criadas no mesmo milissegundo.
    #[test]
    fn entre_carimbos_empatados_a_restaurada_entra_no_fim_do_grupo() {
        let (store, diretorio) = store_limpa("rest-empate");
        let aba = aba_de(&store);
        let meio = todo_em("meio", 1_000, &aba);
        store
            .restaurar(vec![
                todo_em("primeira", 1_000, &aba),
                meio.clone(),
                todo_em("ultima", 1_000, &aba),
            ])
            .expect("semear");

        store.remover(&meio.id).expect("remover");
        let lista = store.restaurar(vec![meio]).expect("restaurar");

        let ids: Vec<&str> = lista.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["primeira", "ultima", "meio"],
            "o comportamento no empate mudou; se foi de propósito, atualize o \
             comentário de `restaurar` e avise o frontend"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O desfazer de "Limpar concluídas": várias de uma vez, cada uma no seu lugar
    /// e com o `done` que tinham.
    #[test]
    fn restaurar_um_lote_recoloca_todas_em_ordem_com_o_done_original() {
        let (store, diretorio) = store_limpa("rest-lote");
        let aba = aba_de(&store);
        store
            .restaurar(vec![
                todo_em("a", 1_000, &aba),
                todo_em("b", 2_000, &aba),
                todo_em("c", 3_000, &aba),
            ])
            .expect("semear");
        let a = store.alternar("a").expect("alternar");
        let c = store.alternar("c").expect("alternar");

        let restantes = store.limpar_concluidas(&aba).expect("limpar");
        assert_eq!(restantes.len(), 1, "só a pendente deveria ter sobrado");

        let lista = store.restaurar(vec![a, c]).expect("restaurar");
        let ids: Vec<&str> = lista.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["a", "b", "c"],
            "as restauradas não voltaram para o lugar de onde saíram"
        );
        assert!(
            lista[0].done && lista[2].done,
            "o done não voltou como estava"
        );
        assert!(!lista[1].done);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Tudo ou nada.** Um id repetido reprova o lote inteiro, e a tarefa válida
    /// que vinha junto também não entra — restaurar pela metade deixaria a tela
    /// mostrando um desfazer que o disco cumpriu só em parte.
    #[test]
    fn id_ja_presente_reprova_o_lote_inteiro_sem_aplicar_nada() {
        let (store, diretorio) = store_limpa("rest-dup");
        let aba = aba_de(&store);
        let presente = store
            .acrescentar("já está aqui", &aba)
            .expect("acrescentar");
        let removida = store.acrescentar("saiu", &aba).expect("acrescentar");
        store.remover(&removida.id).expect("remover");

        let erro = store
            .restaurar(vec![removida.clone(), presente.clone()])
            .expect_err("o id presente deveria reprovar o lote");
        assert!(
            erro.contains(&presente.id),
            "a mensagem não diz qual id: {erro}"
        );

        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1, "o lote reprovado entrou pela metade");
        assert_eq!(lista[0].id, presente.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Id repetido dentro do próprio lote conta como duplicado: a comparação é
    /// contra a cópia que já recebeu os anteriores.
    #[test]
    fn id_repetido_dentro_do_lote_tambem_reprova() {
        let (store, diretorio) = store_limpa("rest-dup-lote");
        let aba = aba_de(&store);
        let saiu = store.acrescentar("saiu", &aba).expect("acrescentar");
        store.remover(&saiu.id).expect("remover");

        assert!(store.restaurar(vec![saiu.clone(), saiu.clone()]).is_err());
        assert!(
            store.listar(&aba).expect("listar").is_empty(),
            "o lote com id repetido entrou pela metade"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Dizer "isto já existiu" não é credencial: a mesma validação de `add_todo`
    /// vale aqui, senão renomear-por-restauração viraria a porta dos fundos.
    #[test]
    fn titulo_invalido_e_recusado_e_nada_e_aplicado() {
        let (store, diretorio) = store_limpa("rest-titulo");
        let aba = aba_de(&store);
        let modelo = store.acrescentar("modelo", &aba).expect("acrescentar");
        store.remover(&modelo.id).expect("remover");

        let vazia = Todo {
            title: "   ".to_owned(),
            ..modelo.clone()
        };
        let longa = Todo {
            title: "a".repeat(LIMITE_TITULO + 1),
            ..modelo.clone()
        };
        assert!(store.restaurar(vec![vazia]).is_err());
        assert!(store.restaurar(vec![longa]).is_err());
        assert!(
            store.listar(&aba).expect("listar").is_empty(),
            "uma tarefa de título inválido entrou pela restauração"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Um título válido mas com espaços em volta é normalizado, como no `add`.
    #[test]
    fn titulo_restaurado_e_trimado_como_no_acrescentar() {
        let (store, diretorio) = store_limpa("rest-trim");
        let aba = aba_de(&store);
        let modelo = store.acrescentar("modelo", &aba).expect("acrescentar");
        store.remover(&modelo.id).expect("remover");

        let lista = store
            .restaurar(vec![Todo {
                title: "  com espaços  ".to_owned(),
                ..modelo
            }])
            .expect("restaurar");
        assert_eq!(lista[0].title, "com espaços");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Lote vazio é recusado, e recusado é melhor que vazio.** Um `Ok(vec![])`
    /// pareceria sucesso e esvaziaria a lista da aba na tela sem nada ter sido
    /// apagado no disco — falha silenciosa indistinguível de perda de dados, que é
    /// o desfecho que este app não pode ter. O que já estava na lista continua lá,
    /// e é essa metade que prende o comportamento: a recusa não pode custar dado.
    #[test]
    fn lote_vazio_e_recusado_sem_tocar_na_lista() {
        let (store, diretorio) = store_limpa("rest-vazio");
        let aba = aba_de(&store);
        let criada = store.acrescentar("intacta", &aba).expect("acrescentar");

        let erro = store
            .restaurar(Vec::new())
            .expect_err("lote vazio precisa fazer barulho, não devolver lista vazia");
        assert!(
            !erro.trim().is_empty(),
            "a rejeição precisa de mensagem legível para o frontend mostrar"
        );

        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1, "o lote vazio recusado mexeu na lista");
        assert_eq!(lista[0].id, criada.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// `restore_tab` **não** é afetado pela regra do lote vazio: ele sempre carrega
    /// uma aba, e uma aba sem tarefa nenhuma é legítima — fechar uma aba vazia é um
    /// gesto comum, e o desfazer dele tem que funcionar.
    #[test]
    fn restaurar_aba_vazia_continua_valendo() {
        let (store, diretorio) = store_limpa("rest-aba-vazia");
        let _ = aba_de(&store);
        let vazia = store.criar_aba("Nunca usei").expect("criar aba");

        let fechada = store.fechar_aba(&vazia.id).expect("fechar aba");
        assert!(fechada.todos.is_empty(), "premissa: a aba estava vazia");

        let abas = store
            .restaurar_aba(fechada.tab, fechada.todos)
            .expect("desfazer o fechamento de uma aba vazia");
        assert_eq!(abas.len(), 2);
        assert!(abas.iter().any(|aba| aba.id == vazia.id));
        assert!(store.listar(&vazia.id).expect("listar").is_empty());

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **O escopo do retorno é a aba do lote** (Esclarecimento 5.1), e não todas
    /// as abas: é o mesmo escopo que `list_todos` devolve, e a tela não precisa
    /// filtrar um payload que não pediu.
    #[test]
    fn o_retorno_e_so_a_lista_da_aba_do_lote() {
        let (store, diretorio) = store_limpa("rest-escopo");
        let aqui = aba_de(&store);
        let ali = store.criar_aba("Ali").expect("criar aba");

        store.acrescentar("fica aqui", &aqui).expect("acrescentar");
        store.acrescentar("mora ali", &ali.id).expect("acrescentar");
        let removida = store
            .acrescentar("volta ali", &ali.id)
            .expect("acrescentar");
        store.remover(&removida.id).expect("remover");

        let devolvida = store.restaurar(vec![removida.clone()]).expect("restaurar");
        assert_eq!(
            devolvida.len(),
            2,
            "o retorno saiu com tarefa de outra aba: {devolvida:?}"
        );
        assert!(
            devolvida.iter().all(|todo| todo.tab_id == ali.id),
            "o retorno não está no escopo da aba do lote"
        );
        // E a tarefa da outra aba continua lá, intacta.
        assert_eq!(store.listar(&aqui).expect("listar").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Um lote misturado reprova a chamada inteira.** Os dois desfazeres que o
    /// comando atende acontecem dentro de uma aba só, então tarefas de abas
    /// diferentes num lote são sinal de que quem chamou juntou coisas que não
    /// vieram do mesmo gesto — e restaurar assim aplicaria metade em cada lista.
    #[test]
    fn lote_com_tarefas_de_abas_diferentes_e_recusado_inteiro() {
        let (store, diretorio) = store_limpa("rest-misturado");
        let aqui = aba_de(&store);
        let ali = store.criar_aba("Ali").expect("criar aba");

        let daqui = store.acrescentar("daqui", &aqui).expect("acrescentar");
        let dali = store.acrescentar("dali", &ali.id).expect("acrescentar");
        store.remover(&daqui.id).expect("remover");
        store.remover(&dali.id).expect("remover");

        let erro = store
            .restaurar(vec![daqui.clone(), dali.clone()])
            .expect_err("um lote de duas abas deveria ser recusado");
        assert!(
            erro.contains(&dali.id),
            "a mensagem não diz qual tarefa: {erro}"
        );

        assert!(
            store.listar_tudo().expect("listar tudo").is_empty(),
            "o lote misturado entrou pela metade"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Restaurar numa lista vazia funciona: é o desfazer da remoção da última
    /// tarefa que restava.
    #[test]
    fn restaurar_na_lista_vazia_recoloca_a_unica_tarefa() {
        let (store, diretorio) = store_limpa("rest-unica");
        let aba = aba_de(&store);
        let unica = store
            .acrescentar("a última que restava", &aba)
            .expect("acrescentar");
        store.remover(&unica.id).expect("remover");
        assert!(store.listar(&aba).expect("listar").is_empty());

        let lista = store.restaurar(vec![unica.clone()]).expect("restaurar");
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].id, unica.id);
        assert_eq!(lista[0].created_at, unica.created_at);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A restauração sobrevive ao processo, como qualquer outra mutação.
    #[test]
    fn a_restauracao_e_gravada_no_disco() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-rest-disco-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("todos.json");

        let store = Store::abrir(arquivo.clone());
        let aba = aba_de(&store);
        let tarefa = store.acrescentar("volta", &aba).expect("acrescentar");
        store.remover(&tarefa.id).expect("remover");
        store.restaurar(vec![tarefa.clone()]).expect("restaurar");

        let relida = Store::abrir(arquivo);
        let lista = relida.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].id, tarefa.id);
        assert_eq!(lista[0].created_at, tarefa.created_at);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Sem órfã pela porta do desfazer.** Restaurar para uma aba já fechada
    /// devolveria a tarefa ao arquivo sem nenhuma lista onde ela apareça:
    /// invisível na tela e contada no tooltip.
    #[test]
    fn restaurar_para_aba_que_nao_existe_mais_e_recusado() {
        let (store, diretorio) = store_limpa("rest-orfa");
        let primeira = aba_de(&store);
        let descartavel = store.criar_aba("Descartável").expect("criar aba");
        let tarefa = store
            .acrescentar("vai junto com a aba", &descartavel.id)
            .expect("acrescentar");

        store.fechar_aba(&descartavel.id).expect("fechar aba");

        let erro = store
            .restaurar(vec![tarefa.clone()])
            .expect_err("a aba não existe mais; a tarefa não pode voltar sozinha");
        assert!(
            erro.contains(&descartavel.id),
            "a mensagem não diz qual aba: {erro}"
        );
        assert!(
            store.listar(&primeira).expect("listar").is_empty(),
            "a tarefa órfã entrou em outra aba"
        );
        assert_eq!(
            store.listar_tudo().expect("listar tudo").len(),
            0,
            "a tarefa órfã entrou no arquivo sem aba"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- pendentes ---

    #[test]
    fn pendentes_conta_so_o_que_falta() {
        let (store, diretorio) = store_limpa("pendentes");
        let aba = aba_de(&store);
        assert_eq!(store.pendentes().expect("contar"), 0);

        let primeira = store.acrescentar("uma", &aba).expect("acrescentar");
        store.acrescentar("outra", &aba).expect("acrescentar");
        assert_eq!(store.pendentes().expect("contar"), 2);

        store.alternar(&primeira.id).expect("alternar");
        assert_eq!(store.pendentes().expect("contar"), 1);

        store.limpar_concluidas(&aba).expect("limpar");
        assert_eq!(store.pendentes().expect("contar"), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }
}

#[cfg(test)]
mod tests_abas {
    use super::auxiliares::*;
    use super::*;
    use std::fs;

    /// Toda store nasce com uma aba: é o invariante e é o que o frontend encontra
    /// na primeira abertura, sem ter que criar nada.
    #[test]
    fn uma_store_nova_ja_tem_a_aba_padrao_e_ela_e_a_ativa() {
        let (store, diretorio) = store_limpa("aba-nova");
        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(abas[0].name, ABA_PADRAO);
        assert_eq!(
            store.aba_ativa().expect("aba ativa"),
            abas[0].id,
            "a aba ativa precisa apontar para a única aba que existe"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn criar_aba_trima_o_nome_e_entra_na_ordem_canonica() {
        let (store, diretorio) = store_limpa("aba-criar");
        let criada = store.criar_aba("  Trabalho  ").expect("criar aba");
        assert_eq!(criada.name, "Trabalho");

        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 2);
        assert_eq!(abas[0].name, ABA_PADRAO, "a mais antiga vem primeiro");
        assert_eq!(abas[1].id, criada.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Nomes repetidos são permitidos**: o `id` é que distingue, e recusar
    /// duplicata criaria um caminho de erro sem ganho real.
    #[test]
    fn duas_abas_podem_ter_o_mesmo_nome() {
        let (store, diretorio) = store_limpa("aba-nome-igual");
        let uma = store.criar_aba("Compras").expect("criar aba");
        let outra = store.criar_aba("Compras").expect("criar a segunda");
        assert_ne!(uma.id, outra.id);
        assert_eq!(store.listar_abas().expect("listar abas").len(), 3);

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn nome_de_aba_vazio_ou_so_espacos_e_recusado() {
        let (store, diretorio) = store_limpa("aba-vazia");
        let aba = aba_de(&store);
        assert!(store.criar_aba("").is_err());
        assert!(store.criar_aba("   ").is_err());
        assert!(store.criar_aba(" \t\n ").is_err());
        assert!(store.renomear_aba(&aba, "  ").is_err());
        assert_eq!(
            store.listar_abas().expect("listar abas").len(),
            1,
            "uma aba de nome vazio entrou na faixa"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// 40 passa, 41 não, nas duas portas — e a contagem é de caracteres, então um
    /// nome acentuado no limite não é recusado pela metade.
    #[test]
    fn o_limite_do_nome_da_aba_e_de_quarenta_caracteres() {
        let (store, diretorio) = store_limpa("aba-limite");
        let no_limite = "a".repeat(LIMITE_NOME_ABA);
        let acima = "a".repeat(LIMITE_NOME_ABA + 1);
        let acentuado = "á".repeat(LIMITE_NOME_ABA);

        let criada = store.criar_aba(&no_limite).expect("40 deve ser aceito");
        assert_eq!(criada.name.chars().count(), LIMITE_NOME_ABA);

        let erro = store.criar_aba(&acima).expect_err("41 deve ser recusado");
        assert!(
            erro.contains("40"),
            "a mensagem precisa dizer o limite: {erro}"
        );
        assert!(store.renomear_aba(&criada.id, &acima).is_err());

        assert_eq!(acentuado.len(), LIMITE_NOME_ABA * 2, "premissa do teste");
        store
            .criar_aba(&acentuado)
            .expect("40 acentuadas devem ser aceitas");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Renomear troca o nome e mais nada: o `created_at` é a posição da aba na
    /// faixa, e corrigir um nome não pode mover a aba debaixo do dedo do usuário.
    #[test]
    fn renomear_aba_preserva_id_created_at_e_a_posicao() {
        let (store, diretorio) = store_limpa("aba-renomear");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");

        let renomeada = store
            .renomear_aba(&primeira, "Pessoal")
            .expect("renomear aba");
        assert_eq!(renomeada.name, "Pessoal");
        assert_eq!(renomeada.id, primeira);

        let abas = store.listar_abas().expect("listar abas");
        let ids: Vec<&str> = abas.iter().map(|aba| aba.id.as_str()).collect();
        assert_eq!(
            ids,
            vec![primeira.as_str(), segunda.id.as_str()],
            "a aba mudou de lugar na faixa"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn renomear_aba_inexistente_falha() {
        let (store, diretorio) = store_limpa("aba-renomear-id");
        assert!(store.renomear_aba("nao-existe", "Qualquer").is_err());
        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- o invariante da última aba ---

    /// **A regra que não tem atalho.** Sem nenhuma aba o app fica sem lugar onde
    /// escrever e a tela sem estado válido. O frontend esconde o gesto, e isto é a
    /// rede embaixo: vale igual para um `invoke` direto.
    #[test]
    fn fechar_a_ultima_aba_e_recusado() {
        let (store, diretorio) = store_limpa("aba-ultima");
        let unica = aba_de(&store);
        store
            .acrescentar("não pode sumir", &unica)
            .expect("acrescentar");

        let erro = store
            .fechar_aba(&unica)
            .expect_err("a última aba não pode ser fechada");
        assert!(
            erro.contains("última"),
            "a mensagem precisa dizer o motivo: {erro}"
        );

        assert_eq!(
            store.listar_abas().expect("listar abas").len(),
            1,
            "a última aba foi fechada apesar do Err"
        );
        assert_eq!(
            store.listar(&unica).expect("listar").len(),
            1,
            "as tarefas da última aba foram embora com o fechamento recusado"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Fechar até sobrar uma: as anteriores saem, a última não. É o caminho que o
    /// usuário percorre de verdade, e ele tem que parar na aba que sobra.
    #[test]
    fn fechar_em_sequencia_para_na_aba_que_sobra() {
        let (store, diretorio) = store_limpa("aba-sequencia");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        let terceira = store.criar_aba("Terceira").expect("criar aba");

        store.fechar_aba(&terceira.id).expect("fechar a terceira");
        store.fechar_aba(&segunda.id).expect("fechar a segunda");
        assert!(store.fechar_aba(&primeira).is_err(), "sobrou zero aba");
        assert_eq!(store.listar_abas().expect("listar abas").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Id que não existe é recusado como "não existe", e não como "é a última",
    /// mesmo quando há só uma aba: quem chamou tem que ser mandado para o problema
    /// certo.
    #[test]
    fn fechar_aba_inexistente_reclama_da_aba_e_nao_do_invariante() {
        let (store, diretorio) = store_limpa("aba-fechar-id");
        let erro = store
            .fechar_aba("nao-existe")
            .expect_err("id inexistente deve falhar");
        assert!(erro.contains("não existe"), "{erro}");
        assert!(!erro.contains("última"), "diagnóstico trocado: {erro}");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// `close_tab` devolve exatamente o que apagou, porque é isso que o desfazer
    /// vai usar para repor.
    #[test]
    fn fechar_aba_devolve_a_aba_e_as_tarefas_dela_e_so_elas() {
        let (store, diretorio) = store_limpa("aba-fechar");
        let fica = aba_de(&store);
        let sai = store.criar_aba("Sai").expect("criar aba");
        let da_que_fica = store.acrescentar("fica", &fica).expect("acrescentar");
        let uma = store.acrescentar("sai 1", &sai.id).expect("acrescentar");
        let outra = store.acrescentar("sai 2", &sai.id).expect("acrescentar");

        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");
        assert_eq!(fechada.tab.id, sai.id);
        assert_eq!(fechada.tab.created_at, sai.created_at);
        let ids: Vec<&str> = fechada.todos.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(ids, vec![uma.id.as_str(), outra.id.as_str()]);

        let restantes = store.listar_tudo().expect("listar tudo");
        assert_eq!(restantes.len(), 1, "a aba fechada deixou tarefas atrás");
        assert_eq!(restantes[0].id, da_que_fica.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Uma aba fechada não é mais destino de nada: `list_todos` e `add_todo` nela
    /// falham em vez de devolver uma lista vazia plausível ou criar uma órfã.
    #[test]
    fn aba_fechada_nao_aceita_mais_listar_nem_acrescentar() {
        let (store, diretorio) = store_limpa("aba-fechada-uso");
        let _ = aba_de(&store);
        let sai = store.criar_aba("Sai").expect("criar aba");
        store.fechar_aba(&sai.id).expect("fechar aba");

        assert!(store.listar(&sai.id).is_err());
        assert!(store.acrescentar("órfã", &sai.id).is_err());
        assert!(store.limpar_concluidas(&sai.id).is_err());
        assert!(store.definir_aba_ativa(&sai.id).is_err());

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- restore_tab: tudo ou nada ---

    /// O desfazer completo: a aba volta com id e carimbo, e as tarefas voltam
    /// com os delas.
    #[test]
    fn restaurar_aba_repoe_a_aba_e_as_tarefas_com_ids_e_carimbos_originais() {
        let (store, diretorio) = store_limpa("aba-rest");
        let _ = aba_de(&store);
        let sai = store.criar_aba("Volta").expect("criar aba");
        let uma = store.acrescentar("primeira", &sai.id).expect("acrescentar");
        let outra = store.acrescentar("segunda", &sai.id).expect("acrescentar");
        store.alternar(&outra.id).expect("alternar");

        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");
        let abas = store
            .restaurar_aba(fechada.tab.clone(), fechada.todos.clone())
            .expect("restaurar aba");

        assert_eq!(abas.len(), 2);
        let reposta = abas
            .iter()
            .find(|aba| aba.id == sai.id)
            .expect("a aba não voltou");
        assert_eq!(reposta.name, "Volta");
        assert_eq!(reposta.created_at, sai.created_at, "o carimbo foi recriado");

        let tarefas = store.listar(&sai.id).expect("listar");
        let ids: Vec<&str> = tarefas.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(ids, vec![uma.id.as_str(), outra.id.as_str()]);
        assert!(!tarefas[0].done);
        assert!(tarefas[1].done, "o done não voltou como estava");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Tudo ou nada, pelo id da aba.** Se a aba já está aberta, nem ela nem as
    /// tarefas do lote entram: repor tarefas numa aba que não foi reposta por
    /// este comando duplicaria a lista de alguém.
    #[test]
    fn restaurar_aba_com_id_de_aba_ja_existente_nao_aplica_nada() {
        let (store, diretorio) = store_limpa("aba-rest-dup-aba");
        let _ = aba_de(&store);
        let viva = store.criar_aba("Viva").expect("criar aba");
        let tarefa = store.acrescentar("única", &viva.id).expect("acrescentar");

        let clone_da_viva = Tab {
            id: viva.id.clone(),
            name: "Cópia".to_owned(),
            created_at: viva.created_at,
        };
        let intrusa = Todo {
            id: "id-novo-que-nao-existe".to_owned(),
            title: "não deveria entrar".to_owned(),
            done: false,
            created_at: 1_000,
            tab_id: viva.id.clone(),
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        };

        let erro = store
            .restaurar_aba(clone_da_viva, vec![intrusa])
            .expect_err("a aba já está aberta");
        assert!(
            erro.contains(&viva.id),
            "a mensagem não diz qual aba: {erro}"
        );

        assert_eq!(store.listar_abas().expect("listar abas").len(), 2);
        let tarefas = store.listar(&viva.id).expect("listar");
        assert_eq!(tarefas.len(), 1, "a tarefa do lote reprovado entrou");
        assert_eq!(tarefas[0].id, tarefa.id);
        assert_eq!(
            store.listar_abas().expect("listar abas")[1].name,
            "Viva",
            "o nome da aba viva foi sobrescrito pelo lote reprovado"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Tudo ou nada, pelo id de uma tarefa.** Uma tarefa já presente reprova o
    /// lote inteiro, e a **aba não volta** — é o caso que separa "tudo ou nada" de
    /// "quase tudo": a aba entraria vazia e o usuário veria o desfazer ter
    /// funcionado pela metade.
    #[test]
    fn restaurar_aba_com_tarefa_ja_presente_nao_repoe_nem_a_aba() {
        let (store, diretorio) = store_limpa("aba-rest-dup-tarefa");
        let outra_aba = aba_de(&store);
        let sai = store.criar_aba("Volta").expect("criar aba");
        let uma = store.acrescentar("primeira", &sai.id).expect("acrescentar");
        store.acrescentar("segunda", &sai.id).expect("acrescentar");

        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");

        // A mesma tarefa reaparece por outro caminho antes do desfazer: agora o
        // lote da aba tem um id que já está na lista.
        store
            .restaurar(vec![Todo {
                tab_id: outra_aba.clone(),
                ..uma.clone()
            }])
            .expect("recolocar a tarefa por outra porta");

        let erro = store
            .restaurar_aba(fechada.tab.clone(), fechada.todos.clone())
            .expect_err("o id repetido deveria reprovar o lote inteiro");
        assert!(
            erro.contains(&uma.id),
            "a mensagem não diz qual tarefa: {erro}"
        );

        assert_eq!(
            store.listar_abas().expect("listar abas").len(),
            1,
            "a aba voltou apesar de o lote ter sido reprovado"
        );
        assert!(
            store.listar_abas().expect("listar abas")[0].id != sai.id,
            "a aba reprovada está na faixa"
        );
        assert_eq!(
            store.listar_tudo().expect("listar tudo").len(),
            1,
            "as tarefas do lote reprovado entraram"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Id repetido dentro do próprio lote também reprova, como no
    /// `restore_todos`.
    #[test]
    fn restaurar_aba_com_id_repetido_dentro_do_lote_e_recusado() {
        let (store, diretorio) = store_limpa("aba-rest-lote-dup");
        let _ = aba_de(&store);
        let sai = store.criar_aba("Volta").expect("criar aba");
        store.acrescentar("única", &sai.id).expect("acrescentar");
        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");

        let mut lote = fechada.todos.clone();
        lote.push(fechada.todos[0].clone());

        assert!(store.restaurar_aba(fechada.tab, lote).is_err());
        assert_eq!(store.listar_abas().expect("listar abas").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Uma tarefa de outra aba dentro do lote é recusada: ela criaria a órfã que o
    /// invariante proíbe, ou entraria numa aba que ninguém mandou mexer.
    #[test]
    fn restaurar_aba_recusa_tarefa_que_nao_e_da_aba() {
        let (store, diretorio) = store_limpa("aba-rest-intrusa");
        let outra = aba_de(&store);
        let sai = store.criar_aba("Volta").expect("criar aba");
        store.acrescentar("da aba", &sai.id).expect("acrescentar");
        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");

        let mut lote = fechada.todos.clone();
        lote.push(Todo {
            id: "de-outra-aba".to_owned(),
            title: "de outra aba".to_owned(),
            done: false,
            created_at: 1_000,
            tab_id: outra.clone(),
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        });

        assert!(store.restaurar_aba(fechada.tab, lote).is_err());
        assert_eq!(store.listar_abas().expect("listar abas").len(), 1);
        assert!(store.listar(&outra).expect("listar").is_empty());

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Nome inválido não entra pela porta do desfazer, como o título não entra
    /// pela do `restore_todos`.
    #[test]
    fn restaurar_aba_com_nome_invalido_e_recusado() {
        let (store, diretorio) = store_limpa("aba-rest-nome");
        let _ = aba_de(&store);
        let sai = store.criar_aba("Volta").expect("criar aba");
        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");

        let sem_nome = Tab {
            name: "   ".to_owned(),
            ..fechada.tab.clone()
        };
        assert!(store.restaurar_aba(sem_nome, Vec::new()).is_err());

        let longo = Tab {
            name: "a".repeat(LIMITE_NOME_ABA + 1),
            ..fechada.tab
        };
        assert!(store.restaurar_aba(longo, Vec::new()).is_err());
        assert_eq!(store.listar_abas().expect("listar abas").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O desfazer sobrevive ao processo: aba e tarefas repostas estão no disco.
    #[test]
    fn a_aba_restaurada_e_gravada_no_disco() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-aba-disco-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("todos.json");

        let sai_id;
        let tarefa_id;
        {
            let store = Store::abrir(arquivo.clone());
            let _ = aba_de(&store);
            let sai = store.criar_aba("Volta").expect("criar aba");
            let tarefa = store
                .acrescentar("volta junto", &sai.id)
                .expect("acrescentar");
            sai_id = sai.id.clone();
            tarefa_id = tarefa.id.clone();
            let fechada = store.fechar_aba(&sai.id).expect("fechar aba");
            store
                .restaurar_aba(fechada.tab, fechada.todos)
                .expect("restaurar aba");
        }

        let relida = Store::abrir(arquivo);
        assert_eq!(relida.listar_abas().expect("listar abas").len(), 2);
        let tarefas = relida.listar(&sai_id).expect("listar");
        assert_eq!(tarefas.len(), 1);
        assert_eq!(tarefas[0].id, tarefa_id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- aba ativa ---

    #[test]
    fn a_aba_ativa_persiste_entre_execucoes() {
        let diretorio = std::env::temp_dir().join(format!("nocom-ativa-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("todos.json");

        let escolhida;
        {
            let store = Store::abrir(arquivo.clone());
            let segunda = store.criar_aba("Segunda").expect("criar aba");
            store
                .definir_aba_ativa(&segunda.id)
                .expect("definir aba ativa");
            escolhida = segunda.id;
        }

        assert_eq!(
            Store::abrir(arquivo).aba_ativa().expect("aba ativa"),
            escolhida,
            "a aba ativa não sobreviveu ao fechamento do app"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Quatro abas em ordem canônica, com a primeira sendo a que a store já traz.
    /// `criar_aba` carimba com o relógio e as três caem no mesmo milissegundo, mas
    /// `ordenar_abas` é estável — então a ordem de criação **é** a ordem da faixa,
    /// e o teste não depende da velocidade da máquina.
    fn quatro_abas(store: &Store) -> Vec<String> {
        let mut ids = vec![aba_de(store)];
        for nome in ["Segunda", "Terceira", "Quarta"] {
            ids.push(store.criar_aba(nome).expect("criar aba").id);
        }
        assert_eq!(
            store
                .listar_abas()
                .expect("listar abas")
                .iter()
                .map(|aba| aba.id.clone())
                .collect::<Vec<String>>(),
            ids,
            "a premissa do teste caiu: a faixa não está na ordem de criação"
        );
        ids
    }

    /// **Fechar a aba aberta vai para a VIZINHA — a próxima na ordem canônica**
    /// (Esclarecimento 5.2). Cair na primeira restante jogaria o usuário para longe
    /// de onde ele estava: fechar a aba 3 de 4 e aparecer na aba 1 é perder o
    /// lugar. E deixar como estava faria `get_active_tab` devolver um id
    /// inexistente, que é o estado inválido que o invariante existe para impedir.
    #[test]
    fn fechar_a_aba_ativa_do_meio_vai_para_a_proxima() {
        let (store, diretorio) = store_limpa("ativa-vizinha");
        let ids = quatro_abas(&store);
        store.definir_aba_ativa(&ids[2]).expect("definir aba ativa");

        store.fechar_aba(&ids[2]).expect("fechar a aba ativa");
        assert_eq!(
            store.aba_ativa().expect("aba ativa"),
            ids[3],
            "a ativa não foi para a vizinha da direita"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A primeira aba também tem vizinha à direita: fechar a ativa na ponta
    /// esquerda anda para a segunda, e não fica onde estava.
    #[test]
    fn fechar_a_primeira_aba_ativa_vai_para_a_segunda() {
        let (store, diretorio) = store_limpa("ativa-vizinha-inicio");
        let ids = quatro_abas(&store);
        store.definir_aba_ativa(&ids[0]).expect("definir aba ativa");

        store.fechar_aba(&ids[0]).expect("fechar a aba ativa");
        assert_eq!(store.aba_ativa().expect("aba ativa"), ids[1]);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **A última da faixa não tem próxima, então vai para a anterior.** É o único
    /// caso em que a vizinha fica à esquerda, e é o que impede a regra de sair do
    /// vetor pela direita.
    #[test]
    fn fechar_a_ultima_aba_ativa_da_faixa_vai_para_a_anterior() {
        let (store, diretorio) = store_limpa("ativa-vizinha-fim");
        let ids = quatro_abas(&store);
        store.definir_aba_ativa(&ids[3]).expect("definir aba ativa");

        store.fechar_aba(&ids[3]).expect("fechar a aba ativa");
        assert_eq!(
            store.aba_ativa().expect("aba ativa"),
            ids[2],
            "a ativa não caiu na vizinha da esquerda"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Com duas abas, os dois lados da regra se encontram: fechar a segunda cai na
    /// primeira (não tem próxima), e fechar a primeira cai na segunda.
    #[test]
    fn com_duas_abas_a_vizinha_e_a_que_sobra() {
        let (store, diretorio) = store_limpa("ativa-vizinha-duas");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        store
            .definir_aba_ativa(&segunda.id)
            .expect("definir aba ativa");

        store.fechar_aba(&segunda.id).expect("fechar a aba ativa");
        assert_eq!(store.aba_ativa().expect("aba ativa"), primeira);

        let terceira = store.criar_aba("Terceira").expect("criar aba");
        store
            .definir_aba_ativa(&primeira)
            .expect("definir aba ativa");
        store.fechar_aba(&primeira).expect("fechar a aba ativa");
        assert_eq!(store.aba_ativa().expect("aba ativa"), terceira.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A ativa nunca sai apontando para a aba que acabou de fechar, em qualquer
    /// posição da faixa. É o invariante por trás dos casos acima, escrito uma vez.
    #[test]
    fn a_ativa_nunca_aponta_para_a_aba_fechada() {
        for posicao in 0..4 {
            let (store, diretorio) = store_limpa(&format!("ativa-invariante-{posicao}"));
            let ids = quatro_abas(&store);
            store
                .definir_aba_ativa(&ids[posicao])
                .expect("definir aba ativa");

            store.fechar_aba(&ids[posicao]).expect("fechar a aba ativa");
            let ativa = store.aba_ativa().expect("aba ativa");
            assert_ne!(ativa, ids[posicao], "a ativa ficou na aba fechada");
            assert!(
                store
                    .listar_abas()
                    .expect("listar abas")
                    .iter()
                    .any(|aba| aba.id == ativa),
                "a ativa aponta para uma aba que não está na faixa"
            );

            let _ = fs::remove_dir_all(&diretorio);
        }
    }

    /// Fechar uma aba que não é a ativa não mexe no foco: o usuário continua onde
    /// estava.
    #[test]
    fn fechar_outra_aba_nao_mexe_na_ativa() {
        let (store, diretorio) = store_limpa("ativa-outra");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        store
            .definir_aba_ativa(&segunda.id)
            .expect("definir aba ativa");

        store.fechar_aba(&primeira).expect("fechar a outra");
        assert_eq!(store.aba_ativa().expect("aba ativa"), segunda.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **`restore_tab` não mexe no foco.** Quem restaura decide para onde ir com
    /// `set_active_tab`; trocar a ativa aqui teletransportaria o usuário para a
    /// aba reposta no meio do que ele estivesse fazendo.
    #[test]
    fn restaurar_aba_nao_muda_a_aba_ativa() {
        let (store, diretorio) = store_limpa("ativa-rest");
        let primeira = aba_de(&store);
        let sai = store.criar_aba("Sai").expect("criar aba");
        store.definir_aba_ativa(&sai.id).expect("definir aba ativa");

        let fechada = store.fechar_aba(&sai.id).expect("fechar aba");
        assert_eq!(store.aba_ativa().expect("aba ativa"), primeira);

        store
            .restaurar_aba(fechada.tab, fechada.todos)
            .expect("restaurar aba");
        assert_eq!(
            store.aba_ativa().expect("aba ativa"),
            primeira,
            "o desfazer trocou a aba que o usuário estava vendo"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    #[test]
    fn definir_aba_ativa_inexistente_falha_e_nao_muda_a_ativa() {
        let (store, diretorio) = store_limpa("ativa-id");
        let primeira = aba_de(&store);
        assert!(store.definir_aba_ativa("nao-existe").is_err());
        assert_eq!(store.aba_ativa().expect("aba ativa"), primeira);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A ativa gravada que não existe mais cai na primeira aba, em vez de falhar:
    /// o app abrindo numa aba é sempre melhor do que o app não abrindo.
    #[test]
    fn aba_ativa_gravada_que_nao_existe_mais_cai_na_primeira() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-ativa-fantasma-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        fs::create_dir_all(&diretorio).expect("criar o diretório");
        let arquivo = diretorio.join("todos.json");
        fs::write(
            &arquivo,
            br#"{
              "tabs": [
                { "id": "aba-a", "name": "A", "created_at": 1000 },
                { "id": "aba-b", "name": "B", "created_at": 2000 }
              ],
              "todos": [],
              "active_tab": "aba-que-foi-fechada"
            }"#,
        )
        .expect("gravar o estado");

        let store = Store::abrir(arquivo);
        assert_eq!(store.aba_ativa().expect("aba ativa"), "aba-a");

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- tarefas por aba ---

    /// O ponto das abas: cada uma tem as suas tarefas, e uma não vê a outra.
    #[test]
    fn cada_aba_lista_so_as_tarefas_dela() {
        let (store, diretorio) = store_limpa("aba-escopo");
        let trabalho = aba_de(&store);
        let casa = store.criar_aba("Casa").expect("criar aba");

        let relatorio = store
            .acrescentar("relatório", &trabalho)
            .expect("acrescentar");
        let louca = store.acrescentar("louça", &casa.id).expect("acrescentar");

        let no_trabalho = store.listar(&trabalho).expect("listar");
        assert_eq!(no_trabalho.len(), 1);
        assert_eq!(no_trabalho[0].id, relatorio.id);
        assert_eq!(no_trabalho[0].tab_id, trabalho);

        let em_casa = store.listar(&casa.id).expect("listar");
        assert_eq!(em_casa.len(), 1);
        assert_eq!(em_casa[0].id, louca.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// `clear_completed` é da aba onde o botão está. Apagar as concluídas das
    /// outras abas seria destruir o que não está na tela.
    #[test]
    fn limpar_concluidas_nao_toca_nas_outras_abas() {
        let (store, diretorio) = store_limpa("aba-limpar");
        let aqui = aba_de(&store);
        let ali = store.criar_aba("Ali").expect("criar aba");

        let daqui = store.acrescentar("daqui", &aqui).expect("acrescentar");
        let dali = store.acrescentar("dali", &ali.id).expect("acrescentar");
        store.alternar(&daqui.id).expect("alternar");
        store.alternar(&dali.id).expect("alternar");

        let restantes = store.limpar_concluidas(&aqui).expect("limpar");
        assert!(
            restantes.is_empty(),
            "a aba desta chamada devia ficar vazia"
        );

        let sobrou_ali = store.listar(&ali.id).expect("listar");
        assert_eq!(
            sobrou_ali.len(),
            1,
            "a limpeza de uma aba levou a concluída da outra"
        );
        assert_eq!(sobrou_ali[0].id, dali.id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **O tooltip do tray soma todas as abas.** Contar só a aba ativa faria o
    /// número mudar ao trocar de aba, sem nada ter sido concluído — e o que se
    /// quer saber sem abrir a janela é o trabalho que resta no app inteiro.
    #[test]
    fn pendentes_soma_as_abas_todas() {
        let (store, diretorio) = store_limpa("pendentes-abas");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        let terceira = store.criar_aba("Terceira").expect("criar aba");

        store.acrescentar("uma", &primeira).expect("acrescentar");
        store.acrescentar("duas", &segunda.id).expect("acrescentar");
        let concluida = store
            .acrescentar("três", &terceira.id)
            .expect("acrescentar");
        assert_eq!(
            store.pendentes().expect("contar"),
            3,
            "a contagem parou na aba ativa"
        );

        store.alternar(&concluida.id).expect("alternar");
        assert_eq!(store.pendentes().expect("contar"), 2);

        // Fechar uma aba tira as pendentes dela da conta: elas não são mais
        // trabalho que resta.
        store.fechar_aba(&segunda.id).expect("fechar aba");
        assert_eq!(store.pendentes().expect("contar"), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }
}

/// A migração do `todos.json` sem abas. **Perder a lista de quem já usa o app é a
/// única falha inaceitável desta mudança**, então cada caminho de leitura tem um
/// teste que conta as tarefas do outro lado.
#[cfg(test)]
mod tests_migracao {
    use super::*;
    use std::fs;

    fn diretorio_limpo(nome: &str) -> PathBuf {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-mig-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let _ = fs::remove_file(&diretorio);
        fs::create_dir_all(&diretorio).expect("criar o diretório");
        diretorio
    }

    /// O formato antigo, exatamente como o app anterior o gravava: um array de
    /// tarefas sem `tab_id`.
    const TODOS_ANTIGOS: &str = r#"[
      { "id": "id-antigo-1", "title": "comprar pão", "done": false, "created_at": 1000 },
      { "id": "id-antigo-2", "title": "lavar louça", "done": true, "created_at": 2000 },
      { "id": "id-antigo-3", "title": "pagar a conta", "done": false, "created_at": 3000 }
    ]"#;

    /// **O teste que este adendo existe para não quebrar.** As três tarefas de
    /// quem já usava o app aparecem na aba padrão, com os ids e os carimbos que
    /// tinham, e o `done` de cada uma.
    #[test]
    fn o_formato_antigo_vira_a_aba_tarefas_sem_perder_nada() {
        let diretorio = diretorio_limpo("basico");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, TODOS_ANTIGOS).expect("gravar o formato antigo");

        let store = Store::abrir(arquivo);

        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1, "a migração deveria criar uma aba só");
        assert_eq!(
            abas[0].name, ABA_PADRAO,
            "a aba da migração precisa se chamar \"{ABA_PADRAO}\""
        );

        let tarefas = store.listar(&abas[0].id).expect("listar");
        assert_eq!(tarefas.len(), 3, "a migração perdeu tarefa");

        let ids: Vec<&str> = tarefas.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["id-antigo-1", "id-antigo-2", "id-antigo-3"],
            "os ids não foram preservados, ou a ordem por created_at se perdeu"
        );
        let carimbos: Vec<i64> = tarefas.iter().map(|todo| todo.created_at).collect();
        assert_eq!(carimbos, vec![1_000, 2_000, 3_000], "os carimbos mudaram");

        assert_eq!(tarefas[0].title, "comprar pão");
        assert!(!tarefas[0].done);
        assert!(tarefas[1].done, "o done da tarefa concluída se perdeu");

        // Toda tarefa migrada aponta para a aba criada: nenhuma órfã.
        assert!(tarefas.iter().all(|todo| todo.tab_id == abas[0].id));
        // E a aba padrão já é a ativa, senão a primeira abertura depois da
        // atualização não teria lista para mostrar.
        assert_eq!(store.aba_ativa().expect("aba ativa"), abas[0].id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A migração acontece **em memória**: o arquivo antigo continua no disco
    /// enquanto o usuário não mudar nada. Se a atualização gravasse na abertura e
    /// a gravação falhasse pela metade, o formato que ainda funcionava já teria
    /// sido substituído.
    #[test]
    fn a_migracao_nao_reescreve_o_arquivo_antes_da_primeira_mutacao() {
        let diretorio = diretorio_limpo("sem-gravar");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, TODOS_ANTIGOS).expect("gravar o formato antigo");

        let store = Store::abrir(arquivo.clone());
        let no_disco = fs::read_to_string(&arquivo).expect("ler o arquivo");
        assert!(
            no_disco.trim_start().starts_with('['),
            "a abertura reescreveu o arquivo antigo: {no_disco}"
        );

        // E na primeira mutação ele passa para o formato novo, com as tarefas
        // antigas ainda lá.
        let aba = store.listar_abas().expect("listar abas")[0].id.clone();
        store.acrescentar("nova", &aba).expect("acrescentar");
        let convertido = fs::read_to_string(&arquivo).expect("ler o arquivo");
        assert!(convertido.contains("\"tabs\""), "{convertido}");
        assert!(
            convertido.contains("id-antigo-1"),
            "a conversão perdeu as tarefas antigas: {convertido}"
        );
        assert_eq!(store.listar(&aba).expect("listar").len(), 4);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// A migração sobrevive ao processo: reaberto, o arquivo já convertido tem as
    /// tarefas antigas na mesma aba.
    #[test]
    fn as_tarefas_migradas_continuam_la_depois_de_reabrir() {
        let diretorio = diretorio_limpo("reabrir");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, TODOS_ANTIGOS).expect("gravar o formato antigo");

        let aba = {
            let store = Store::abrir(arquivo.clone());
            let aba = store.listar_abas().expect("listar abas")[0].id.clone();
            // Uma mutação qualquer para o novo formato chegar ao disco.
            store
                .acrescentar("depois da migração", &aba)
                .expect("acrescentar");
            aba
        };

        let relida = Store::abrir(arquivo);
        let abas = relida.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(
            abas[0].id, aba,
            "a segunda abertura criou outra aba em vez de reusar a migrada"
        );
        let tarefas = relida.listar(&aba).expect("listar");
        assert_eq!(tarefas.len(), 4, "a reabertura perdeu tarefa");
        assert_eq!(tarefas[0].id, "id-antigo-1");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Nem a validação apaga tarefa antiga.** Um título vazio ou acima do limite
    /// no arquivo antigo já estava lá; recusá-lo na leitura seria apagá-lo, e o
    /// usuário perderia a linha sem nunca ter pedido nada.
    #[test]
    fn tarefa_antiga_com_titulo_invalido_nao_e_descartada_na_migracao() {
        let diretorio = diretorio_limpo("titulo-invalido");
        let arquivo = diretorio.join("todos.json");
        let longo = "a".repeat(LIMITE_TITULO + 50);
        fs::write(
            &arquivo,
            format!(
                r#"[
                  {{ "id": "vazia", "title": "", "done": false, "created_at": 1000 }},
                  {{ "id": "longa", "title": "{longo}", "done": false, "created_at": 2000 }}
                ]"#
            ),
        )
        .expect("gravar o formato antigo");

        let store = Store::abrir(arquivo);
        let aba = store.listar_abas().expect("listar abas")[0].id.clone();
        let tarefas = store.listar(&aba).expect("listar");
        assert_eq!(
            tarefas.len(),
            2,
            "a migração descartou tarefa por validação"
        );
        let ids: Vec<&str> = tarefas.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(ids, vec!["vazia", "longa"]);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Um array vazio é o app antigo sem nenhuma tarefa: vira a aba "Tarefas"
    /// vazia, e não zero aba.
    #[test]
    fn array_antigo_vazio_vira_a_aba_padrao_vazia() {
        let diretorio = diretorio_limpo("vazio");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, b"[]").expect("gravar o array vazio");

        let store = Store::abrir(arquivo);
        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(abas[0].name, ABA_PADRAO);
        assert!(store.listar(&abas[0].id).expect("listar").is_empty());

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Arquivo inexistente começa com a aba "Tarefas" vazia, sem pânico — a mesma
    /// regra do contrato original.
    #[test]
    fn arquivo_inexistente_comeca_com_a_aba_padrao_vazia() {
        let diretorio = diretorio_limpo("ausente");
        let store = Store::abrir(diretorio.join("nem-existe.json"));
        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(abas[0].name, ABA_PADRAO);
        assert_eq!(store.aba_ativa().expect("aba ativa"), abas[0].id);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Corrompido também, e sem pânico: derrubar o app por causa de um JSON
    /// truncado deixaria o usuário sem app e sem as tarefas.
    #[test]
    fn json_corrompido_abre_com_a_aba_padrao_vazia() {
        let diretorio = diretorio_limpo("corrompido");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, b"{ isto nao e json").expect("gravar lixo");

        let store = Store::abrir(arquivo);
        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(abas[0].name, ABA_PADRAO);
        assert!(store.listar(&abas[0].id).expect("listar").is_empty());

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **O campo que falta não pode custar a lista.** Um arquivo já no formato
    /// novo mas sem `active_tab` — de uma versão intermediária, de uma edição à
    /// mão — precisa abrir com as tarefas dele. Sem o `default` no campo, a
    /// desserialização falharia inteira e "falhou" aqui significa lista perdida.
    #[test]
    fn formato_novo_sem_aba_ativa_abre_com_as_tarefas_e_cai_na_primeira() {
        let diretorio = diretorio_limpo("sem-ativa");
        let arquivo = diretorio.join("todos.json");
        fs::write(
            &arquivo,
            br#"{
              "tabs": [{ "id": "aba-1", "name": "Tarefas", "created_at": 1000 }],
              "todos": [
                { "id": "t1", "title": "sobrevive", "done": false, "created_at": 1500, "tab_id": "aba-1" }
              ]
            }"#,
        )
        .expect("gravar o estado sem active_tab");

        let store = Store::abrir(arquivo);
        assert_eq!(store.aba_ativa().expect("aba ativa"), "aba-1");
        let tarefas = store.listar("aba-1").expect("listar");
        assert_eq!(tarefas.len(), 1, "a tarefa se perdeu por um campo ausente");
        assert_eq!(tarefas[0].id, "t1");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// **Órfã é adotada, não apagada.** Uma tarefa apontando para uma aba que não
    /// está no arquivo seria invisível na tela e contada no tooltip; descartá-la
    /// resolveria isso destruindo justamente o dado que o app existe para guardar.
    #[test]
    fn tarefa_apontando_para_aba_inexistente_e_adotada_pela_primeira() {
        let diretorio = diretorio_limpo("orfa");
        let arquivo = diretorio.join("todos.json");
        fs::write(
            &arquivo,
            br#"{
              "tabs": [
                { "id": "aba-1", "name": "Primeira", "created_at": 1000 },
                { "id": "aba-2", "name": "Segunda", "created_at": 2000 }
              ],
              "todos": [
                { "id": "t1", "title": "com aba", "done": false, "created_at": 1500, "tab_id": "aba-2" },
                { "id": "t2", "title": "sem aba", "done": false, "created_at": 1600, "tab_id": "aba-que-sumiu" }
              ],
              "active_tab": "aba-1"
            }"#,
        )
        .expect("gravar o estado com órfã");

        let store = Store::abrir(arquivo);
        assert_eq!(
            store.listar_tudo().expect("listar tudo").len(),
            2,
            "a órfã foi descartada em vez de adotada"
        );
        let na_primeira = store.listar("aba-1").expect("listar");
        assert_eq!(na_primeira.len(), 1);
        assert_eq!(na_primeira[0].id, "t2");
        assert_eq!(store.listar("aba-2").expect("listar").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Um `tabs: []` editado à mão não deixa o app sem aba: o invariante é
    /// reconstruído, e as tarefas que estavam lá são adotadas em vez de perdidas.
    #[test]
    fn estado_sem_nenhuma_aba_ganha_a_aba_padrao_e_mantem_as_tarefas() {
        let diretorio = diretorio_limpo("sem-aba");
        let arquivo = diretorio.join("todos.json");
        fs::write(
            &arquivo,
            br#"{
              "tabs": [],
              "todos": [
                { "id": "t1", "title": "sobrevive", "done": false, "created_at": 1000, "tab_id": "aba-que-sumiu" }
              ],
              "active_tab": "aba-que-sumiu"
            }"#,
        )
        .expect("gravar o estado sem aba");

        let store = Store::abrir(arquivo);
        let abas = store.listar_abas().expect("listar abas");
        assert_eq!(abas.len(), 1);
        assert_eq!(abas[0].name, ABA_PADRAO);
        assert_eq!(store.aba_ativa().expect("aba ativa"), abas[0].id);
        let tarefas = store.listar(&abas[0].id).expect("listar");
        assert_eq!(tarefas.len(), 1, "a tarefa se perdeu junto com a aba");
        assert_eq!(tarefas[0].id, "t1");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O formato novo é um objeto e o antigo é um array, então a leitura não os
    /// confunde: um arquivo já convertido não é relido como antigo, e não ganha
    /// uma segunda aba "Tarefas" a cada abertura.
    #[test]
    fn o_formato_novo_nao_e_lido_como_antigo() {
        let diretorio = diretorio_limpo("sem-confusao");
        let arquivo = diretorio.join("todos.json");

        {
            let store = Store::abrir(arquivo.clone());
            let aba = store.listar_abas().expect("listar abas")[0].id.clone();
            store.criar_aba("Segunda").expect("criar aba");
            store.acrescentar("uma", &aba).expect("acrescentar");
        }

        for _ in 0..3 {
            let store = Store::abrir(arquivo.clone());
            assert_eq!(
                store.listar_abas().expect("listar abas").len(),
                2,
                "uma reabertura criou aba a mais"
            );
            assert_eq!(store.listar_tudo().expect("listar tudo").len(), 1);
        }

        let _ = fs::remove_dir_all(&diretorio);
    }
}

/// **O arquivo que o app não entende.** Estes testes existem por causa de uma
/// falha real do caminho de abertura: `ler` devolvia `None` tanto para "não há
/// arquivo" quanto para "não entendi o arquivo", os dois casos abriam uma aba
/// "Tarefas" vazia sem aviso nenhum, e a primeira tarefa digitada gravava por
/// cima da única cópia da lista do usuário.
///
/// O PRODUCT.md declara "nenhum caminho pode apagar tarefa antiga" como a única
/// falha inaceitável do produto, e o Princípio 5 proíbe que um erro seja
/// indistinguível de perda de dados. Estes testes prendem as duas metades da
/// correção: o arquivo sai do caminho, e o fato é contável para a tela.
#[cfg(test)]
mod tests_resgate {
    use super::*;
    use std::fs;

    fn diretorio_limpo(nome: &str) -> PathBuf {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-resgate-{nome}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let _ = fs::remove_file(&diretorio);
        fs::create_dir_all(&diretorio).expect("criar o diretório");
        diretorio
    }

    /// Um JSON truncado no meio — o que sobra de uma gravação interrompida antes
    /// de o `sync_all` e o rename existirem, ou de uma edição à mão malfeita.
    const TRUNCADO: &str = r#"{ "tabs": [ { "id": "a", "name": "Tarefas", "created"#;

    /// **O teste que fecha o caminho de perda.** A lista ilegível é movida para
    /// um arquivo ao lado, e não fica onde a próxima gravação vai passar.
    #[test]
    fn arquivo_ilegivel_e_guardado_de_lado_antes_de_qualquer_gravacao() {
        let diretorio = diretorio_limpo("guardado");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, TRUNCADO).expect("gravar o arquivo torto");

        let store = Store::abrir(arquivo.clone());
        let backup = diretorio.join("todos.corrupt.json");

        assert!(
            backup.exists(),
            "o arquivo ilegível precisa ter sido preservado"
        );
        assert_eq!(
            fs::read_to_string(&backup).expect("ler o backup"),
            TRUNCADO,
            "o backup precisa ser byte a byte o que estava no disco"
        );
        assert!(
            !arquivo.exists(),
            "o ilegível sai do caminho: quem fica ali é o arquivo novo, criado na \
             primeira mutação"
        );

        // A primeira mutação de verdade grava um arquivo novo — e não toca no
        // backup, que é o único lugar onde a lista antiga ainda existe.
        let aba = store.listar_abas().expect("listar abas")[0].id.clone();
        store
            .acrescentar("a primeira depois do estrago", &aba)
            .expect("acrescentar");
        assert!(arquivo.exists(), "a mutação grava um todos.json novo");
        assert_eq!(
            fs::read_to_string(&backup).expect("ler o backup"),
            TRUNCADO,
            "gravar não pode encostar no backup"
        );
    }

    /// A outra metade: o fato chega à tela. Sem isto, o app abre vazio em
    /// silêncio e o usuário não tem como distinguir isso de ter perdido tudo.
    #[test]
    fn o_caminho_do_resgate_e_contavel_para_a_tela() {
        let diretorio = diretorio_limpo("contavel");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, TRUNCADO).expect("gravar o arquivo torto");

        let store = Store::abrir(arquivo);
        let resgate = store
            .resgate()
            .expect("a abertura ilegível precisa relatar");
        assert!(
            resgate.ends_with("todos.corrupt.json"),
            "o resgate precisa apontar para o backup de verdade, e não para uma \
             frase: {resgate}"
        );
    }

    /// **Abertura normal não relata nada.** Um aviso em toda abertura viraria
    /// ruído, e ruído é o que faz um aviso de verdade não ser lido.
    #[test]
    fn abertura_normal_e_primeira_execucao_nao_relatam_resgate() {
        let diretorio = diretorio_limpo("silencio");

        // Primeira execução: não há arquivo.
        let store = Store::abrir(diretorio.join("todos.json"));
        assert!(store.resgate().is_none(), "arquivo ausente não é resgate");
        let aba = store.listar_abas().expect("listar abas")[0].id.clone();
        store.acrescentar("uma tarefa", &aba).expect("acrescentar");
        drop(store);

        // Segunda abertura: o arquivo existe e é legível.
        let store = Store::abrir(diretorio.join("todos.json"));
        assert!(store.resgate().is_none(), "arquivo legível não é resgate");
        assert_eq!(store.listar_tudo().expect("listar").len(), 1);
    }

    /// Um arquivo de zero byte é o que sobra de uma gravação que morreu antes de
    /// escrever qualquer coisa. Não há lista nenhuma ali para preservar, e tratá-lo
    /// como resgate mandaria o usuário procurar tarefas num arquivo vazio.
    #[test]
    fn arquivo_vazio_e_primeira_execucao_e_nao_resgate() {
        let diretorio = diretorio_limpo("vazio");
        let arquivo = diretorio.join("todos.json");
        fs::write(&arquivo, "   \n").expect("gravar o vazio");

        let store = Store::abrir(arquivo);
        assert!(store.resgate().is_none());
        assert_eq!(store.listar_abas().expect("listar abas").len(), 1);
    }

    /// **O formato antigo continua sendo migrado, e não resgatado.** Ele é um
    /// array e falha como formato novo — se o resgate se metesse antes da segunda
    /// tentativa, atualizar o app viraria "sua lista está num arquivo ao lado".
    #[test]
    fn o_formato_antigo_e_migrado_e_nunca_tratado_como_ilegivel() {
        let diretorio = diretorio_limpo("antigo");
        let arquivo = diretorio.join("todos.json");
        fs::write(
            &arquivo,
            r#"[{ "id": "x", "title": "pão", "done": false, "created_at": 10 }]"#,
        )
        .expect("gravar o formato antigo");

        let store = Store::abrir(arquivo);
        assert!(store.resgate().is_none(), "migração não é resgate");
        assert!(
            !diretorio.join("todos.corrupt.json").exists(),
            "migração não move arquivo nenhum de lugar"
        );
        assert_eq!(store.listar_tudo().expect("listar").len(), 1);
    }

    /// **Um backup existente nunca é sobrescrito.** Se o app abrir ilegível duas
    /// vezes, o primeiro backup é o que tem mais chance de conter a lista inteira
    /// — e o caminho relatado continua sendo o dele, porque é para lá que o
    /// usuário precisa ser mandado.
    #[test]
    fn o_primeiro_backup_sobrevive_a_um_segundo_estrago() {
        let diretorio = diretorio_limpo("dois");
        let arquivo = diretorio.join("todos.json");
        let backup = diretorio.join("todos.corrupt.json");

        fs::write(&arquivo, TRUNCADO).expect("gravar o primeiro estrago");
        let primeira = Store::abrir(arquivo.clone());
        assert!(primeira.resgate().is_some());
        drop(primeira);

        fs::write(&arquivo, "outro estrago, outro dia").expect("gravar o segundo");
        let segunda = Store::abrir(arquivo);
        assert!(
            segunda.resgate().is_some(),
            "o segundo estrago também precisa ser relatado"
        );
        assert_eq!(
            fs::read_to_string(&backup).expect("ler o backup"),
            TRUNCADO,
            "o backup preservado precisa continuar sendo o PRIMEIRO"
        );
    }
}

/// A gravação em si: temporário, `sync_all`, rename. O que estes testes prendem é
/// o desfecho observável — o arquivo final íntegro e nenhum `.tmp` sobrando —,
/// porque a durabilidade contra queda de energia não é testável em processo.
#[cfg(test)]
mod tests_gravacao {
    use super::*;
    use std::fs;

    #[test]
    fn a_gravacao_nao_deixa_temporario_para_tras() {
        let diretorio = std::env::temp_dir().join(format!("nocom-tmp-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        let arquivo = diretorio.join("todos.json");
        let store = Store::abrir(arquivo.clone());
        let aba = store.listar_abas().expect("listar abas")[0].id.clone();
        store.acrescentar("uma tarefa", &aba).expect("acrescentar");

        assert!(arquivo.exists());
        assert!(
            !diretorio.join("todos.json.tmp").exists(),
            "o temporário é renomeado, não copiado: sobrar um significa que o \
             rename não aconteceu"
        );
        // E o que ficou no disco é lido de volta inteiro.
        let relido = Store::abrir(arquivo);
        assert!(
            relido.resgate().is_none(),
            "o que gravamos tem que ser legível"
        );
        assert_eq!(relido.listar_tudo().expect("listar").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }
}

#[cfg(test)]
mod tests_adendo13 {
    use super::auxiliares::*;
    use super::*;
    use std::fs;

    // --- recorrência ---

    /// O contrato do Adendo 13: escolher a recorrência não conclui, não move e
    /// não recarimba nada — só o `repeat` muda.
    #[test]
    fn definir_recorrencia_troca_so_o_repeat() {
        let (store, diretorio) = store_limpa("rec-definir");
        let aba = aba_de(&store);
        let criada = store.acrescentar("regar as plantas", &aba).expect("acrescentar");
        assert_eq!(criada.repeat, Recorrencia::Nenhuma, "o padrão é none");

        let diaria = store
            .definir_recorrencia(&criada.id, Recorrencia::Diaria)
            .expect("definir");
        assert_eq!(diaria.repeat, Recorrencia::Diaria);
        assert!(!diaria.done);
        assert_eq!(diaria.created_at, criada.created_at);
        assert_eq!(diaria.done_at, None, "pendente não ganha carimbo");

        assert!(store
            .definir_recorrencia("nao-existe", Recorrencia::Diaria)
            .is_err());

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Concluir carimba `done_at`; desmarcar limpa. É a base de cálculo da volta,
    /// e vale para toda tarefa — ver o comentário no `alternar`.
    #[test]
    fn alternar_carimba_e_limpa_o_done_at() {
        let (store, diretorio) = store_limpa("rec-carimbo");
        let aba = aba_de(&store);
        let criada = store.acrescentar("lavar louça", &aba).expect("acrescentar");

        let concluida = store.alternar(&criada.id).expect("alternar");
        assert!(concluida.done_at.is_some(), "concluir tem que carimbar");

        let devolvida = store.alternar(&criada.id).expect("alternar de volta");
        assert_eq!(devolvida.done_at, None, "desmarcar tem que limpar o carimbo");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O caso da tarefa concluída ANTES desta versão: `done: true` sem carimbo.
    /// Ligar a recorrência nela precisa carimbar agora, senão a volta nunca tem
    /// base de cálculo e a recorrência parece não funcionar.
    #[test]
    fn definir_recorrencia_em_concluida_sem_carimbo_carimba_agora() {
        let (store, diretorio) = store_limpa("rec-legado");
        let aba = aba_de(&store);
        let legado = Todo {
            id: "concluida-antiga".to_owned(),
            title: "tarefa de versão antiga".to_owned(),
            done: true,
            created_at: 1_000,
            tab_id: aba.clone(),
            repeat: Recorrencia::Nenhuma,
            done_at: None,
        };
        store.restaurar(vec![legado]).expect("semear");

        let com_recorrencia = store
            .definir_recorrencia("concluida-antiga", Recorrencia::Semanal)
            .expect("definir");
        assert!(com_recorrencia.done, "definir não pode desmarcar");
        assert!(
            com_recorrencia.done_at.is_some(),
            "concluída sem carimbo tem que ganhar um agora"
        );

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// "Limpar concluídas" preserva as recorrentes: elas não estão encerradas,
    /// estão esperando o período. As sem recorrência saem como sempre saíram.
    #[test]
    fn limpar_concluidas_preserva_as_recorrentes() {
        let (store, diretorio) = store_limpa("rec-limpar");
        let aba = aba_de(&store);
        let comum = store.acrescentar("comum", &aba).expect("acrescentar");
        let rotina = store.acrescentar("rotina", &aba).expect("acrescentar");
        store
            .definir_recorrencia(&rotina.id, Recorrencia::Diaria)
            .expect("definir");
        store.alternar(&comum.id).expect("concluir a comum");
        store.alternar(&rotina.id).expect("concluir a rotina");

        let restantes = store.limpar_concluidas(&aba).expect("limpar");
        let ids: Vec<&str> = restantes.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec![rotina.id.as_str()],
            "a recorrente concluída tinha que ficar, e só ela"
        );
        assert!(restantes[0].done, "limpar não desmarca a recorrente");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Reativar é o braço do backend na volta: `done = false`, carimbo limpo,
    /// tudo-ou-nada, e lote vazio é bug de quem chamou.
    #[test]
    fn reativar_devolve_a_pendente_e_e_tudo_ou_nada() {
        let (store, diretorio) = store_limpa("rec-reativar");
        let aba = aba_de(&store);
        let rotina = store.acrescentar("rotina", &aba).expect("acrescentar");
        store
            .definir_recorrencia(&rotina.id, Recorrencia::Diaria)
            .expect("definir");
        store.alternar(&rotina.id).expect("concluir");

        assert!(store.reativar(&[]).is_err(), "lote vazio é Err");
        assert!(
            store
                .reativar(&[rotina.id.clone(), "nao-existe".to_owned()])
                .is_err(),
            "um id inexistente reprova o lote inteiro"
        );
        let ainda = store.listar(&aba).expect("listar");
        assert!(ainda[0].done, "o lote reprovado não pode ter aplicado metade");

        let reativadas = store.reativar(&[rotina.id.clone()]).expect("reativar");
        assert_eq!(reativadas.len(), 1);
        assert!(!reativadas[0].done);
        assert_eq!(reativadas[0].done_at, None);
        assert_eq!(reativadas[0].repeat, Recorrencia::Diaria, "a recorrência fica");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// `listar_recorrentes` atravessa as abas: é a leitura da meia-noite, e uma
    /// rotina numa aba de fundo tem que voltar mesmo sem ninguém abrir a aba.
    #[test]
    fn listar_recorrentes_atravessa_as_abas() {
        let (store, diretorio) = store_limpa("rec-listar");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        let na_primeira = store.acrescentar("aqui", &primeira).expect("acrescentar");
        let na_segunda = store.acrescentar("lá", &segunda.id).expect("acrescentar");
        store.acrescentar("sem recorrência", &primeira).expect("acrescentar");
        store
            .definir_recorrencia(&na_primeira.id, Recorrencia::Diaria)
            .expect("definir");
        store
            .definir_recorrencia(&na_segunda.id, Recorrencia::Mensal)
            .expect("definir");

        let recorrentes = store.listar_recorrentes().expect("listar");
        let ids: Vec<&str> = recorrentes.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(ids, vec![na_primeira.id.as_str(), na_segunda.id.as_str()]);

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- mover entre abas ---

    /// O ponto do comando: a tarefa muda de aba **pela idade real** — `created_at`
    /// intacto —, e não como se fosse recém-criada no fim da lista.
    #[test]
    fn mover_preserva_o_carimbo_e_entra_na_ordem_da_aba_nova() {
        let (store, diretorio) = store_limpa("mover");
        let origem = aba_de(&store);
        let destino = store.criar_aba("Destino").expect("criar aba");
        // Semeia por `restaurar` para controlar os carimbos (ver tests_restaurar).
        store
            .restaurar(vec![Todo {
                id: "antiga-no-destino".to_owned(),
                title: "antiga".to_owned(),
                done: false,
                created_at: 1_000,
                tab_id: destino.id.clone(),
                repeat: Recorrencia::Nenhuma,
                done_at: None,
            }])
            .expect("semear o destino");
        store
            .restaurar(vec![Todo {
                id: "do-meio".to_owned(),
                title: "movida".to_owned(),
                done: false,
                created_at: 500,
                tab_id: origem.clone(),
                repeat: Recorrencia::Nenhuma,
                done_at: None,
            }])
            .expect("semear a origem");

        let movida = store.mover("do-meio", &destino.id).expect("mover");
        assert_eq!(movida.tab_id, destino.id);
        assert_eq!(movida.created_at, 500, "mover não pode recarimbar");

        let origem_depois = store.listar(&origem).expect("listar origem");
        assert!(origem_depois.iter().all(|todo| todo.id != "do-meio"));
        let destino_depois = store.listar(&destino.id).expect("listar destino");
        let ids: Vec<&str> = destino_depois.iter().map(|todo| todo.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["do-meio", "antiga-no-destino"],
            "a movida entra pela idade, não no fim"
        );

        assert!(store.mover("do-meio", "aba-inexistente").is_err());
        assert!(store.mover("nao-existe", &destino.id).is_err());

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- contagem por aba ---

    #[test]
    fn pendentes_por_aba_conta_cada_aba_na_ordem_canonica() {
        let (store, diretorio) = store_limpa("contagem");
        let primeira = aba_de(&store);
        let segunda = store.criar_aba("Segunda").expect("criar aba");
        store.acrescentar("um", &primeira).expect("acrescentar");
        store.acrescentar("dois", &primeira).expect("acrescentar");
        let feita = store.acrescentar("três", &segunda.id).expect("acrescentar");
        store.acrescentar("quatro", &segunda.id).expect("acrescentar");
        store.alternar(&feita.id).expect("concluir");

        let contagens = store.pendentes_por_aba().expect("contar");
        assert_eq!(contagens.len(), 2);
        assert_eq!(contagens[0].tab_id, primeira);
        assert_eq!(contagens[0].pending, 2);
        assert_eq!(contagens[1].tab_id, segunda.id);
        assert_eq!(contagens[1].pending, 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    // --- exportar e importar ---

    /// A ida e volta inteira: exportar de uma máquina, importar na outra. O
    /// arquivo exportado é um `todos.json` válido, e a importação num app vazio
    /// traz tudo — menos a aba padrão da instalação nova, que já existia lá.
    #[test]
    fn exportar_e_importar_levam_tudo_para_a_outra_maquina() {
        let (origem, dir_origem) = store_limpa("exp-origem");
        let aba = aba_de(&origem);
        let tarefa = origem.acrescentar("levar comigo", &aba).expect("acrescentar");
        origem
            .definir_recorrencia(&tarefa.id, Recorrencia::Semanal)
            .expect("definir");
        let extra = origem.criar_aba("Projetos").expect("criar aba");
        origem
            .acrescentar("na outra aba", &extra.id)
            .expect("acrescentar");

        let arquivo = dir_origem.join("export.json");
        origem.exportar_para(&arquivo).expect("exportar");

        let (destino, dir_destino) = store_limpa("exp-destino");
        let resumo = destino.importar_de(&arquivo).expect("importar");
        assert_eq!(resumo.tabs, 2, "as duas abas exportadas entram");
        assert_eq!(resumo.todos, 2);

        // A recorrência atravessa o arquivo.
        let recorrentes = destino.listar_recorrentes().expect("listar");
        assert_eq!(recorrentes.len(), 1);
        assert_eq!(recorrentes[0].repeat, Recorrencia::Semanal);

        // A aba padrão do destino continua lá: importar nunca remove.
        assert_eq!(destino.listar_abas().expect("abas").len(), 3);

        let _ = fs::remove_dir_all(&dir_origem);
        let _ = fs::remove_dir_all(&dir_destino);
    }

    /// Importar o próprio export em cima de si mesmo é no-op contado: tudo já
    /// existe por id, nada entra e nada sai.
    #[test]
    fn importar_o_proprio_export_nao_muda_nada() {
        let (store, diretorio) = store_limpa("exp-si-mesmo");
        let aba = aba_de(&store);
        store.acrescentar("já estou aqui", &aba).expect("acrescentar");

        let arquivo = diretorio.join("export.json");
        store.exportar_para(&arquivo).expect("exportar");

        let resumo = store.importar_de(&arquivo).expect("importar");
        assert_eq!(resumo.tabs, 0);
        assert_eq!(resumo.todos, 0);
        assert_eq!(store.listar(&aba).expect("listar").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// O formato antigo (array sem abas) entra pela mesma leitura da migração:
    /// vira uma aba "Tarefas" nova, sem tocar no que já existe.
    #[test]
    fn importar_o_formato_antigo_cria_a_aba_da_migracao() {
        let (store, diretorio) = store_limpa("exp-antigo");
        let aba = aba_de(&store);
        store.acrescentar("minha", &aba).expect("acrescentar");

        let arquivo = diretorio.join("antigo.json");
        fs::write(
            &arquivo,
            r#"[{"id":"antiga-1","title":"do formato antigo","done":false,"created_at":1000}]"#,
        )
        .expect("escrever o arquivo antigo");

        let resumo = store.importar_de(&arquivo).expect("importar");
        assert_eq!(resumo.tabs, 1, "a aba 'Tarefas' da migração");
        assert_eq!(resumo.todos, 1);
        assert_eq!(store.listar(&aba).expect("listar").len(), 1, "nada foi removido");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Arquivo que não é JSON nenhum: `Err` dizendo que nada mudou, e nada muda.
    #[test]
    fn importar_arquivo_ilegivel_falha_sem_tocar_em_nada() {
        let (store, diretorio) = store_limpa("exp-ilegivel");
        let aba = aba_de(&store);
        store.acrescentar("intacta", &aba).expect("acrescentar");

        let arquivo = diretorio.join("lixo.json");
        fs::write(&arquivo, b"isto nao e json").expect("escrever lixo");

        assert!(store.importar_de(&arquivo).is_err());
        assert!(store.importar_de(&diretorio.join("nao-existe.json")).is_err());
        assert_eq!(store.listar(&aba).expect("listar").len(), 1);

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Tarefa importada apontando para uma aba que não veio no arquivo é adotada
    /// pela primeira aba — a regra do `normalizar`, valendo na porta nova.
    #[test]
    fn importar_orfa_adota_na_primeira_aba() {
        let (store, diretorio) = store_limpa("exp-orfa");
        let aba = aba_de(&store);

        // A store só cria o diretório na primeira gravação, e este teste importa
        // antes de qualquer mutação.
        fs::create_dir_all(&diretorio).expect("criar diretório");
        let arquivo = diretorio.join("orfa.json");
        fs::write(
            &arquivo,
            r#"{"tabs":[],"todos":[{"id":"orfa-1","title":"órfã","done":false,"created_at":1000,"tab_id":"aba-que-nao-veio"}],"active_tab":""}"#,
        )
        .expect("escrever o arquivo");

        let resumo = store.importar_de(&arquivo).expect("importar");
        assert_eq!(resumo.todos, 1);
        let lista = store.listar(&aba).expect("listar");
        assert_eq!(lista.len(), 1, "a órfã tem que aparecer em alguma lista");
        assert_eq!(lista[0].id, "orfa-1");

        let _ = fs::remove_dir_all(&diretorio);
    }

    /// Um `todos.json` de versão anterior — sem `repeat` nem `done_at` — abre
    /// exatamente como antes: campo faltando é `none`/`null`, nunca leitura
    /// recusada. É a garantia de que a atualização não perde nada.
    #[test]
    fn arquivo_de_versao_anterior_le_com_repeat_none() {
        let diretorio =
            std::env::temp_dir().join(format!("nocom-rec-anterior-{}", std::process::id()));
        let _ = fs::remove_dir_all(&diretorio);
        fs::create_dir_all(&diretorio).expect("criar diretório");
        fs::write(
            diretorio.join("todos.json"),
            r#"{"tabs":[{"id":"t1","name":"Tarefas","created_at":1}],"todos":[{"id":"a","title":"antiga","done":true,"created_at":2,"tab_id":"t1"}],"active_tab":"t1"}"#,
        )
        .expect("escrever o arquivo antigo");

        let store = Store::abrir(diretorio.join("todos.json"));
        let lista = store.listar("t1").expect("listar");
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].repeat, Recorrencia::Nenhuma);
        assert_eq!(lista[0].done_at, None);
        assert!(store.resgate().is_none(), "o arquivo não pode ler como ilegível");

        let _ = fs::remove_dir_all(&diretorio);
    }
}
