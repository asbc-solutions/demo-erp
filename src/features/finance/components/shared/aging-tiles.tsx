import * as React from "react"

import { KpiCard, type KpiAccent } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { formatAmount, formatPercent } from "../../lib/utils/money"

export type AgingBucket = { id: string; label: string; amount: number }

/**
 * `series` colours buckets as a categorical sequence (style guide);
 * `severity` colours them by how late they are (receivables, payables).
 */
const BUCKET_ACCENTS: Record<"series" | "severity", readonly KpiAccent[]> = {
  series: ["indigo", "teal", "amber", "blue", "emerald"],
  severity: ["success", "warning", "warning", "warning", "danger"],
}

type AgingTilesProps = React.ComponentProps<"div"> & {
  buckets: AgingBucket[]
  accents?: "series" | "severity"
}

/** Aging buckets as tiles: amount per bucket and its share of the total. */
function AgingTiles({ className, buckets, accents = "series", ...props }: AgingTilesProps) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0)
  const palette = BUCKET_ACCENTS[accents]
  return (
    <div
      data-slot="aging-tiles"
      className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5", className)}
      {...props}
    >
      {buckets.map((bucket, index) => (
        <KpiCard
          key={bucket.id}
          layout="bar"
          accent={palette[index % palette.length]}
          label={bucket.label}
          value={formatAmount(bucket.amount)}
          caption={total > 0 ? formatPercent((bucket.amount / total) * 100) : "—"}
        />
      ))}
    </div>
  )
}

export { AgingTiles }
