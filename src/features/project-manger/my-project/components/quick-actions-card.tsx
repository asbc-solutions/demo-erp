import {
  Clock,
  FileText,
  type LucideIcon,
  Receipt,
  RefreshCw,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"

export type QuickActionId =
  | "log-time"
  | "submit-report"
  | "update-status"
  | "file-expense"

type QuickAction = {
  id: QuickActionId
  label: string
  icon: "clock" | "file" | "refresh" | "receipt"
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "log-time", label: "Log time", icon: "clock" },
  { id: "submit-report", label: "Submit report", icon: "file" },
  { id: "update-status", label: "Update status", icon: "refresh" },
  { id: "file-expense", label: "File expense", icon: "receipt" },
]

const ICON_MAP: Record<QuickAction["icon"], LucideIcon> = {
  clock: Clock,
  file: FileText,
  refresh: RefreshCw,
  receipt: Receipt,
}

export function QuickActionsCard({
  onAction,
}: {
  onAction: (id: QuickActionId) => void
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default border-b px-5 py-3.5">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ICON_MAP[action.icon]
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.id)}
              className="border-stroke-default hover:border-brand-primary/40 hover:bg-surface-hover flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors"
            >
              <Icon className="text-content-tertiary size-4 shrink-0" aria-hidden />
              <span className="text-content-primary text-[13px] leading-5 font-medium">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
