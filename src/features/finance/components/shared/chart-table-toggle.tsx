"use client"

import * as React from "react"
import { ChartColumn, Table2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

type ChartTableToggleProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** One sentence saying what the chart shows, read before either view. */
  description?: React.ReactNode
  chart: React.ReactNode
  table: React.ReactNode
}

/**
 * Every chart can be read as a table instead ("Show these figures as a
 * table"), so the figures stay available to screen readers and to people
 * who want exact numbers.
 */
function ChartTableToggle({ className, description, chart, table, ...props }: ChartTableToggleProps) {
  const t = useTranslations("FinanceShared")
  const [showTable, setShowTable] = React.useState(false)
  const Icon = showTable ? ChartColumn : Table2
  return (
    <div data-slot="chart-table-toggle" className={cn("flex flex-col gap-3", className)} {...props}>
      {description ? (
        <p className="text-content-secondary text-sm leading-5">{description}</p>
      ) : null}
      <button
        type="button"
        aria-pressed={showTable}
        onClick={() => setShowTable((value) => !value)}
        className="text-brand-primary inline-flex w-fit items-center gap-1.5 text-[13px] leading-5 font-medium hover:underline"
      >
        <Icon aria-hidden className="size-3.5" />
        {showTable ? t("showAsChart") : t("showAsTable")}
      </button>
      {showTable ? table : chart}
    </div>
  )
}

export { ChartTableToggle }
