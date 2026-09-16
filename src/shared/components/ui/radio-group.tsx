"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/src/shared/lib/utils/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        // Base — Figma: 16px circle, gray-500 border, white bg
        "border-content-tertiary/80 bg-surface-white aspect-square size-4 shrink-0 rounded-full border outline-none transition-[color,box-shadow,border-color]",
        // Focus
        "focus-visible:border-brand-primary focus-visible:ring-brand-primary/20 focus-visible:ring-[3px]",
        // Checked — Figma: indigo border with indigo dot inside
        "data-[state=checked]:border-brand-primary",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-brand-danger aria-invalid:ring-brand-danger/20",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <span className="bg-brand-primary block size-2.5 rounded-full" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
