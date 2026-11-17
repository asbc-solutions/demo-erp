"use client"

import * as React from "react"
import { Download } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { DRAFT_STATUS_OPTIONS } from "../../lib/constants/assistant"
import { useAssistantDrafts } from "../../lib/queries/overview"
import type { AssistantDraft } from "../../lib/types/assistant"

function actedLabel(draft: AssistantDraft, { formatShortDate, formatShortDateTime }: FinanceDateFormat): string {
  if (!draft.acted_at) return "—"
  return draft.acted_note
    ? `${formatShortDate(draft.acted_at)} (${draft.acted_note})`
    : formatShortDateTime(draft.acted_at)
}

type AssistantT = ReturnType<typeof useTranslations<"FinanceAssistant">>
type SharedT = ReturnType<typeof useTranslations<"FinanceShared">>

function draftColumns(t: AssistantT, dateFormat: FinanceDateFormat): FinanceColumn<AssistantDraft>[] {
  return [
    { id: "proposed", header: t("colProposed"), cell: (row) => dateFormat.formatShortDateTime(row.proposed_at) },
    { id: "type", header: t("colType"), cell: (row) => row.type },
    { id: "record", header: t("colRecord"), cell: (row) => <DocNumber className="text-xs">{row.record}</DocNumber> },
    {
      id: "conversation",
      header: t("colConversation"),
      cell: (row) => <span className="block max-w-56 truncate">{row.conversation}</span>,
    },
    { id: "status", header: t("colStatus"), cell: (row) => <StatusPill status={row.status} /> },
    { id: "acted-by", header: t("colActedBy"), cell: (row) => row.acted_by ?? "—" },
    { id: "acted", header: t("colActed"), cell: (row) => actedLabel(row, dateFormat) },
    {
      id: "result",
      header: t("colResult"),
      cell: (row) => <span className="block max-w-64 truncate">{row.result}</span>,
    },
  ]
}

function toCsv(rows: AssistantDraft[], t: AssistantT, tShared: SharedT, dateFormat: FinanceDateFormat): string {
  const header = [
    t("colProposed"),
    t("colType"),
    t("colRecord"),
    t("colConversation"),
    t("colStatus"),
    t("colActedBy"),
    t("colActed"),
    t("colResult"),
  ]
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = rows.map((row) =>
    [
      dateFormat.formatShortDateTime(row.proposed_at),
      row.type,
      row.record,
      row.conversation,
      tShared(`status.${row.status}`),
      row.acted_by ?? "",
      actedLabel(row, dateFormat),
      row.result,
    ]
      .map(escape)
      .join(","),
  )
  return [header.map(escape).join(","), ...lines].join("\n")
}

/** Drafts — every action the assistant proposed and what people did with it. */
function DraftsTab({ scopeLabel }: { scopeLabel: string }) {
  const t = useTranslations("FinanceAssistant")
  const tShared = useTranslations("FinanceShared")
  const dateFormat = useFinanceDateFormat()
  const [status, setStatus] = React.useState("all")
  const { data: drafts, isError, refetch } = useAssistantDrafts(status)

  const exportCsv = () => {
    if (!drafts) return
    const url = URL.createObjectURL(
      new Blob([toCsv(drafts, t, tShared, dateFormat)], { type: "text/csv;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "assistant-proposals.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-content-secondary text-sm leading-5">{t("draftsIntro")}</p>
        <div className="ms-auto flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label={t("filterByStatus")} className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRAFT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" disabled={!drafts?.length} onClick={exportCsv}>
            <Download aria-hidden />
            {t("export")}
          </Button>
        </div>
      </div>

      {isError ? (
        <FinanceErrorState onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-2">
          <FinanceTable
            caption={t("draftsCaption")}
            columns={draftColumns(t, dateFormat)}
            rows={drafts ?? []}
            loading={!drafts}
            getRowId={(row) => row.id}
            empty={
              <p className="text-content-tertiary py-8 text-center text-sm">{t("draftsEmpty")}</p>
            }
          />
          <p className="text-content-tertiary text-[13px] leading-5">
            {t("draftsFooter", { scope: scopeLabel, count: drafts?.length ?? 0 })}
          </p>
        </div>
      )}
    </div>
  )
}

export { DraftsTab }
