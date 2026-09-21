import { StatusPill } from "../../../components/shared/status-pill"
import type { StatusTone } from "../../../lib/constants/statuses"
import type { AgingBucketId } from "../../lib/types/subledger"

const BUCKET: Record<AgingBucketId, { label: string; tone: StatusTone }> = {
  current: { label: "current", tone: "success" },
  "1-30": { label: "1–30 days", tone: "info" },
  "31-60": { label: "31–60 days", tone: "warning" },
  "61-90": { label: "61–90 days", tone: "warning" },
  "90+": { label: "90+ days", tone: "danger" },
}

/** Aging bucket as a pill, coloured by how late it is. */
function AgingBucketPill({ bucket }: { bucket: AgingBucketId }) {
  const meta = BUCKET[bucket]
  return <StatusPill status={`bucket-${bucket}`} label={meta.label} family="internal" tone={meta.tone} />
}

/** "20 Apr 2026 · 10d late" — the late part only when the document is overdue. */
function DueCell({ date, daysLate }: { date: string; daysLate: number }) {
  return (
    <span className="whitespace-nowrap">
      {date}
      {daysLate > 0 ? <span className="text-status-danger-fg"> · {daysLate}d late</span> : null}
    </span>
  )
}

export { AgingBucketPill, DueCell }
