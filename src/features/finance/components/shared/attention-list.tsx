import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { cva } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

import type { AttentionItem, AttentionTone } from "../../lib/types/common"

const attentionDotVariants = cva("size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      danger: "bg-status-danger-fg",
      warning: "bg-status-warning-fg",
      info: "bg-status-info-fg",
    } satisfies Record<AttentionTone, string>,
  },
  defaultVariants: { tone: "info" },
})

type AttentionListProps = React.ComponentProps<"ul"> & {
  items: AttentionItem[]
}

/** "Needs your attention" rows: severity dot, sentence, count; worst first as given. */
function AttentionList({ className, items, ...props }: AttentionListProps) {
  return (
    <ul data-slot="attention-list" className={cn("flex flex-col", className)} {...props}>
      {items.map((item) => {
        const content = (
          <>
            <span aria-hidden className={attentionDotVariants({ tone: item.tone })} />
            <span className="text-content-primary flex-1 text-sm leading-5">{item.label}</span>
            <span className="text-content-primary text-sm leading-5 tabular-nums">{item.count}</span>
          </>
        )
        return (
          <li key={item.id} className="border-stroke-default border-b">
            {item.href ? (
              <Link
                href={item.href}
                className="hover:bg-surface-hover/60 -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-3">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export { AttentionList, attentionDotVariants }
