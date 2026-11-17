"use client"

import { cva } from "class-variance-authority"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { useFinanceScope } from "../../lib/context/finance-scope"
import { useFinanceEntities, useFinancePeriods } from "../../lib/queries/shell"
import type { PeriodStatus } from "../../lib/types/common"


const periodDotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    status: {
      open: "bg-status-success-fg",
      closing: "bg-status-warning-fg",
      adjusting: "bg-status-warning-fg",
      closed: "bg-status-neutral-fg",
      locked: "bg-status-neutral-fg",
      future: "bg-content-quaternary",
    } satisfies Record<PeriodStatus, string>,
  },
})

function EntityPicker({ className }: { className?: string }) {
  const t = useTranslations("FinanceShared")
  const { scope, setEntityId } = useFinanceScope()
  const { data: entities = [] } = useFinanceEntities()

  return (
    <Select value={scope.entityId} onValueChange={setEntityId}>
      <SelectTrigger aria-label={t("entity")} className={cn("h-9 w-72", className)}>
        <SelectValue placeholder={t("entity")} />
      </SelectTrigger>
      <SelectContent>
        {entities.map((entity) => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Period select plus a status dot, e.g. `Apr 2026 · open ●`. */
function PeriodPicker({ className }: { className?: string }) {
  const t = useTranslations("FinanceShared")
  const { scope, setPeriod } = useFinanceScope()
  const { data: periods = [] } = useFinancePeriods()
  const current = periods.find((period) => period.id === scope.period)

  return (
    <div data-slot="period-picker" className={cn("flex items-center gap-2.5", className)}>
      <Select value={scope.period} onValueChange={setPeriod}>
        <SelectTrigger aria-label={t("period")} className="h-9 w-48">
          <SelectValue placeholder={t("period")} />
        </SelectTrigger>
        <SelectContent>
          {periods.map((period) => (
            <SelectItem key={period.id} value={period.id}>
              {period.label} · {t(`periodStatus.${period.status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current ? (
        <span className={periodDotVariants({ status: current.status })}>
          <span className="sr-only">{t("periodIs", { status: t(`periodStatus.${current.status}`) })}</span>
        </span>
      ) : null}
    </div>
  )
}

export { EntityPicker, PeriodPicker }
