import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

export type KeyValue = { term: React.ReactNode; value: React.ReactNode }

type KeyValueListProps = React.ComponentProps<"dl"> & {
  items: KeyValue[]
}

/** Term-over-value facts laid out in a row, e.g. Entity · Period · Base currency. */
function KeyValueList({ className, items, ...props }: KeyValueListProps) {
  return (
    <dl
      data-slot="key-value-list"
      className={cn("flex flex-wrap gap-x-10 gap-y-4", className)}
      {...props}
    >
      {items.map((item, index) => (
        <div key={index} className="flex min-w-36 flex-col gap-0.5">
          <dt className="text-content-secondary text-[13px] leading-5">{item.term}</dt>
          <dd className="text-content-primary text-sm leading-5">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export { KeyValueList }
