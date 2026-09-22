import { StatusPill } from "../../../components/shared/status-pill"
import type { EDocumentStatus } from "../../lib/types/tax"

/** E-document statuses mapped onto the finance status vocabulary. */
const STATUS: Record<EDocumentStatus, { key: string; label: string }> = {
  valid: { key: "valid", label: "Valid" },
  rejected: { key: "rejected", label: "Rejected" },
  submitted: { key: "submitted", label: "Submitted" },
  not_sent: { key: "not_sent", label: "Not sent" },
  cancel_requested: { key: "cancel_requested", label: "Cancellation requested" },
  cancelled: { key: "cancelled", label: "Cancelled" },
}

function EDocumentStatusPill({ status }: { status: EDocumentStatus }) {
  return <StatusPill status={STATUS[status].key} label={STATUS[status].label} />
}

export { EDocumentStatusPill }
