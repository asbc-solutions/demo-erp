"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { useAuditLog } from "../../lib/queries/audit-log"
import { HrSectionSpinner } from "../shared/hr-loading"
import { AuditDayGroup } from "./audit-timeline"

// ─── Filters ─────────────────────────────────────────────────────────────────

const ACTION_FILTERS = [
  { value: "ALL", labelKey: "allActions" },
  { value: "insert", labelKey: "action.INSERT" },
  { value: "update", labelKey: "action.UPDATE" },
  { value: "delete", labelKey: "action.DELETE" },
  { value: "approve", labelKey: "action.APPROVE" },
  { value: "reject", labelKey: "action.REJECT" },
  { value: "status_change", labelKey: "action.STATUS_CHANGE" },
  { value: "login", labelKey: "action.LOGIN" },
  { value: "export", labelKey: "action.EXPORT" },
] as const

const MODULE_FILTERS = [
  { value: "ALL", labelKey: "allModules" },
  { value: "hr", labelKey: "module.hr" },
  { value: "payroll", labelKey: "module.payroll" },
  { value: "recruitment", labelKey: "module.recruitment" },
  { value: "performance", labelKey: "module.performance" },
  { value: "leave", labelKey: "module.leave" },
  { value: "training", labelKey: "module.training" },
  { value: "benefits", labelKey: "module.benefits" },
  { value: "system", labelKey: "module.system" },
] as const

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditLogTab() {
  const t = useTranslations("HrAuditLog")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [moduleFilter, setModuleFilter] = useState("ALL")

  const { data, isLoading } = useAuditLog({
    per_page: 50,
    action_type: actionFilter === "ALL" ? undefined : actionFilter,
    module_name: moduleFilter === "ALL" ? undefined : moduleFilter,
  })

  const days = (data?.days ?? []).filter((d) => Array.isArray(d?.entries))
  const total = data?.meta?.total_entries ?? days.reduce((sum, d) => sum + d.entries.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="border-stroke-default bg-surface-white flex flex-wrap items-center justify-between gap-3 rounded-[14px] border px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-content-secondary inline-flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="size-4" strokeWidth={1.75} />
            {t("filtersLabel")}
          </span>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-40 rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="h-9 w-40 rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULE_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isLoading && (
          <span className="text-content-tertiary text-xs leading-4">
            {t("entriesCount", { count: total })}
          </span>
        )}
      </div>

      {isLoading ? (
        <HrSectionSpinner />
      ) : days.length === 0 ? (
        <div className="border-stroke-default bg-surface-white text-content-tertiary flex h-40 items-center justify-center rounded-[14px] border text-sm">
          {t("empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((day) => (
            <AuditDayGroup
              key={day.date}
              label={day.date_label}
              entries={day.entries}
            />
          ))}
        </div>
      )}
    </div>
  )
}
