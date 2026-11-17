"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useSaveFiscalCalendar } from "../../lib/mutations/configuration"
import { useFiscalCalendar } from "../../lib/queries/configuration"
import type { ConfigTranslator, FiscalCalendar } from "../../lib/types/configuration"
import { MONTH_NUMBERS, monthName } from "../../lib/utils/months"

const PERIOD_STATUSES = ["open", "closing", "adjusting", "closed", "locked", "future"] as const
type PeriodStatusKey = (typeof PERIOD_STATUSES)[number]
const isPeriodStatus = (status: string): status is PeriodStatusKey => (PERIOD_STATUSES as readonly string[]).includes(status)
const STATUS_TONE: Record<string, "success" | "info" | "neutral" | "warning"> = { open: "success", closing: "warning", adjusting: "warning", closed: "info", locked: "neutral", future: "neutral" }

type Period = FiscalCalendar["periods"][number]

function buildColumns(t: ConfigTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<Period>[] {
  return [
    { id: "period", header: t("period"), cell: (row) => <span className="text-content-primary font-medium">{row.label}</span> },
    { id: "start", header: t("opens"), cell: (row) => formatDate(row.start_date) },
    { id: "end", header: t("ends"), cell: (row) => formatDate(row.end_date) },
    { id: "adjusting", header: t("adjustingUntil"), cell: (row) => formatDate(row.adjusting_until) },
    { id: "status", header: t("status"), cell: (row) => <StatusPill status={`period-${row.status}`} label={isPeriodStatus(row.status) ? t(`periodStatus.${row.status}`) : row.status} tone={STATUS_TONE[row.status] ?? "neutral"} /> },
  ]
}

function EditDialog({ calendar, open, onOpenChange }: { calendar: FiscalCalendar; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceConfiguration")
  const locale = useIntlLocale()
  const save = useSaveFiscalCalendar()
  const [month, setMonth] = React.useState(String(calendar.year_start_month))
  const [days, setDays] = React.useState(String(calendar.adjusting_days))
  const invalid = !(Number.isInteger(Number(days)) && Number(days) >= 0 && Number(days) <= 30)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editCalendarTitle")}</DialogTitle>
          <DialogDescription>{t("editCalendarDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="calendar-start">{t("fiscalYearStarts")}</FieldLabel>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="calendar-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NUMBERS.map((monthNumber) => (
                  <SelectItem key={monthNumber} value={String(monthNumber)}>
                    {t("firstOfMonth", { month: monthName(monthNumber, locale) })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="calendar-days">{t("adjustingWindowDays")}</FieldLabel>
            <Input id="calendar-days" inputMode="numeric" className="w-28 tabular-nums" value={days} aria-invalid={invalid} onChange={(event) => setDays(event.target.value)} />
            <FieldDescription>{t("adjustingWindowHint")}</FieldDescription>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={invalid || save.isPending}
            onClick={() =>
              save.mutate(
                { year_start_month: Number(month), adjusting_days: Number(days) },
                {
                  onSuccess: () => {
                    toast.success(t("toastCalendarSaved"))
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, t("errorSaveCalendar"))),
                },
              )
            }
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 11.05 · Fiscal calendar — when the year starts, how it is split, and the adjusting window after month-end. */
function FiscalCalendarPage() {
  const t = useTranslations("FinanceConfiguration")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const { data, isError, refetch } = useFiscalCalendar()
  const [editing, setEditing] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("fiscalCalendar")}
        actions={
          <Button variant="secondary" disabled={!data} onClick={() => setEditing(true)}>
            {t("edit")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("fiscalYearStart")} value={data.year_start_label} />
              <KpiCard layout="bar" accent="teal" label={t("periodLength")} value={t("monthly")} caption={t("periodsCount", { count: data.periods_per_year })} />
              <KpiCard layout="bar" accent="amber" label={t("adjustingWindow")} value={t("daysCount", { count: data.adjusting_days })} caption={t("afterPeriodEnd")} />
            </div>
            {data.pending_change ? (
              <FinanceAlert tone="warning">
                {t("pendingYearStart", { date: data.year_start_label })}
              </FinanceAlert>
            ) : null}
            <p className="text-content-secondary max-w-3xl text-[13px] leading-5">
              {t("calendarInfo")}
            </p>
            <FinanceSection title={t("thisYearsPeriods")}>
              <FinanceTable caption={t("periodsCaption")} columns={columns} rows={data.periods} getRowId={(row) => row.id} />
            </FinanceSection>
            <EditDialog key={`${data.year_start_month}-${data.adjusting_days}-${String(editing)}`} calendar={data} open={editing} onOpenChange={setEditing} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { FiscalCalendarPage }
