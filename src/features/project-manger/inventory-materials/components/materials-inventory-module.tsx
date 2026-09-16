"use client"

import { useState } from "react"
import {
  BadgeDollarSign,
  CheckCircle2,
  Flag,
  Package,
  type LucideIcon,
} from "lucide-react"

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
    border: "border-l-brand-primary",
    tile: "bg-brand-primary/10 text-brand-primary",
  },
  emerald: {
    border: "border-l-brand-success",
    tile: "bg-brand-success/10 text-brand-success",
  },
  amber: {
    border: "border-l-brand-warning",
    tile: "bg-brand-warning/10 text-brand-warning",
  },
  violet: {
    border: "border-l-violet-500",
    tile: "bg-violet-500/10 text-violet-500",
  },
}

const TABS: { id: MaterialTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reserved", label: "Reserved" },
  { id: "issued", label: "Issued" },
  { id: "pending_procurement", label: "Pending Procurement" },
]

export function MaterialsInventoryModule() {
  // Summary cards are portfolio-wide; the detail table is scoped to a project.
  const summaryQuery = useInventorySummary()
  const stats = buildInventoryStats(summaryQuery.data)

  const { projects, projectId, setProjectId, isLoading: projectsLoading } =
    useProjectScope()
  const [tab, setTab] = useState<MaterialTab>("all")

  const materialsQuery = useProjectMaterials(projectId ?? "", tab)
  const rows = (materialsQuery.data ?? []).map(mapMaterialRow)

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
            Materials &amp; Inventory
          </h1>
          <p className="text-content-tertiary text-sm">
            Portfolio stock, reservations, goods issues, and procurement
          </p>
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
          return (
            <Card
              key={stat.id}
              variant="elevated"
              className={cn(
                "flex-row items-center gap-3 border-l-4 p-4",
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
                  {stat.label}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold">
                  {summaryQuery.isLoading ? "…" : stat.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {stat.caption}
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
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-3 text-[13px] font-medium transition-colors",
                tab === item.id
                  ? "border-brand-primary text-brand-primary"
                  : "text-content-tertiary hover:text-content-primary border-transparent",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>WBS</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Stock Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!projectId ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Select a project to view its material reservations.
                </TableCell>
              </TableRow>
            ) : materialsQuery.isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Loading materials…
                </TableCell>
              </TableRow>
            ) : materialsQuery.isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  Couldn&apos;t load materials.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  className="text-content-tertiary py-10 text-center text-sm"
                >
                  No materials in this view.
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
                    <Badge variant={m.statusTone}>{m.statusLabel}</Badge>
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
