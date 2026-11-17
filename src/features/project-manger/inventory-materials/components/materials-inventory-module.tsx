"use client"

import { useState } from "react"
import {
  BadgeDollarSign,
  CheckCircle2,
  Flag,
  Package,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  ProjectScopeBar,
  useProjectScope,
} from "../../components/project-scoped-view"
import {
  buildInventoryStats,
  mapMaterialRow,
  type InventoryStat,
} from "../../lib/mappers/inventory-mapper"
import {
  useInventorySummary,
  useProjectMaterials,
} from "../../lib/queries/inventory"
import type { MaterialTab } from "../../lib/types"

const STAT_ICON: Record<InventoryStat["icon"], LucideIcon> = {
  package: Package,
  check: CheckCircle2,
  flag: Flag,
  dollar: BadgeDollarSign,
}

const STAT_ACCENT: Record<
  InventoryStat["accent"],
  { border: string; tile: string }
> = {
  indigo: {
    border: "border-s-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-s-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-s-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-s-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

type InventoryStatId = "total" | "reserved-value" | "issued-value" | "pending"

const TABS = [
  "all",
  "reserved",
  "issued",
  "pending_procurement",
] as const satisfies readonly MaterialTab[]

export function MaterialsInventoryModule() {
  const t = useTranslations("ProjectsInventory")
  const tCommon = useTranslations("Common")

  // Summary cards are portfolio-wide; the detail table is scoped to a project.
  const summaryQuery = useInventorySummary()
  const stats = buildInventoryStats(summaryQuery.data)
  const summary = summaryQuery.data

  const statCaption = (id: InventoryStatId): string => {
    switch (id) {
      case "total":
        return summary
          ? t("statCaption.total", {
              reserved: summary.reserved_count,
              issued: summary.issued_count,
            })
          : ""
      case "reserved-value":
        return t("statCaption.reservedValue")
      case "issued-value":
        return t("statCaption.issuedValue")
      case "pending":
        return summary
          ? t("statCaption.pending", { count: summary.late_sku_count })
          : ""
    }
  }

  const statLabel = (id: InventoryStatId): string => {
    switch (id) {
      case "total":
        return t("statLabel.total")
      case "reserved-value":
        return t("statLabel.reservedValue")
      case "issued-value":
        return t("statLabel.issuedValue")
      case "pending":
        return t("statLabel.pending")
    }
  }

  const { projects, projectId, setProjectId, isLoading: projectsLoading } =
    useProjectScope()
  const [tab, setTab] = useState<MaterialTab>("all")

  const materialsQuery = useProjectMaterials(projectId ?? "", tab)
  const rows = (materialsQuery.data ?? []).map((item) => ({
    ...mapMaterialRow(item),
    status: item.status,
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-content-tertiary text-sm">{t("subtitle")}</p>
        </div>
        <ProjectScopeBar
          projects={projects}
          projectId={projectId}
          onChange={setProjectId}
          isLoading={projectsLoading}
        />
      </header>

      {/* portfolio summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = STAT_ICON[stat.icon]
          const accent = STAT_ACCENT[stat.accent]
          const statId = stat.id as InventoryStatId
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-s-4 p-4",
                accent.border,
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  accent.tile,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                  {statLabel(statId)}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {summaryQuery.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {statCaption(statId)}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      {/* per-project material reservations */}
      <Card className="overflow-hidden p-0">
        <div className="border-stroke-default flex flex-wrap items-center gap-1 border-b px-4">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "-mb-px border-b-2 px-3 py-3 text-[13px] font-medium transition-colors",
                tab === item
                  ? "border-brand-primary text-brand-primary"
                  : "text-content-tertiary hover:text-content-primary border-transparent",
              )}
            >
              {t(`tab.${item}`)}
            </button>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("colCode")}</TableHead>
              <TableHead>{tCommon("description")}</TableHead>
              <TableHead>{t("colWbs")}</TableHead>
              <TableHead>{t("colReserved")}</TableHead>
              <TableHead>{t("colIssued")}</TableHead>
              <TableHead>{t("colStockType")}</TableHead>
              <TableHead>{t("colLocation")}</TableHead>
              <TableHead>{t("colUnitCost")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!projectId ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("selectProject")}
                </TableCell>
              </TableRow>
            ) : materialsQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : materialsQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("loadError")}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-content-tertiary font-mono text-[12px]">
                    {m.code}
                  </TableCell>
                  <TableCell className="text-content-primary text-[13px] font-medium">
                    {m.name}
                  </TableCell>
                  <TableCell className="text-content-tertiary font-mono text-[12px]">
                    {m.wbs}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px] tabular-nums">
                    {m.reserved}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px] tabular-nums">
                    {m.issued}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.isProjectStock ? "primary" : "neutral"}>
                      {m.stockType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {m.location}
                  </TableCell>
                  <TableCell className="text-content-primary text-[13px] font-semibold tabular-nums">
                    {m.unitCost}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.statusTone}>
                      {t(`reservationStatus.${m.status}`)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
