"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("list-none", className)}
      {...props}
    />
  )
}

const paginationButtonVariants = cva(
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-medium transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-brand-primary/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-content-tertiary hover:bg-surface-hover hover:text-content-primary",
        active:
          "bg-brand-primary text-white hover:bg-brand-primary-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type PaginationButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof paginationButtonVariants> & {
    isActive?: boolean
  }

function PaginationButton({
  className,
  variant,
  isActive,
  type = "button",
  ...props
}: PaginationButtonProps) {
  const resolvedVariant = isActive ? "active" : variant
  return (
    <button
      type={type}
      data-slot="pagination-button"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(paginationButtonVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label="Go to previous page"
      className={cn(className)}
      {...props}
    >
      <ChevronLeft />
      <span className="sr-only">Previous</span>
    </PaginationButton>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton
      aria-label="Go to next page"
      className={cn(className)}
      {...props}
    >
      <ChevronRight />
      <span className="sr-only">Next</span>
    </PaginationButton>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "text-content-tertiary flex size-8 items-center justify-center text-xs",
        className,
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  paginationButtonVariants,
}
