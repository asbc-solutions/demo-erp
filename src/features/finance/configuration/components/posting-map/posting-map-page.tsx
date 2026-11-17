"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { ArrowRight } from "lucide-react"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
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
  const t = useTranslations("FinanceConfiguration")
  if (!code) return <StatusPill status="blocked" label={t("notRouted")} tone="danger" />
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
  const t = useTranslations("FinanceConfiguration")
  const stage = useStageRule()
  return (rule: PostingRule, input: StageInput) =>
    stage.mutate(
      { id: rule.id, input },
      { onError: (error) => toast.error(errorMessage(error, t("errorStage"))) },
    )
}

function Before({ before, after }: { before: React.ReactNode; after: React.ReactNode }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-content-tertiary line-through decoration-1">{before}</span>
      <ArrowRight className="text-content-tertiary size-3 rtl:rotate-180" aria-hidden />
      <span className="text-content-primary">{after}</span>
    </span>
  )
}

/** 11.03 · Posting map — how each document event becomes a balanced entry, edited by staging and publishing. */
function PostingMapPage() {
  const t = useTranslations("FinanceConfiguration")
  const { formatDate } = useFinanceDateFormat()
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
      header: t("documentEvent"),
      cell: (row) => (
        <span className="flex items-center gap-2">
          <span className="text-content-primary font-medium">{row.event}</span>
          {row.staged ? <StatusPill status="changed" label={t("changed")} tone="info" /> : null}
        </span>
      ),
    },
    { id: "module", header: t("module"), cell: (row) => <span className="text-content-secondary text-xs">{row.module}</span> },
    {
      id: "debit",
      header: t("debitAccount"),
      cell: (row) =>
        editing ? (
          <AccountSelect
            aria-label={t("debitAccountFor", { event: row.event })}
            value={effective(row).debit_account ?? ""}
            placeholder={t("notRouted")}
            onValueChange={(code) => stage(row, { debit_account: code })}
            className="h-8 w-60 text-[13px]"
          />
        ) : (
          <AccountCell code={effective(row).debit_account} name={effective(row).debit_name} />
        ),
    },
    {
      id: "credit",
      header: t("creditAccount"),
      cell: (row) =>
        editing ? (
          <AccountSelect
            aria-label={t("creditAccountFor", { event: row.event })}
            value={effective(row).credit_account ?? ""}
            placeholder={t("notRouted")}
            onValueChange={(code) => stage(row, { credit_account: code })}
            className="h-8 w-60 text-[13px]"
          />
        ) : (
          <AccountCell code={effective(row).credit_account} name={effective(row).credit_name} />
        ),
    },
    {
      id: "tax",
      header: t("tax"),
      cell: (row) =>
        editing ? (
          <Select value={effective(row).tax_code ?? NO_TAX} onValueChange={(value) => stage(row, { tax_code: value === NO_TAX ? null : value })}>
            <SelectTrigger aria-label={t("taxCodeFor", { event: row.event })} className="h-8 w-32 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TAX}>{t("noTax")}</SelectItem>
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
    { id: "impact", header: t("impact"), align: "end", cell: (row) => <span className="text-content-secondary tabular-nums">{t("perMonth", { count: row.per_month })}</span> },
    { id: "changed", header: t("lastChanged"), label: t("lastChanged"), hideable: true, cell: (row) => `${formatDate(row.changed_on)} · ${row.changed_by}` },
  ]

  const compareColumns: FinanceColumn<PostingRule>[] = [
    columns[0],
    { id: "debit", header: t("debitAccount"), cell: (row) => <Before before={row.current.debit_account ?? t("notRouted")} after={row.staged?.debit_account ?? t("notRouted")} /> },
    { id: "credit", header: t("creditAccount"), cell: (row) => <Before before={row.current.credit_account ?? t("notRouted")} after={row.staged?.credit_account ?? t("notRouted")} /> },
    { id: "tax", header: t("tax"), cell: (row) => <Before before={row.current.tax_code ?? t("noTax")} after={row.staged?.tax_code ?? t("noTax")} /> },
    { id: "impact", header: t("impact"), align: "end", cell: (row) => `${t("perMonth", { count: row.per_month })} · ${formatAmount(row.monthly_value)}` },
  ]

  const groups =
    data && groupBy === "module"
      ? Array.from(new Set(data.rules.map((rule) => rule.module))).map((module) => {
          const rows = data.rules.filter((rule) => rule.module === module)
          return { id: module, label: t("moduleEvents", { module, count: rows.length }), rows }
        })
      : undefined

  return (
    <>
      <FinancePageHeader
        title={t("postingMap")}
        figure={data ? <HeaderFigure label={t("stagedChanges")}>{data.staged_count}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/finance/settings/posting-map/simulate">{t("simulate")}</Link>
            </Button>
            <Button variant="secondary" aria-pressed={editing} onClick={() => setEditing((current) => !current)}>
              {editing ? t("stopEditing") : t("editMap")}
            </Button>
            <Button variant="primary" disabled={!data?.staged_count} onClick={() => setConfirming(true)}>
              {t("publishChanges")}
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
              {t("postingMapInfo")}
            </FinanceAlert>

            <div role="group" aria-label={t("mapView")} className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
              {(
                [
                  ["current", t("currentMap")],
                  ["compare", t("currentVsStaged")],
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

            {data.staged_count ? <StagedSummary data={data} onDiscard={() => discard.mutate(undefined, { onSuccess: () => toast.success(t("toastDiscarded")), onError: (error) => toast.error(errorMessage(error, t("errorDiscard"))) })} /> : null}

            {view === "compare" ? (
              data.staged_count ? (
                <FinanceTable caption={t("compareCaption")} columns={compareColumns} rows={data.rules.filter((rule) => rule.staged)} getRowId={(row) => row.id} />
              ) : (
                <p className="text-content-secondary text-sm leading-5">{t("noRulesChange")}</p>
              )
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <GroupBySelect
                    value={groupBy}
                    onValueChange={setGroupBy}
                    options={[
                      { value: "none", label: t("noGrouping") },
                      { value: "module", label: t("module") },
                    ]}
                  />
                  <ColumnChooser
                    columns={columns.map((column) => ({ id: column.id, label: typeof column.header === "string" ? column.header : column.id }))}
                    hiddenIds={hiddenIds}
                    onHiddenIdsChange={setHiddenIds}
                  />
                </div>
                <FinanceTable
                  caption={t("postingMap")}
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
            <AlertDialogTitle>{t("publishTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("publishDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          {data ? (
            <dl className="border-stroke-default grid grid-cols-2 gap-3 rounded-lg border p-3 text-[13px] leading-5">
              <div>
                <dt className="text-content-tertiary">{t("stagedChanges")}</dt>
                <dd className="text-content-primary font-medium tabular-nums">{data.staged_count}</dd>
              </div>
              <div>
                <dt className="text-content-tertiary">{t("impact")}</dt>
                <dd className="text-content-primary font-medium tabular-nums">
                  {t("perMonth", { count: data.staged_documents })} · {formatAmount(data.staged_value)}
                </dd>
              </div>
            </dl>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                publish.mutate(undefined, {
                  onSuccess: (result) => {
                    toast.success(t("toastPublished", { count: result.published }))
                    setEditing(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, t("errorPublish"))),
                })
              }
            >
              {t("publishChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function StagedSummary({ data, onDiscard }: { data: PostingMap; onDiscard: () => void }) {
  const t = useTranslations("FinanceConfiguration")
  return (
    <section aria-label={t("stagedChanges")} className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border p-4">
      <div className="bg-surface-hover flex items-center justify-between gap-3 rounded-md px-3 py-2">
        <span className="text-content-secondary flex items-center gap-2 text-[13px]">
          {t("stagedChanges")}
          <StatusPill status="staged" label={t("stagedCount", { count: data.staged_count })} tone="info" />
        </span>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          {t("discardAll")}
        </Button>
      </div>
      <p className="text-content-primary text-[13px] leading-5">{data.staged_events.join(" · ")}</p>
      <FinanceAlert tone="warning">
        {t("stagedWarning", { count: data.staged_count, documents: data.staged_documents, value: formatAmount(data.staged_value) })}
      </FinanceAlert>
    </section>
  )
}

export { PostingMapPage }
