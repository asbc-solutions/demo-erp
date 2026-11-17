"use client"

import {
  Banknote,
  Building2,
  CalendarDays,
  Clock,
  Target,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { useIntlLocale } from "@/src/i18n/intl-locale"
import { useProgram } from "../../lib/queries/training"
import type { ProgramStatus, TrainingProgram } from "../../lib/types"
import { categoryBadge } from "./training-format"

type ProgramDetailsDialogProps = Readonly<{
  program: TrainingProgram
  open: boolean
  onOpenChange: (open: boolean) => void
}>

const STATUS_VARIANT: Record<
  ProgramStatus,
  "success" | "info" | "warning" | "neutral"
> = {
  active: "success",
  completed: "info",
  paused: "warning",
  draft: "neutral",
  archived: "neutral",
}

function formatDay(intlLocale: string, iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function DetailRow({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}>) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-content-tertiary">
        <span className="shrink-0 text-content-quaternary [&_svg]:size-3.5">
          {icon}
        </span>
        {label}
      </span>
      <span className="min-w-0 text-end text-sm font-medium text-content-primary">
        {value}
      </span>
    </div>
  )
}

export function ProgramDetailsDialog({
  program,
  open,
  onOpenChange,
}: ProgramDetailsDialogProps) {
  const t = useTranslations("HrTraining")
  const tCommon = useTranslations("Common")
  const intlLocale = useIntlLocale()
  // Detail endpoint exists; fall back to the row the card already holds while
  // it resolves (and if it ever returns nothing).
  const { data } = useProgram(open ? program.program_id : "")
  const p = data ?? program

  const cat = categoryBadge(p.category, t)
  const start = formatDay(intlLocale, p.start_date)
  const end = formatDay(intlLocale, p.end_date)
  const schedule =
    start && end ? `${start} — ${end}` : (start ?? end ?? null)
  const cost =
    p.cost_per_seat == null
      ? null
      : `${p.currency_code ? `${p.currency_code} ` : "£"}${p.cost_per_seat.toLocaleString(intlLocale)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="pe-12">
          <DialogTitle className="text-lg leading-6 font-semibold text-content-primary">
            {p.program_name}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge className={cat.className}>{cat.label}</Badge>
            <Badge variant={STATUS_VARIANT[p.status] ?? "neutral"}>
              {t(`programStatus.${p.status}`)}
            </Badge>
            <span className="font-mono text-xs text-content-tertiary">
              {p.program_code}
            </span>
          </div>
        </DialogHeader>

        <DialogBody className="gap-5">
          {p.description && (
            <p className="text-sm leading-5 text-content-secondary">
              {p.description}
            </p>
          )}

          <div className="flex flex-col gap-3 rounded-[14px] border border-stroke-default bg-surface-page p-4">
            {p.provider && (
              <DetailRow
                icon={<Building2 strokeWidth={1.75} aria-hidden />}
                label={t("provider")}
                value={p.provider}
              />
            )}
            {p.target_audience && (
              <DetailRow
                icon={<Target strokeWidth={1.75} aria-hidden />}
                label={t("targetAudience")}
                value={p.target_audience}
              />
            )}
            {p.total_duration_hours != null && (
              <DetailRow
                icon={<Clock strokeWidth={1.75} aria-hidden />}
                label={t("totalDuration")}
                value={t("hoursCount", { count: p.total_duration_hours })}
              />
            )}
            <DetailRow
              icon={<Users strokeWidth={1.75} aria-hidden />}
              label={t("enrolled")}
              value={
                p.max_cohort_size != null
                  ? t("seatsTaken", {
                      enrolled: p.enrolled_count ?? 0,
                      max: p.max_cohort_size,
                    })
                  : `${p.enrolled_count ?? 0}`
              }
            />
            {cost && (
              <DetailRow
                icon={<Banknote strokeWidth={1.75} aria-hidden />}
                label={t("costPerSeat")}
                value={cost}
              />
            )}
            {schedule && (
              <DetailRow
                icon={<CalendarDays strokeWidth={1.75} aria-hidden />}
                label={t("schedule")}
                value={schedule}
              />
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-md border-stroke-default bg-surface-white px-4 text-sm font-semibold text-content-primary"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
