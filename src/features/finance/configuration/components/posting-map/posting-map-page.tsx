"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { ArrowRight } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { AccountSelect } from "../../../components/shared/account-select"
import { ColumnChooser, GroupBySelect } from "../../../components/shared/filter-bar"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useDiscardStaged, usePublishMap, useStageRule } from "../../lib/mutations/configuration"
import { usePostingMap } from "../../lib/queries/configuration"
import type { PostingMap, PostingRule, RuleSide, StageInput } from "../../lib/types/configuration"

const NO_TAX = "none"

type View = "current" | "compare"

function effective(rule: PostingRule): RuleSide {
  return rule.staged ?? rule.current
}

function AccountCell({ code, name }: { code: string | null; name: string | null }) {
  if (!code) return <StatusPill status="blocked" label="Not routed" tone="danger" />
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-xs">{code}</span>
      <span className="text-content-secondary">{name}</span>
    </span>
  )
}

function TaxCell({ side }: { side: RuleSide }) {
  if (!side.tax_code) return <span className="text-content-tertiary">—</span>
  return (
    <span className="font-mono text-xs">
      {side.tax_code}
      {side.tax_rate !== null ? <span className="text-content-tertiary font-sans"> · {side.tax_rate}%</span> : null}
    </span>
  )
}

/** One editable cell: stages the change as soon as it is picked. */
function useStage() {
  const stage = useStageRule()
  return (rule: PostingRule, input: StageInput) =>
    stage.mutate(
      { id: rule.id, input },
      { onError: (error) => toast.error(errorMessage(error, "The change could not be staged. Try again.")) },
    )
}

function Before({ before, after }: { before: React.ReactNode; after: React.ReactNode }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-content-tertiary line-through decoration-1">{before}</span>
      <ArrowRight className="text-content-tertiary size-3" aria-hidden />
      <span className="text-content-primary">{after}</span>
    </span>
  )
}

