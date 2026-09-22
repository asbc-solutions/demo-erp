"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useMapItems, useRenewSeal, useResubmitGroup, useSubmitBatch } from "../../lib/mutations/tax"
import { useEInvoicing } from "../../lib/queries/tax"
import type { EDocument, EDocumentStatus } from "../../lib/types/tax"
import { EDocumentStatusPill } from "./e-document-status"

const FILTERS: { value: "all" | EDocumentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_sent", label: "Not sent" },
  { value: "submitted", label: "Submitted" },
  { value: "valid", label: "Valid" },
  { value: "rejected", label: "Rejected" },
  { value: "cancel_requested", label: "Cancellation requested" },
  { value: "cancelled", label: "Cancelled" },
]

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "status", label: "Status" },
  { value: "buyer", label: "Buyer" },
]

const COLUMNS: FinanceColumn<EDocument>[] = [
  { id: "number", header: "Document", cell: (row) => <DocNumber>{row.number}</DocNumber> },
  { id: "type", header: "Type", hideable: true, cell: (row) => (row.type === "credit_note" ? "credit note" : "invoice") },
  { id: "buyer", header: "Buyer", cell: (row) => row.buyer_name },
  { id: "issued", header: "Issued", hideable: true, cell: (row) => formatDate(row.issued) },
  { id: "total", header: "Total", align: "end", cell: (row) => <Amount value={row.total} currency={row.currency} /> },
  {
    id: "uuid",
    header: "Submission UUID",
    hideable: true,
    cell: (row) => <span className="text-content-secondary font-mono text-xs">{row.submission_uuid ? `${row.submission_uuid.slice(0, 12)}…` : "—"}</span>,
  },
  { id: "attempts", header: "Attempts", align: "end", hideable: true, cell: (row) => row.attempts },
  { id: "status", header: "Status", cell: (row) => <EDocumentStatusPill status={row.status} /> },
]

