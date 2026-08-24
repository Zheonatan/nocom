import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // **O fundo que o preset pintava só no tema escuro saiu daqui** — era o token
        // `input` a 30%, e dava um retângulo visivelmente mais claro atrás de "Nova
        // tarefa…". O DESIGN.md declara este campo com fundo transparente sobre a
        // superfície, e a divergência era da mesma classe do `×` da aba: um fundo que
        // existe num tema e não no outro faz o mesmo controle se ler de dois jeitos.
        //
        // Quem identifica o campo é o `control-border`, pela Regra da Linha que
        // Informa, e ele tem contraste para isso nos dois temas. Os `disabled:`
        // continuam: são estado, não o fundo em repouso, e nenhum campo deste app
        // chega a ser desabilitado.
        "h-8 w-full min-w-0 rounded-lg border border-control-border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
