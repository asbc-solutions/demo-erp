"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

function Accordion(
  props: Readonly<React.ComponentProps<typeof AccordionPrimitive.Root>>,
) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-stroke-default border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  hideChevron = false,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** Hide the built-in trailing chevron so the consumer can place its own. */
  hideChevron?: boolean
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:ring-brand-primary/30 flex flex-1 items-center gap-3 py-2 text-start text-sm outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          !hideChevron && "justify-between [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        {!hideChevron && (
          <ChevronDown
            aria-hidden
            className="text-content-quaternary pointer-events-none size-4 shrink-0 transition-transform duration-200"
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-2", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
