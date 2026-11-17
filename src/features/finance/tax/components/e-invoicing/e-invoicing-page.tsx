"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import {
  FinanceTable,
  columnLabel,
  type FinanceColumn,
  type FinanceTableGroup,
} from "../../../components/shared/finance-table"
import { ColumnChooser, GroupBySelect } from "../../../components/shared/filter-bar"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useMapItems, useRenewSeal, useResubmitGroup, useSubmitBatch } from "../../lib/mutations/tax"
import { useEInvoicing } from "../../lib/queries/tax"
import type { EDocument, EDocumentStatus, TaxMessageKey, TaxTranslator } from "../../lib/types/tax"
import { EDocumentStatusPill, eDocumentStatusLabelKey } from "./e-document-status"

const FILTERS: { value: "all" | EDocumentStatus; labelKey: TaxMessageKey }[] = [
  { value: "all", labelKey: "all" },
  { value: "not_sent", labelKey: "eStatusNotSent" },
  { value: "submitted", labelKey: "eStatusSubmitted" },
  { value: "valid", labelKey: "eStatusValid" },
  { value: "rejected", labelKey: "eStatusRejected" },
  { value: "cancel_requested", labelKey: "eStatusCancelRequested" },
  { value: "cancelled", labelKey: "eStatusCancelled" },
]

const GROUP_OPTIONS: { value: string; labelKey: TaxMessageKey }[] = [
  { value: "none", labelKey: "noGrouping" },
  { value: "status", labelKey: "status" },
  { value: "buyer", labelKey: "buyer" },
]

