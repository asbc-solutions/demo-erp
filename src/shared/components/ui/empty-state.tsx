import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center gap-3 text-center",
  {
    variants: {
      variant: {
        plain: "",
        card: "border-stroke-default bg-surface-white rounded-xl border border-dashed",
      },
      size: {
        sm: "px-4 py-8",
        default: "px-6 py-12",
      },
    },
    defaultVariants: {
      variant: "plain",
      size: "default",
    },
  },
)

type EmptyStateProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof emptyStateVariants> & {
    icon?: React.ReactNode
    title: React.ReactNode
    description?: React.ReactNode
    /** Buttons or links rendered under the description. */
    actions?: React.ReactNode
  }

function EmptyState({
  className,
  variant,
  size,
  icon,
  title,
  description,
  actions,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-variant={variant ?? "plain"}
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    >
      {icon ? (
        <div
          data-slot="empty-state-icon"
          aria-hidden
          className="bg-surface-hover text-content-tertiary flex size-10 items-center justify-center rounded-full [&_svg:not([class*='size-'])]:size-5"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-content-primary text-sm leading-5 font-semibold">{title}</p>
        {description ? (
          <p className="text-content-tertiary text-[13px] leading-5">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div data-slot="empty-state-actions" className="flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export { EmptyState, emptyStateVariants }
