"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { useComplianceAuditLog } from "../lib/queries/audit"
import type { AuditStatus } from "../lib/types/audit"
import { ComplianceErrorState } from "./shared/compliance-error-state"
import { CompliancePageSpinner } from "./shared/compliance-loading"
import { ComplianceTablePagination } from "./shared/compliance-table-pagination"

const PAGE_SIZE = 20

const MODULE_FILTERS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "All modules", value: "all" },
  { label: "HR", value: "hr" },
  { label: "Finance", value: "finance" },
  { label: "Compliance", value: "compliance" },
  { label: "Sales", value: "sales" },
  { label: "Settings", value: "settings" },
]

const STATUS_ICON: Record<AuditStatus, typeof CheckCircle2> = {
  success: CheckCircle2,
  failure: AlertTriangle,
  warning: Clock3,
}

const STATUS_CLASS: Record<AuditStatus, string> = {
  success: "bg-brand-success/10 text-brand-success",
  failure: "bg-brand-danger/10 text-brand-danger",
  warning: "bg-brand-warning/10 text-brand-warning",
}

export function AuditTab() {
  const [moduleFilter, setModuleFilter] = useState("all")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useComplianceAuditLog({
    module_name: moduleFilter === "all" ? undefined : moduleFilter,
    page,
    per_page: PAGE_SIZE,
  })

  const events = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={moduleFilter}
          onValueChange={(value) => {
            setModuleFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_FILTERS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CompliancePageSpinner />
      ) : isError ? (
        <ComplianceErrorState message="Failed to load the audit log." onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="space-y-2">
            {events.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-content-tertiary text-sm">No audit events for this filter.</p>
              </Card>
            ) : (
              events.map((event) => {
                const Icon = STATUS_ICON[event.status]
                return (
                  <Card key={event.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                          STATUS_CLASS[event.status],
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-content-primary text-sm font-medium">
                          {event.actor} · {event.action_label}
                        </p>
                        <p className="text-content-tertiary text-xs">{event.description}</p>
                        <p className="text-content-quaternary text-xs">
                          {event.module_label} / {event.subject} · {event.ip ?? "—"} ·{" "}
                          {event.when}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
          {meta ? (
            <ComplianceTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="events"
            />
          ) : null}
        </>
      )}
    </div>
  )
}
