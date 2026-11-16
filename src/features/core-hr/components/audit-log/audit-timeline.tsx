import {
  ArrowLeftRight,
  CheckCircle,
  Download,
  LogIn,
  Pencil,
  Plus,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

import type { AuditAction, AuditEntry } from "../../types/audit"

// ─── Action display config ───────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  AuditAction,
  { icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  INSERT: {
    icon: Plus,
    iconBg: "bg-brand-success/10",
    iconColor: "text-brand-success",
  },
  UPDATE: {
    icon: Pencil,
    iconBg: "bg-brand-primary/10",
    iconColor: "text-brand-primary",
  },
  DELETE: {
    icon: Trash2,
    iconBg: "bg-brand-danger/10",
    iconColor: "text-brand-danger",
  },
  STATUS_CHANGE: {
    icon: ArrowLeftRight,
    iconBg: "bg-brand-warning/10",
    iconColor: "text-brand-warning",
  },
  LOGIN: {
    icon: LogIn,
    iconBg: "bg-brand-info/10",
    iconColor: "text-brand-info",
  },
  APPROVE: {
    icon: CheckCircle,
    iconBg: "bg-brand-success/10",
    iconColor: "text-brand-success",
  },
  REJECT: {
    icon: XCircle,
    iconBg: "bg-brand-danger/10",
    iconColor: "text-brand-danger",
  },
  EXPORT: {
    icon: Download,
    iconBg: "bg-brand-info/10",
    iconColor: "text-brand-info",
  },
}

function getActionConfig(badge: string) {
  return ACTION_CONFIG[badge as AuditAction] ?? ACTION_CONFIG.UPDATE
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionBadge({ badge }: Readonly<{ badge: string }>) {
  const config = getActionConfig(badge)
  const Icon = config.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase",
        config.iconBg,
        config.iconColor,
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {badge}
    </span>
  )
}

function ModuleBadge({ badge }: Readonly<{ badge: string }>) {
  return (
    <span className="border-stroke-default bg-surface-hover text-content-secondary inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase">
      {badge}
    </span>
  )
}

function ChangeText({ entry }: Readonly<{ entry: AuditEntry }>) {
  if (entry.field_changed && entry.old_value != null && entry.new_value != null) {
    return (
      <p className="text-content-primary text-sm leading-5">
        <span className="font-semibold">{entry.field_changed}</span>
        <span> changed from </span>
        <span className="text-brand-danger font-medium line-through">
          {entry.old_value}
        </span>
        <span> to </span>
        <span className="text-brand-success font-semibold">
          {entry.new_value}
        </span>
      </p>
    )
  }
  return (
    <p className="text-content-primary text-sm leading-5 font-medium">
      {entry.description}
    </p>
  )
}

function AuditMetaLine({ entry }: Readonly<{ entry: AuditEntry }>) {
  if (!entry.employee_name && !entry.changed_by_name) return null

  return (
    <p className="text-content-tertiary text-xs leading-4">
      {entry.employee_name && (
        <>
          Employee:{" "}
          <span className="text-content-primary font-medium">
            {entry.employee_name}
            {entry.employee_number && ` (${entry.employee_number})`}
          </span>
        </>
      )}
      {entry.employee_name && entry.changed_by_name && " · "}
      {entry.changed_by_name && (
        <>
          By:{" "}
          <span className="text-content-primary font-medium">
            {entry.changed_by_name}
          </span>
        </>
      )}
    </p>
  )
}

function AuditEntryCard({ entry }: Readonly<{ entry: AuditEntry }>) {
  return (
    <article className="bg-surface-page border-stroke-default flex flex-col gap-2 rounded-[12px] border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ActionBadge badge={entry.action_badge} />
        <ModuleBadge badge={entry.module_badge} />
        <span className="text-content-tertiary ms-auto text-xs leading-4">
          {entry.time_label}
        </span>
      </div>
      <ChangeText entry={entry} />
      <AuditMetaLine entry={entry} />
    </article>
  )
}

export function AuditDayGroup({
  label,
  entries,
}: Readonly<{ label: string; entries: AuditEntry[] }>) {
  return (
    <section className="bg-surface-page border-stroke-default rounded-[14px] border p-4">
      <p className="text-content-tertiary mb-4 text-sm leading-5">{label}</p>
      <ol className="relative flex flex-col gap-3 ps-2">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1
          const config = getActionConfig(entry.action_badge)
          const Icon = config.icon
          return (
            <li key={entry.id} className="relative flex items-start gap-4">
              {!isLast && (
                <span
                  aria-hidden
                  className="bg-stroke-default absolute top-9 inset-s-3.75 h-[calc(100%-12px)] w-px"
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                  config.iconBg,
                  config.iconColor,
                )}
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <AuditEntryCard entry={entry} />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
