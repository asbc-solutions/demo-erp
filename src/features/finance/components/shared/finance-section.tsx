import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

type FinanceSectionProps = Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned link or button on the heading rule, e.g. "Open close workspace". */
  action?: React.ReactNode
}

/** A titled block of a finance page: 18px heading over a hairline rule. */
function FinanceSection({
  className,
  title,
  description,
  action,
  children,
  ...props
}: FinanceSectionProps) {
  const headingId = React.useId()
  return (
    <section
      data-slot="finance-section"
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className="border-stroke-default flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 id={headingId} className="text-content-primary text-lg leading-[26px] font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {description ? (
        <p className="text-content-secondary text-sm leading-5">{description}</p>
      ) : null}
      {children}
    </section>
  )
}

export { FinanceSection }
