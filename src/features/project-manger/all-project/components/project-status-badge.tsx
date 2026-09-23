import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectLifecycleStatus } from "../../lib/types"
import { LIFECYCLE_STATUS_STYLE } from "../data/all-projects-data"

export function ProjectStatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectLifecycleStatus | null | undefined
  /** Human label from the backend (`status_label`). Falls back to the key. */
  label?: string
  className?: string
}) {
  // A row with an unrecognised (or missing) status must still render — this
  // badge sits in every list cell, so throwing here takes the whole page down.
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
      {label ?? status?.replace(/_/g, " ") ?? "Unknown"}
    </span>
  )
}
