"use client"

import { useMemo } from "react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { usePendingLeaveRequests, useLeaveTypes } from "../../lib/queries/leave"
import type { LeaveType } from "../../lib/types"

type TeamRow = {
  id: string
  name: string
  department?: string
  annualPending: number
  totalPending: number
}

function TeamTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="pl-6">
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </TableCell>
          {Array.from({ length: 5 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-12" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}

export function TeamOverviewTab() {
  const { data: pendingData, isLoading } = usePendingLeaveRequests({
    per_page: 100,
  })
  const { data: typesData } = useLeaveTypes()

  const rows: TeamRow[] = useMemo(() => {
    const typeMap = new Map(
      (typesData?.data ?? []).map((t) => [t.id, t] as const),
    )
    const requests = pendingData?.data ?? []
    const byEmployee = new Map<string, TeamRow>()

    for (const req of requests) {
      const key = req.employee?.id ?? req.employee_id ?? req.id
      const type: LeaveType | undefined =
        req.leave_type ?? typeMap.get(req.leave_type_id)
      const existing =
        byEmployee.get(key) ??
        ({
          id: key,
          name: req.employee?.full_name ?? "Employee",
          department: req.employee?.department_name,
          annualPending: 0,
          totalPending: 0,
        } satisfies TeamRow)

      existing.totalPending += req.working_days ?? 0
      if (type?.category === "annual") {
        existing.annualPending += req.working_days ?? 0
      }
      byEmployee.set(key, existing)
    }

    return Array.from(byEmployee.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }, [pendingData, typesData])

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[14px] border border-stroke-default bg-surface-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-1 border-b border-stroke-default px-6 py-4">
          <h2 className="text-lg font-semibold text-content-primary">
            Team Leave Overview
          </h2>
          <p className="text-sm text-content-tertiary">
            Leave usage across all team members.
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Employee</TableHead>
              <TableHead>Annual Available</TableHead>
              <TableHead>Annual Used</TableHead>
              <TableHead>Annual Pending</TableHead>
              <TableHead>Sick Used</TableHead>
              <TableHead className="pr-6">Total Days</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TeamTableSkeleton />
          ) : (
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-sm text-content-tertiary"
                  >
                    No pending team leave to display.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-stroke-default hover:bg-surface-hover/50"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          alt={row.name}
                          color="neutral"
                          className="shrink-0"
                        />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-content-primary">
                            {row.name}
                          </span>
                          {row.department && (
                            <span className="truncate text-xs text-content-tertiary">
                              {row.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-content-quaternary">
                      —
                    </TableCell>
                    <TableCell className="text-sm text-content-quaternary">
                      —
                    </TableCell>
                    <TableCell>
                      {row.annualPending > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-md bg-brand-warning/12 px-2 py-0.5 text-xs font-medium tabular-nums text-brand-warning">
                          {row.annualPending}
                        </span>
                      ) : (
                        <span className="text-sm text-content-quaternary">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-content-quaternary">
                      —
                    </TableCell>
                    <TableCell
                      className={cn(
                        "pr-6 text-sm font-semibold tabular-nums",
                        row.totalPending > 0
                          ? "text-content-primary"
                          : "text-content-quaternary",
                      )}
                    >
                      {row.totalPending}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          )}
        </Table>
      </div>

      <p className="px-1 text-xs text-content-quaternary">
        Pending figures are derived from the manager approval queue. Annual
        available / used and sick used totals require a bulk team-balances
        endpoint that isn&apos;t exposed by the API yet.
      </p>
    </div>
  )
}
