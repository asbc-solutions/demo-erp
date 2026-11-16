"use client"

import { useMemo, useState } from "react"
import { Folder, FolderOpen, MoreHorizontal } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { buildDocumentLibraryView } from "../../lib/mappers/documents-mapper"
import { useDocumentLibrary } from "../../lib/queries/documents"
import type { DocumentCategory } from "../../lib/types"

export function DocumentsLibraryModule() {
  // No project_id → portfolio-wide library across every project.
  const { data, isLoading, isError } = useDocumentLibrary()
  const view = useMemo(() => buildDocumentLibraryView(data), [data])

  const [activeFolder, setActiveFolder] = useState<DocumentCategory | null>(null)

  const activeLabel =
    view.folders.find((f) => f.key === activeFolder)?.label ?? "All Documents"

  const items = useMemo(
    () =>
      activeFolder
        ? view.items.filter((d) => d.category === activeFolder)
        : view.items,
    [view.items, activeFolder],
  )

  return (
    <div className="flex flex-col gap-4 p-6 lg:flex-row">
      <Card className="h-fit shrink-0 gap-4 p-4 lg:w-56">
        <div className="flex flex-col gap-1">
          <span className="text-content-tertiary mb-1 text-[10px] font-semibold tracking-wide uppercase">
            Library
          </span>
          {isLoading ? (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-muted h-8 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            view.folders.map((folder) => {
              const isActive = folder.key === activeFolder
              const Icon = isActive ? FolderOpen : Folder
              return (
                <button
                  key={folder.key ?? "all"}
                  type="button"
                  onClick={() => setActiveFolder(folder.key)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-content-secondary hover:bg-surface-hover",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{folder.label}</span>
                  </span>
                  <span className="text-content-tertiary shrink-0 text-[11px] tabular-nums">
                    {folder.count}
                  </span>
                </button>
              )
            })
          )}
        </div>
        {view.tags.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {view.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-muted text-content-secondary rounded-md px-2 py-0.5 text-[11px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-content-primary text-2xl leading-8 font-bold tracking-tight">
              {activeLabel}
            </h1>
            <p className="text-content-tertiary text-sm">
              Documents, versions, and approvals across all projects
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-44 animate-pulse rounded-[14px]"
              />
            ))}
          </div>
        ) : isError ? (
          <Card className="flex h-48 items-center justify-center p-6">
            <p className="text-content-tertiary text-sm">
              Couldn&apos;t load documents.
            </p>
          </Card>
        ) : items.length === 0 ? (
          <Card className="flex h-48 items-center justify-center p-6">
            <p className="text-content-tertiary text-sm">
              No documents in {activeLabel.toLowerCase()} yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((doc) => {
              const Icon = doc.icon
              return (
                <Card key={doc.id} className="gap-3 p-4">
                  <div
                    className={cn(
                      "relative flex h-24 items-center justify-center rounded-lg",
                      doc.tone,
                    )}
                  >
                    <Icon className="size-7" aria-hidden />
                    <button
                      type="button"
                      aria-label="Document options"
                      className="text-content-tertiary hover:text-content-primary absolute top-2 inset-e-2"
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-content-primary truncate text-[13px] font-semibold">
                      {doc.title}
                    </span>
                    <span className="text-content-tertiary text-[11px]">
                      {doc.categoryLabel} · {doc.author}
                    </span>
                  </div>
                  <StatusPill status={doc.statusLabel} />
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
