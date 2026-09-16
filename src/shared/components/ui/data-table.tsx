import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

function DataTable({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table"
      className={cn(
        "border-stroke-default bg-surface-white flex w-full flex-col overflow-hidden rounded-[14px] border",
        className,
      )}
      {...props}
    />
  )
}

function DataTableHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-header"
      className={cn(
        "border-stroke-default flex items-center justify-between gap-4 border-b px-6 py-4",
        className,
      )}
      {...props}
    />
  )
}

function DataTableHeading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-heading"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function DataTableTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-title"
      className={cn(
        "text-content-primary text-sm leading-5 font-semibold",
        className,
      )}
      {...props}
    />
  )
}

function DataTableDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="data-table-description"
      className={cn("text-content-tertiary text-xs leading-4", className)}
      {...props}
    />
  )
}

function DataTableActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

function DataTableContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-content"
      className={cn("relative w-full", className)}
      {...props}
    />
  )
}

function DataTableFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="data-table-footer"
      className={cn(
        "border-stroke-default flex items-center justify-between gap-4 border-t px-6 py-3",
        className,
      )}
      {...props}
    />
  )
}

function DataTableMeta({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="data-table-meta"
      className={cn("text-content-tertiary text-xs leading-4", className)}
      {...props}
    />
  )
}

export {
  DataTable,
  DataTableActions,
  DataTableContent,
  DataTableDescription,
  DataTableFooter,
  DataTableHeader,
  DataTableHeading,
  DataTableMeta,
  DataTableTitle,
}
