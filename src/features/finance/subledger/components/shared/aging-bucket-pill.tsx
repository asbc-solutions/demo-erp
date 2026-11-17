import { useTranslations } from "next-intl"

import { StatusPill } from "../../../components/shared/status-pill"
import type { StatusTone } from "../../../lib/constants/statuses"
import type { AgingBucketId } from "../../lib/types/subledger"

const BUCKET_TONE: Record<AgingBucketId, StatusTone> = {
  current: "success",
  "1-30": "info",
  "31-60": "warning",
  "61-90": "warning",
  "90+": "danger",
}

/** Aging bucket as a pill, coloured by how late it is. */
function AgingBucketPill({ bucket }: { bucket: AgingBucketId }) {
  const t = useTranslations("FinanceSubledger")
  return (
    <StatusPill
      status={`bucket-${bucket}`}
      label={t(`bucketPill.${bucket}`)}
      family="internal"
      tone={BUCKET_TONE[bucket]}
    />
  )
}

/** "20 Apr 2026 · 10d late" — the late part only when the document is overdue. */
function DueCell({ date, daysLate }: { date: string; daysLate: number }) {
  const t = useTranslations("FinanceSubledger")
  return (
    <span className="whitespace-nowrap">
      {date}
      {daysLate > 0 ? <span className="text-status-danger-fg"> · {t("daysLate", { days: daysLate })}</span> : null}
    </span>
  )
}

export { AgingBucketPill, DueCell }
