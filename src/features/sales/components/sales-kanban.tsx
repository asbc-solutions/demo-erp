 "use client"

import { useState } from "react"

import { cn } from "@/src/shared/lib/utils/utils"

import {
  SALES_DEALS,
  SALES_STAGES,
  STAGE_ACCENT,
  type SalesDeal,
  type SalesStage,
} from "../data/sales-mock"

import { DealCard } from "./deal-card"

const formatAmount = (value: number) => `$${value.toLocaleString("en-US")}`

function StageColumn({
  stage,
  deals,
  activeDropStage,
  draggingDealId,
  onCardDragStart,
  onCardDragEnd,
  onStageDragOver,
  onStageDrop,
}: {
  stage: SalesStage
  deals: SalesDeal[]
  activeDropStage: SalesStage | null
  draggingDealId: string | null
  onCardDragStart: (dealId: string) => void
  onCardDragEnd: () => void
  onStageDragOver: (stage: SalesStage | null) => void
  onStageDrop: (stage: SalesStage) => void
}) {
  const accent = STAGE_ACCENT[stage]
  const total = deals.reduce((sum, deal) => sum + deal.amount, 0)
  const isDropActive = activeDropStage === stage

  return (
    <div
      className={cn(
        "flex min-w-[180px] flex-1 flex-col rounded-2xl transition-colors",
        isDropActive && "bg-brand-primary/5",
      )}
      onDragOver={(event) => {
        event.preventDefault()
        onStageDragOver(stage)
      }}
      onDrop={(event) => {
        event.preventDefault()
        onStageDrop(stage)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onStageDragOver(null)
        }
      }}
    >
      <div
        className={cn(
          "h-0.5 rounded-t-xl border-t-[1.6px]",
          accent.rail,
        )}
        aria-hidden
      />

      <div className="flex items-center gap-2 px-1 pt-2">
        <span className={cn("size-2 rounded-full", accent.dot)} aria-hidden />
        <span className="text-[12px] leading-[18px] font-medium text-content-primary">
          {stage}
        </span>
        <span className="bg-[#f4f4f5] border-stroke-default flex items-center justify-center rounded-lg border px-1.5 py-px text-[10px] leading-[15px] font-medium text-content-quaternary">
          {deals.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-3">
        {deals.length === 0 ? (
          <div className="border-stroke-default flex h-[88px] items-center justify-center rounded-2xl border border-dashed text-[12px] leading-[18px] text-content-quaternary">
            No deals — drop here
          </div>
        ) : (
          deals.map((deal) => (
            <div
              key={deal.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", deal.id)
                event.dataTransfer.effectAllowed = "move"
                onCardDragStart(deal.id)
              }}
              onDragEnd={onCardDragEnd}
              className={cn(
                "cursor-grab active:cursor-grabbing",
                draggingDealId === deal.id && "opacity-60",
              )}
            >
              <DealCard deal={deal} />
            </div>
          ))
        )}
      </div>

      <div className="px-1 pt-2">
        <p className="text-[11px] leading-[15.4px] text-content-quaternary">
          {formatAmount(total)}
        </p>
      </div>
    </div>
  )
}

export function SalesKanban() {
  const [deals, setDeals] = useState(SALES_DEALS)
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null)
  const [activeDropStage, setActiveDropStage] = useState<SalesStage | null>(null)

  const handleDrop = (stage: SalesStage) => {
    if (!draggingDealId) return

    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.id === draggingDealId ? { ...deal, stage } : deal,
      ),
    )

    setDraggingDealId(null)
    setActiveDropStage(null)
  }

  return (
    <div className="flex w-full items-start gap-4 overflow-x-auto pb-4">
      {SALES_STAGES.map((stage) => (
        <StageColumn
          key={stage}
          stage={stage}
          deals={deals.filter((deal) => deal.stage === stage)}
          activeDropStage={activeDropStage}
          draggingDealId={draggingDealId}
          onCardDragStart={setDraggingDealId}
          onCardDragEnd={() => {
            setDraggingDealId(null)
            setActiveDropStage(null)
          }}
          onStageDragOver={setActiveDropStage}
          onStageDrop={handleDrop}
        />
      ))}
    </div>
  )
}