/** 11.03 · Posting map — how each document event becomes a balanced entry, edited by staging and publishing. */
function PostingMapPage() {
  const { data, isError, refetch } = usePostingMap()
  const discard = useDiscardStaged()
  const publish = usePublishMap()
  const stage = useStage()
  const [editing, setEditing] = React.useState(false)
  const [view, setView] = React.useState<View>("current")
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>(["changed"])
  const [confirming, setConfirming] = React.useState(false)

  const taxOptions = data?.tax_codes ?? []

  const columns: FinanceColumn<PostingRule>[] = [
    {
      id: "event",
      header: "Document event",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="text-content-primary font-medium">{row.event}</span>
          {row.staged ? <StatusPill status="changed" label="Changed" tone="info" /> : null}
        </span>
      ),
    },
    { id: "module", header: "Module", cell: (row) => <span className="text-content-secondary text-xs">{row.module}</span> },
    {
      id: "debit",
      header: "Debit account",
      cell: (row) =>
        editing ? (
          <AccountSelect
            aria-label={`Debit account for ${row.event}`}
            value={effective(row).debit_account ?? ""}
            placeholder="Not routed"
            onValueChange={(code) => stage(row, { debit_account: code })}
            className="h-8 w-60 text-[13px]"
          />
        ) : (
          <AccountCell code={effective(row).debit_account} name={effective(row).debit_name} />
        ),
    },
    {
      id: "credit",
      header: "Credit account",
      cell: (row) =>
        editing ? (
          <AccountSelect
            aria-label={`Credit account for ${row.event}`}
            value={effective(row).credit_account ?? ""}
            placeholder="Not routed"
            onValueChange={(code) => stage(row, { credit_account: code })}
            className="h-8 w-60 text-[13px]"
          />
        ) : (
          <AccountCell code={effective(row).credit_account} name={effective(row).credit_name} />
        ),
    },
    {
      id: "tax",
      header: "Tax",
      cell: (row) =>
        editing ? (
          <Select value={effective(row).tax_code ?? NO_TAX} onValueChange={(value) => stage(row, { tax_code: value === NO_TAX ? null : value })}>
            <SelectTrigger aria-label={`Tax code for ${row.event}`} className="h-8 w-32 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TAX}>No tax</SelectItem>
              {taxOptions.map((tax) => (
                <SelectItem key={tax.code} value={tax.code}>
                  {tax.code} · {tax.rate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <TaxCell side={effective(row)} />
        ),
    },
    { id: "impact", header: "Impact", align: "end", cell: (row) => <span className="text-content-secondary tabular-nums">{row.per_month}/mo</span> },
    { id: "changed", header: "Last changed", label: "Last changed", hideable: true, cell: (row) => `${formatDate(row.changed_on)} · ${row.changed_by}` },
  ]

  const compareColumns: FinanceColumn<PostingRule>[] = [
    columns[0],
    { id: "debit", header: "Debit account", cell: (row) => <Before before={row.current.debit_account ?? "Not routed"} after={row.staged?.debit_account ?? "Not routed"} /> },
    { id: "credit", header: "Credit account", cell: (row) => <Before before={row.current.credit_account ?? "Not routed"} after={row.staged?.credit_account ?? "Not routed"} /> },
    { id: "tax", header: "Tax", cell: (row) => <Before before={row.current.tax_code ?? "No tax"} after={row.staged?.tax_code ?? "No tax"} /> },
    { id: "impact", header: "Impact", align: "end", cell: (row) => `${row.per_month}/mo · ${formatAmount(row.monthly_value)}` },
  ]

  const groups =
    data && groupBy === "module"
      ? Array.from(new Set(data.rules.map((rule) => rule.module))).map((module) => {
          const rows = data.rules.filter((rule) => rule.module === module)
          return { id: module, label: `${module} · ${rows.length} events`, rows }
        })
      : undefined

  return (
    <>
      <FinancePageHeader
        title="Posting map"
        figure={data ? <HeaderFigure label="Staged changes">{data.staged_count}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/settings/posting-map/simulate">Simulate</Link>
            </Button>
            <Button variant="secondary" aria-pressed={editing} onClick={() => setEditing((current) => !current)}>
              {editing ? "Stop editing" : "Edit map"}
            </Button>
            <Button variant="primary" disabled={!data?.staged_count} onClick={() => setConfirming(true)}>
              Publish changes
            </Button>
          </>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <FinanceAlert tone="info">
              The posting map turns each document event into a balanced ledger entry. Auto entries follow this map exactly, so
              changing a row changes how future documents post — existing entries are untouched.
            </FinanceAlert>

            <div role="group" aria-label="Map view" className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
              {(
                [
                  ["current", "Current map"],
                  ["compare", "Current vs staged"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={cn(
                    "text-content-secondary rounded-md px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                    view === value && "bg-surface-white text-content-primary font-medium shadow-xs",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {data.staged_count ? <StagedSummary data={data} onDiscard={() => discard.mutate(undefined, { onSuccess: () => toast.success("Staged changes discarded."), onError: (error) => toast.error(errorMessage(error, "The changes could not be discarded. Try again.")) })} /> : null}

            {view === "compare" ? (
              data.staged_count ? (
                <FinanceTable caption="Staged posting rules against the current map" columns={compareColumns} rows={data.rules.filter((rule) => rule.staged)} getRowId={(row) => row.id} />
              ) : (
                <p className="text-content-secondary text-sm leading-5">No rules change, so nothing about future postings would differ.</p>
              )
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <GroupBySelect
                    value={groupBy}
                    onValueChange={setGroupBy}
                    options={[
                      { value: "none", label: "No grouping" },
                      { value: "module", label: "Module" },
                    ]}
                  />
                  <ColumnChooser
                    columns={columns.map((column) => ({ id: column.id, label: typeof column.header === "string" ? column.header : column.id }))}
                    hiddenIds={hiddenIds}
                    onHiddenIdsChange={setHiddenIds}
                  />
                </div>
                <FinanceTable
                  caption="Posting map"
                  columns={columns}
                  rows={groups ? undefined : data.rules}
                  groups={groups}
                  hiddenColumnIds={hiddenIds}
                  getRowId={(row) => row.id}
                />
              </>
            )}
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish these posting map changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Published rules take effect for documents posted from now on. Entries already in the ledger keep the accounts they
              were posted to, so today&apos;s trial balance does not move. Every change is recorded in the audit log with your name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {data ? (
            <dl className="border-stroke-default grid grid-cols-2 gap-3 rounded-lg border p-3 text-[13px] leading-5">
              <div>
                <dt className="text-content-tertiary">Staged changes</dt>
                <dd className="text-content-primary font-medium tabular-nums">{data.staged_count}</dd>
              </div>
              <div>
                <dt className="text-content-tertiary">Impact</dt>
                <dd className="text-content-primary font-medium tabular-nums">
                  {data.staged_documents}/mo · {formatAmount(data.staged_value)}
                </dd>
              </div>
            </dl>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                publish.mutate(undefined, {
                  onSuccess: (result) => {
                    toast.success(`${result.published} ${result.published === 1 ? "rule" : "rules"} published.`)
                    setEditing(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, "The map could not be published. Try again.")),
                })
              }
            >
              Publish changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StagedSummary({ data, onDiscard }: { data: PostingMap; onDiscard: () => void }) {
  return (
    <section aria-label="Staged changes" className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border p-4">
      <div className="bg-surface-hover flex items-center justify-between gap-3 rounded-md px-3 py-2">
        <span className="text-content-secondary flex items-center gap-2 text-[13px]">
          Staged changes
          <StatusPill status="staged" label={`${data.staged_count} staged ${data.staged_count === 1 ? "change" : "changes"}`} tone="info" />
        </span>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          Discard all
        </Button>
      </div>
      <p className="text-content-primary text-[13px] leading-5">{data.staged_events.join(" · ")}</p>
      <FinanceAlert tone="warning">
        {data.staged_count} {data.staged_count === 1 ? "rule changes" : "rules change"}. {data.staged_documents} documents a month post
        through them, worth {formatAmount(data.staged_value)} in the last full month. Publishing changes how future documents post.
        Entries already in the ledger keep the accounts they were posted to, so the trial balance does not move today.
      </FinanceAlert>
    </section>
  )
}

export { PostingMapPage }
