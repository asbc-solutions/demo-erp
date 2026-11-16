import * as React from "react"

import { Avatar, avatarToneFor } from "@/src/shared/components/ui/avatar"
import { cn } from "@/src/shared/lib/utils/utils"

import type { HistoryEvent } from "../../lib/types/common"
import { formatDateTime } from "../../lib/utils/date"

type DocumentHistoryProps = React.ComponentProps<"ol"> & {
  events: HistoryEvent[]
}

/** Who did what to a document, newest first, joined by a hairline. */
function DocumentHistory({ className, events, ...props }: DocumentHistoryProps) {
  return (
    <ol data-slot="document-history" className={cn("flex flex-col", className)} {...props}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {isLast ? null : (
              <span
                aria-hidden
                className="bg-stroke-default absolute top-8 bottom-0 inset-s-3.5 w-px"
              />
            )}
            <Avatar size="sm" alt={event.actor} color={avatarToneFor(event.actor)} />
            <div className="flex min-w-0 flex-col gap-0.5 pt-1">
              <span className="text-content-primary text-sm leading-5 font-medium">{event.title}</span>
              <span className="text-content-tertiary text-[13px] leading-5">
                {[event.actor, formatDateTime(event.at), event.reference].filter(Boolean).join(" · ")}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { DocumentHistory }
