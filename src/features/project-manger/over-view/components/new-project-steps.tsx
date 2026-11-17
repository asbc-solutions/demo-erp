"use client"

import {
  Bell,
  BellOff,
  Briefcase,
  Building2,
  Check,
  Landmark,
  Layers,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { useBranches } from "@/src/features/core-hr/lib/queries/branches"
import { useCostCenters } from "@/src/features/core-hr/lib/queries/cost-centers"
import { useEmployees } from "@/src/features/core-hr/lib/queries/employees"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { TASK_PRIORITY_KEY } from "../../all-project/data/project-detail-data"
import {
  BILLING_METHODS,
  BILLING_METHOD_KEY,
  PROJECT_PRIORITIES,
  PROJECT_TYPES,
  STAKEHOLDER_AVATAR_STYLE,
  STAKEHOLDER_ROLES,
  TIMEZONES,
  WBS_LEVEL_STYLE,
  WBS_SKELETON,
  WORKING_DAYS,
  type NewProjectForm,
  type ProjectTypeOption,
} from "../data/new-project-data"

type StepProps = {
  form: NewProjectForm
  update: (patch: Partial<NewProjectForm>) => void
}

const TYPE_ICON: Record<ProjectTypeOption["icon"], LucideIcon> = {
  briefcase: Briefcase,
  building: Building2,
  landmark: Landmark,
  layers: Layers,
  sparkles: Sparkles,
  shield: ShieldCheck,
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-wide uppercase">
      {children}
    </span>
  )
}

