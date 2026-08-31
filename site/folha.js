/* Comportamento da folha de cotas. Nada aqui e obrigatorio para a pagina
 * funcionar: sem JavaScript a folha inteira se le, os tres sistemas aparecem
 * juntos (que era a pagina anterior, e ela funcionava), os comandos continuam
 * selecionaveis e as cotas aparecem ja desenhadas. O que desaparece sem
 * JavaScript e o seletor, e nao o conteudo.
 *
 *   1. escolher o sistema, e mostrar so o que serve para ele;
 *   2. avisar quem abriu no celular que o NoCom e app de computador;
 *   3. copiar um comando;
 *   4. desenhar as cotas uma vez, quando a prancha entra na tela;
 *   5. correr a varredura de 2 s, so a pedido;
 *   6. dobrar e desdobrar a janela com o proprio atalho do app (⌃⌥T), ou com
 *      um clique no pacote -- a demonstracao que a primeira dobra promete.
 *
 * Nada fala com a rede. A pagina nao tem uma unica requisicao de terceiro, e isso
 * e um requisito do produto e nao uma preferencia tecnica. */

(function () {
  "use strict";

  var doc = document;
  var PADRAO = "macos";

  /* ------------------------------------------------------------- 1. o sistema
     `userAgentData` primeiro, `platform` depois, `userAgent` por ultimo. */

  function sistemaDaVisitante() {
    var nav = navigator;
    var uad = nav.userAgentData;
    var alvo = String((uad && uad.platform) || nav.platform || nav.userAgent || "").toLowerCase();
    var ua = String(nav.userAgent || "").toLowerCase();

    /* Celular antes de tudo: Android chega com "linux" no `userAgent`, e o iPad
       moderno se anuncia como "macintosh". Sem esta checagem primeiro, quem abre
       no telefone recebe uma linha de `brew` que nao tem onde rodar. */
    if (ua.indexOf("android") !== -1 || ua.indexOf("iphone") !== -1 || ua.indexOf("ipad") !== -1) {
      return "movel";
    }
    if (nav.maxTouchPoints > 1 && ua.indexOf("macintosh") !== -1) return "movel";

    if (alvo.indexOf("mac") !== -1 || alvo.indexOf("darwin") !== -1) return "macos";
    if (alvo.indexOf("win") !== -1) return "windows";
    if (alvo.indexOf("linux") !== -1 || alvo.indexOf("x11") !== -1) return "linux";
    return null;
  }

  function escolher(sistema) {
    var botoes = doc.querySelectorAll(".seletor-botoes button");
    Array.prototype.forEach.call(botoes, function (botao) {
      var meu = botao.getAttribute("data-escolha");
      botao.setAttribute("aria-pressed", meu === sistema ? "true" : "false");
    });

    var paineis = doc.querySelectorAll("[data-sistema]");
    Array.prototype.forEach.call(paineis, function (painel) {
      if (painel.getAttribute("data-sistema") === sistema) {
        painel.removeAttribute("hidden");
      } else {
        painel.setAttribute("hidden", "");
      }
    });
  }

  function ligarSeletor() {
    var seletor = doc.querySelector(".seletor-botoes");
    if (!seletor) return;

    seletor.addEventListener("click", function (evento) {
      var botao = evento.target.closest ? evento.target.closest("button[data-escolha]") : null;
      if (!botao) return;
      escolher(botao.getAttribute("data-escolha"));
    });

    var detectado = sistemaDaVisitante();

    if (detectado === "movel") {
      var aviso = doc.getElementById("aviso-movel");
      if (aviso) aviso.removeAttribute("hidden");
      /* O celular ainda escolhe um sistema para ler: o aviso explica por que os
         comandos nao servem agora, e a pessoa continua podendo trocar. */
      escolher(PADRAO);
      return;
    }

    /* Deteccao sem resposta e rara em computador, e um padrao arbitrario e melhor
       que tres blocos abertos ao mesmo tempo: o seletor esta logo ali. */
    escolher(detectado || PADRAO);
  }

  /* ----------------------------------------------------------------- 3. copiar
     O botao so existe com JavaScript (o CSS o esconde em `.sem-js`), porque sem
     ele o texto ja esta ali para selecionar e um botao morto e pior que nenhum. */

  function anunciar(texto) {
    var vivo = doc.getElementById("aviso-vivo");
    if (vivo) vivo.textContent = texto;
  }

  function ligarCopia() {
    var botoes = doc.querySelectorAll(".copiar");

    Array.prototype.forEach.call(botoes, function (botao) {
      botao.addEventListener("click", function () {
        var alvo = doc.getElementById(botao.getAttribute("data-para"));
        if (!alvo) return;

        var texto = alvo.textContent;
        var pronto = function () {
          botao.classList.add("copiado");
          anunciar(botao.getAttribute("data-anuncio") || "");
          window.setTimeout(function () {
            botao.classList.remove("copiado");
          }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(pronto, function () {
            /* Recusa de permissao: a linha continua selecionavel, e dizer isso
               e melhor que um botao que finge ter funcionado. */
            anunciar(botao.getAttribute("data-anuncio-falhou") || "");
          });
          return;
        }

        /* Navegador sem `clipboard`: seleciona a linha para a pessoa copiar. */
        var faixa = doc.createRange();
        faixa.selectNodeContents(alvo);
        var selecao = window.getSelection();
        selecao.removeAllRanges();
        selecao.addRange(faixa);
        anunciar(botao.getAttribute("data-anuncio-selecionado") || "");
      });
    });
  }

  /* --------------------------------------------------------- 4. as chamadas
     Escolher uma chamada faz tres coisas de uma vez: realca a regiao na janela,
     acende o balao correspondente, e recorta o detalhe 2:1.

     O RECORTE E CALCULADO, e nao escrito a mao. `data-regiao` esta em px da janela
     -- as mesmas coordenadas que o realce usa no SVG, e ambas vem medidas do DOM
     real por `npm run vitrine`. Se as duas divergirem, o detalhe mostra uma parte e
     a seta aponta outra.

     E O DETALHE E O PROPRIO ESPECIME, CLONADO. Antes era um recorte do PNG por
     `background-position`, o que amarrava a nitidez a resolucao do raster: 2:1
     sobre uma imagem 2x gasta toda a resolucao que existe. Um clone do DOM ampliado
     por `transform: scale(2)` amplia TEXTO, e e nitido em qualquer escala. */

  var ESCALA_DETALHE = 2; /* 2:1, e o rotulo do detalhe diz isso por escrito. */

  var JANELA_LARGURA = 360;
  var JANELA_ALTURA = 480;

  /* O clone vive dentro da vidraca. A shadow root nao vem no `cloneNode`, entao ela
     e recriada e recebe o mesmo conteudo -- inclusive o `<style>` do app, que ja
     esta parseado e nao custa uma requisicao.

     Clonar em vez de embutir um segundo especime no HTML economiza os 28 kB de
     marcacao que a duplicata custaria, e nao tira nada de ninguem: a vidraca ja era
     so-com-JavaScript antes disto (ver `.sem-js .detalhe` no CSS). */
  function clonarEspecime(vidro) {
    var fonte = doc.querySelector(".palco .especime");
    if (!fonte || !fonte.shadowRoot || !vidro) return null;
    var clone = doc.createElement("div");
    clone.className = "especime";
    /* Sem `role`/`aria-label`: a vidraca inteira e `aria-hidden`, e o desenho
       ampliado nao e uma segunda coisa a anunciar. Um estado, uma voz. */
    clone.attachShadow({ mode: "open" }).innerHTML = fonte.shadowRoot.innerHTML;
    vidro.appendChild(clone);
    return clone;
  }

  function recortar(vidro, clone, regiao) {
    if (!clone) return;
    var partes = regiao.split(",").map(Number);
    var x = partes[0], y = partes[1], largura = partes[2], altura = partes[3];

    var caixa = vidro.getBoundingClientRect();
    /* Quanto da JANELA cabe na vidraca, em px da janela. */
    var cabeX = caixa.width / ESCALA_DETALHE;
    var cabeY = caixa.height / ESCALA_DETALHE;

    /* Centraliza na regiao e depois PRENDE dentro da janela: sem isso o recorte
       passa da aresta e mostra a pelicula da folha atras do especime, que aparece
       como um bloco de outra cor -- foi exatamente o que aconteceu com a data, que
       fica a 18px da borda direita. */
    var prender = function (inicio, tamanho, cabe, limite) {
      /* Regiao mais larga que a vidraca alinha pelo COMECO, e nao pelo centro:
         centralizar um campo de texto corta o inicio dele, que e onde a leitura
         comeca. Regiao que cabe fica centrada. Depois, prende dentro da janela. */
      var alvo = tamanho > cabe ? inicio : inicio + tamanho / 2 - cabe / 2;
      return Math.max(0, Math.min(alvo, Math.max(0, limite - cabe)));
    };
    var esq = prender(x, largura, cabeX, JANELA_LARGURA);
    var topo = prender(y, altura, cabeY, JANELA_ALTURA);

    /* `transform-origin: 0 0` com `scale(2)`, entao o desvio e em px JA ampliados. */
    clone.style.left = -(esq * ESCALA_DETALHE) + "px";
    clone.style.top = -(topo * ESCALA_DETALHE) + "px";
  }

  function ligarChamadas() {
    var lista = doc.querySelector(".chamadas");
    if (!lista) return;

    var vidro = doc.querySelector(".detalhe-vidro");
    var clone = clonarEspecime(vidro);
    var botoes = lista.querySelectorAll("button[data-chamada]");
    if (!botoes.length) return;

    function mostrar(chave, regiao) {
      Array.prototype.forEach.call(botoes, function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-chamada") === chave ? "true" : "false");
      });
      Array.prototype.forEach.call(doc.querySelectorAll(".chamada"), function (g) {
        g.classList.toggle("acesa", g.getAttribute("data-chamada") === chave);
      });
      Array.prototype.forEach.call(doc.querySelectorAll(".realce"), function (r) {
        r.classList.toggle("acesa", r.getAttribute("data-realce") === chave);
      });
      if (vidro && regiao) recortar(vidro, clone, regiao);
    }

    Array.prototype.forEach.call(botoes, function (botao) {
      var chave = botao.getAttribute("data-chamada");
      var regiao = botao.getAttribute("data-regiao");
      /* Ponteiro e teclado escolhem pelo mesmo caminho: `focus` cobre Tab e o
         clique, e `mouseenter` da a previa que so o mouse consegue pedir. */
      botao.addEventListener("click", function () { mostrar(chave, regiao); });
      botao.addEventListener("focus", function () { mostrar(chave, regiao); });
      botao.addEventListener("mouseenter", function () { mostrar(chave, regiao); });
    });

    var primeiro = botoes[0];
    mostrar(primeiro.getAttribute("data-chamada"), primeiro.getAttribute("data-regiao"));

    /* A vidraca muda de largura com a coluna, e o recorte centralizado depende
       dela: recalcula no redimensionamento, sem observar nada mais que isso. */
    window.addEventListener("resize", function () {
      var ativo = lista.querySelector('button[aria-pressed="true"]');
      if (ativo && vidro) recortar(vidro, clone, ativo.getAttribute("data-regiao"));
    });
  }

  /* ------------------------------------------------------------- 5. as cotas
     Cada traco recebe o proprio comprimento em `--corrida`, entao a linha corre
     na velocidade do desenho e nao na do CSS. Um momento autoral, uma vez. */

  function prepararCotas() {
    var alvos = doc.querySelectorAll(".desenha-alvo");
    if (!alvos.length) return;

    Array.prototype.forEach.call(alvos, function (alvo) {
      var tracos = alvo.querySelectorAll(".traco");
      Array.prototype.forEach.call(tracos, function (traco) {
        var comprimento = 0;
        try {
          comprimento = traco.getTotalLength();
        } catch (erro) {
          comprimento = 0;
        }
        if (comprimento > 0) {
          traco.style.setProperty("--corrida", comprimento.toFixed(1));
        }
      });
    });

    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(alvos, function (alvo) {
        alvo.classList.add("desenhada");
      });
      return;
    }

    var olho = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add("desenhada");
          olho.unobserve(entrada.target);
        });
      },
      { threshold: 0.25 }
    );

    Array.prototype.forEach.call(alvos, function (alvo) {
      olho.observe(alvo);
    });
  }

  /* --------------------------------------------------------- 5. os 2 segundos
     A unica coisa cronometrada da folha, e ela nao comeca sozinha: a pessoa
     pede. Um laco que corre sem causa e exatamente o que o produto recusa. */

  function ligarVarredura() {
    var botao = doc.querySelector(".botao-varredura");
    if (!botao) return;

    var grupos = doc.querySelectorAll(".ciclo");
    if (!grupos.length) return;

    var rodando = false;

    botao.addEventListener("click", function () {
      if (rodando) return;
      rodando = true;
      botao.setAttribute("aria-disabled", "true");

      Array.prototype.forEach.call(grupos, function (grupo) {
        grupo.classList.remove("correndo");
        /* Reinicia a animacao: ler a geometria forca o navegador a reconhecer a
           remocao da classe antes de ela voltar. */
        void grupo.getBoundingClientRect().width;
        grupo.classList.add("correndo");
      });

      window.setTimeout(function () {
        rodando = false;
        botao.removeAttribute("aria-disabled");
      }, 2000);
    });
  }

  /* ------------------------------------------------------------ 6. a data de hoje
     O ESPECIME NAO PODE ENVELHECER, e ate a 0.4.0 ele envelhecia.

     A chamada 3 promete "vermelha no dia". A data vermelha, porem, era escrita por
     `scripts/vitrine/stub.js` no momento da extracao e congelava ali: um dia depois
     de gerar a folha, a pagina publicada marcava ONTEM em vermelho enquanto a frase
     ao lado prometia hoje. Nao havia como consertar num raster -- a data era pixel.

     Agora ela e texto, e este trecho reescreve os dois numeros no navegador de quem
     visita. A pilula vermelha volta a dizer a verdade em qualquer dia, sem
     republicar nada.

     O QUE ELE NAO FAZ, de proposito: nao recalcula qual pilula acende. Quem acende
     e a classe `bg-today`, que a extracao ja conferiu estar no lugar (ver
     `conferirHoje` em `captura.mjs`) -- este trecho troca o NUMERO da pilula que ja
     e a de hoje, e o da futura. Decidir aqui qual data e hoje seria uma segunda
     copia da regra que mora em `src/lib/dates.ts`.

     E A LARGURA NAO MUDA. O formato tem sempre cinco caracteres e a pilula usa
     `tabular-nums`, entao a caixa medida em `cotas.json` continua valendo para
     qualquer dia do ano -- se nao fosse assim, o realce da chamada 3 sairia de
     lugar a cada virada de mes. */

  function escreverData(marca, data, ordem) {
    if (!marca) return;
    var d = String(data.getDate());
    var m = String(data.getMonth() + 1);
    if (d.length < 2) d = "0" + d;
    if (m.length < 2) m = "0" + m;
    /* So o primeiro no de texto: a pilula de hoje carrega depois dele um
       `<span class="sr-only"> (hoje)</span>`, que e a palavra que o leitor de tela
       le no lugar da tinta vermelha. Reescrever `textContent` apagaria ela. */
    var alvo = marca.firstChild;
    if (alvo && alvo.nodeType === 3) alvo.nodeValue = ordem === "mes" ? m + "/" + d : d + "/" + m;
  }

  function atualizarDatas() {
    var host = doc.querySelector(".palco .especime");
    if (!host || !host.shadowRoot) return;
    var raiz = host.shadowRoot;
    var ordem = host.getAttribute("data-ordem") === "mes" ? "mes" : "dia";
    var hoje = new Date();
    escreverData(raiz.querySelector("mark[data-especime-hoje]"), hoje, ordem);
    /* Tres dias a frente, como o `stub.js` escolheu: a pilula cinza ao lado da
       vermelha e a comparacao que ensina que o vermelho quer dizer "e hoje" e nao
       "tem data". */
    escreverData(
      raiz.querySelector("mark[data-especime-futuro]"),
      new Date(hoje.getTime() + 3 * 86400000),
      ordem
    );
  }

  /* ------------------------------------------------------------- 7. o puxao
     A primeira dobra promete que ⌃⌥T esconde a janela e traz de volta, e a
     pagina cumpre NELA MESMA: o atalho do app dobra a janela de volta no pacote
     e desdobra de novo. O clique no pacote faz o mesmo gesto, para quem chegou
     de mouse. Nada disso e conteudo -- sem JavaScript a dica nem aparece (ver
     `.sem-js .puxao-dica` no CSS) e a janela chega implantada. */

  function ligarPuxao() {
    var palco = doc.querySelector(".palco");
    if (!palco) return;

    var botao = palco.querySelector(".pacote-botao");

    function puxar() {
      /* Antes da entrada desenhar o palco, o puxao nao tem o que dobrar. */
      if (!palco.classList.contains("desenhada")) return;
      var dobrado = palco.classList.toggle("dobrado");
      /* O botao anuncia o estado que ele mesmo produziu: pressionado quando a
         janela esta dobrada no pacote. */
      if (botao) botao.setAttribute("aria-pressed", dobrado ? "true" : "false");
    }

    doc.addEventListener("keydown", function (evento) {
      if (evento.ctrlKey && evento.altKey && evento.code === "KeyT") {
        evento.preventDefault();
        puxar();
      }
    });

    if (botao) botao.addEventListener("click", puxar);
  }

  ligarSeletor();
  /* As datas ANTES das chamadas: `ligarChamadas` clona o especime para a vidraca do
     detalhe, e o clone precisa nascer com a data ja corrigida. */
  atualizarDatas();
  ligarChamadas();
  ligarCopia();
  prepararCotas();
  ligarVarredura();
  ligarPuxao();
})();
