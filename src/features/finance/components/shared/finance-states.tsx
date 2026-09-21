import * as React from "react"
import { CircleAlert } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

/** A failed load, phrased as what happened and what to do, with a retry. */
function FinanceErrorState({
  title = "These figures could not be loaded.",
  description = "The finance service did not answer. Try again, and if it keeps failing, check the connection status in Finance settings.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      variant="card"
      className={className}
      icon={<CircleAlert className="text-status-danger-fg" />}
      title={title}
      description={description}
      actions={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  )
}

/** Placeholder for a row of KPI tiles while their figures load. */
function FinanceTilesSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div
      aria-busy
      aria-label="Loading figures"
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-[14px]" />
      ))}
    </div>
  )
}

export { FinanceErrorState, FinanceTilesSkeleton }
