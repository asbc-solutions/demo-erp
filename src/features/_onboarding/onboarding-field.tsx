"use client"

import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

/**
 * The onboarding forms sit on a card rather than the page, so their controls are
 * taller and flatter than the `ui/input` default. Shared here so a new step
 * cannot drift from the ones beside it.
 */
export const onboardingInputClass =
  "border-stroke-default bg-muted text-content-primary placeholder:text-content-quaternary h-12 w-full rounded-lg border px-3 text-base leading-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none transition-[border-color,box-shadow] focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/15 dark:shadow-none"

type OnboardingFieldProps = Readonly<{
  id: string
  label: string
  error?: string
  /** Rendered after the label, e.g. "Required". */
  hint?: string
  className?: string
  children: React.ReactNode
}>

export function OnboardingField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: OnboardingFieldProps) {
  return (
    <div data-slot="onboarding-field" className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-content-tertiary text-xs leading-[18px] font-medium"
        >
          {label}
        </label>
        {hint && (
          <span className="text-content-quaternary text-xs leading-[18px]">
            {hint}
          </span>
        )}
      </div>

      {children}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-brand-danger text-xs leading-[18px]"
        >
          {error}
        </p>
      )}
    </div>
  )
}
