"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Diamond,
  Download,
  Folder,
  FolderOpen,
  GitBranch,
  Plus,
  SquareCheck,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { toWbsNodes } from "../../../lib/mappers/hierarchy-mapper"
import { useProjectHierarchy } from "../../../lib/queries/hierarchy"
import { WBS_STATUS_KEY, type WbsNode } from "../../data/project-detail-data"

import { StatusPill } from "./status-pill"

const KIND_ICON: Record<WbsNode["kind"], LucideIcon> = {
  Project: FolderOpen,
  Phase: Folder,
  Workstream: Diamond,
  Task: SquareCheck,
}

const KIND_KEY = {
  Project: "project",
  Phase: "phase",
  Workstream: "workstream",
  Task: "task",
} as const satisfies Record<WbsNode["kind"], string>

const VIEW_MODES = ["tree", "table", "chart"] as const

function collectParentIds(nodes: WbsNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.id)
      collectParentIds(node.children, acc)
    }
  }
  return acc
}

function flatten(
  nodes: WbsNode[],
  collapsed: Set<string>,
  out: WbsNode[] = [],
): WbsNode[] {
  for (const node of nodes) {
    out.push(node)
    if (node.children?.length && !collapsed.has(node.id)) {
      flatten(node.children, collapsed, out)
    }
  }
  return out
}

export function WbsTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsProjectDetail")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const { data, isLoading } = useProjectHierarchy(projectId)
  const tree = useMemo(
    () => toWbsNodes(data ?? [], { t: tShared, locale }),
    [data, tShared, locale],
  )
  const parentIds = useMemo(() => collectParentIds(tree), [tree])

  // Default fully-expanded by tracking the *collapsed* set instead.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [view, setView] = useState<(typeof VIEW_MODES)[number]>("tree")

  const rows = useMemo(() => flatten(tree, collapsed), [tree, collapsed])

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
            {t("wbsTitle")}
          </h2>
          <p className="text-content-tertiary text-sm">{t("wbsSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-9 gap-2 px-3 text-[12px]">
            <GitBranch className="size-3.5" aria-hidden />
            {t("baselineMode")}
          </Button>
          <Button variant="outline" className="h-9 gap-2 px-3 text-[12px]">
            <Download className="size-3.5" aria-hidden />
            {tCommon("export")}
          </Button>
          <Button variant="primary" className="h-9 gap-2 px-3 text-[12px]">
            <Plus className="size-4" aria-hidden />
            {t("addPhase")}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-stroke-default flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setCollapsed(new Set())}
              className="text-content-secondary hover:text-content-primary flex items-center gap-1 font-medium"
            >
              <ChevronDown className="size-3.5" aria-hidden />
              {t("expandAll")}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(new Set(parentIds))}
              className="text-content-secondary hover:text-content-primary flex items-center gap-1 font-medium"
            >
              <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
              {t("collapseAll")}
            </button>
          </div>
          <div className="bg-surface-muted flex items-center gap-0.5 rounded-lg p-0.5">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  view === mode
                    ? "bg-surface-white text-brand-primary shadow-sm"
                    : "text-content-tertiary hover:text-content-primary",
                )}
              >
                {t(`wbsView.${mode}`)}
              </button>
            ))}
          </div>
        </div>

        {/* column header */}
        <div className="bg-surface-page text-content-tertiary border-stroke-default grid grid-cols-[minmax(0,1fr)_44px_150px_150px_90px] items-center gap-2 border-b px-4 py-2.5 text-[10px] font-semibold tracking-wide uppercase">
          <span>{t("colElement")}</span>
          <span />
          <span>{tCommon("status")}</span>
          <span>{t("colSchedule")}</span>
          <span className="text-end">{t("colBudget")}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-9 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-content-tertiary px-4 py-12 text-center text-sm">
            {t("wbsEmpty")}
          </p>
        ) : (
          <div>
            {rows.map((node) => {
              const Icon = KIND_ICON[node.kind]
              const hasChildren = !!node.children?.length
              const isOpen = !collapsed.has(node.id)
              return (
                <div
                  key={node.id}
                  className={cn(
                    "border-stroke-light grid grid-cols-[minmax(0,1fr)_44px_150px_150px_90px] items-center gap-2 border-b px-4 py-2.5 last:border-0",
                    node.level === 1 && "bg-brand-primary/5",
                    node.level === 2 && "bg-surface-page/60",
                  )}
                >
                  <div
                    className="flex min-w-0 items-center gap-1.5"
                    style={{ paddingInlineStart: `${(node.level - 1) * 20}px` }}
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        aria-label={isOpen ? t("collapse") : t("expand")}
                        className="text-content-tertiary hover:text-content-primary shrink-0"
                      >
                        {isOpen ? (
                          <ChevronDown className="size-3.5" aria-hidden />
                        ) : (
                          <ChevronRight
                            className="size-3.5 rtl:rotate-180"
                            aria-hidden
                          />
                        )}
                      </button>
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-medium whitespace-nowrap",
                        node.level === 4
                          ? "text-content-tertiary"
                          : "text-brand-primary",
                      )}
                    >
                      {t("wbsLevel", {
                        level: node.level,
                        kind: tShared(`wbsKind.${KIND_KEY[node.kind]}`),
                      })}
                    </span>
                    <Icon
                      className="text-content-quaternary size-3.5 shrink-0"
                      aria-hidden
                    />
                    <span className="text-content-tertiary shrink-0 font-mono text-[11px]">
                      {node.code}
                    </span>
                    <span
                      className={cn(
                        "text-content-primary truncate text-[13px]",
                        node.level <= 2
                          ? "font-semibold"
                          : node.level === 3
                            ? "font-medium"
                            : "font-normal",
                      )}
                    >
                      {node.name}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <Avatar
                      color={node.owner.color}
                      className="size-[22px] text-[10px]"
                    >
                      {node.owner.initials}
                    </Avatar>
                  </div>
                  <StatusPill
                    status={node.status}
                    label={tShared(`status.${WBS_STATUS_KEY[node.status]}`)}
                  />
                  <span className="text-content-secondary text-xs">
                    {node.schedule}
                  </span>
                  <span className="text-content-primary text-end text-xs font-semibold">
                    {node.budget}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
