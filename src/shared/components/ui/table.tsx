import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

type TableDensity = "default" | "compact"

/**
 * `density="compact"` tightens every head and cell through the `group/table`
 * data attribute, so dense ledgers opt in once instead of restyling each cell.
 */
function Table({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"table"> & { density?: TableDensity }) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        data-density={density}
        className={cn("group/table w-full caption-bottom border-collapse text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-surface-page [&_tr]:border-b [&_tr]:border-stroke-default", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-stroke-default bg-surface-page text-content-secondary border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-stroke-default hover:bg-surface-page/60 data-[state=selected]:bg-brand-primary/5 border-b transition-colors",
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-content-tertiary h-11 px-4 text-left align-middle text-xs font-semibold tracking-[0.6px] uppercase whitespace-nowrap",
        "group-data-[density=compact]/table:h-9 group-data-[density=compact]/table:px-3 group-data-[density=compact]/table:text-[11px] group-data-[density=compact]/table:tracking-[0.5px]",
        "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-6 *:[[role=checkbox]]:translate-y-px",
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "text-content-secondary px-4 py-4 align-middle text-sm whitespace-nowrap",
        "group-data-[density=compact]/table:px-3 group-data-[density=compact]/table:py-2.5 group-data-[density=compact]/table:text-[13px] group-data-[density=compact]/table:leading-5",
        "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-6 *:[[role=checkbox]]:translate-y-px",
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-content-tertiary mt-4 text-sm", className)}
      {...props}
    />
  )
}

export type { TableDensity }
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
