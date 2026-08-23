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
 *   5. correr a varredura de 2 s, so a pedido.
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

     O RECORTE E CALCULADO, e nao escrito a mao. `data-regiao` esta em px da janela;
     a imagem tem 30px CSS de margem transparente por lado e foi capturada a 2x,
     entao a regiao em coordenadas da imagem e (px + 30) * 2. E a mesma fonte de
     verdade que posiciona o realce no SVG -- se as duas divergirem, o detalhe
     mostra uma parte e a seta aponta outra. */

  var ESCALA_DETALHE = 2; /* 2:1, e o rotulo do detalhe diz isso por escrito. */
  var MARGEM_CAPTURA = 30;

  var JANELA_LARGURA = 360;
  var JANELA_ALTURA = 480;

  function recortar(vidro, regiao) {
    var partes = regiao.split(",").map(Number);
    var x = partes[0], y = partes[1], largura = partes[2], altura = partes[3];

    var caixa = vidro.getBoundingClientRect();
    /* Quanto da JANELA cabe na vidraca, em px da janela. */
    var cabeX = caixa.width / ESCALA_DETALHE;
    var cabeY = caixa.height / ESCALA_DETALHE;

    /* Centraliza na regiao e depois PRENDE dentro da janela: sem isso o recorte
       passa da aresta e mostra a margem transparente da captura, que aparece como
       um bloco de outra cor -- foi exatamente o que aconteceu com a data, que fica
       a 18px da borda direita. */
    var prender = function (inicio, tamanho, cabe, limite) {
      /* Regiao mais larga que a vidraca alinha pelo COMECO, e nao pelo centro:
         centralizar um campo de texto corta o inicio dele, que e onde a leitura
         comeca. Regiao que cabe fica centrada. Depois, prende dentro da janela. */
      var alvo = tamanho > cabe ? inicio : inicio + tamanho / 2 - cabe / 2;
      return Math.max(0, Math.min(alvo, Math.max(0, limite - cabe)));
    };
    var esq = prender(x, largura, cabeX, JANELA_LARGURA);
    var topo = prender(y, altura, cabeY, JANELA_ALTURA);

    var desvioX = (esq + MARGEM_CAPTURA) * ESCALA_DETALHE;
    var desvioY = (topo + MARGEM_CAPTURA) * ESCALA_DETALHE;

    vidro.style.backgroundPosition = -desvioX + "px " + -desvioY + "px";
  }

  function ligarChamadas() {
    var lista = doc.querySelector(".chamadas");
    if (!lista) return;

    var vidro = doc.querySelector(".detalhe-vidro");
    var botoes = lista.querySelectorAll("button[data-chamada]");
    if (!botoes.length) return;

    var explicacao = doc.querySelector(".chamada-explicacao");

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
      if (vidro && regiao) recortar(vidro, regiao);

      /* A frase visivel vem da copia sr-only do proprio botao: uma fonte de texto,
         nao duas. `innerHTML` e nao `textContent` porque ela carrega <code>. */
      if (explicacao) {
        var fonte = lista.querySelector(
          'button[data-chamada="' + chave + '"] .chamada-texto'
        );
        if (fonte) explicacao.innerHTML = fonte.innerHTML;
      }
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
      if (ativo && vidro) recortar(vidro, ativo.getAttribute("data-regiao"));
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

  ligarSeletor();
  ligarChamadas();
  ligarCopia();
  prepararCotas();
  ligarVarredura();
})();
