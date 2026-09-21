"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/src/shared/components/ui/breadcrumb"
import { cn } from "@/src/shared/lib/utils/utils"

import { matchFinanceNav } from "../../lib/utils/nav"

export type FinanceCrumb = { label: string; href?: string }

/**
 * Crumbs for the current route: the nav section, then the nav item. On a
 * detail route the item becomes a link and the page title is appended by the
 * header itself.
 */
function useFinanceCrumbs(): FinanceCrumb[] {
  const pathname = usePathname()
  const match = matchFinanceNav(pathname)
  if (!match) return []
  const isItemRoute = pathname === match.item.href
  return [
    { label: match.group.label },
    { label: match.item.label, href: isItemRoute ? undefined : match.item.href },
  ]
}

type FinancePageHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  title: React.ReactNode
  /** Override the crumbs derived from the finance nav. */
  breadcrumbs?: FinanceCrumb[]
  /** A headline figure beside the title, e.g. "Owed to us 100,606.05 EGP". */
  figure?: React.ReactNode
  actions?: React.ReactNode
}

/** White title band at the top of every finance page: crumbs, title, figure, actions. */
function FinancePageHeader({
  className,
  title,
  breadcrumbs,
  figure,
  actions,
  children,
  ...props
}: FinancePageHeaderProps) {
  const derived = useFinanceCrumbs()
  const crumbs = breadcrumbs ?? derived
  const pathname = usePathname()
  const onItemRoute = crumbs.length > 0 && !crumbs[crumbs.length - 1].href
  const trail: FinanceCrumb[] =
    breadcrumbs || onItemRoute || typeof title !== "string"
      ? crumbs
      : [...crumbs, { label: title }]

  return (
    <header
      data-slot="finance-page-header"
      className={cn("border-stroke-default bg-surface-white border-b px-6 pt-4 pb-5", className)}
      {...props}
    >
      {trail.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] leading-5">
            {trail.map((crumb, index) => {
              const isLast = index === trail.length - 1
              return (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-content-secondary font-normal">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : crumb.href && crumb.href !== pathname ? (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="text-content-tertiary">{crumb.label}</span>
                    )}
                  </BreadcrumbItem>
                  {isLast ? null : <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-3">
        <h1 className="text-content-primary text-xl leading-7 font-semibold">{title}</h1>
        {figure}
        {actions ? (
          <div data-slot="finance-page-actions" className="ml-auto flex flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </header>
  )
}

/** Canvas under the header; sections stack with the design's 24px rhythm. */
function FinancePageBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="finance-page-body"
      className={cn("flex flex-1 flex-col gap-6 p-6", className)}
      {...props}
    />
  )
}

const headerFigureValueVariants = cva("text-content-primary tabular-nums", {
  variants: {
    size: {
      default: "text-sm leading-5 font-semibold",
      lg: "text-2xl leading-8 font-bold",
    },
  },
  defaultVariants: { size: "default" },
})

/** Label-over-value figure placed beside a page title. */
function HeaderFigure({
  className,
  label,
  size,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof headerFigureValueVariants> & { label: React.ReactNode }) {
  return (
    <div
      data-slot="header-figure"
      data-size={size ?? "default"}
      className={cn("flex flex-col", className)}
      {...props}
    >
      <span className="text-content-tertiary text-[13px] leading-5">{label}</span>
      <span className={headerFigureValueVariants({ size })}>{children}</span>
    </div>
  )
}

/** Inline facts about a record — kind, code, tax number, currency, terms. */
function MetaChips({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="meta-chips"
      className={cn(
        "text-content-tertiary flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] leading-5",
        className,
      )}
      {...props}
    />
  )
}

export { FinancePageBody, FinancePageHeader, HeaderFigure, MetaChips }
