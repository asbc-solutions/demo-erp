import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import {
  FINANCE_STATUSES,
  getStatusMeta,
  type StatusFamily,
  type StatusKey,
  type StatusTone,
} from "../../lib/constants/statuses"

/**
 * Family sets the border (solid, dashed) and whether a marker icon shows; tone
 * sets the colour. Border colour is resolved per family × tone in
 * `compoundVariants` because accounting pills use the soft border token while
 * internal and external pills outline in the foreground colour.
 */
const statusPillVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border px-1.5 py-px text-[11px] leading-4 font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      family: {
        internal: "border-solid",
        external: "border-dashed",
        accounting: "border-solid",
        failed: "border-solid",
      },
      tone: {
        neutral: "bg-status-neutral-bg text-status-neutral-fg",
        info: "bg-status-info-bg text-status-info-fg",
        success: "bg-status-success-bg text-status-success-fg",
        warning: "bg-status-warning-bg text-status-warning-fg",
        danger: "bg-status-danger-bg text-status-danger-fg",
        muted: "bg-surface-hover text-content-tertiary border-stroke-light",
      },
    },
    compoundVariants: [
      { family: ["internal", "external"], tone: "neutral", className: "border-status-neutral-fg/40" },
      { family: ["internal", "external"], tone: "info", className: "border-status-info-fg/40" },
      { family: ["internal", "external"], tone: "success", className: "border-status-success-border" },
      { family: ["internal", "external"], tone: "warning", className: "border-status-warning-fg/40" },
      { family: ["internal", "external"], tone: "danger", className: "border-status-danger-border" },
      { family: ["accounting", "failed"], tone: "neutral", className: "border-status-neutral-border" },
      { family: ["accounting", "failed"], tone: "info", className: "border-status-info-border" },
      { family: ["accounting", "failed"], tone: "success", className: "border-status-success-border" },
      { family: ["accounting", "failed"], tone: "warning", className: "border-status-warning-border" },
      { family: ["accounting", "failed"], tone: "danger", className: "border-status-danger-border" },
    ],
    defaultVariants: {
      family: "internal",
      tone: "neutral",
    },
  },
)

type StatusPillProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof statusPillVariants> & {
    /** A key from the finance status vocabulary, or any backend status string. */
    status: StatusKey | (string & {})
    /** Override the vocabulary's label, e.g. "Customer" or "EGP". */
    label?: React.ReactNode
  }

/** Translates a finance status key; unknown backend statuses read with spaces for underscores. */
function useStatusLabel(): (status: string) => string {
  const t = useTranslations("FinanceShared")
  return (status) =>
    status in FINANCE_STATUSES ? t(`status.${status as StatusKey}`) : getStatusMeta(status).label
}

function StatusPill({ className, status, label, family, tone, ...props }: StatusPillProps) {
  const statusLabel = useStatusLabel()
  const meta = getStatusMeta(status)
  const vocabularyLabel = statusLabel(status)
  const resolvedFamily: StatusFamily = family ?? meta.family
  const resolvedTone: StatusTone = tone ?? meta.tone
  const Marker = resolvedFamily === "external" || resolvedFamily === "failed" ? meta.icon : undefined

  return (
    <span
      data-slot="status-pill"
      data-status={status}
      data-family={resolvedFamily}
      data-tone={resolvedTone}
      className={cn(statusPillVariants({ family: resolvedFamily, tone: resolvedTone }), className)}
      {...props}
    >
      {Marker ? <Marker aria-hidden strokeWidth={2} /> : null}
      {label ?? vocabularyLabel}
    </span>
  )
}

export { StatusPill, statusPillVariants, useStatusLabel }
