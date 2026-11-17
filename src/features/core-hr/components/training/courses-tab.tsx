"use client"

import { useState } from "react"
import { BookOpen, Building2, Clock, Monitor, Search, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
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

import { useCourses } from "../../lib/queries/training"
import type { DeliveryIconKey } from "./training-format"
import { categoryBadge, deliveryFormat } from "./training-format"

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS = [
  { id: "all", labelKey: "category.all" },
  { id: "technical", labelKey: "category.technical" },
  { id: "leadership", labelKey: "category.leadership" },
  { id: "management", labelKey: "category.management" },
  { id: "compliance", labelKey: "category.compliance" },
  { id: "soft_skills", labelKey: "category.soft_skills" },
] as const

const DELIVERY_ICON: Record<DeliveryIconKey, React.ReactNode> = {
  online: <Monitor strokeWidth={1.75} />,
  hybrid: <Sparkles strokeWidth={1.75} />,
  classroom: <Building2 strokeWidth={1.75} />,
}

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CoursesTab() {
  const t = useTranslations("HrTraining")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const { data, isLoading, isError } = useCourses({ per_page: 100 })
  const courses = data?.data ?? []

  const filtered = courses.filter((c) => {
    if (category !== "all" && c.category?.toLowerCase() !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.course_name.toLowerCase().includes(q) ||
        (c.program_name?.toLowerCase().includes(q) ?? false) ||
        c.course_code.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-96">
          <Search
            className="absolute top-1/2 inset-s-3 size-4 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchCourses")}
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((f) => {
            const active = category === f.id
            return (
              <Button
                key={f.id}
                type="button"
                variant={active ? "primary" : "secondary"}
                size="sm"
                onClick={() => setCategory(f.id)}
              >
                {t(f.labelKey)}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Table card */}
      <Card variant="elevated" className="gap-0">
        <div className="flex flex-col gap-1 p-6">
          <h3 className="text-lg leading-7 font-semibold text-content-primary">
            {t("tabCourses")}
          </h3>
          <p className="text-sm leading-5 text-content-tertiary">
            {t("coursesAvailable", { count: courses.length })}
          </p>
        </div>

        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t("colCourse")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colProgramme")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colCategory")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colDuration")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colFormat")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && (isError || filtered.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-content-tertiary"
                  >
                    {isError
                      ? t("coursesLoadError")
                      : t("coursesEmpty")}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((course) => {
                  const cat = categoryBadge(course.category, t)
                  const fmt = deliveryFormat(course.delivery_mode, t)
                  return (
                    <TableRow key={course.course_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-hover text-content-tertiary">
                            <BookOpen className="size-4" strokeWidth={1.75} />
                          </span>
                          <span className="text-sm font-medium text-content-primary">
                            {course.course_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-content-tertiary">
                        {course.program_name ?? course.course_code}
                      </TableCell>
                      <TableCell>
                        <Badge className={cat.className}>{cat.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-content-secondary">
                          <Clock
                            className="size-3.5 text-content-quaternary"
                            strokeWidth={1.75}
                          />
                          {t("hoursShort", { hours: course.duration_hours })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", fmt.className)}>
                          {DELIVERY_ICON[fmt.icon]}
                          {fmt.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.is_active ? "success" : "neutral"}>
                          {course.is_active ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
