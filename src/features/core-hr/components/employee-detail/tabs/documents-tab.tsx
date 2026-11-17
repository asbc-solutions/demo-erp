"use client"

import { Clock, FileText, ShieldCheck, XCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"

import type { DocumentStatus } from "../../../lib/types"
import { useEmployeeDocuments } from "../../../lib/queries/documents"
import { HrSectionSpinner } from "../../shared/hr-loading"
import { SectionCard } from "../section-card"

type DocumentsTabProps = Readonly<{
  employeeId: string
}>

function DocumentStatusBadge({ status }: Readonly<{ status: DocumentStatus }>) {
  const t = useTranslations("HrEmployeeDetail")
  if (status === "VERIFIED") {
    return (
      <Badge
        variant="outline"
        className="border-brand-success/30 bg-brand-success/10 text-brand-success rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
      >
        <ShieldCheck className="size-3" />
        {t("docVerified")}
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
        {t("docPending")}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-brand-danger/30 bg-brand-danger/10 text-brand-danger rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase"
    >
      <XCircle className="size-3" />
      {t("docRejected")}
    </Badge>
  )
}

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const t = useTranslations("HrEmployeeDetail")
  const { data: documents = [], isLoading } = useEmployeeDocuments(employeeId)

  return (
    <SectionCard
      title={t("documentsTitle")}
      description={t("documentsDescription")}
      bodyClassName="px-6 pb-6 pt-1 flex flex-col gap-3"
    >
      {isLoading && <HrSectionSpinner />}
      {!isLoading && documents.length === 0 && (
        <p className="text-content-tertiary py-8 text-center text-sm">
          {t("documentsEmpty")}
        </p>
      )}
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="border-stroke-default bg-surface-white flex items-center gap-4 rounded-[12px] border px-4 py-3"
        >
          <span
            aria-hidden
            className="bg-surface-hover text-content-tertiary flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          >
            <FileText className="size-5" strokeWidth={1.5} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-content-primary text-sm leading-5 font-semibold">
              {doc.document_title}
            </span>
            <span className="text-content-tertiary text-xs leading-4">
              {doc.document_type_label}
              {doc.expiry_date &&
                ` · ${t("expiresOn", { date: doc.expiry_date })}`}
            </span>
          </div>
          <DocumentStatusBadge status={doc.status_label} />
        </div>
      ))}
    </SectionCard>
  )
}