function buildColumns(t: TaxTranslator, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<EDocument>[] {
  return [
    { id: "number", header: t("document"), cell: (row) => <DocNumber>{row.number}</DocNumber> },
    { id: "type", header: t("type"), hideable: true, cell: (row) => (row.type === "credit_note" ? t("creditNote") : t("invoice")) },
    { id: "buyer", header: t("buyer"), cell: (row) => row.buyer_name },
    { id: "issued", header: t("issued"), hideable: true, cell: (row) => formatDate(row.issued) },
    { id: "total", header: t("total"), align: "end", cell: (row) => <Amount value={row.total} currency={row.currency} /> },
    {
      id: "uuid",
      header: t("submissionUuid"),
      hideable: true,
      cell: (row) => <span className="text-content-secondary font-mono text-xs">{row.submission_uuid ? `${row.submission_uuid.slice(0, 12)}…` : "—"}</span>,
    },
    { id: "attempts", header: t("attempts"), align: "end", hideable: true, cell: (row) => row.attempts },
    { id: "status", header: t("status"), cell: (row) => <EDocumentStatusPill status={row.status} /> },
  ]
}

/** 07.03 · E-invoicing console — what the authority accepted, what it held up, and why. */
function EInvoicingPage() {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const columns = React.useMemo(() => buildColumns(t, formatDate), [t, formatDate])
  const router = useRouter()
  const [authority, setAuthority] = React.useState<"ETA" | "ZATCA">("ETA")
  const { data, isError, refetch } = useEInvoicing(authority)
  const submitBatch = useSubmitBatch()
  const resubmitGroup = useResubmitGroup()
  const renewSeal = useRenewSeal()
  const mapItems = useMapItems()
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["value"]>("all")
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>(["uuid"])
  const busy = submitBatch.isPending || resubmitGroup.isPending || renewSeal.isPending || mapItems.isPending
  const fail = (fallback: string) => (error: unknown) => toast.error(errorMessage(error, fallback))

  const items = React.useMemo(() => (data?.items ?? []).filter((row) => filter === "all" || row.status === filter), [data, filter])
  const groups: FinanceTableGroup<EDocument>[] | undefined = React.useMemo(() => {
    if (groupBy === "none") return undefined
    const keyOf = (row: EDocument) => (groupBy === "status" ? row.status : row.buyer_name)
    return Array.from(new Set(items.map(keyOf))).map((key) => ({ id: key, label: groupBy === "status" ? t(eDocumentStatusLabelKey(key as EDocumentStatus)) : key, rows: items.filter((row) => keyOf(row) === key) }))
  }, [items, groupBy, t])

  const state = data?.state
  const count = (value: string) => (value === "all" ? (data?.items.length ?? 0) : (data?.items.filter((row) => row.status === value).length ?? 0))

  return (
    <>
      <FinancePageHeader
        title={t("eInvoicingConsole")}
        figure={state ? <HeaderFigure label={t("clearedThisMonthEta")}>{state.valid}</HeaderFigure> : null}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy || !state?.not_sent}
              onClick={() =>
                submitBatch.mutate(undefined, {
                  onSuccess: (result) => toast.success(t("toastBatchSent", { sent: result.sent, cleared: result.cleared })),
                  onError: fail(t("errorSendBatch")),
                })
              }
            >
              {t("submitNotSentBatch")}
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !state?.items_unmapped}
              onClick={() =>
                mapItems.mutate(undefined, {
                  onSuccess: () => toast.success(t("toastItemsMapped")),
                  onError: fail(t("errorMapItems")),
                })
              }
            >
              {t("mapItemCodes")}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                renewSeal.mutate(undefined, {
                  onSuccess: (result) => toast.success(t("toastSealRenewed", { date: formatDate(result.seal_expires) })),
                  onError: fail(t("errorRenewSeal")),
                })
              }
            >
              {t("renewSeal")}
            </Button>
            <Button variant="primary" disabled={!state?.rejected} onClick={() => setFilter("rejected")}>
              {t("reviewFailed", { count: state?.rejected ?? 0 })}
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <div role="group" aria-label={t("authority")} className="border-stroke-default flex gap-6 border-b">
          {(["ETA", "ZATCA"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={authority === value}
              onClick={() => {
                setAuthority(value)
                setFilter("all")
              }}
              className={cn(
                "text-content-secondary -mb-px flex items-center gap-2 border-b-2 border-transparent pb-2 text-sm leading-5 outline-none focus-visible:underline",
                authority === value && "border-brand-primary text-content-primary font-medium",
              )}
            >
              {value === "ETA" ? t("authorityEta") : t("authorityZatca")}
              <span className="text-content-tertiary text-xs tabular-nums">{data?.authorities[value] ?? "—"}</span>
            </button>
          ))}
        </div>

        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data || !state ? (
          <Skeleton aria-busy aria-label={t("loadingDocuments")} className="h-96 rounded-xl" />
        ) : (
          <>
            {authority === "ETA" && data.groups.length > 0 ? (
              <FinanceSection title={t("holdingUpTitle")} description={t("holdingUpDescription")}>
                <div className="flex flex-col gap-3">
                  {data.groups.map((group) => {
                    const fixable = group.bulk && !data.unregistered_codes.length
                    return (
                      <article
                        key={group.code}
                        className={cn("bg-surface-white flex flex-col gap-3 rounded-xl border p-4", group.bulk ? "border-brand-primary" : "border-stroke-default")}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-content-primary text-sm leading-5 font-semibold">
                            {group.bulk ? t("oneFixClearsAll") : t("eachNeedsCorrection")}
                          </h3>
                          <span className="text-content-secondary text-[13px] leading-5">
                            {t("groupSummary", { count: group.ids.length, value: formatAmount(group.value) })}
                          </span>
                        </div>
                        <p className="text-content-primary text-[13px] leading-5">{group.message}</p>
                        <p className="text-content-secondary text-[13px] leading-5">
                          {group.bulk
                            ? t("bulkFixHint")
                            : t("noBulkFixHint")}
                        </p>
                        <dl className="grid grid-cols-2 gap-4 text-[13px] leading-5">
                          <div>
                            <dt className="text-content-secondary">{t("authorityCode")}</dt>
                            <dd className="font-mono text-xs">{group.code}</dd>
                          </div>
                          <div>
                            <dt className="text-content-secondary">{t("where")}</dt>
                            <dd className="font-mono text-xs">{group.path}</dd>
                          </div>
                        </dl>
                        {group.bulk ? (
                          <div className="flex flex-col items-start gap-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                resubmitGroup.mutate(group.code, {
                                  onSuccess: (result) =>
                                    result.cleared === result.sent
                                      ? toast.success(t("toastDocumentsCleared", { count: result.cleared }))
                                      : toast.error(t("toastDocumentsFailedSame", { count: result.sent - result.cleared })),
                                  onError: fail(t("errorResubmit")),
                                })
                              }
                            >
                              {t("resubmitThese", { count: group.ids.length })}
                            </Button>
                            {!fixable ? (
                              <span className="text-content-tertiary text-xs leading-4">{t("resubmitWillFail")}</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {group.ids.map((id) => (
                              <Button key={id} variant="ghost" size="sm" onClick={() => router.push(`/finance/tax/e-invoicing/${id}`)}>
                                {t("openId", { id })}
                              </Button>
                            ))}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </FinanceSection>
            ) : null}

            {authority === "ETA" && state.seal_days <= 30 ? (
              <FinanceAlert
                tone="warning"
                className="text-status-warning-fg"
                action={
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => renewSeal.mutate(undefined, { onError: fail(t("errorRenewSeal")) })}>
                    {t("renewSeal")}
                  </Button>
                }
              >
                {t("sealExpiresWarning", { days: state.seal_days, date: formatDate(state.seal_expires) })}
              </FinanceAlert>
            ) : null}
            {authority === "ETA" && state.items_unmapped > 0 ? (
              <FinanceAlert
                tone="warning"
                className="text-status-warning-fg"
                action={
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => mapItems.mutate(undefined, { onError: fail(t("errorMapItems")) })}>
                    {t("mapItemCodes")}
                  </Button>
                }
              >
                {t("itemsUnmappedWarning", { unmapped: state.items_unmapped, total: state.items_total })}
              </FinanceAlert>
            ) : null}

            {authority === "ETA" ? (
              <dl className="flex flex-wrap gap-8 text-[13px] leading-5">
                {[
                  [t("cleared"), state.valid],
                  [t("failed"), state.rejected],
                  [t("awaitingResponse"), state.submitted],
                  [t("eStatusNotSent"), state.not_sent],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-content-secondary">{label}</dt>
                    <dd className="text-content-primary text-xl leading-7 font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div role="group" aria-label={t("filterByStatus")} className="flex flex-wrap gap-1.5">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "border-stroke-default text-content-secondary rounded-full border px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                    filter === option.value && "border-brand-primary bg-brand-primary/10 text-content-primary font-medium",
                  )}
                >
                  {t(option.labelKey)} <span className="tabular-nums">{count(option.value)}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))} />
                <ColumnChooser
                  columns={columns.filter((column) => column.hideable).map((column) => ({ id: column.id, label: columnLabel(column) }))}
                  hiddenIds={hiddenIds}
                  onHiddenIdsChange={setHiddenIds}
                />
              </div>
              <FinanceTable
                caption={t("electronicDocuments")}
                columns={columns}
                rows={items}
                groups={groups}
                getRowId={(row) => row.id}
                hiddenColumnIds={hiddenIds}
                onRowClick={(row) => router.push(`/finance/tax/e-invoicing/${row.id}`)}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noDocumentWithStatus")}</p>}
              />
            </div>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { EInvoicingPage }
