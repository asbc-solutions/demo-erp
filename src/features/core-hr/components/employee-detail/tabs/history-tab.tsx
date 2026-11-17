"use client"

import { History } from "lucide-react"
import { useTranslations } from "next-intl"

import { AuditDayGroup } from "../../audit-log/audit-timeline"
import { useEmployeeHistory } from "../../../lib/queries/audit-log"
import { HrSectionSpinner } from "../../shared/hr-loading"
import { SectionCard } from "../section-card"

type HistoryTabProps = Readonly<{
  employeeId: string
}>

export function HistoryTab({ employeeId }: HistoryTabProps) {
  const t = useTranslations("HrEmployeeDetail")
  const { data: days = [], isLoading } = useEmployeeHistory(employeeId)

  return (
    <SectionCard
      title={t("historyTitle")}
      description={t("historyDescription")}
      bodyClassName="px-6 pb-6 pt-1 flex flex-col gap-4"
    >
      {isLoading && <HrSectionSpinner />}
      {!isLoading && days.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="bg-surface-hover text-content-tertiary flex size-10 items-center justify-center rounded-full">
            <History className="size-5" strokeWidth={1.5} />
          </span>
          <p className="text-content-tertiary text-sm leading-5">
            {t("historyEmpty")}
          </p>
        </div>
      )}
      {days.map((day) => (
        <AuditDayGroup
          key={day.date}
          label={day.date_label}
          entries={day.entries}
        />
      ))}
    </SectionCard>
  )
}
