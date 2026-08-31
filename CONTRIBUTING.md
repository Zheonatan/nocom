# Contribuir

Issue e PR podem ser em português ou em inglês — os dois são lidos igual.
*Issues and PRs are welcome in Portuguese or English.*

## O caminho curto

Relatar um bug, sugerir algo ou só contar como você usa o app já é contribuir.
Para bug, o [template de issue](https://github.com/Zheonatan/nocom/issues/new/choose)
pede o que faz diferença: sistema, versão e o passo a passo. Para
vulnerabilidade de segurança, **não** abra issue — ver o
[`SECURITY.md`](SECURITY.md).

## Antes de escrever código

**Leia [O que ele não é](README.pt-BR.md#o-que-ele-não-é) primeiro** (em
inglês, [What it isn't](README.md#what-it-isnt)). O NoCom tem
não-objetivos declarados — prazos, prioridades, subtarefas, etiquetas,
colaboração, sincronização — e um PR que cruza essa linha será recusado mesmo
bem escrito. Não é juízo sobre o código: é o produto se mantendo pequeno de
propósito. Para qualquer mudança que não seja correção pontual, **abra uma
issue antes de investir num PR** — conversar custa minutos, um PR recusado
custa uma tarde.

## Rodando o projeto

Os pré-requisitos e os comandos estão no
[`DEVELOPMENT.md`](DEVELOPMENT.md). O resumo:

```sh
npm install
npm run tauri dev
```

## O que um PR precisa para entrar

1. **Os quatro comandos da Definição de Pronto passando** — o CI roda todos nos
   três sistemas, mas rodar antes localmente encurta a conversa:

   ```sh
   npm test
   npm run build
   cd src-tauri && cargo check --all-targets && cargo test
   ```

2. **Os documentos acompanhando o comportamento.** O
   [`CONTRACT.md`](CONTRACT.md) é normativo: mudou o que o app faz, o adendo
   correspondente entra no mesmo PR. Decisão de interface vai para o
   [`DESIGN.md`](DESIGN.md); mudança no que o produto é, para o
   [`PRODUCT.md`](PRODUCT.md).

3. **Toda string visível passa pelo dicionário** (`src/lib/i18n.ts`). O
   português é o canônico e o inglês é conferido por tipo — uma chave faltando
   quebra o `tsc`, que é a intenção.

4. **Commits no estilo do histórico**: em português, no presente, dizendo o que
   o commit faz ("Corrige…", "Acrescenta…"), com o porquê no corpo quando ele
   não é óbvio. `git log` é o melhor exemplo do formato.

Mexeu na interface? `npm run vitrine` regera as fotos dos dois READMEs e o
espécime da landing page — nenhuma imagem do repositório é editada à mão.
