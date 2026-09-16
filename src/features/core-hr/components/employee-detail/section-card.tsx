import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

type SectionCardProps = Readonly<{
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}>

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "border-stroke-default bg-surface-white rounded-[14px] border shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-base leading-6 font-semibold">
            {title}
          </h2>
          {description && (
            <p className="text-content-tertiary text-sm leading-5">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("px-6 pt-1 pb-6", bodyClassName)}>{children}</div>
    </section>
  )
}

type DetailFieldProps = Readonly<{
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  className?: string
}>

export function DetailField({ label, value, icon, className }: DetailFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-content-tertiary text-xs leading-4">{label}</span>
      <span className="text-content-primary inline-flex items-center gap-2 text-sm leading-5 font-medium">
        {icon}
        {value}
      </span>
    </div>
  )
}
