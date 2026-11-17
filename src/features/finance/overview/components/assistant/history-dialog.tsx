"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useAssistantHistory } from "../../lib/queries/overview"
import type { AssistantConversation } from "../../lib/types/assistant"

/** The finance demo's "today"; conversations are grouped relative to it. */
const TODAY = "2026-03-31"
const YESTERDAY = "2026-03-30"

function dayLabel(
  askedAt: string,
  tCommon: ReturnType<typeof useTranslations<"Common">>,
  formatDate: FinanceDateFormat["formatDate"],
): string {
  const day = askedAt.slice(0, 10)
  if (day === TODAY) return tCommon("today")
  if (day === YESTERDAY) return tCommon("yesterday")
  return formatDate(day)
}

type HistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  retentionDays: number
  onPick: (question: string) => void
}

/** Past conversations, each with the scope it was asked under. Picking one asks it again. */
function HistoryDialog({ open, onOpenChange, retentionDays, onPick }: HistoryDialogProps) {
  const t = useTranslations("FinanceAssistant")
  const tCommon = useTranslations("Common")
  const { formatDate, formatTime } = useFinanceDateFormat()
  const [query, setQuery] = React.useState("")
  const { data: conversations } = useAssistantHistory(open)
  const searchId = React.useId()

  const term = query.trim().toLowerCase()
  const visible = (conversations ?? []).filter((conversation) =>
    conversation.question.toLowerCase().includes(term),
  )
  const groups = visible.reduce<Map<string, AssistantConversation[]>>((acc, conversation) => {
    const label = dayLabel(conversation.asked_at, tCommon, formatDate)
    acc.set(label, [...(acc.get(label) ?? []), conversation])
    return acc
  }, new Map())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("history")}</DialogTitle>
          <DialogDescription>{t("historyDescription", { days: retentionDays })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-1">
            <Label htmlFor={searchId} className="text-content-secondary text-[13px] font-normal">
              {t("searchConversations")}
            </Label>
            <Input
              id={searchId}
              type="search"
              placeholder={t("searchConversationsPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {!conversations ? (
            <Skeleton aria-busy aria-label={t("loadingHistory")} className="h-40 rounded-lg" />
          ) : visible.length === 0 ? (
            <p className="text-content-tertiary py-6 text-center text-sm">
              {t("noConversationMatches", { query: query.trim() })}
            </p>
          ) : (
            Array.from(groups.entries()).map(([label, items]) => (
              <section key={label} aria-label={label} className="flex flex-col">
                <h3 className="text-content-tertiary pb-1 text-[13px] leading-5">{label}</h3>
                <ul className="flex flex-col">
                  {items.map((conversation) => (
                    <li key={conversation.id} className="border-stroke-default border-b">
                      <button
                        type="button"
                        onClick={() => onPick(conversation.question)}
                        className="hover:bg-surface-hover/60 focus-visible:bg-surface-hover -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-start outline-none"
                      >
                        <span className="text-content-primary min-w-0 flex-1 truncate text-sm leading-5">
                          {conversation.question}
                        </span>
                        {conversation.scope_label ? (
                          <StatusPill status="pending" label={conversation.scope_label} />
                        ) : null}
                        <span className="text-content-tertiary w-11 shrink-0 text-end text-[13px] tabular-nums">
                          {formatTime(conversation.asked_at)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { HistoryDialog }
