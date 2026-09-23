"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

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

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Actions" },
  { value: "insert", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "status_change", label: "Status Change" },
  { value: "login", label: "Login" },
  { value: "export", label: "Export" },
]

const MODULE_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Modules" },
  { value: "hr", label: "HR" },
  { value: "payroll", label: "Payroll" },
  { value: "recruitment", label: "Recruitment" },
  { value: "performance", label: "Performance" },
  { value: "leave", label: "Leave" },
  { value: "training", label: "Training" },
  { value: "benefits", label: "Benefits" },
  { value: "system", label: "System" },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditLogTab() {
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
            Filters:
          </span>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-40 rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
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
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isLoading && (
          <span className="text-content-tertiary text-xs leading-4">
            {total} entries
          </span>
        )}
      </div>

      {isLoading ? (
        <HrSectionSpinner />
      ) : days.length === 0 ? (
        <div className="border-stroke-default bg-surface-white text-content-tertiary flex h-40 items-center justify-center rounded-[14px] border text-sm">
          No audit entries match the current filters.
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
