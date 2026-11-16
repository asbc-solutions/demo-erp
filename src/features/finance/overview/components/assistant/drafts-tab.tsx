"use client"

import * as React from "react"
import { Download } from "lucide-react"

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
import { formatShortDate, formatShortDateTime } from "../../../lib/utils/date"
import { DRAFT_STATUS_OPTIONS } from "../../lib/constants/assistant"
import { useAssistantDrafts } from "../../lib/queries/overview"
import type { AssistantDraft } from "../../lib/types/assistant"

function actedLabel(draft: AssistantDraft): string {
  if (!draft.acted_at) return "—"
  return draft.acted_note
    ? `${formatShortDate(draft.acted_at)} (${draft.acted_note})`
    : formatShortDateTime(draft.acted_at)
}

const COLUMNS: FinanceColumn<AssistantDraft>[] = [
  { id: "proposed", header: "Proposed", cell: (row) => formatShortDateTime(row.proposed_at) },
  { id: "type", header: "Type", cell: (row) => row.type },
  { id: "record", header: "Record", cell: (row) => <DocNumber className="text-xs">{row.record}</DocNumber> },
  {
    id: "conversation",
    header: "Conversation",
    cell: (row) => <span className="block max-w-56 truncate">{row.conversation}</span>,
  },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  { id: "acted-by", header: "Acted by", cell: (row) => row.acted_by ?? "—" },
  { id: "acted", header: "Acted", cell: actedLabel },
  {
    id: "result",
    header: "Result",
    cell: (row) => <span className="block max-w-64 truncate">{row.result}</span>,
  },
]

function toCsv(rows: AssistantDraft[]): string {
  const header = ["Proposed", "Type", "Record", "Conversation", "Status", "Acted by", "Acted", "Result"]
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = rows.map((row) =>
    [
      formatShortDateTime(row.proposed_at),
      row.type,
      row.record,
      row.conversation,
      row.status.replace(/_/g, " "),
      row.acted_by ?? "",
      actedLabel(row),
      row.result,
    ]
      .map(escape)
      .join(","),
  )
  return [header.map(escape).join(","), ...lines].join("\n")
}

/** Drafts — every action the assistant proposed and what people did with it. */
function DraftsTab({ scopeLabel }: { scopeLabel: string }) {
  const [status, setStatus] = React.useState("all")
  const { data: drafts, isError, refetch } = useAssistantDrafts(status)

  const exportCsv = () => {
    if (!drafts) return
    const url = URL.createObjectURL(new Blob([toCsv(drafts)], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "assistant-proposals.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-content-secondary text-sm leading-5">
          Every action the assistant proposed, who reviewed it, and what it became. Nothing here was
          applied by the assistant.
        </p>
        <div className="ms-auto flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status" className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRAFT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" disabled={!drafts?.length} onClick={exportCsv}>
            <Download aria-hidden />
            Export
          </Button>
        </div>
      </div>

      {isError ? (
        <FinanceErrorState onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-2">
          <FinanceTable
            caption="Actions the assistant proposed"
            columns={COLUMNS}
            rows={drafts ?? []}
            loading={!drafts}
            getRowId={(row) => row.id}
            empty={
              <p className="text-content-tertiary py-8 text-center text-sm">
                No proposals have this status.
              </p>
            }
          />
          <p className="text-content-tertiary text-[13px] leading-5">
            Scope: {scopeLabel} · {drafts?.length ?? 0} proposals · every row has an Audit log entry
          </p>
        </div>
      )}
    </div>
  )
}

export { DraftsTab }
