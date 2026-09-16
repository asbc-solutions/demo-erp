"use client"

import { useMemo, useRef, useState } from "react"
import {
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Presentation,
  Upload,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { documentsApi } from "../../../lib/api/documents"
import { formatApiDate } from "../../../lib/mappers/project-mapper"
import {
  useApproveDocument,
  useDeleteDocument,
  useRejectDocument,
  useUploadDocument,
} from "../../../lib/mutations/documents"
import { useNodeDocuments } from "../../../lib/queries/documents"
import type { DocumentCategory } from "../../../lib/types"
import { DOC_FOLDERS, DOC_TAGS } from "../../data/project-detail-data"

import { StatusPill } from "./status-pill"

/** Maps the library folders to a backend document_category (null = all). */
const FOLDER_CATEGORY: Record<string, DocumentCategory | null> = {
  "All Documents": null,
  Contracts: "contract",
  Drawings: "drawing",
  Specifications: "specification",
  Approvals: "permit",
  Reports: "report",
}

const TYPE_TILE: Record<string, { icon: LucideIcon; tone: string }> = {
  pdf: { icon: FileText, tone: "bg-brand-danger/10 text-brand-danger" },
  dwg: { icon: FileText, tone: "bg-brand-info/10 text-brand-info" },
  doc: { icon: FileText, tone: "bg-brand-info/10 text-brand-info" },
  docx: { icon: FileText, tone: "bg-brand-info/10 text-brand-info" },
  xls: { icon: FileSpreadsheet, tone: "bg-brand-success/10 text-brand-success" },
  xlsx: { icon: FileSpreadsheet, tone: "bg-brand-success/10 text-brand-success" },
  ppt: { icon: Presentation, tone: "bg-brand-warning/10 text-brand-warning" },
  pptx: { icon: Presentation, tone: "bg-brand-warning/10 text-brand-warning" },
}

const FALLBACK_TILE = {
  icon: FileText,
  tone: "bg-surface-muted text-content-tertiary",
}

export function DocumentsTab({ projectId }: { projectId: string }) {
  // The project's root node id is the project id for node-scoped endpoints.
  const nodeId = projectId
  const [activeFolder, setActiveFolder] = useState(DOC_FOLDERS[0])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isError } = useNodeDocuments(nodeId)
  const upload = useUploadDocument(nodeId)
  const approve = useApproveDocument(nodeId)
  const reject = useRejectDocument(nodeId)
  const remove = useDeleteDocument(nodeId)

  const docs = useMemo(() => {
    const category = FOLDER_CATEGORY[activeFolder]
    const all = data ?? []
    return category ? all.filter((d) => d.document_category === category) : all
  }, [data, activeFolder])

  const handleFilePicked = (file: File | undefined) => {
    if (!file) return
    const category = FOLDER_CATEGORY[activeFolder] ?? "other"
    upload.mutate(
      {
        projectId,
        nodeType: "project",
        title: file.name,
        documentCategory: category,
        file,
      },
      {
        onSuccess: () => toast.success("Document uploaded"),
        onError: (err) =>
          toast.error("Couldn't upload document", {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  const handleDownload = async (id: string) => {
    try {
      const res = await documentsApi.downloadUrl(id)
      window.open(res.data.data.download_url, "_blank", "noopener")
    } catch (err) {
      toast.error("Couldn't get download link", {
        description: (err as ApiError).message,
      })
    }
  }

  const handleApprove = (id: string) =>
    approve.mutate(id, {
      onSuccess: () => toast.success("Document approved"),
      onError: (err) =>
        toast.error("Couldn't approve", {
          description: (err as unknown as ApiError).message,
        }),
    })

  const handleReject = (id: string) =>
    reject.mutate(
      { id, payload: {} },
      {
        onSuccess: () => toast.success("Document rejected"),
        onError: (err) =>
          toast.error("Couldn't reject", {
            description: (err as unknown as ApiError).message,
          }),
      },
    )

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this document?")) return
    remove.mutate(id, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (err) =>
        toast.error("Couldn't delete", {
          description: (err as unknown as ApiError).message,
        }),
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          handleFilePicked(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      <Card className="h-fit shrink-0 gap-4 p-4 lg:w-56">
        <div className="flex flex-col gap-1">
          <span className="text-content-tertiary mb-1 text-[10px] font-semibold tracking-wide uppercase">
            Library
          </span>
          {DOC_FOLDERS.map((folder) => {
            const isActive = folder === activeFolder
            const Icon = isActive ? FolderOpen : Folder
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-content-secondary hover:bg-surface-hover",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {folder}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DOC_TAGS.map((tag) => (
              <span
                key={tag}
                className="bg-surface-muted text-content-secondary rounded-md px-2 py-0.5 text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-content-primary text-xl leading-7 font-bold tracking-tight">
              {activeFolder}
            </h2>
            <p className="text-content-tertiary text-sm">
              All project documents, versions, and approvals
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              className="h-9 gap-2 px-3 text-[12px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending}
            >
              <Upload className="size-3.5" aria-hidden />
              {upload.isPending ? "Uploading…" : "Upload"}
            </Button>
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
        ) : docs.length === 0 ? (
          <Card className="flex h-48 items-center justify-center p-6">
            <p className="text-content-tertiary text-sm">
              No documents in {activeFolder.toLowerCase()} yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => {
              const ext = doc.file?.file_type?.toLowerCase() ?? ""
              const { icon: Icon, tone } = TYPE_TILE[ext] ?? FALLBACK_TILE
              return (
                <Card key={doc.document_id} className="gap-3 p-4">
                  <div
                    className={cn(
                      "relative flex h-24 items-center justify-center rounded-lg",
                      tone,
                    )}
                  >
                    <Icon className="size-7" aria-hidden />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Document options"
                          className="text-content-tertiary hover:text-content-primary absolute top-2 right-2"
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleDownload(doc.document_id)}
                        >
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleApprove(doc.document_id)}
                        >
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleReject(doc.document_id)}
                        >
                          Reject
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-brand-danger"
                          onClick={() => handleDelete(doc.document_id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-content-primary truncate text-[13px] font-semibold">
                      {doc.title}
                    </span>
                    <span className="text-content-tertiary text-[11px]">
                      v{doc.current_version} · {formatApiDate(doc.created_at)} ·{" "}
                      {doc.document_category_label}
                    </span>
                  </div>
                  <StatusPill status={doc.status_label} />
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
