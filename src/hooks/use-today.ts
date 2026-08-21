import { useEffect, useState } from "react";
import { msUntilNextDay, todayKey } from "@/lib/dates";

/**
 * O dia de hoje (`2026-08-19`), e ele VIRA sozinho.
 *
 * Não é preciosismo: este app não é uma página que alguém abre e fecha — ele mora
 * na bandeja e fica semanas com o mesmo processo de pé. Sem esta virada, a data
 * destacada seria a de quando a janela foi aberta, e depois da meia-noite o
 * destaque passaria a AFIRMAR que ontem é hoje. Um destaque errado é pior que
 * nenhum: nenhum não diz nada, errado diz uma mentira.
 *
 * Dois despertadores, pela mesma razão pela qual o app tem duas vias de volta:
 *
 * 1. **O timer até a meia-noite**, reagendado a cada virada (nunca um intervalo
 *    fixo, que acumularia deriva).
 * 2. **O foco da janela.** A máquina que dorme com o app aberto suspende o timer
 *    junto, e ele é servido atrasado no retorno — o gesto de trazer a janela de
 *    volta é a chance de o dia já estar certo quando a lista aparece. Voltar o
 *    foco no mesmo dia não custa nada: o `setKey` com o mesmo valor não
 *    re-renderiza (o React desiste da atualização).
 *
 * O valor é string de propósito — ver `todayKey`. Ele desce até o `TodoRow`, que
 * é `memo`, e muda no máximo uma vez por dia.
 */
export function useToday(): string {
  const [key, setKey] = useState(todayKey);

  useEffect(() => {
    let timer: number | undefined;

    function schedule() {
      timer = window.setTimeout(() => {
        setKey(todayKey());
        schedule();
      }, msUntilNextDay());
    }

    function refresh() {
      setKey(todayKey());
    }

    schedule();
    window.addEventListener("focus", refresh);

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return key;
}
