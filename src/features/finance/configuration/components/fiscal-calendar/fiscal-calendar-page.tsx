"use client"

import * as React from "react"
import { toast } from "sonner"

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
import { formatDate } from "../../../lib/utils/date"
import { useSaveFiscalCalendar } from "../../lib/mutations/configuration"
import { useFiscalCalendar } from "../../lib/queries/configuration"
import type { FiscalCalendar } from "../../lib/types/configuration"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const STATUS_TONE: Record<string, "success" | "info" | "neutral" | "warning"> = { open: "success", closing: "warning", adjusting: "warning", closed: "info", locked: "neutral", future: "neutral" }

type Period = FiscalCalendar["periods"][number]

const COLUMNS: FinanceColumn<Period>[] = [
  { id: "period", header: "Period", cell: (row) => <span className="text-content-primary font-medium">{row.label}</span> },
  { id: "start", header: "Opens", cell: (row) => formatDate(row.start_date) },
  { id: "end", header: "Ends", cell: (row) => formatDate(row.end_date) },
  { id: "adjusting", header: "Adjusting until", cell: (row) => formatDate(row.adjusting_until) },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={`period-${row.status}`} label={row.status === "future" ? "not open" : row.status} tone={STATUS_TONE[row.status] ?? "neutral"} /> },
]

function EditDialog({ calendar, open, onOpenChange }: { calendar: FiscalCalendar; open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSaveFiscalCalendar()
  const [month, setMonth] = React.useState(String(calendar.year_start_month))
  const [days, setDays] = React.useState(String(calendar.adjusting_days))
  const invalid = !(Number.isInteger(Number(days)) && Number(days) >= 0 && Number(days) <= 30)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit the fiscal calendar</DialogTitle>
          <DialogDescription>A new year start applies from the next financial year; this year&apos;s periods stay as they are.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="calendar-start">Fiscal year starts</FieldLabel>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="calendar-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>
                    1 {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="calendar-days">Adjusting window (days)</FieldLabel>
            <Input id="calendar-days" inputMode="numeric" className="w-28 tabular-nums" value={days} aria-invalid={invalid} onChange={(event) => setDays(event.target.value)} />
            <FieldDescription>Days after period end when the close team can still book late entries. Between 0 and 30.</FieldDescription>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={invalid || save.isPending}
            onClick={() =>
              save.mutate(
                { year_start_month: Number(month), adjusting_days: Number(days) },
                {
                  onSuccess: () => {
                    toast.success("Fiscal calendar saved.")
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, "The calendar could not be saved. Try again.")),
                },
              )
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 11.05 · Fiscal calendar — when the year starts, how it is split, and the adjusting window after month-end. */
function FiscalCalendarPage() {
  const { data, isError, refetch } = useFiscalCalendar()
  const [editing, setEditing] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Fiscal calendar"
        actions={
          <Button variant="secondary" disabled={!data} onClick={() => setEditing(true)}>
            Edit
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
              <KpiCard layout="bar" accent="indigo" label="Fiscal year start" value={data.year_start_label} />
              <KpiCard layout="bar" accent="teal" label="Period length" value="Monthly" caption={`${data.periods_per_year} periods`} />
              <KpiCard layout="bar" accent="amber" label="Adjusting window" value={`${data.adjusting_days} days`} caption="After period end" />
            </div>
            {data.pending_change ? (
              <FinanceAlert tone="warning">
                The financial year is set to start on {data.year_start_label}. This year&apos;s periods were created from 1 January, so the
                new start applies from the next financial year.
              </FinanceAlert>
            ) : null}
            <p className="text-content-secondary max-w-3xl text-[13px] leading-5">
              The fiscal calendar defines when periods open and close. The adjusting window lets the close team book late entries
              into a period after month-end without reopening it for everyone.
            </p>
            <FinanceSection title="This year's periods">
              <FinanceTable caption="Financial periods this year" columns={COLUMNS} rows={data.periods} getRowId={(row) => row.id} />
            </FinanceSection>
            <EditDialog key={`${data.year_start_month}-${data.adjusting_days}-${String(editing)}`} calendar={data} open={editing} onOpenChange={setEditing} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { FiscalCalendarPage }
