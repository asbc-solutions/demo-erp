"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { CircleCheck, Link2, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { ACCEPT_ALL_FROM } from "../../lib/constants/reconciliation"
import { useReconciliationActions } from "../../lib/mutations/banking"
import { useReconciliation } from "../../lib/queries/banking"
import type { MatchSuggestion, ReconciliationWorkspace, StatementLine } from "../../lib/types/banking"
import { CreateEntryDialog } from "./create-entry-dialog"
import { ReconciliationLists, SuggestionPill } from "./reconciliation-lists"

/** Amounts within this are the same payment (rounding, small fees). */
const MATCH_TOLERANCE = 1

function SuggestionToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const t = useTranslations("FinanceBanking")
  return (
    <div role="group" aria-label={t("showSuggestions")} className="bg-surface-hover flex rounded-md p-0.5">
      {[
        { value: true, label: t("suggestions") },
        { value: false, label: t("none") },
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
  const t = useTranslations("FinanceBanking")
  const references = new Map(data.statement.items.map((line) => [line.id, line.reference]))
  if (data.causes.length === 0) return null
  return (
    <FinanceSection title={t("causesTitle")} description={t("causesDescription")}>
      <ul className="flex flex-col gap-2">
        {data.causes.map((cause) => (
          <li
            key={cause.id}
            className="border-stroke-default bg-surface-white flex flex-col gap-1 rounded-lg border px-4 py-3"
          >
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-content-primary text-[13px] leading-5 font-semibold tabular-nums">
                {t("linesCount", { count: cause.line_ids.length })}
              </span>
              <span className="text-content-secondary text-[13px] leading-5">{t(`cause.${cause.id}`)}</span>
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
  const t = useTranslations("FinanceBanking")
  if (data.matched.length === 0) return null
  return (
    <FinanceSection title={t("matchedCount", { count: data.matched_count })}>
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
                <span className="text-content-tertiary text-xs">
                  {t("differenceAmount", { amount: formatAmount(pair.difference) })}
                </span>
              ) : null}
            </span>
            {pair.auto ? (
              <span className="text-content-tertiary w-20 text-end text-xs">{t("bankFeed")}</span>
            ) : (
              <Button variant="ghost" size="sm" className="w-20" disabled={busy} onClick={() => onUnmatch(pair.line.id)}>
                {t("unmatch")}
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
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
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
      { onError: fail(t("matchFailed")) },
    )

  const matchSelected = () => {
    if (!line || !entry) return
    actions.match.mutate(
      { lineId: line.id, entryId: entry.id },
      {
        onSuccess: () => {
          toast.success(t("pairMatched", { reference: line.reference, entry: entry.entry }))
          setSelection({ line: null, entry: null })
        },
        onError: fail(t("matchFailed")),
      },
    )
  }

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("reconciliationTitle")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title={t("reconciliationTitle")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            title={t("onlyBanksTitle")}
            description={t("onlyBanksDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/reconciliation">{t("openReconciliation")}</Link>
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
        title={t("reconciliationTitle")}
        figure={
          data ? (
            <HeaderFigure size="lg" label={data.treasury.name}>
              {t("matchedOfTotal", { matched: data.matched_count, total: data.total_count })}
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            <>
              <Select value={treasuryId} onValueChange={(id) => router.push(`/finance/reconciliation/${id}`)}>
                <SelectTrigger aria-label={t("bankAccount")} className="h-9 w-64">
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
                        t("reconciliationFinished", {
                          name: data.treasury.name,
                          date: formatDate(result.last_reconciled),
                          count: result.reconciled_lines,
                        }),
                      ),
                    onError: fail(t("finishFailed")),
                  })
                }
              >
                {t("finishReconciliation")}
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label={t("loadingReconciliation")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : data.total_count === 0 ? (
          <EmptyState
            variant="card"
            icon={<CircleCheck />}
            title={t("nothingToReconcile", { name: data.treasury.name })}
            description={
              data.treasury.last_reconciled
                ? t("lastReconciledImport", { date: formatDate(data.treasury.last_reconciled) })
                : t("importToStart")
            }
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/reconciliation/import">{t("importAStatement")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("statementOutstanding", { currency: data.treasury.currency })}
                value={<Amount value={data.statement.total} align="start" signed />}
                caption={String(data.statement.count)}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("bookOutstanding", { currency: data.treasury.currency })}
                value={<Amount value={data.book.total} align="start" signed />}
                caption={String(data.book.count)}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("differenceIn", { currency: data.treasury.currency })}
                value={<Amount value={data.difference} align="start" signed />}
                caption={data.statement.count > 0 ? t("matchRemaining") : t("everyLineMatched")}
              />
            </div>

            <div className="bg-surface-hover border-stroke-default flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5">
              <Sparkles className="text-content-secondary size-4" aria-hidden />
              <SuggestionToggle on={showSuggestions} onChange={setShowSuggestions} />
              <span className="text-content-secondary text-[13px] leading-5">
                {showSuggestions
                  ? t("suggestedMatches", { count: data.suggestions.length })
                  : t("suggestionsHidden")}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ms-auto"
                disabled={!showSuggestions || bulk === 0 || busy}
                onClick={() =>
                  actions.acceptAll.mutate(ACCEPT_ALL_FROM, {
                    onSuccess: (result) => toast.success(t("suggestionsAccepted", { count: result.accepted })),
                    onError: fail(t("acceptAllFailed")),
                  })
                }
              >
                {t("acceptAllAbove", { percent: ACCEPT_ALL_FROM })}
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
                        {t("accept")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          actions.dismiss.mutate(
                            { lineId: top.line_id, entryId: top.entry_id },
                            { onError: fail(t("dismissFailed")) },
                          )
                        }
                      >
                        {t("dismiss")}
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
                <FinanceAlert tone="info">{t("noConfidentSuggestion")}</FinanceAlert>
              )
            ) : null}

            <div className="bg-surface-hover border-stroke-default flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5">
              <span className="text-content-secondary text-[13px] leading-5">{t("selectedPairDifference")}</span>
              <span className="text-content-primary text-[13px] leading-5 font-medium tabular-nums">
                {pairDifference === null ? "—" : formatAmount(pairDifference)}
              </span>
              {pairDifference !== null && !canMatch ? (
                <span className="text-status-danger-fg text-xs leading-4">{t("tooFarApart")}</span>
              ) : null}
              <Button variant="primary" size="sm" className="ms-auto" disabled={!canMatch || busy} onClick={() => setConfirmPair(true)}>
                <Link2 aria-hidden />
                {t("matchPair")}
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
                actions.unmatch.mutate(lineId, { onError: fail(t("unmatchFailed")) })
              }
            />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmPair} onOpenChange={setConfirmPair}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("matchConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("matchConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={matchSelected}>
              {t("matchPair")}
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
  const t = useTranslations("FinanceBanking")
  const { data: treasuries, isError, refetch } = useFinanceTreasuries()
  const fallback = React.useMemo(() => {
    const banks = (treasuries ?? []).filter((row) => row.kind === "bank")
    return [...banks].sort((a, b) => b.unmatched_lines - a.unmatched_lines)[0]?.id
  }, [treasuries])
  const id = treasuryId ?? fallback

  if (!id) {
    return (
      <>
        <FinancePageHeader title={t("reconciliationTitle")} />
        <FinancePageBody>
          {isError ? (
            <FinanceErrorState onRetry={() => refetch()} />
          ) : (
            <div aria-busy aria-label={t("loadingReconciliation")} className="flex flex-col gap-6">
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
