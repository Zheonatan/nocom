# Changelog

Cada versão publicada, contada do ponto de vista de quem usa o app. O que mudou
por dentro — e o porquê de cada decisão — vive nos commits e nos adendos do
[`CONTRACT.md`](CONTRACT.md).

Este arquivo também é a fonte das notas de release: o
[workflow de build](.github/workflows/release.yml) copia a seção da versão para
o corpo da release no GitHub, e o `npm run publicar` se recusa a publicar uma
versão que ainda não tenha seção aqui.

## 0.5.0 — 2026-08-25

**Lembretes sobre a data do título.** Uma tarefa com data agora aceita, pelo
clique direito, um lembrete: na data, um dia antes ou uma semana antes. Às 9h do
dia escolhido sai uma notificação nativa com o título da tarefa. A autorização
de notificar só é pedida no primeiro uso — quem nunca armar um lembrete nunca vê
a pergunta. No macOS a notificação passou a falar com o centro de notificações
atual do sistema: a API que a biblioteca usava foi aposentada pela Apple e
aceitava a chamada descartando-a em silêncio.

**O aviso do macOS mudou de tom.** O `.app` sai do build assinado com identidade
ad-hoc, e o Gatekeeper deixou de dizer que o app "está danificado e deve ser
movido para o Lixo". O bloqueio da primeira abertura virou o aviso normal de app
não notarizado, que tem saída pela interface: **Ajustes do Sistema › Privacidade
e Segurança › Abrir Mesmo Assim**. O app continua sem notarização — o README
explica o que isso significa e o que resolve.

**Um arquivo ilegível não é um arquivo vazio.** Se o `todos.json` existe mas não
pôde ser lido — permissão negada, bytes corrompidos —, o app entra no modo de
resgate em vez de abrir com a lista em branco. Antes, a primeira tarefa criada
nessa sessão gravaria por cima da lista intacta que continuava no disco.

**Miudezas que se sentem no dedo:** `Enter` e `Escape` no meio de uma composição
de acento (IME) fecham a composição, não a tarefa; remover uma linha pelo
teclado não mata o foco — ele desce para a linha vizinha ou volta ao campo; e
desfazer depois de trocar de aba não põe mais a lista antiga na tela da nova.

## 0.4.0 — 2026-08-24

**Recorrência.** Pelo clique direito, uma tarefa pode repetir diária, semanal ou
mensalmente: concluída, ela volta sozinha a pendente no período seguinte, como
se tivesse sido desmarcada. Só isso, de propósito — não conta atraso, não ordena
por vencimento e não marca "atrasada".

**Menu de contexto na tarefa** — a primeira superfície flutuante do app. É onde
moram a recorrência e o **mover para outra aba**, que pode ser desfeito na hora
como todo gesto destrutivo.

**Exportar e importar.** Exportar salva suas tarefas num arquivo; importar
mescla o arquivo com o que já existe, sem nunca remover nada.

**Iniciar com o sistema**, opcional, na engrenagem. E dois atalhos de
convivência: `Cmd+W` fecha a aba ativa, e o chip de cada aba diz quantas
pendentes ela tem quando o mouse para em cima.

**Fora do app:** o NoCom ganhou uma [página](https://zheonatan.github.io/nocom),
a publicação no Homebrew e no winget passou a ser automática a cada versão, a
janela aparece na barra de tarefas do Linux, e o Windows parou de desenhar um
canto e um fio por cima da janela.

## 0.3.0 — 2026-08-22

**O app se atualiza sozinho — quando você pede.** Na engrenagem, **Verificar se
há versão nova**: se houver, o botão baixa, confere a assinatura, substitui o
app e o reabre. Não há verificação automática, de propósito — sem o seu clique,
nada sai da máquina.

**A data que você escreveu no título ganhou vida.** Escreva `pagar boleto
20/08` e o app reconhece a data, destaca ela e — quando ela fecha o título —
leva para uma coluna à direita. No dia dela, o destaque fica vermelho; no dia
seguinte, volta ao cinza sozinho. O texto que você digitou nunca é reescrito.

**A marca.** Sai o logo padrão do Tauri; entra um anel branco de fio fino num
campo preto, com o campo na forma que cada sistema espera de um ícone.

## 0.2.0 — 2026-08-21

**O app agora se chama NoCom.** E o README passou a ser escrito para quem baixa
o app, não para quem o compila — com a release publicada direto, sem rascunho.

## 0.1.0 — 2026-08-21

A primeira versão já era o produto inteiro em miniatura: a janela que aparece
por cima do trabalho com um atalho global (configurável na engrenagem), some
com `Escape` e continua à mão no ícone da bandeja; abas como listas separadas;
tudo guardado num arquivo de texto local, sem conta e sem rede. Instaladores
para macOS, Windows e Linux saindo do CI.
