# Segurança

*Security reports are welcome in Portuguese or English.*

## Como relatar

Encontrou uma vulnerabilidade? Relate **em privado**, por
[Security Advisories](https://github.com/Zheonatan/nocom/security/advisories/new) —
o formulário "Report a vulnerability" do próprio GitHub. Não abra issue pública:
uma issue conta o problema para todo mundo antes de existir correção.

Resposta em até uma semana. O projeto é mantido por uma pessoa, sem programa de
recompensa — o que há para oferecer é correção rápida e crédito no aviso, se
você quiser.

## Versões com suporte

Só a versão mais recente recebe correção. O app avisa quando há versão nova
(engrenagem → **Verificar se há versão nova**) e se atualiza sozinho a partir
daí.

## Onde um problema seria mais grave

O NoCom roda local e não abre porta nenhuma, então a superfície é pequena — mas
existe, e estes são os pontos que valem atenção:

- **O atualizador.** A única requisição de rede do app. Um pacote só é aceito se
  a assinatura minisign bater com a chave pública embutida
  (`plugins.updater.pubkey` no `tauri.conf.json`) — é a assinatura, não o HTTPS,
  que decide o que vira o app novo. Qualquer forma de contornar essa
  verificação é o pior cenário do projeto.
- **A fronteira IPC** entre a webview e o Rust, descrita no
  [`CONTRACT.md`](CONTRACT.md).
- **A leitura do `todos.json`** e do arquivo que o "Importar" mescla: são as
  duas entradas de dados que não vêm do teclado.
