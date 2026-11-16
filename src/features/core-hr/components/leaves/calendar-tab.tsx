"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { usePendingLeaveRequests, useLeaveTypes } from "../../lib/queries/leave"
import type { LeaveType } from "../../lib/types"
import {
  getLeaveCategoryStyle,
  LEAVE_CATEGORY_LABELS,
} from "../../lib/utils/leave-style"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// Week starts on Monday to match the design.
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type CalendarEvent = {
  id: string
  name: string
  category?: string
  colorHex?: string
  department?: string
  start: Date
  end: Date
}

function toDateOnly(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function CalendarTab() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [deptFilter, setDeptFilter] = useState("all")

  const { data: pendingData, isLoading } = usePendingLeaveRequests({
    per_page: 100,
  })
  const { data: typesData } = useLeaveTypes()

  const typeMap = useMemo(
    () => new Map((typesData?.data ?? []).map((t) => [t.id, t])),
    [typesData],
  )

  const events: CalendarEvent[] = useMemo(() => {
    const requests = pendingData?.data ?? []
    return requests.map((req) => {
      const type: LeaveType | undefined =
        req.leave_type ?? typeMap.get(req.leave_type_id)
      return {
        id: req.id,
        name: req.employee?.full_name ?? "Employee",
        category: type?.category,
        colorHex: type?.color_hex,
        department: req.employee?.department_name,
        start: toDateOnly(req.start_date),
        end: toDateOnly(req.end_date),
      }
    })
  }, [pendingData, typeMap])

  const departments = useMemo(() => {
    const set = new Set<string>()
    events.forEach((e) => e.department && set.add(e.department))
    return Array.from(set).sort()
  }, [events])

  const legendCategories = useMemo(() => {
    const set = new Set<string>()
    events.forEach((e) => e.category && set.add(e.category))
    return Array.from(set)
  }, [events])

  const filteredEvents =
    deptFilter === "all"
      ? events
      : events.filter((e) => e.department === deptFilter)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-based leading blank count.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const eventsForDay = (day: number) => {
    const cellDate = new Date(year, month, day)
    return filteredEvents.filter(
      (e) => cellDate >= e.start && cellDate <= e.end,
    )
  }

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-stroke-default bg-surface-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="flex size-8 items-center justify-center rounded-[8px] text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex size-8 items-center justify-center rounded-[8px] text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content-primary"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-7 text-content-primary">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-sm text-content-tertiary">
              Team leave calendar view
            </p>
          </div>
        </div>

        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="h-9 w-[180px] rounded-[10px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      {legendCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1">
          {legendCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 text-xs text-content-tertiary"
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  getLeaveCategoryStyle(cat).dotClass,
                )}
              />
              {LEAVE_CATEGORY_LABELS[
                cat as keyof typeof LEAVE_CATEGORY_LABELS
              ] ?? cat}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      {isLoading ? (
        <Skeleton className="h-[520px] rounded-[14px]" />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-stroke-default bg-surface-white">
          <div className="grid grid-cols-7 border-b border-stroke-default bg-surface-page">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-medium text-content-tertiary"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayEvents = day ? eventsForDay(day) : []
              const showMax = 3
              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[110px] border-b border-e border-stroke-default p-2 last:border-e-0",
                    idx % 7 === 6 && "border-e-0",
                    !day && "bg-surface-page",
                  )}
                >
                  {day && (
                    <>
                      <span
                        className={cn(
                          "mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday(day)
                            ? "bg-brand-primary text-white"
                            : "text-content-secondary",
                        )}
                      >
                        {day}
                      </span>
                      <div className="flex flex-col gap-1">
                        {dayEvents.slice(0, showMax).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "truncate rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium leading-4 text-white",
                              !event.colorHex &&
                                getLeaveCategoryStyle(event.category).dotClass,
                            )}
                            style={
                              event.colorHex
                                ? { backgroundColor: event.colorHex }
                                : undefined
                            }
                            title={event.name}
                          >
                            {event.name.split(" ")[0]}
                          </div>
                        ))}
                        {dayEvents.length > showMax && (
                          <span className="px-1 text-[10px] text-content-quaternary">
                            +{dayEvents.length - showMax} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="px-1 text-xs text-content-quaternary">
        Showing pending team leave requests. Approved team-wide leave will appear
        here once a team calendar endpoint is available.
      </p>
    </div>
  )
}
