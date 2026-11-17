import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectLifecycleStatus } from "../../lib/types"
import { LIFECYCLE_STATUS_STYLE } from "../data/all-projects-data"

export function ProjectStatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectLifecycleStatus | null | undefined
  /** Human label from the backend (`status_label`), shown for statuses the UI doesn't know. */
  label?: string
  className?: string
}) {
  const t = useTranslations("ProjectsShared")
  // A row with an unrecognised (or missing) status must still render — this
  // badge sits in every list cell, so throwing here takes the whole page down.
  const known = !!status && status in LIFECYCLE_STATUS_STYLE
  const style = (status && LIFECYCLE_STATUS_STYLE[status]) || LIFECYCLE_STATUS_STYLE.created
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-[16.5px] font-medium whitespace-nowrap capitalize",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {known && status
        ? t(`lifecycle.${status}`)
        : (label ?? status?.replace(/_/g, " ") ?? t("unknown"))}
    </span>
  )
}
