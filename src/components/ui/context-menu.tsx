import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Menu de contexto (Adendo 13) — **a primeira superfície flutuante do app**, e a
 * exceção declarada ao "não tem modal nem popover" do DESIGN.md: ele aparece sob
 * o cursor por gesto explícito, some ao primeiro clique fora e custa zero de
 * altura permanente, que é exatamente o que a Regra do Custo de Altura protege.
 *
 * A separação do fundo segue a lei do app — **tom e traço, nunca sombra**: fundo
 * `card`, fio de 1px em `border`, item realçado em `muted`. Numa janela de
 * 360x480 o Radix já cuida de o menu nunca vazar da vista.
 *
 * Só as partes que o app usa: shadcn completo traria checkbox-item, grupos e
 * rótulos que ninguém chama — mobília, e este arquivo não tem espaço para
 * mobília. A próxima opção do menu acrescenta a parte dela quando chegar.
 */

function ContextMenu(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Root>,
) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>,
) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

/**
 * A moldura compartilhada do conteúdo e do subconteúdo: mesma superfície, mesmo
 * fio, mesmo raio de 10px (`rounded-lg`, o passo acima dos 8px dos itens — a
 * Regra do Raio Decrescente lida de dentro para fora).
 */
const MOLDURA =
  "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-foreground"

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        // `collisionPadding` de 8px: o menu para antes de encostar na borda do
        // cartão, onde o canto arredondado da janela o cortaria.
        collisionPadding={8}
        className={cn(MOLDURA, className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

/** O passo de todo item: 28px de altura, texto de 12px, realce em `muted`. */
const ITEM =
  "relative flex h-7 cursor-default items-center gap-2 rounded-md px-2 text-xs outline-none " +
  "data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"

function ContextMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item>) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      className={cn(ITEM, className)}
      {...props}
    />
  )
}

function ContextMenuSub(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Sub>,
) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger>) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      className={cn(ITEM, "data-[state=open]:bg-muted", className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-3 text-muted-foreground" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        data-slot="context-menu-sub-content"
        collisionPadding={8}
        className={cn(MOLDURA, className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuRadioGroup(
  props: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>,
) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

/**
 * Item de escolha única. O check à esquerda é o indicador do Radix — croma 0,
 * como manda o Pigmento Único: escolhido é informação de estado, não alarme.
 */
function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(ITEM, "pl-7", className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-3" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
}
