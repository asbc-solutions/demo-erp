"use client"

import * as React from "react"
import { Check, CheckCircle2, RotateCcw } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

type Accent = "primary" | "danger"

/** Employee identity pill shown under the wizard title. */
export function EmployeeChip({
  initials,
  name,
  subtitle,
}: Readonly<{ initials?: string; name: string; subtitle?: string }>) {
  return (
    <div className="bg-surface-page inline-flex w-fit items-center gap-2 rounded-full py-1 pe-3 ps-1">
      <Avatar size="sm" alt={name} fallback={initials} />
      <span className="text-content-primary text-sm font-semibold">{name}</span>
      {subtitle && (
        <span className="text-content-tertiary text-sm">{subtitle}</span>
      )}
    </div>
  )
}

/** Horizontal numbered stepper (1 → 2 → 3). */
export function OperationStepper({
  steps,
  current,
  accent = "primary",
}: Readonly<{ steps: string[]; current: number; accent?: Accent }>) {
  const currentCircle =
    accent === "danger" ? "bg-brand-danger text-white" : "bg-brand-primary text-white"
  const connectorDone =
    accent === "danger" ? "bg-brand-danger" : "bg-brand-primary"

  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const status = i < current ? "completed" : i === current ? "current" : "upcoming"
        return (
          <React.Fragment key={label}>
            <li className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  status === "completed" && "bg-brand-success text-white",
                  status === "current" && currentCircle,
                  status === "upcoming" &&
                    "border-stroke-input text-content-quaternary border",
                )}
              >
                {status === "completed" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "text-sm",
                  status === "upcoming"
                    ? "text-content-quaternary"
                    : "text-content-primary font-medium",
                )}
              >
                {label}
              </span>
            </li>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-3 h-px flex-1 rounded-full",
                  i < current ? connectorDone : "bg-stroke-default",
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </ol>
  )
}

export type ComparisonRow = {
  label: string
  current: React.ReactNode
  next: React.ReactNode
}

/** Current vs After comparison table used in the review step. */
export function ComparisonTable({
  nextLabel,
  rows,
  accent = "primary",
}: Readonly<{ nextLabel: string; rows: ComparisonRow[]; accent?: Accent }>) {
  const nextColor = accent === "danger" ? "text-brand-danger" : "text-brand-primary"
  return (
    <div className="border-stroke-default overflow-hidden rounded-[12px] border">
      <div className="bg-surface-page text-content-tertiary grid grid-cols-[120px_1fr_1fr] gap-3 px-4 py-2.5 text-[11px] font-semibold tracking-[0.4px] uppercase">
        <span />
        <span>Current</span>
        <span className={nextColor}>{nextLabel}</span>
      </div>
      <div className="divide-stroke-default/60 divide-y">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[120px_1fr_1fr] items-center gap-3 px-4 py-3"
          >
            <span className="text-content-tertiary text-sm">{row.label}</span>
            <span className="text-content-primary text-sm">{row.current}</span>
            <span className={cn("text-sm font-medium", nextColor)}>
              {row.next}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Shared success/result step (step 3). */
export function OperationResult({
  title,
  children,
  onViewProfile,
  onUndo,
  undoLabel = "Undo (24h window)",
  undoing = false,
  onDone,
  extra,
}: Readonly<{
  title: string
  children: React.ReactNode
  onViewProfile?: () => void
  onUndo?: () => void
  undoLabel?: string
  undoing?: boolean
  onDone: () => void
  extra?: React.ReactNode
}>) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="bg-brand-success/10 text-brand-success flex size-14 items-center justify-center rounded-full">
        <CheckCircle2 className="size-7" strokeWidth={2} />
      </span>
      <h3 className="text-content-primary text-lg leading-7 font-semibold">
        {title}
      </h3>
      <p className="text-content-tertiary max-w-sm text-sm leading-5">
        {children}
      </p>
      {extra}
      <div className="mt-1 flex items-center gap-4">
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="text-brand-primary text-sm font-semibold hover:underline"
          >
            View employee profile
          </button>
        )}
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={undoing}
            className="text-content-tertiary inline-flex items-center gap-1.5 text-sm hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            {undoing ? "Undoing…" : undoLabel}
          </button>
        )}
      </div>
      <Button
        variant="primary"
        className="mt-4 rounded-[10px] px-6"
        onClick={onDone}
      >
        Done
      </Button>
    </div>
  )
}
