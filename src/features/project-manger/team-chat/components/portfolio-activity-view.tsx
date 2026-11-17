"use client"

import { MessagesSquare } from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Card } from "@/src/shared/components/ui/card"

import { usePortfolioActivity } from "../../lib/queries/collaboration"

function formatTime(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "All projects" scope of Team Chat — the cross-project team feed. */
export function PortfolioActivityView() {
  const t = useTranslations("ProjectsTeamChat")
  const locale = useIntlLocale()
  const { data, isLoading, isError } = usePortfolioActivity(50)
  const items = data ?? []

  return (
    <Card className="flex min-h-[420px] flex-col overflow-hidden p-0">
      <div className="border-stroke-default flex items-center gap-2 border-b px-5 py-3">
        <MessagesSquare className="text-content-tertiary size-4" aria-hidden />
        <span className="text-content-primary text-sm font-semibold">
          {t("title")}
        </span>
        <span className="text-content-tertiary text-xs">{t("subtitle")}</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-muted h-12 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-content-tertiary text-sm">
            {t("loadFailed")}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <MessagesSquare className="text-content-quaternary size-8" aria-hidden />
          <p className="text-content-tertiary text-sm">
            {t("empty")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-stroke-default flex gap-3 border-b px-5 py-3.5 last:border-b-0"
            >
              <Avatar color="primary" className="size-8 shrink-0 text-[11px]">
                {item.author.initials}
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-content-primary text-[13px] font-semibold">
                    {item.author.name}
                  </span>
                  <span className="bg-surface-muted text-content-tertiary rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                    {item.project_name}
                  </span>
                  <span className="text-content-quaternary text-[11px]">
                    {formatTime(item.occurred_at, locale)}
                  </span>
                </div>
                <p className="text-content-secondary text-[13px] leading-[20px] whitespace-pre-wrap">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
