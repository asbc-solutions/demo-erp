"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cva, type VariantProps } from "class-variance-authority"
import {
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Info,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

// Per-variant styling — Figma "Standard / Compact Alerts":
// success → emerald, warning → amber, error → red, info → blue
const alertVariants = cva(
  "relative flex w-full rounded-[10px] border-s-4 [&>svg]:shrink-0 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        success:
          "bg-emerald-50 border-s-brand-success [&>svg]:text-brand-success [&_[data-slot=alert-title]]:text-emerald-800 [&_[data-slot=alert-description]]:text-emerald-700 [&_[data-slot=alert-close]]:text-emerald-700",
        warning:
          "bg-amber-100 border-s-brand-warning [&>svg]:text-brand-warning [&_[data-slot=alert-title]]:text-amber-800 [&_[data-slot=alert-description]]:text-amber-700 [&_[data-slot=alert-close]]:text-amber-700",
        error:
          "bg-red-100 border-s-brand-danger [&>svg]:text-brand-danger [&_[data-slot=alert-title]]:text-red-800 [&_[data-slot=alert-description]]:text-red-700 [&_[data-slot=alert-close]]:text-red-700",
        info: "bg-blue-50 border-s-brand-info [&>svg]:text-brand-info [&_[data-slot=alert-title]]:text-blue-800 [&_[data-slot=alert-description]]:text-blue-700 [&_[data-slot=alert-close]]:text-blue-700",
      },
      size: {
        default:
          "items-start gap-3 py-4 pe-4 ps-5 [&>svg]:mt-0.5 [&>svg]:size-5",
        compact:
          "items-center gap-2.5 py-2.5 pe-4 ps-5 [&>svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "default",
    },
  },
)

const variantIcons: Record<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>,
  LucideIcon
> = {
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,
}

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Render a custom icon instead of the variant default. */
    icon?: React.ReactNode
    /** Hide the leading icon entirely. */
    hideIcon?: boolean
  }

function Alert({
  className,
  variant = "info",
  size = "default",
  icon,
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const VariantIcon = variantIcons[variant ?? "info"]
  const renderedIcon = hideIcon ? null : (icon ?? <VariantIcon aria-hidden />)

  return (
    <div
      data-slot="alert"
      data-variant={variant}
      data-size={size}
      role={variant === "error" ? "alert" : undefined}
      aria-live={variant === "error" ? undefined : "polite"}
      className={cn(alertVariants({ variant, size }), className)}
      {...props}
    >
      {renderedIcon}
      {size === "default" ? (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      ) : (
        children
      )}
    </div>
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("text-sm leading-5 font-medium", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-description"
      className={cn("text-xs leading-4", className)}
      {...props}
    />
  )
}

function AlertContent({
  className,
  ...props
}: React.ComponentProps<"p">) {
  // Single-line content for compact alerts
  return (
    <p
      data-slot="alert-description"
      className={cn("min-w-0 flex-1 text-xs leading-4", className)}
      {...props}
    />
  )
}

function AlertClose({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const t = useTranslations("Ui")
  return (
    <button
      type="button"
      data-slot="alert-close"
      aria-label={t("dismiss")}
      className={cn(
        "ms-auto inline-flex shrink-0 items-center justify-center rounded p-1 transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        className,
      )}
      {...props}
    >
      <X className="size-4" aria-hidden />
    </button>
  )
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertContent,
  AlertClose,
  alertVariants,
}
