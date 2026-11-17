import { useTranslations } from "next-intl"

import { StatusPill } from "../../../components/shared/status-pill"
import type { EDocumentStatus, TaxMessageKey } from "../../lib/types/tax"

/** E-document statuses mapped onto the finance status vocabulary. */
const STATUS: Record<EDocumentStatus, { key: string; labelKey: TaxMessageKey }> = {
  valid: { key: "valid", labelKey: "eStatusValid" },
  rejected: { key: "rejected", labelKey: "eStatusRejected" },
  submitted: { key: "submitted", labelKey: "eStatusSubmitted" },
  not_sent: { key: "not_sent", labelKey: "eStatusNotSent" },
  cancel_requested: { key: "cancel_requested", labelKey: "eStatusCancelRequested" },
  cancelled: { key: "cancelled", labelKey: "eStatusCancelled" },
}

/** The `FinanceTax` key of an e-document status label. */
function eDocumentStatusLabelKey(status: EDocumentStatus): TaxMessageKey {
  return STATUS[status].labelKey
}

function EDocumentStatusPill({ status }: { status: EDocumentStatus }) {
  const t = useTranslations("FinanceTax")
  return <StatusPill status={STATUS[status].key} label={t(STATUS[status].labelKey)} />
}

export { EDocumentStatusPill, eDocumentStatusLabelKey }
