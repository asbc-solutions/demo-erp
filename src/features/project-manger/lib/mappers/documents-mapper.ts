import {
  FileSpreadsheet,
  FileText,
  Presentation,
  type LucideIcon,
} from "lucide-react"

import type {
  DocumentCategory,
  DocumentLibrary,
  DocumentLibraryItem,
  DocumentStatus,
} from "../types"

/* ------------------------------------------------------------------ */
/* Known enums (translated via `ProjectsShared.documentCategory/Status`) */
/* ------------------------------------------------------------------ */

const DOCUMENT_CATEGORIES: readonly string[] = [
  "specification",
  "drawing",
  "report",
  "contract",
  "permit",
  "meeting_minutes",
  "other",
] satisfies DocumentCategory[]

const DOCUMENT_STATUSES: readonly string[] = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
] satisfies DocumentStatus[]

export function isDocumentCategory(value: string): value is DocumentCategory {
  return DOCUMENT_CATEGORIES.includes(value)
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return DOCUMENT_STATUSES.includes(value)
}

/* ------------------------------------------------------------------ */
/* Category → tile (icon + tone)                                       */
/* ------------------------------------------------------------------ */

type CategoryTile = { icon: LucideIcon; tone: string }

const CATEGORY_TILE: Record<string, CategoryTile> = {
  contract: { icon: FileText, tone: "bg-brand-danger/10 text-brand-danger" },
  drawing: { icon: FileText, tone: "bg-brand-info/10 text-brand-info" },
  specification: { icon: FileText, tone: "bg-brand-info/10 text-brand-info" },
  report: {
    icon: FileSpreadsheet,
    tone: "bg-brand-success/10 text-brand-success",
  },
  permit: { icon: Presentation, tone: "bg-brand-warning/10 text-brand-warning" },
  meeting_minutes: {
    icon: FileText,
    tone: "bg-surface-muted text-content-tertiary",
  },
  other: { icon: FileText, tone: "bg-surface-muted text-content-tertiary" },
}

const FALLBACK_TILE: CategoryTile = {
  icon: FileText,
  tone: "bg-surface-muted text-content-tertiary",
}

/* ------------------------------------------------------------------ */
/* View model                                                          */
/* ------------------------------------------------------------------ */

/**
 * Left-rail folder. `key === null` is the "All Documents" pseudo-folder (its
 * `label` is empty — translate it at render). Other labels come from the API.
 */
export type DocFolder = { key: DocumentCategory | null; label: string; count: number }

export type DocTile = {
  id: string
  title: string
  category: DocumentCategory
  categoryLabel: string
  /** Raw status key — translate known ones with `isDocumentStatus`. */
  status: string
  statusLabel: string
  author: string
  icon: LucideIcon
  tone: string
}

export type DocumentLibraryView = {
  folders: DocFolder[]
  tags: string[]
  items: DocTile[]
}

export function buildDocumentLibraryView(
  library: DocumentLibrary | undefined,
): DocumentLibraryView {
  if (!library) return { folders: [], tags: [], items: [] }

  const { documents, facets } = library

  const categoryLabel = new Map(facets.categories.map((f) => [f.key, f.label]))
  const statusLabel = new Map(facets.statuses.map((f) => [f.key, f.label]))

  const folders: DocFolder[] = [
    { key: null, label: "", count: documents.length },
    ...facets.categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        key: c.key as DocumentCategory,
        label: c.label,
        count: c.count,
      })),
  ]

  const items: DocTile[] = documents.map((doc: DocumentLibraryItem) => {
    const tile = CATEGORY_TILE[doc.document_category] ?? FALLBACK_TILE
    return {
      id: doc.document_id,
      title: doc.title,
      category: doc.document_category,
      categoryLabel:
        categoryLabel.get(doc.document_category) ?? doc.document_category,
      status: doc.status,
      statusLabel: statusLabel.get(doc.status) ?? doc.status,
      author: doc.author?.name ?? doc.owner?.name ?? "—",
      icon: tile.icon,
      tone: tile.tone,
    }
  })

  return { folders, tags: facets.tags.map((t) => t.label), items }
}
