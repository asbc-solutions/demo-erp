import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectLifecycleStatus } from "../../lib/types"
import { LIFECYCLE_STATUS_STYLE } from "../data/all-projects-data"

export function ProjectStatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectLifecycleStatus
  /** Human label from the backend (`status_label`). Falls back to the key. */
  label?: string
  className?: string
}) {
  const style = LIFECYCLE_STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] leading-[16.5px] font-medium whitespace-nowrap capitalize",
        style.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {label ?? status.replace(/_/g, " ")}
    </span>
  )
}
