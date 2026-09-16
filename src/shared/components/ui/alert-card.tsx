import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

const alertCardVariants = cva(
  "flex w-full items-start gap-3 rounded-[10px] border p-4",
  {
    variants: {
      variant: {
        warning: "bg-[#fef3c7] border-[#fde68a] [--alert-fg:#92400e] [--alert-body:#a16207]",
        danger: "bg-[#fee2e2] border-[#fecaca] [--alert-fg:#991b1b] [--alert-body:#b91c1c]",
        info: "bg-[#eff6ff] border-[#bfdbfe] [--alert-fg:#1e40af] [--alert-body:#1d4ed8]",
        success: "bg-[#ecfdf5] border-[#a7f3d0] [--alert-fg:#065f46] [--alert-body:#047857]",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

const defaultIcon: Record<NonNullable<VariantProps<typeof alertCardVariants>["variant"]>, LucideIcon> = {
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  success: CheckCircle2,
}

type AlertCardProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof alertCardVariants> & {
    title: React.ReactNode
    description?: React.ReactNode
    icon?: React.ReactNode
    hideIcon?: boolean
    ctaLabel?: React.ReactNode
    ctaHref?: string
    onCtaClick?: React.MouseEventHandler<HTMLAnchorElement>
  }

function AlertCard({
  className,
  variant = "info",
  title,
  description,
  icon,
  hideIcon = false,
  ctaLabel,
  ctaHref,
  onCtaClick,
  children,
  ...props
}: AlertCardProps) {
  const resolvedVariant = variant ?? "info"
  const Icon = defaultIcon[resolvedVariant]
  return (
    <div
      data-slot="alert-card"
      data-variant={resolvedVariant}
      role="alert"
      className={cn(alertCardVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {!hideIcon && (
        <div
          data-slot="alert-card-icon"
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-(--alert-fg)"
          aria-hidden
        >
          {icon ?? <Icon className="size-5" />}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-(--alert-fg) text-sm leading-5 font-medium">
          {title}
        </p>
        {description && (
          <p className="text-(--alert-body) text-xs leading-4">
            {description}
          </p>
        )}
        {children}
        {ctaLabel && (
          <a
            href={ctaHref ?? "#"}
            onClick={onCtaClick}
            data-slot="alert-card-cta"
            className="text-(--alert-fg) mt-1.5 inline-flex w-fit items-center text-xs leading-4 font-medium underline hover:no-underline"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </div>
  )
}

export { AlertCard, alertCardVariants }
export type { AlertCardProps }
