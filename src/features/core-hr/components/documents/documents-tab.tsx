"use client"

import { useMemo, useState } from "react"
import {
  Check,
  Clock,
  Download,
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useDocuments } from "../../lib/queries/documents"
import {
  useVerifyDocument,
  useRejectDocument,
  useDeleteDocument,
} from "../../lib/mutations/documents"
import { useEmployees } from "../../lib/queries/employees"
import { documentsApi } from "../../lib/api/documents"
import type { EmployeeDocument, EmployeeListItem } from "../../lib/types"
import type { HrFilterGroup, HrFilterValues } from "../shared/hr-filter-panel"
import { HrToolbar } from "../shared/hr-toolbar"
import { UploadDocumentDialog } from "./upload-document-dialog"

const EMPTY_DOCS: EmployeeDocument[] = []
const EMPTY_EMPLOYEES: EmployeeListItem[] = []

const DOCUMENT_STATUSES = ["VERIFIED", "PENDING", "REJECTED"] as const

function DocumentTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="ps-6">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="pe-6 text-end">
            <Skeleton className="ms-auto h-7 w-20 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

function StatusBadge({
  status,
}: Readonly<{ status: EmployeeDocument["status_label"] }>) {
  const t = useTranslations("HrDocuments")

  if (status === "VERIFIED") {
    return (
      <Badge
        variant="outline"
        className="border-brand-success/30 bg-brand-success/10 text-brand-success rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        <ShieldCheck className="size-3" />
        {t("status.VERIFIED")}
      </Badge>
    )
  }
  if (status === "PENDING") {
    return (
      <Badge
        variant="outline"
        className="border-brand-warning/30 bg-brand-warning/10 text-brand-warning rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        <Clock className="size-3" />
        {t("status.PENDING")}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-brand-danger/30 bg-brand-danger/10 text-brand-danger rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
    >
      <XCircle className="size-3" />
      {t("status.REJECTED")}
    </Badge>
  )
}

function ActionButtons({
  doc,
  onVerify,
  onReject,
  onDelete,
  onDownload,
  isPending,
}: Readonly<{
  doc: EmployeeDocument
  onVerify: () => void
  onReject: () => void
  onDelete: () => void
  onDownload: () => void
  isPending: boolean
}>) {
  const t = useTranslations("HrDocuments")

  return (
    <div className="flex items-center justify-end gap-1">
      {doc.has_file && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("downloadLabel", { title: doc.document_title })}
          className="text-content-tertiary hover:text-content-primary"
          onClick={onDownload}
        >
          <Download />
        </Button>
      )}
      {doc.status_label !== "VERIFIED" && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("verifyLabel", { title: doc.document_title })}
          className="text-brand-success hover:bg-brand-success/10"
          disabled={isPending}
          onClick={onVerify}
        >
          <Check />
        </Button>
      )}
      {doc.status_label === "VERIFIED" && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("rejectLabel", { title: doc.document_title })}
          className="text-brand-danger hover:bg-brand-danger/10"
          disabled={isPending}
          onClick={onReject}
        >
          <X />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("deleteLabel", { title: doc.document_title })}
        className="text-brand-danger hover:bg-brand-danger/10"
        disabled={isPending}
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export function DocumentsTab() {
  const t = useTranslations("HrDocuments")
  const tCommon = useTranslations("Common")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data, isLoading, isError } = useDocuments({ per_page: 50 })
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    per_page: 100,
  })

  const verifyDoc = useVerifyDocument()
  const rejectDoc = useRejectDocument()
  const deleteDoc = useDeleteDocument()

  const documents = data?.data ?? EMPTY_DOCS
  const employees = employeesData?.data ?? EMPTY_EMPLOYEES

  const employeesById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const statusFilter = filters.status ?? []
    return documents.filter((doc) => {
      if (
        statusFilter.length > 0 &&
        !statusFilter.includes(doc.status_label)
      ) {
        return false
      }
      if (!query) return true
      const employee = employeesById.get(doc.employee_id)
      return [
        doc.document_title,
        doc.document_type_label,
        doc.document_category,
        employee?.full_name ?? "",
        employee?.employee_number ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [documents, employeesById, search, filters])

  const filterGroups: HrFilterGroup[] = [
    {
      id: "status",
      label: tCommon("status"),
      options: DOCUMENT_STATUSES.map((status) => ({
        value: status,
        label: t(`status.${status}`),
      })),
    },
  ]

  const isMutating =
    verifyDoc.isPending || rejectDoc.isPending || deleteDoc.isPending

  function handleVerify(doc: EmployeeDocument) {
    verifyDoc.mutate(
      { employeeId: doc.employee_id, id: doc.id },
      {
        onSuccess: () =>
          toast.success(t("verified"), {
            description: doc.document_title,
          }),
        onError: (err) => {
          toast.error(t("verifyFailed"), {
            description:
              (err as unknown as ApiError).message ?? t("verifyFailedDescription"),
          })
        },
      }
    )
  }

  function handleReject(doc: EmployeeDocument) {
    rejectDoc.mutate(
      { employeeId: doc.employee_id, id: doc.id },
      {
        onSuccess: () =>
          toast.success(t("rejected"), {
            description: doc.document_title,
          }),
        onError: (err) => {
          toast.error(t("rejectFailed"), {
            description:
              (err as unknown as ApiError).message ?? t("rejectFailedDescription"),
          })
        },
      }
    )
  }

  function handleDelete(doc: EmployeeDocument) {
    deleteDoc.mutate(
      { employeeId: doc.employee_id, id: doc.id },
      {
        onSuccess: () =>
          toast.success(t("deleted"), {
            description: doc.document_title,
          }),
        onError: (err) => {
          toast.error(t("deleteFailed"), {
            description:
              (err as unknown as ApiError).message ?? t("deleteFailedDescription"),
          })
        },
      }
    )
  }

  async function handleDownload(doc: EmployeeDocument) {
    try {
      const res = await documentsApi.download(doc.employee_id, doc.id)
      window.open(res.data.data.download_url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error(t("downloadFailed"), {
        description: t("downloadFailedDescription"),
      })
    }
  }

  return (
    <div className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5">
      <HrToolbar
        primary={
          <Button
            variant="primary"
            className="rounded-[10px]"
            onClick={() => setUploadOpen(true)}
          >
            <Upload />
            {t("uploadDocument")}
          </Button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        filterGroups={filterGroups}
        filterValues={filters}
        onFilterChange={setFilters}
      />

      <div className="border-stroke-default overflow-hidden rounded-[12px] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">{t("colEmployee")}</TableHead>
              <TableHead>{tCommon("type")}</TableHead>
              <TableHead>{t("colDocument")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("colExpiry")}</TableHead>
              <TableHead className="pe-6 text-end">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <DocumentTableSkeleton />
          ) : (
            <TableBody>
              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-content-tertiary py-12 text-center text-sm"
                  >
                    {t("loadError")}
                  </TableCell>
                </TableRow>
              )}

              {!isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-content-tertiary py-12 text-center text-sm"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}

              {!isError &&
                filtered.map((doc) => {
                  const employee = employeesById.get(doc.employee_id)
                  const employeeName =
                    employee?.full_name ??
                    t("employeeRef", { id: doc.employee_id.slice(0, 8) })
                  const employeeNumber = employee?.employee_number ?? ""

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="ps-6">
                        <div className="flex flex-col">
                          <span className="text-content-primary text-sm font-semibold">
                            {employeeName}
                          </span>
                          <span className="text-content-tertiary text-xs leading-4">
                            {employeeNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-stroke-default bg-surface-hover text-content-secondary rounded-md px-2 py-0.5 text-[11px] tracking-[0.4px] uppercase"
                        >
                          {doc.document_type_label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText
                            className="text-content-tertiary size-4 shrink-0"
                            strokeWidth={1.75}
                          />
                          <span className="text-content-primary text-sm">
                            {doc.document_title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status_label} />
                      </TableCell>
                      <TableCell className="text-content-tertiary text-sm">
                        {doc.expiry_date ?? "—"}
                      </TableCell>
                      <TableCell className="pe-6 text-end">
                        <ActionButtons
                          doc={doc}
                          isPending={isMutating}
                          onVerify={() => handleVerify(doc)}
                          onReject={() => handleReject(doc)}
                          onDelete={() => handleDelete(doc)}
                          onDownload={() => handleDownload(doc)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          )}
        </Table>
      </div>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        employees={employees}
        employeesLoading={employeesLoading}
      />
    </div>
  )
}
