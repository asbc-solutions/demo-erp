"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatAmount } from "../../../lib/utils/money"
import { SUGGESTION_TONE } from "../../lib/constants/reconciliation"
import type { BookEntry, MatchSuggestion, StatementLine } from "../../lib/types/banking"

const dayMonth = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, { day: "2-digit", month: "short", timeZone: "UTC" })

type Line = { id: string; date: string; description: string; reference: string; amount: number }

function SuggestionPill({ suggestion }: { suggestion: MatchSuggestion }) {
  const t = useTranslations("FinanceBanking")
  return (
    <StatusPill
      status={`match-${suggestion.label}`}
      label={t("suggestionScore", { score: suggestion.score, label: t(`suggestionLabel.${suggestion.label}`) })}
      tone={SUGGESTION_TONE[suggestion.label]}
    />
  )
}

function LineRow({
  line,
  selected,
  suggestion,
  onSelect,
  action,
}: {
  line: Line
  selected: boolean
  suggestion?: MatchSuggestion
  onSelect: () => void
  action?: React.ReactNode
}) {
  const locale = useIntlLocale()
  return (
    <li
      data-selected={selected || undefined}
      data-suggested={suggestion ? "" : undefined}
      className={cn(
        "border-stroke-light flex items-center gap-3 border-b border-s-2 border-s-transparent px-3 py-2.5 last:border-b-0",
        suggestion && "bg-status-info-bg border-s-status-info-fg/40",
        selected && "bg-brand-primary/10 border-s-brand-primary",
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-sm text-start outline-none focus-visible:ring-2"
      >
        <span className="text-content-secondary w-12 shrink-0 text-[13px] leading-5">{dayMonth(line.date, locale)}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-content-primary truncate text-[13px] leading-5">{line.description}</span>
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-content-secondary font-mono text-xs leading-4">{line.reference}</span>
            {suggestion ? <SuggestionPill suggestion={suggestion} /> : null}
          </span>
        </span>
        <Amount value={line.amount} signed className="text-[13px] leading-5" />
      </button>
      {action}
    </li>
  )
}

function ColumnShell({
  title,
  count,
  total,
  children,
  empty,
}: {
  title: string
  count: number
  total: number
  children: React.ReactNode
  empty: string
}) {
  return (
    <section
      aria-label={title}
      className="border-stroke-default bg-surface-white flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-xs"
    >
      <header className="bg-surface-hover border-stroke-default flex items-center justify-between gap-3 border-b px-3 py-2.5">
        <h3 className="text-content-primary text-[13px] leading-5 font-medium">{title}</h3>
        <span className="flex items-center gap-3 text-[13px] leading-5">
          <span className="text-content-tertiary tabular-nums">{count}</span>
          <Amount value={total} signed />
        </span>
      </header>
      {count === 0 ? (
        <p className="text-content-tertiary px-3 py-8 text-center text-[13px]">{empty}</p>
      ) : (
        <ul className="max-h-[36rem] overflow-y-auto">{children}</ul>
      )}
    </section>
  )
}

type ListsProps = {
  statement: { items: StatementLine[]; count: number; total: number }
  book: { items: BookEntry[]; count: number; total: number }
  suggestionByLine: Map<string, MatchSuggestion>
  suggestionByEntry: Map<string, MatchSuggestion>
  selectedLineId: string | null
  selectedEntryId: string | null
  onSelectLine: (id: string) => void
  onSelectEntry: (id: string) => void
  onCreateEntry: (line: StatementLine) => void
}

/** The two sides of the reconciliation: what the bank says, and what the books say. */
function ReconciliationLists({
  statement,
  book,
  suggestionByLine,
  suggestionByEntry,
  selectedLineId,
  selectedEntryId,
  onSelectLine,
  onSelectEntry,
  onCreateEntry,
}: ListsProps) {
  const t = useTranslations("FinanceBanking")
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <ColumnShell
        title={t("bankStatement")}
        count={statement.count}
        total={statement.total}
        empty={t("everyLineMatchedPeriod")}
      >
        {statement.items.map((line) => (
          <LineRow
            key={line.id}
            line={line}
            selected={selectedLineId === line.id}
            suggestion={suggestionByLine.get(line.id)}
            onSelect={() => onSelectLine(line.id)}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateEntry(line)}
                aria-label={t("createEntryFrom", { reference: line.reference, amount: formatAmount(line.amount) })}
              >
                {t("createEntry")}
              </Button>
            }
          />
        ))}
      </ColumnShell>
      <ColumnShell title={t("bookEntries")} count={book.count} total={book.total} empty={t("everyEntryMatched")}>
        {book.items.map((entry) => (
          <LineRow
            key={entry.id}
            line={{ ...entry, reference: entry.entry }}
            selected={selectedEntryId === entry.id}
            suggestion={suggestionByEntry.get(entry.id)}
            onSelect={() => onSelectEntry(entry.id)}
          />
        ))}
      </ColumnShell>
    </div>
  )
}

export { ReconciliationLists, SuggestionPill, dayMonth }
