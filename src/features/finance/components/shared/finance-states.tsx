import * as React from "react"
import { CircleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

/** A failed load, phrased as what happened and what to do, with a retry. */
function FinanceErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  const t = useTranslations("FinanceShared")
  return (
    <EmptyState
      variant="card"
      className={className}
      icon={<CircleAlert className="text-status-danger-fg" />}
      title={title ?? t("loadErrorTitle")}
      description={description ?? t("loadErrorDescription")}
      actions={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t("retry")}
          </Button>
        ) : undefined
      }
    />
  )
}

/** Placeholder for a row of KPI tiles while their figures load. */
function FinanceTilesSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  const t = useTranslations("FinanceShared")
  return (
    <div
      aria-busy
      aria-label={t("loadingFigures")}
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-[14px]" />
      ))}
    </div>
  )
}

export { FinanceErrorState, FinanceTilesSkeleton }