/** 07.03 · E-invoicing console — what the authority accepted, what it held up, and why. */
function EInvoicingPage() {
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
    return Array.from(new Set(items.map(keyOf))).map((key) => ({ id: key, label: key.replace(/_/g, " "), rows: items.filter((row) => keyOf(row) === key) }))
  }, [items, groupBy])

  const state = data?.state
  const count = (value: string) => (value === "all" ? (data?.items.length ?? 0) : (data?.items.filter((row) => row.status === value).length ?? 0))

  return (
    <>
      <FinancePageHeader
        title="E-invoicing console"
        figure={state ? <HeaderFigure label="Cleared this month · ETA">{state.valid}</HeaderFigure> : null}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={busy || !state?.not_sent}
              onClick={() =>
                submitBatch.mutate(undefined, {
                  onSuccess: (result) => toast.success(`${result.sent} documents sent; ${result.cleared} cleared.`),
                  onError: fail("The batch could not be sent. Try again."),
                })
              }
            >
              Submit not-sent batch
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !state?.items_unmapped}
              onClick={() =>
                mapItems.mutate(undefined, {
                  onSuccess: () => toast.success("Every item is mapped to an authority code. Resubmit the documents it held up."),
                  onError: fail("The item codes could not be mapped. Try again."),
                })
              }
            >
              Map item codes
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                renewSeal.mutate(undefined, {
                  onSuccess: (result) => toast.success(`The seal is renewed until ${formatDate(result.seal_expires)}.`),
                  onError: fail("The seal could not be renewed. Try again."),
                })
              }
            >
              Renew seal
            </Button>
            <Button variant="primary" disabled={!state?.rejected} onClick={() => setFilter("rejected")}>
              Review {state?.rejected ?? 0} failed
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <div role="group" aria-label="Authority" className="border-stroke-default flex gap-6 border-b">
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
              {value === "ETA" ? "ETA — Egypt" : "ZATCA — Saudi Arabia"}
              <span className="text-content-tertiary text-xs tabular-nums">{data?.authorities[value] ?? "—"}</span>
            </button>
          ))}
        </div>

        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data || !state ? (
          <Skeleton aria-busy aria-label="Loading documents" className="h-96 rounded-xl" />
        ) : (
          <>
            {authority === "ETA" && data.groups.length > 0 ? (
              <FinanceSection title="What is holding documents up" description="Grouped by what the authority objected to, not by document. Fix the cause once where you can.">
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
                            {group.bulk ? "One fix clears all of these" : "Each document needs its own correction"}
                          </h3>
                          <span className="text-content-secondary text-[13px] leading-5">
                            {group.ids.length} documents · Value held up: {formatAmount(group.value)}
                          </span>
                        </div>
                        <p className="text-content-primary text-[13px] leading-5">{group.message}</p>
                        <p className="text-content-secondary text-[13px] leading-5">
                          {group.bulk
                            ? "Correct this centrally — register the item, renew the certificate — then resubmit the batch."
                            : "There is no bulk fix for this. Open each document and correct it."}
                        </p>
                        <dl className="grid grid-cols-2 gap-4 text-[13px] leading-5">
                          <div>
                            <dt className="text-content-secondary">Authority code</dt>
                            <dd className="font-mono text-xs">{group.code}</dd>
                          </div>
                          <div>
                            <dt className="text-content-secondary">Where</dt>
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
                                      ? toast.success(`${result.cleared} documents cleared.`)
                                      : toast.error(`${result.sent - result.cleared} documents failed the same way. Map the item code first.`),
                                  onError: fail("The documents could not be resubmitted. Try again."),
                                })
                              }
                            >
                              Resubmit these {group.ids.length}
                            </Button>
                            {!fixable ? (
                              <span className="text-content-tertiary text-xs leading-4">Resubmitting without correcting the cause will fail the same way.</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {group.ids.map((id) => (
                              <Button key={id} variant="ghost" size="sm" onClick={() => router.push(`/finance/tax/e-invoicing/${id}`)}>
                                Open {id}
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
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => renewSeal.mutate(undefined, { onError: fail("The seal could not be renewed. Try again.") })}>
                    Renew seal
                  </Button>
                }
              >
                The signing seal expires in {state.seal_days} days, on {formatDate(state.seal_expires)}. Documents cannot be signed after
                that. Renew the seal with the authority before the deadline.
              </FinanceAlert>
            ) : null}
            {authority === "ETA" && state.items_unmapped > 0 ? (
              <FinanceAlert
                tone="warning"
                className="text-status-warning-fg"
                action={
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => mapItems.mutate(undefined, { onError: fail("The item codes could not be mapped. Try again.") })}>
                    Map item codes
                  </Button>
                }
              >
                {state.items_unmapped} of {state.items_total} item codes are not mapped to authority codes. Documents that use them will be
                rejected. Map the remaining codes before the next submission.
              </FinanceAlert>
            ) : null}

            {authority === "ETA" ? (
              <dl className="flex flex-wrap gap-8 text-[13px] leading-5">
                {[
                  ["Cleared", state.valid],
                  ["Failed", state.rejected],
                  ["Awaiting response", state.submitted],
                  ["Not sent", state.not_sent],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-content-secondary">{label}</dt>
                    <dd className="text-content-primary text-xl leading-7 font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
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
                  {option.label} <span className="tabular-nums">{count(option.value)}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <GroupBySelect value={groupBy} onValueChange={setGroupBy} options={GROUP_OPTIONS} />
                <ColumnChooser
                  columns={COLUMNS.filter((column) => column.hideable).map((column) => ({ id: column.id, label: columnLabel(column) }))}
                  hiddenIds={hiddenIds}
                  onHiddenIdsChange={setHiddenIds}
                />
              </div>
              <FinanceTable
                caption="Electronic documents"
                columns={COLUMNS}
                rows={items}
                groups={groups}
                getRowId={(row) => row.id}
                hiddenColumnIds={hiddenIds}
                onRowClick={(row) => router.push(`/finance/tax/e-invoicing/${row.id}`)}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">No document has this status.</p>}
              />
            </div>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { EInvoicingPage }