/* ── Step 1 — Classification ─────────────────────────────────────────── */
export function ClassificationStep({ form, update }: StepProps) {
  const t = useTranslations("ProjectsNewProject")
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-content-primary text-base leading-6 font-semibold">
        {t("classificationQuestion")}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TYPES.map((type) => {
          const Icon = TYPE_ICON[type.icon]
          const selected = form.type === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => update({ type: type.id })}
              className={cn(
                "relative flex flex-col gap-2 rounded-xl border p-4 text-start transition-colors",
                selected
                  ? "border-brand-primary bg-brand-primary/[0.06]"
                  : "border-stroke-default hover:border-stroke-input bg-surface-white",
              )}
            >
              {selected && (
                <span className="bg-brand-primary absolute top-3 inset-e-3 flex size-5 items-center justify-center rounded-full text-white">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              )}
              <Icon
                className={cn(
                  "size-[18px]",
                  selected ? "text-brand-primary" : "text-content-tertiary",
                )}
                aria-hidden
              />
              <span className="text-content-primary text-sm leading-5 font-semibold">
                {t(type.labelKey)}
              </span>
              <span className="text-content-tertiary text-[12px] leading-[17px]">
                {t(type.descriptionKey)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("billingMethod")}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {BILLING_METHODS.map((method) => {
            const active = form.billingMethod === method
            return (
              <button
                key={method}
                type="button"
                onClick={() => update({ billingMethod: method })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[13px] leading-5 font-medium transition-colors",
                  active
                    ? "border-brand-primary bg-brand-primary/[0.06] text-brand-primary"
                    : "border-stroke-default text-content-tertiary hover:text-content-primary",
                )}
              >
                {t(BILLING_METHOD_KEY[method])}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Step 2 — Details ────────────────────────────────────────────────── */
export function DetailsStep({ form, update }: StepProps) {
  const t = useTranslations("ProjectsNewProject")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const fiscalYear = new Date().getFullYear()
  const employees = useEmployees({ per_page: 100 })
  const branches = useBranches({ per_page: 100, is_active: true })
  const costCenters = useCostCenters({ fiscal_year: fiscalYear, per_page: 100 })

  const employeeOptions = (employees.data?.data ?? []).map((e) => ({
    value: e.id,
    label: e.full_name,
  }))
  const branchOptions = (branches.data?.data ?? []).map((b) => ({
    value: b.id,
    label: b.branch_name,
  }))
  const costCenterOptions = (costCenters.data?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.cc_name} (${c.cc_code})`,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionLabel>{t("projectName")}</SectionLabel>
        <Input
          placeholder={t("projectNamePlaceholder")}
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-10 text-[13px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("projectCode")}</SectionLabel>
          <Input
            value={form.code}
            onChange={(e) => update({ code: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("priority")}</SectionLabel>
          <Select
            value={form.priority}
            onValueChange={(v) =>
              update({ priority: v as NewProjectForm["priority"] })
            }
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {tShared(`priority.${TASK_PRIORITY_KEY[p]}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionLabel>{tCommon("description")}</SectionLabel>
        <Textarea
          placeholder={t("descriptionPlaceholder")}
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          className="min-h-[96px] text-[13px]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("classification")}</SectionLabel>
          <Select
            value={form.classification}
            onValueChange={(v) =>
              update({ classification: v as NewProjectForm["classification"] })
            }
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strategic">{t("strategic")}</SelectItem>
              <SelectItem value="operational">{t("operational")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("roleProjectManager")}</SectionLabel>
          <Select
            value={form.managerId}
            onValueChange={(v) => update({ managerId: v })}
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue
                placeholder={
                  employees.isLoading ? tCommon("loading") : t("selectManager")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {employeeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("branch")}</SectionLabel>
          <Select
            value={form.branchId}
            onValueChange={(v) => update({ branchId: v })}
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue
                placeholder={
                  branches.isLoading ? tCommon("loading") : t("selectBranch")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("costCentre")}</SectionLabel>
          <Select
            value={form.costCentreId}
            onValueChange={(v) => update({ costCentreId: v })}
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue
                placeholder={
                  costCenters.isLoading
                    ? tCommon("loading")
                    : t("selectCostCentre")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {costCenterOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("currency")}</SectionLabel>
          <Input
            value={form.currencyCode}
            onChange={(e) =>
              update({ currencyCode: e.target.value.toUpperCase() })
            }
            maxLength={3}
            placeholder="EGP"
            className="h-10 text-[13px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("budgetAmount")}</SectionLabel>
          <Input
            type="number"
            min={0}
            value={form.budgetAmount}
            onChange={(e) => update({ budgetAmount: e.target.value })}
            placeholder="1500000"
            className="h-10 text-[13px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="np-start" className="contents">
            <SectionLabel>{t("startDate")}</SectionLabel>
          </Label>
          <Input
            id="np-start"
            type="date"
            value={form.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="np-end" className="contents">
            <SectionLabel>{t("targetEndDate")}</SectionLabel>
          </Label>
          <Input
            id="np-end"
            type="date"
            value={form.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
      </div>
    </div>
  )
}

/* ── Step 3 — Hierarchy ──────────────────────────────────────────────── */
export function HierarchyStep() {
  const t = useTranslations("ProjectsNewProject")
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>{t("wbsSkeleton")}</SectionLabel>
      <div className="border-stroke-default bg-surface-page flex flex-col gap-1 rounded-xl border p-3">
        {WBS_SKELETON.map((node) => (
          <div
            key={node.id}
            className="flex items-center gap-2.5 py-1.5"
            style={{ paddingInlineStart: node.indent * 24 }}
          >
            <span
              className={cn(
                "inline-flex h-5 items-center rounded-md px-1.5 text-[10px] leading-4 font-semibold",
                WBS_LEVEL_STYLE[node.level],
              )}
            >
              {node.level}
            </span>
            <span
              className={cn(
                "text-sm leading-5",
                node.level === "L3"
                  ? "text-content-secondary"
                  : "text-content-primary font-medium",
              )}
            >
              {t(node.labelKey)}
            </span>
          </div>
        ))}
        <button
          type="button"
          className="text-brand-primary hover:bg-brand-primary/[0.06] mt-1 w-fit rounded-lg px-2 py-1 text-[13px] leading-5 font-medium transition-colors"
        >
          {t("addPhase")}
        </button>
      </div>
    </div>
  )
}

/* ── Step 4 — Stakeholders ───────────────────────────────────────────── */
export function StakeholdersStep({ form, update }: StepProps) {
  const t = useTranslations("ProjectsNewProject")
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>{t("stakeholders")}</SectionLabel>
      <div className="flex flex-col gap-2">
        {STAKEHOLDER_ROLES.map((s) => {
          const notify = form.notify[s.id]
          return (
            <div
              key={s.id}
              className="border-stroke-default bg-surface-page flex items-center gap-3 rounded-xl border px-4 py-3"
            >
              <span className="text-content-secondary w-36 shrink-0 text-sm leading-5 font-medium">
                {t(s.roleKey)}
                {s.required && <span className="text-brand-danger">*</span>}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] leading-4 font-semibold",
                  STAKEHOLDER_AVATAR_STYLE[s.color],
                )}
                aria-hidden
              >
                {s.initials}
              </span>
              <span className="text-content-primary min-w-0 flex-1 truncate text-sm leading-5">
                {s.name ?? "—"}
              </span>
              <button
                type="button"
                onClick={() =>
                  update({ notify: { ...form.notify, [s.id]: !notify } })
                }
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] leading-[17px] font-medium transition-colors",
                  notify
                    ? "bg-brand-primary/12 text-brand-primary"
                    : "text-content-tertiary hover:text-content-primary",
                )}
                aria-pressed={notify}
              >
                {notify ? (
                  <Bell className="size-3.5" aria-hidden />
                ) : (
                  <BellOff className="size-3.5" aria-hidden />
                )}
                {t("notify")}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Step 5 — Calendar ───────────────────────────────────────────────── */
export function CalendarStep({ form, update }: StepProps) {
  const t = useTranslations("ProjectsNewProject")
  const toggleDay = (id: string) => {
    const next = form.workingDays.includes(id)
      ? form.workingDays.filter((d) => d !== id)
      : [...form.workingDays, id]
    update({ workingDays: next })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("calendarName")}</SectionLabel>
          <Input
            value={form.calendarName}
            onChange={(e) => update({ calendarName: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("timezone")}</SectionLabel>
          <Select
            value={form.timezone}
            onValueChange={(v) => update({ timezone: v })}
          >
            <SelectTrigger className="h-10 text-[13px]">
              <SelectValue placeholder={t("selectTimezone")} />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {t(tz.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("workingDays")}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {WORKING_DAYS.map((day) => {
            const active = form.workingDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-lg border px-3.5 py-1.5 text-[13px] leading-5 font-medium transition-colors",
                  active
                    ? "border-brand-primary bg-brand-primary/[0.06] text-brand-primary"
                    : "border-stroke-default text-content-tertiary hover:text-content-primary",
                )}
              >
                {t(`weekday.${day}`)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="np-sod" className="contents">
            <SectionLabel>{t("startOfDay")}</SectionLabel>
          </Label>
          <Input
            id="np-sod"
            type="time"
            value={form.startOfDay}
            onChange={(e) => update({ startOfDay: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="np-eod" className="contents">
            <SectionLabel>{t("endOfDay")}</SectionLabel>
          </Label>
          <Input
            id="np-eod"
            type="time"
            value={form.endOfDay}
            onChange={(e) => update({ endOfDay: e.target.value })}
            className="h-10 text-[13px]"
          />
        </div>
      </div>
    </div>
  )
}

/* ── Step 6 — Review ─────────────────────────────────────────────────── */
function ReviewCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: React.ReactNode }>
}) {
  return (
    <div className="border-stroke-default bg-surface-page rounded-xl border p-4">
      <h4 className="text-content-primary mb-2 text-[13px] leading-5 font-semibold tracking-wide uppercase">
        {title}
      </h4>
      <dl className="flex flex-col">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-stroke-light flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
          >
            <dt className="text-content-tertiary text-[13px] leading-5">
              {row.label}
            </dt>
            <dd className="text-content-primary text-[13px] leading-5 font-medium">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function formatDate(value: string, locale: string) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ReviewStep({ form }: StepProps) {
  const t = useTranslations("ProjectsNewProject")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const typeOption = PROJECT_TYPES.find((type) => type.id === form.type)
  const typeLabel = typeOption ? t(typeOption.labelKey) : "—"
  const workingDaysLabel = (() => {
    const ordered = WORKING_DAYS.filter((d) => form.workingDays.includes(d))
    if (ordered.length === 0) return "—"
    return t("range", {
      from: t(`weekday.${ordered[0]}`),
      to: t(`weekday.${ordered[ordered.length - 1]}`),
    })
  })()
  const pm = STAKEHOLDER_ROLES.find((s) => s.id === "pm")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReviewCard
          title={t("reviewProject")}
          rows={[
            { label: tCommon("name"), value: form.name || "—" },
            { label: t("reviewCode"), value: form.code },
            { label: tCommon("type"), value: typeLabel },
            {
              label: t("billingMethod"),
              value: t(BILLING_METHOD_KEY[form.billingMethod]),
            },
            {
              label: t("priority"),
              value: tShared(`priority.${TASK_PRIORITY_KEY[form.priority]}`),
            },
          ]}
        />
        <ReviewCard
          title={t("reviewSchedule")}
          rows={[
            { label: t("reviewStart"), value: formatDate(form.startDate, locale) },
            { label: t("reviewEnd"), value: formatDate(form.endDate, locale) },
            { label: t("reviewCalendar"), value: form.calendarName || "—" },
            { label: t("workingDays"), value: workingDaysLabel },
            {
              label: t("reviewHours"),
              value: t("range", { from: form.startOfDay, to: form.endOfDay }),
            },
          ]}
        />
      </div>

      <div className="border-stroke-default bg-surface-page rounded-xl border p-4">
        <h4 className="text-content-primary mb-2 text-[13px] leading-5 font-semibold tracking-wide uppercase">
          {t("stakeholders")}
        </h4>
        <dl className="flex flex-col">
          {STAKEHOLDER_ROLES.filter((s) => s.name).map((s) => (
            <div
              key={s.id}
              className="border-stroke-light flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
            >
              <dt className="text-content-tertiary text-[13px] leading-5">
                {t(s.roleKey)}
              </dt>
              <dd className="text-content-primary flex items-center gap-2 text-[13px] leading-5 font-medium">
                {s.name}
                {form.notify[s.id] && (
                  <span className="bg-brand-primary/12 text-brand-primary rounded px-1.5 py-0.5 text-[11px] leading-4 font-medium">
                    {t("notified")}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {pm && !form.name && (
        <p className="text-brand-warning text-[12px] leading-4">
          {t("nameRequiredHint")}
        </p>
      )}
    </div>
  )
}
