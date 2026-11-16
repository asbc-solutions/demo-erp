import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/src/shared/lib/utils/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Figma design-system variants
        primary:
          "bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary/30",
        secondary:
          "border-stroke-default bg-surface-white text-content-secondary hover:bg-surface-hover hover:text-content-primary",
        success:
          "bg-brand-success text-white hover:bg-brand-success-hover focus-visible:ring-brand-success/30",
        warning:
          "bg-brand-warning text-white hover:bg-brand-warning-hover focus-visible:ring-brand-warning/30",
        danger:
          "bg-brand-danger text-white hover:bg-brand-danger-hover focus-visible:ring-brand-danger/30",
        "outline-primary":
          "border-brand-primary bg-surface-white text-brand-primary hover:bg-brand-primary/5",
        "ghost-primary":
          "text-brand-primary hover:bg-brand-primary/5",
        // shadcn baseline variants (kept for compatibility with existing usage)
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-brand-primary underline-offset-4 hover:underline",
      },
      size: {
        // Aligned to Figma sizes: Small 32 / Regular 36 / Large 44
        sm: "h-8 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3.5",
        default:
          "h-9 gap-2 px-4 text-sm has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-11 gap-2 px-6 text-base has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5 [&_svg:not([class*='size-'])]:size-5",
        // Icon-only square buttons
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
        // Legacy aliases
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
