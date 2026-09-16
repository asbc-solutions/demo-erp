import { DollarSign } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { PROJECT_STATUS_STYLE } from "../data/operations-mock"
import type { ProjectListItem } from "../lib/types"
import { formatCurrencyAmount, formatDate, getInitials } from "../lib/utils/format"

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Card
      variant="elevated"
      className="gap-4 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-content-primary text-base leading-5 font-medium">
          {project.name}
        </h3>
        <span
          className={cn(
            "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] leading-[15.4px] font-medium",
            PROJECT_STATUS_STYLE[project.status],
          )}
        >
          {project.status_label}
        </span>
      </div>

      <p className="text-content-tertiary text-[12px] leading-[18px]">
        {project.description || "No description provided."}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] leading-[15.4px] text-content-tertiary">
            Progress
          </span>
          <span className="text-content-primary text-[11px] leading-[15.4px] font-medium">
            {project.progress_pct}%
          </span>
        </div>
        <div className="bg-[#f4f4f5] h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-brand-primary h-full rounded-full transition-all"
            style={{ width: `${project.progress_pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <DollarSign className="size-3.5 text-content-tertiary" aria-hidden />
          <span className="text-[11px] leading-[15.4px] text-content-tertiary tabular-nums">
            {formatCurrencyAmount(project.spent_amount, project.currency_code)} /{" "}
            {formatCurrencyAmount(project.budget_amount, project.currency_code)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {project.lead ? (
            <div className="flex items-center gap-1.5">
              <span className="bg-brand-primary flex size-5 items-center justify-center rounded-full text-[9px] leading-[12.6px] text-white">
                {getInitials(project.lead.name)}
              </span>
              <span className="text-[11px] leading-[15.4px] text-content-tertiary">
                {project.lead.name}
              </span>
            </div>
          ) : (
            <span className="text-[11px] leading-[15.4px] text-content-tertiary">
              Unassigned
            </span>
          )}
          {project.end_date ? (
            <span className="text-[11px] leading-[15.4px] text-content-tertiary">
              {formatDate(project.end_date)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
