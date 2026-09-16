"use client"

import * as React from "react"
import {
  Activity,
  Banknote,
  Briefcase,
  FileText,
  FileWarning,
  Handshake,
  Shield,
  User,
  UserPlus,
} from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { useActivityFeed } from "../lib/queries/activity-feed"
import type { ActivityFeedCategory, ActivityFeedItem } from "../lib/types/activity-feed"
import { CommandCenterSectionSpinner } from "./shared/command-center-loading"
import { CommandCenterErrorState } from "./shared/command-center-error-state"

const toneDot: Record<ActivityFeedCategory, string> = {
  finance: "bg-brand-success",
  sales: "bg-brand-primary",
  people: "bg-brand-warning",
  system: "bg-violet-500",
}

const CATEGORY_FILTERS: { label: string; category: ActivityFeedCategory }[] = [
  { label: "Finance", category: "finance" },
  { label: "Sales", category: "sales" },
  { label: "People", category: "people" },
  { label: "System", category: "system" },
]

/**
 * `module` isn't returned as a fixed enum in the docs (only example values
 * per `category` are listed) — map known modules and fall back generically.
 */
function activityIcon(activityModule: string) {
  const c = "size-4 text-content-secondary"
  switch (activityModule) {
    case "finance":
    case "payroll":
      return <Banknote className={c} />
    case "sales":
      return <Handshake className={c} />
    case "recruitment":
      return <UserPlus className={c} />
    case "hr":
    case "leave":
    case "attendance":
    case "performance":
      return <User className={c} />
    case "training":
      return <Briefcase className={c} />
    case "compliance":
      return <FileWarning className={c} />
    case "system":
    case "settings":
    case "integrations":
      return <Shield className={c} />
    default:
      return <FileText className={c} />
  }
}

function ActivityRow({ item }: Readonly<{ item: ActivityFeedItem }>) {
  return (
    <div className="flex gap-3">
      <div className="relative p-1">
        {activityIcon(item.module)}
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-1.5 rounded-full border border-white",
            toneDot[item.tone],
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-[18px] text-content-primary">{item.title}</p>
        <p className="text-[11px] text-content-quaternary">{item.time_label}</p>
      </div>
    </div>
  )
}

export function ActivityFeedSection() {
  const [category, setCategory] = React.useState<ActivityFeedCategory | undefined>(
    undefined,
  )
  const { data, isLoading, isError, refetch } = useActivityFeed({ category, limit: 20 })
  const items = data?.data ?? []

  return (
    <Card
      variant="elevated"
      className="flex w-full shrink-0 flex-col gap-6 rounded-2xl border-stroke-default pt-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] xl:max-w-[412px]"
    >
      <div className="flex items-center justify-between px-6 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex rounded-lg bg-brand-primary/12 p-1.5 text-brand-primary">
            <Activity className="size-3.5" />
          </span>
          <p className="text-sm font-semibold text-content-primary">Activity Feed</p>
        </div>
        <Badge
          variant="primary"
          className="rounded-lg border border-brand-primary/15 bg-brand-primary/8 px-2 py-0.5 text-[11px] font-medium text-brand-primary shadow-[0px_0px_8px_0px_rgba(99,102,241,0.25),0px_0px_2px_0px_rgba(99,102,241,0.15)]"
        >
          Live
        </Badge>
      </div>
      <div className="flex flex-col gap-4 px-6 pb-6">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={cn(
              "rounded-lg px-2 py-1 text-[11px] font-medium",
              category === undefined
                ? "bg-surface-hover text-content-primary"
                : "text-content-quaternary hover:bg-surface-hover",
            )}
          >
            All
          </button>
          {CATEGORY_FILTERS.map(({ label, category: filterCategory }) => (
            <button
              key={filterCategory}
              type="button"
              onClick={() => setCategory(filterCategory)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px]",
                category === filterCategory
                  ? "bg-surface-hover text-content-primary"
                  : "text-content-quaternary hover:bg-surface-hover",
              )}
            >
              <span className={cn("size-1.5 rounded-full", toneDot[filterCategory])} />
              {label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <CommandCenterSectionSpinner />
        ) : isError ? (
          <CommandCenterErrorState
            message="Failed to load activity."
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-xs text-content-quaternary">
            No activity yet.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
            <button
              type="button"
              className="text-center text-[11px] text-brand-primary hover:underline"
            >
              View all activity →
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
