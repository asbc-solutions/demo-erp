import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/src/shared/lib/utils/utils"

function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  const t = useTranslations("Ui")
  return (
    <nav
      aria-label={t("breadcrumb")}
      data-slot="breadcrumb"
      {...props}
    />
  )
}

function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-content-tertiary flex flex-wrap items-center gap-1.5 text-sm leading-5",
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

type BreadcrumbLinkProps = React.ComponentProps<"a"> & {
  asChild?: boolean
  variant?: "default" | "link"
}

function BreadcrumbLink({
  asChild,
  className,
  variant = "default",
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "transition-colors outline-none focus-visible:underline",
        variant === "default" &&
          "text-content-tertiary hover:text-content-primary",
        variant === "link" && "text-brand-primary hover:underline",
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      data-slot="breadcrumb-page"
      className={cn("text-content-primary font-medium", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      aria-hidden
      data-slot="breadcrumb-separator"
      className={cn(
        "text-content-lightest inline-flex items-center [&>svg]:size-3.5",
        className,
      )}
      {...props}
    >
      {children ?? <ChevronRight className="rtl:rotate-180" />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const t = useTranslations("Common")
  return (
    <span
      aria-hidden
      data-slot="breadcrumb-ellipsis"
      className={cn(
        "text-content-tertiary flex size-9 items-center justify-center",
        className,
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">{t("more")}</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
