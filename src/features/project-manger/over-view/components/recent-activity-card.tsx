"use client"

import {
  CheckCircle2,
  FileText,
  MessageSquare,
  Receipt,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { useMyActivity } from "../../lib/queries/my-work"
import type { MyActivityKind } from "../../lib/types"

const KIND_STYLE: Record<MyActivityKind, { icon: LucideIcon; tile: string }> = {
  task_completed: {
    icon: CheckCircle2,
    tile: "bg-brand-success/12 text-brand-success",
  },
  mention: {
    icon: MessageSquare,
    tile: "bg-brand-info/12 text-brand-info",
  },
  invoice: {
    icon: Receipt,
    tile: "bg-brand-primary/12 text-brand-primary",
  },
  document: {
    icon: FileText,
    tile: "bg-brand-success/12 text-brand-success",
  },
  risk: {
    icon: TriangleAlert,
    tile: "bg-brand-danger/12 text-brand-danger",
  },
}

export function RecentActivityCard() {
  const t = useTranslations("ProjectsOverview")
  const { data, isLoading, isError } = useMyActivity()
  const activity = data ?? []

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default border-b px-5 py-3.5">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          {t("recentActivity")}
        </h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-muted h-10 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          {t("activityLoadFailed")}
        </p>
      ) : activity.length === 0 ? (
        <p className="text-content-tertiary px-5 py-10 text-center text-sm">
          {t("noRecentActivity")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1 p-3">
          {activity.map((item) => {
            const style = KIND_STYLE[item.kind] ?? KIND_STYLE.document
            const Icon = style.icon
            return (
              <li key={item.id} className="flex items-center gap-3 px-2 py-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    style.tile,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-content-secondary truncate text-[13px] leading-[17px]">
                    {item.text}
                  </span>
                  <span className="text-content-tertiary text-[12px] leading-[17px]">
                    {item.time_label}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
