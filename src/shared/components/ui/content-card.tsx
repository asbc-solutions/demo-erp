import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Card } from "./card"

type ContentCardCategory =
  | "indigo"
  | "emerald"
  | "amber"
  | "blue"
  | "red"
  | "violet"
  | "neutral"

const categoryStyles: Record<ContentCardCategory, string> = {
  indigo: "bg-brand-primary/[0.08] text-brand-primary",
  emerald: "bg-brand-success/[0.08] text-brand-success",
  amber: "bg-brand-warning/[0.08] text-brand-warning",
  blue: "bg-brand-info/[0.08] text-brand-info",
  red: "bg-brand-danger/[0.08] text-brand-danger",
  violet: "bg-violet-500/[0.08] text-violet-600",
  neutral: "bg-surface-hover text-content-tertiary",
}

type ContentCardProps = Omit<React.ComponentProps<typeof Card>, "title"> & {
  category?: React.ReactNode
  categoryColor?: ContentCardCategory
  title: React.ReactNode
  description?: React.ReactNode
  ctaLabel?: React.ReactNode
  ctaHref?: string
  onCtaClick?: React.MouseEventHandler<HTMLAnchorElement>
}

function ContentCard({
  className,
  category,
  categoryColor = "indigo",
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  variant = "elevated",
  children,
  ...props
}: ContentCardProps) {
  return (
    <Card
      data-slot="content-card"
      variant={variant}
      className={cn("gap-2 px-5 pt-6 pb-5", className)}
      {...props}
    >
      {category && (
        <span
          data-slot="content-card-category"
          className={cn(
            "inline-flex w-fit items-center rounded-lg px-2 py-0.5 text-[10px] leading-4 font-semibold tracking-[0.5px] uppercase",
            categoryStyles[categoryColor],
          )}
        >
          {category}
        </span>
      )}
      <h4 className="text-content-primary text-sm leading-5 font-semibold">
        {title}
      </h4>
      {description && (
        <p className="text-content-tertiary text-xs leading-[19.5px]">
          {description}
        </p>
      )}
      {children}
      {ctaLabel && (
        <a
          href={ctaHref ?? "#"}
          onClick={onCtaClick}
          data-slot="content-card-cta"
          className="text-brand-primary mt-1 inline-flex items-center gap-1 text-xs leading-4 font-medium hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="size-3" />
        </a>
      )}
    </Card>
  )
}

export { ContentCard }
export type { ContentCardCategory, ContentCardProps }
