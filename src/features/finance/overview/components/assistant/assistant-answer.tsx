"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { ArrowRight, Copy, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { KeyValueList } from "../../../components/shared/key-value-list"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatTime } from "../../../lib/utils/date"
import type { AssistantAnswer } from "../../lib/types/assistant"

function AnswerTable({ table }: { table: NonNullable<AssistantAnswer["table"]> }) {
  return (
    <div className="border-stroke-default overflow-hidden rounded-lg border">
      <Table density="compact">
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            {table.columns.map((column) => (
              <TableHead key={column.id} className={cn(column.align === "end" && "text-end")}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow key={row.id}>
              {table.columns.map((column) => {
                const value = row[column.id]
                return (
                  <TableCell
                    key={column.id}
                    className={cn("text-content-primary", column.align === "end" && "text-end tabular-nums")}
                  >
                    {column.id === "href" ? (
                      <Link
                        href={String(value)}
                        className="text-content-secondary hover:text-brand-primary font-mono text-xs hover:underline"
                      >
                        {String(value)}
                      </Link>
                    ) : (
                      value
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="bg-surface-hover text-content-tertiary border-stroke-default border-t px-3 py-2 text-[13px] leading-5">
        {table.footnote}
      </p>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: NonNullable<AssistantAnswer["proposal"]> }) {
  const [dismissed, setDismissed] = React.useState(false)
  return (
    <section
      aria-label="Proposed action"
      className="border-brand-primary/40 bg-brand-primary/5 flex flex-col gap-3 rounded-xl border p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden className="text-brand-primary size-4" />
        <span className="text-content-primary text-sm leading-5 font-medium">
          Proposed action — review required
        </span>
        <StatusPill status="opened_in_screen" label={proposal.badge} />
      </div>
      <p className="text-content-secondary text-sm leading-5">{proposal.summary}</p>
      <KeyValueList items={proposal.facts.map((fact) => ({ term: fact.term, value: fact.value }))} />
      {dismissed ? (
        <StatusPill status="dismissed" className="w-fit" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" asChild>
            <Link href={proposal.action.href}>{proposal.action.label}</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      )}
    </section>
  )
}

function answerAsText(answer: AssistantAnswer): string {
  const lines = [answer.headline]
  if (answer.table) {
    lines.push(answer.table.columns.map((column) => column.label).join("\t"))
    for (const row of answer.table.rows) {
      lines.push(answer.table.columns.map((column) => String(row[column.id] ?? "")).join("\t"))
    }
    lines.push(answer.table.footnote)
  }
  return lines.join("\n")
}

/**
 * One grounded answer: headline, the screen it matches, the figures, links to
 * the source screens and — never applied by the assistant — a proposed action.
 */
function AssistantAnswerView({ answer }: { answer: AssistantAnswer }) {
  const [panel, setPanel] = React.useState<"why" | "sources" | null>(null)
  const panelId = React.useId()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answerAsText(answer))
      toast.success("Answer copied.")
    } catch {
      toast.error("The answer could not be copied. Select the text and copy it instead.")
    }
  }

  return (
    <article
      aria-label="Assistant answer"
      data-slot="assistant-answer"
      className="border-brand-primary flex flex-col gap-3 border-s-2 ps-4"
    >
      <div className="text-content-tertiary flex items-center gap-1.5 text-[13px] leading-5">
        <Sparkles aria-hidden className="size-3.5" />
        Assistant · {formatTime(answer.answered_at)}
      </div>
      <p className="text-content-primary text-base leading-6 font-semibold">{answer.headline}</p>
      {answer.matches ? (
        <StatusPill status="matched" label={`Matches ${answer.matches}`} className="w-fit" />
      ) : answer.limited ? (
        <StatusPill status="expired" label="Limited access" className="w-fit" />
      ) : null}

      {answer.table ? <AnswerTable table={answer.table} /> : null}

      {answer.links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {answer.links.map((link) => (
            <Button key={link.href + link.label} variant="secondary" size="sm" asChild>
              <Link href={link.href}>
                {link.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          ))}
        </div>
      ) : null}

      {answer.proposal ? <ProposalCard proposal={answer.proposal} /> : null}

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={panel === "why"}
          aria-controls={panelId}
          onClick={() => setPanel((current) => (current === "why" ? null : "why"))}
        >
          Why this answer?
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={panel === "sources"}
          aria-controls={panelId}
          onClick={() => setPanel((current) => (current === "sources" ? null : "sources"))}
        >
          Sources ({answer.sources})
        </Button>
        <Button variant="ghost" size="sm" onClick={copy}>
          <Copy aria-hidden />
          Copy
        </Button>
      </div>

      {panel ? (
        <div
          id={panelId}
          className="bg-surface-hover text-content-secondary rounded-lg px-4 py-3 text-[13px] leading-5"
        >
          {panel === "why" ? (
            answer.grounding.length > 0 ? (
              <p>
                Every figure above was read from{" "}
                {answer.grounding.map((source) => source.label).join(", ")}
                {answer.not_read.length > 0
                  ? `. It did not read ${answer.not_read.join(" or ")}.`
                  : "."}
              </p>
            ) : (
              <p>No finance screen could answer this, so nothing was read.</p>
            )
          ) : (
            <ul className="flex flex-col gap-1">
              {answer.grounding.length === 0 ? <li>No sources were read.</li> : null}
              {answer.grounding.map((source) => (
                <li key={source.label} className="flex justify-between gap-4">
                  <span>{source.label}</span>
                  <span className="text-content-tertiary">{source.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  )
}

export { AssistantAnswerView }
