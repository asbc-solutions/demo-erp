import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/src/shared/lib/utils/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-0.5 text-xs leading-4 font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        success:
          "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-200",
        warning:
          "bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200",
        danger:
          "bg-red-50 text-red-950 dark:bg-red-950/45 dark:text-red-200",
        info: "bg-sky-50 text-sky-950 dark:bg-sky-950/40 dark:text-sky-200",
        neutral: "bg-surface-hover text-content-tertiary",
        primary: "bg-brand-primary/10 text-brand-primary",
        outline:
          "border-stroke-default text-content-secondary border bg-transparent",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
