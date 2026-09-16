"use client"

import { useState } from "react"
import { Download, Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

import { SALES_KPIS } from "../data/sales-mock"

import { NewDealDialog } from "./new-deal-dialog"
import { SalesKanban } from "./sales-kanban"
import { SalesKpiCard } from "./sales-kpi-card"
import { SalesTable } from "./sales-table"

type SalesView = "kanban" | "table"

const VIEW_LABEL: Record<SalesView, string> = {
  kanban: "Kanban",
  table: "Table",
}

function ViewToggle({
  value,
  onChange,
}: {
  value: SalesView
  onChange: (view: SalesView) => void
}) {
  return (
    <div className="bg-surface-white border-stroke-default flex h-9 items-center gap-0.5 rounded-xl border p-1">
      {(Object.keys(VIEW_LABEL) as SalesView[]).map((view) => {
        const isActive = view === value
        return (
          <button
            key={view}
            type="button"
            onClick={() => onChange(view)}
            className={cn(
              "flex h-[26px] items-center justify-center rounded-lg px-3 text-[11px] leading-[15.4px] font-medium transition-colors",
              isActive
                ? "bg-surface-page text-content-primary shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                : "text-content-tertiary hover:text-content-primary",
            )}
          >
            {VIEW_LABEL[view]}
          </button>
        )
      })}
    </div>
  )
}

export function SalesPipelineView() {
  const [view, setView] = useState<SalesView>("kanban")
  const [newDealOpen, setNewDealOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
          Sales Pipeline
        </h1>
        <p className="text-content-tertiary text-sm leading-5">
          Track deals across every stage from prospecting to close.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SALES_KPIS.map((kpi) => (
          <SalesKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={() => setNewDealOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            New Deal
          </Button>
          <Button variant="secondary" className="h-9 gap-2 px-3 text-[12px]">
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </section>

      <section>{view === "kanban" ? <SalesKanban /> : <SalesTable />}</section>

      <NewDealDialog open={newDealOpen} onOpenChange={setNewDealOpen} />
    </div>
  )
}
