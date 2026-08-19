import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // `duration-75` na base e `duration-150` no estado marcado: a duração
        // usada é sempre a do estado para o qual se vai. Marcar é o gesto
        // afirmativo do app e a tinta assenta em 150ms, junto com o check que se
        // desenha por cima (ver `check-draw` em index.css); DESMARCAR é
        // correção, e correção não tem cerimônia — o quadrado esvazia em 75ms,
        // no mesmo tempo em que o Radix desmonta o indicador. Sem a assimetria,
        // desmarcar deixava um quadrado cheio e SEM check por 150ms.
        // O `after:absolute` é o MECANISMO do alvo ampliado; a GEOMETRIA dele não
        // mora aqui. Ela depende da linha que hospeda o checkbox — de quanto
        // padding ela tem, de onde começa o texto ao lado, e de a linha ter uma ou
        // duas alturas —, e um par de insets fixos na base não tem como saber nada
        // disso. Quem usa declara `after:` com os quatro lados; ver `TodoRow`.
        //
        // Sem geometria nenhuma o pseudo-elemento colapsa em zero, o que é o
        // desfecho certo para um esquecimento: o alvo volta a ser o desenho de
        // 16px, e não um retângulo invisível de tamanho arbitrário.
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-control-border transition-colors duration-75 data-checked:duration-150 outline-none group-has-disabled/field:opacity-50 after:absolute focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
