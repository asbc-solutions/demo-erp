"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { CircleCheck, Link2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { ACCEPT_ALL_FROM, CAUSE_COPY } from "../../lib/constants/reconciliation"
import { useReconciliationActions } from "../../lib/mutations/banking"
import { useReconciliation } from "../../lib/queries/banking"
import type { MatchSuggestion, ReconciliationWorkspace, StatementLine } from "../../lib/types/banking"
import { CreateEntryDialog } from "./create-entry-dialog"
import { ReconciliationLists, SuggestionPill } from "./reconciliation-lists"

/** Amounts within this are the same payment (rounding, small fees). */
const MATCH_TOLERANCE = 1

function SuggestionToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div role="group" aria-label="Show suggestions" className="bg-surface-hover flex rounded-md p-0.5">
      {[
        { value: true, label: "Suggestions" },
        { value: false, label: "None" },
      ].map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={on === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "text-content-secondary focus-visible:ring-ring rounded-sm px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
            on === option.value && "bg-surface-white text-content-primary font-medium shadow-xs",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Causes({ data }: { data: ReconciliationWorkspace }) {
  const references = new Map(data.statement.items.map((line) => [line.id, line.reference]))
  if (data.causes.length === 0) return null
  return (
    <FinanceSection
      title="Why these have not matched"
      description="Grouped by cause, so a batch is dealt with once rather than line by line."
    >
      <ul className="flex flex-col gap-2">
        {data.causes.map((cause) => (
          <li
            key={cause.id}
            className="border-stroke-default bg-surface-white flex flex-col gap-1 rounded-lg border px-4 py-3"
          >
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-content-primary text-[13px] leading-5 font-semibold tabular-nums">
                {cause.line_ids.length} {cause.line_ids.length === 1 ? "line" : "lines"}
              </span>
              <span className="text-content-secondary text-[13px] leading-5">{CAUSE_COPY[cause.id]}</span>
            </span>
            <span className="text-content-tertiary font-mono text-xs leading-4">
              {cause.line_ids.map((id) => references.get(id) ?? id).join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    </FinanceSection>
  )
}

function Matched({ data, onUnmatch, busy }: { data: ReconciliationWorkspace; onUnmatch: (lineId: string) => void; busy: boolean }) {
  if (data.matched.length === 0) return null
  return (
    <FinanceSection title={`Matched (${data.matched_count})`}>
      <ul className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
        {data.matched.map((pair) => (
          <li key={pair.line.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 text-[13px] leading-5">
            <span className="flex min-w-48 flex-1 flex-col">
              <span className="text-content-primary">{pair.line.description}</span>
              <span className="text-content-secondary font-mono text-xs">{pair.line.reference}</span>
            </span>
            <span className="flex min-w-48 flex-1 flex-col">
              <span className="text-content-primary">{pair.entry.description}</span>
              <span className="text-content-secondary font-mono text-xs">{pair.entry.entry}</span>
            </span>
            <span className="flex flex-col items-end">
              <Amount value={pair.line.amount} signed />
              {Math.abs(pair.difference) > 0.004 ? (
                <span className="text-content-tertiary text-xs">Difference {formatAmount(pair.difference)}</span>
              ) : null}
            </span>
            {pair.auto ? (
              <span className="text-content-tertiary w-20 text-end text-xs">Bank feed</span>
            ) : (
              <Button variant="ghost" size="sm" className="w-20" disabled={busy} onClick={() => onUnmatch(pair.line.id)}>
                Unmatch
              </Button>
            )}
          </li>
        ))}
      </ul>
    </FinanceSection>
  )
}

/**
 * 04.04 / 04.05 · Bank reconciliation — pair each statement line with its book
 * entry, accept suggestions, or create the entry the ledger is missing.
 */
function ReconciliationWorkspaceView({ treasuryId }: { treasuryId: string }) {
  const router = useRouter()
  const { data, isError, isPending, refetch } = useReconciliation(treasuryId)
  const actions = useReconciliationActions(treasuryId)
  const [showSuggestions, setShowSuggestions] = React.useState(true)
  const [selection, setSelection] = React.useState<{ line: string | null; entry: string | null }>({ line: null, entry: null })
  const [confirmPair, setConfirmPair] = React.useState(false)
  const [entryFor, setEntryFor] = React.useState<StatementLine | null>(null)

  const busy =
    actions.match.isPending ||
    actions.acceptAll.isPending ||
    actions.dismiss.isPending ||
    actions.unmatch.isPending ||
    actions.finish.isPending

  // A selection only counts while its line is still open.
  const line = data?.statement.items.find((row) => row.id === selection.line) ?? null
  const entry = data?.book.items.find((row) => row.id === selection.entry) ?? null
  const pairDifference = line && entry ? round2(line.amount - entry.amount) : null
  const canMatch = pairDifference !== null && Math.abs(pairDifference) <= MATCH_TOLERANCE

  const suggestions = showSuggestions ? (data?.suggestions ?? []) : []
  const suggestionByLine = new Map(suggestions.map((suggestion) => [suggestion.line_id, suggestion]))
  const suggestionByEntry = new Map(suggestions.map((suggestion) => [suggestion.entry_id, suggestion]))
  const top = suggestions[0]
  const bulk = suggestions.filter((suggestion) => suggestion.score >= ACCEPT_ALL_FROM).length

  const fail = (fallback: string) => (error: unknown) => toast.error(errorMessage(error, fallback))

  const accept = (suggestion: MatchSuggestion) =>
    actions.match.mutate(
      { lineId: suggestion.line_id, entryId: suggestion.entry_id },
      { onError: fail("The pair could not be matched. Try again.") },
    )

  const matchSelected = () => {
    if (!line || !entry) return
    actions.match.mutate(
      { lineId: line.id, entryId: entry.id },
      {
        onSuccess: () => {
          toast.success(`${line.reference} is matched to ${entry.entry}.`)
          setSelection({ line: null, entry: null })
        },
        onError: fail("The pair could not be matched. Try again."),
      },
    )
  }

  if (isError) {
    return (
      <>
        <FinancePageHeader title="Bank reconciliation" />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title="Bank reconciliation" />
        <FinancePageBody>
          <EmptyState
            variant="card"
            title="Only bank accounts are reconciled here."
            description="Cash treasuries are counted, not reconciled against a statement. Pick a bank account."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/reconciliation">Open Bank reconciliation</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title="Bank reconciliation"
        figure={
          data ? (
            <HeaderFigure size="lg" label={data.treasury.name}>
              {data.matched_count}/{data.total_count} matched
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            <>
              <Select value={treasuryId} onValueChange={(id) => router.push(`/finance/reconciliation/${id}`)}>
                <SelectTrigger aria-label="Bank account" className="h-9 w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.unmatched_lines > 0 ? ` · ${account.unmatched_lines}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="primary"
                disabled={!data.can_finish || busy}
                onClick={() =>
                  actions.finish.mutate(undefined, {
                    onSuccess: (result) =>
                      toast.success(
                        `${data.treasury.name} is reconciled to ${formatDate(result.last_reconciled)} (${result.reconciled_lines} lines).`,
                      ),
                    onError: fail("The reconciliation could not be finished. Try again."),
                  })
                }
              >
                Finish reconciliation
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label="Loading reconciliation" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : data.total_count === 0 ? (
          <EmptyState
            variant="card"
            icon={<CircleCheck />}
            title={`${data.treasury.name} has nothing to reconcile.`}
            description={
              data.treasury.last_reconciled
                ? `It was last reconciled on ${formatDate(data.treasury.last_reconciled)}. Import a statement to start the next one.`
                : "Import a statement to start reconciling."
            }
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/reconciliation/import">Import a statement</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={`Statement outstanding (${data.treasury.currency})`}
                value={<Amount value={data.statement.total} align="start" signed />}
                caption={String(data.statement.count)}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={`Book outstanding (${data.treasury.currency})`}
                value={<Amount value={data.book.total} align="start" signed />}
                caption={String(data.book.count)}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={`Difference (${data.treasury.currency})`}
                value={<Amount value={data.difference} align="start" signed />}
                caption={data.statement.count > 0 ? "Match remaining lines" : "Every statement line is matched"}
              />
            </div>

            <div className="bg-surface-hover border-stroke-default flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5">
              <Sparkles className="text-content-secondary size-4" aria-hidden />
              <SuggestionToggle on={showSuggestions} onChange={setShowSuggestions} />
              <span className="text-content-secondary text-[13px] leading-5">
                {showSuggestions
                  ? `${data.suggestions.length} suggested ${data.suggestions.length === 1 ? "match" : "matches"}`
                  : "Suggestions hidden — match by hand"}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ms-auto"
                disabled={!showSuggestions || bulk === 0 || busy}
                onClick={() =>
                  actions.acceptAll.mutate(ACCEPT_ALL_FROM, {
                    onSuccess: (result) => toast.success(`${result.accepted} suggested pairs were matched.`),
                    onError: fail("The suggestions could not be accepted. Try again."),
                  })
                }
              >
                Accept all above {ACCEPT_ALL_FROM}%
              </Button>
            </div>

            {showSuggestions ? (
              top ? (
                <FinanceAlert
                  tone="info"
                  action={
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" disabled={busy} onClick={() => accept(top)}>
                        <CircleCheck aria-hidden />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          actions.dismiss.mutate(
                            { lineId: top.line_id, entryId: top.entry_id },
                            { onError: fail("The suggestion could not be dismissed. Try again.") },
                          )
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  }
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <SuggestionPill suggestion={top} />
                    <span className="text-status-info-fg">{top.reasons.join(" · ")}</span>
                  </span>
                </FinanceAlert>
              ) : (
                <FinanceAlert tone="info">
                  No confident suggestion for the lines left. Match them by hand, or create an entry for a
                  statement line the ledger has never seen.
                </FinanceAlert>
              )
            ) : null}

            <div className="bg-surface-hover border-stroke-default flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5">
              <span className="text-content-secondary text-[13px] leading-5">Selected pair difference</span>
              <span className="text-content-primary text-[13px] leading-5 font-medium tabular-nums">
                {pairDifference === null ? "—" : formatAmount(pairDifference)}
              </span>
              {pairDifference !== null && !canMatch ? (
                <span className="text-status-danger-fg text-xs leading-4">
                  Too far apart to match. Create an entry for the difference, or pick another pair.
                </span>
              ) : null}
              <Button variant="primary" size="sm" className="ms-auto" disabled={!canMatch || busy} onClick={() => setConfirmPair(true)}>
                <Link2 aria-hidden />
                Match pair
              </Button>
            </div>

            <ReconciliationLists
              statement={data.statement}
              book={data.book}
              suggestionByLine={suggestionByLine}
              suggestionByEntry={suggestionByEntry}
              selectedLineId={line?.id ?? null}
              selectedEntryId={entry?.id ?? null}
              onSelectLine={(id) => setSelection((current) => ({ ...current, line: current.line === id ? null : id }))}
              onSelectEntry={(id) => setSelection((current) => ({ ...current, entry: current.entry === id ? null : id }))}
              onCreateEntry={setEntryFor}
            />

            <Causes data={data} />
            <Matched
              data={data}
              busy={busy}
              onUnmatch={(lineId) =>
                actions.unmatch.mutate(lineId, { onError: fail("The pair could not be unmatched. Try again.") })
              }
            />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmPair} onOpenChange={setConfirmPair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Match these two lines?</AlertDialogTitle>
            <AlertDialogDescription>
              Matching marks the statement line and the book entry as reconciled against each other. It changes
              no ledger figure. You can unmatch them again until the reconciliation is finished.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={matchSelected}>
              Match pair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateEntryDialog treasuryId={treasuryId} line={entryFor} onOpenChange={(open) => !open && setEntryFor(null)} />
    </>
  )
}

/**
 * `/finance/reconciliation` opens the bank account with the most unmatched
 * lines; `/finance/reconciliation/[accountId]` opens that account.
 */
function ReconciliationPage({ treasuryId }: { treasuryId?: string }) {
  const { data: treasuries, isError, refetch } = useFinanceTreasuries()
  const fallback = React.useMemo(() => {
    const banks = (treasuries ?? []).filter((row) => row.kind === "bank")
    return [...banks].sort((a, b) => b.unmatched_lines - a.unmatched_lines)[0]?.id
  }, [treasuries])
  const id = treasuryId ?? fallback

  if (!id) {
    return (
      <>
        <FinancePageHeader title="Bank reconciliation" />
        <FinancePageBody>
          {isError ? (
            <FinanceErrorState onRetry={() => refetch()} />
          ) : (
            <div aria-busy aria-label="Loading reconciliation" className="flex flex-col gap-6">
              <FinanceTilesSkeleton />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          )}
        </FinancePageBody>
      </>
    )
  }

  return <ReconciliationWorkspaceView key={id} treasuryId={id} />
}

export { ReconciliationPage }
