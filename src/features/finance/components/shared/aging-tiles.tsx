import * as React from "react"

import { KpiCard, type KpiAccent } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { formatAmount, formatPercent } from "../../lib/utils/money"

export type AgingBucket = { id: string; label: string; amount: number }

/** Current → 90+ in the series order, oldest last. */
const BUCKET_ACCENTS: readonly KpiAccent[] = ["indigo", "teal", "amber", "blue", "emerald"]

type AgingTilesProps = React.ComponentProps<"div"> & {
  buckets: AgingBucket[]
}

/** Aging buckets as tiles: amount per bucket and its share of the total. */
function AgingTiles({ className, buckets, ...props }: AgingTilesProps) {
  const total = buckets.reduce((sum, bucket) => sum + bucket.amount, 0)
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
          accent={BUCKET_ACCENTS[index % BUCKET_ACCENTS.length]}
          label={bucket.label}
          value={formatAmount(bucket.amount)}
          caption={total > 0 ? formatPercent((bucket.amount / total) * 100) : "—"}
        />
      ))}
    </div>
  )
}

export { AgingTiles }
