"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { CircleAlert, CircleCheck, Printer } from "lucide-react"
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure, MetaChips } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useFileVatReturn, useResolveVatCheck, useSettleVatReturn } from "../../lib/mutations/tax"
import { useVatReturn, useVatReturns } from "../../lib/queries/tax"
import type { TaxMessageKey, TaxTranslator, VatBoxes, VatReturn } from "../../lib/types/tax"

const STATUS: Record<VatReturn["status"], { labelKey: TaxMessageKey; tone: "info" | "success" | "neutral" }> = {
  draft: { labelKey: "vatDraft", tone: "info" },
  filed: { labelKey: "vatFiled", tone: "neutral" },
  settled: { labelKey: "vatSettled", tone: "success" },
}

type BoxRow = [number, TaxMessageKey, keyof VatBoxes]

const OUTPUT_BOXES: BoxRow[] = [
  [1, "boxTotalSales", "total_sales"],
  [2, "boxTaxableSales", "taxable_sales"],
  [3, "boxOutputVat", "output_vat"],
  [4, "boxZeroRated", "zero_rated"],
  [5, "boxExempt", "exempt"],
]

const INPUT_BOXES: BoxRow[] = [
  [6, "boxTotalPurchases", "total_purchases"],
  [7, "boxInputVat", "input_vat"],
  [8, "boxNonRecoverable", "non_recoverable"],
  [9, "boxAdjustments", "adjustments"],
]

function BoxTable({ title, rows, boxes, total, totalLabel }: { title: string; rows: BoxRow[]; boxes: VatBoxes; total: number; totalLabel: string }) {
  const t = useTranslations("FinanceTax")
  return (
    <FinanceSection title={title}>
      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t("box")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead className="text-end">{t("valueEgp")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([box, labelKey, key]) => (
              <TableRow key={box}>
                <TableCell className="tabular-nums">{box}</TableCell>
                <TableCell>{t(labelKey)}</TableCell>
                <TableCell className="text-end">
                  <Amount value={boxes[key]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>{totalLabel}</TableCell>
              <TableCell className="text-end">
                <Amount value={total} emphasis="strong" />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </FinanceSection>
  )
}

function periodRange(row: VatReturn, formatDate: FinanceDateFormat["formatDate"]) {
  return `${formatDate(row.start)} — ${formatDate(row.end)}`
}

function boxLines(t: TaxTranslator, rows: BoxRow[], vat: VatReturn): [string, number][] {
  return rows.map(([box, labelKey, key]): [string, number] => [t("boxLine", { box, label: t(labelKey) }), vat.boxes[key]])
}

function SettleDialog({ vat, open, onOpenChange }: { vat: VatReturn; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const { data: treasuries = [] } = useFinanceTreasuries()
  const settle = useSettleVatReturn()
  const [treasuryId, setTreasuryId] = React.useState("bnk-cib-0021")
  const treasury = treasuries.find((row) => row.id === treasuryId)
  const short = treasury ? vat.net > treasury.balance : false
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settleTitle")}</DialogTitle>
          <DialogDescription>{t("settleDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-content-secondary text-[13px] leading-5">
            {t.rich("payingToEta", {
              amount: formatAmount(vat.net),
              range: periodRange(vat, formatDate),
              strong: (chunks) => <span className="text-content-primary font-medium tabular-nums">{chunks}</span>,
            })}
          </p>
          <Field>
            <FieldLabel htmlFor="settle-treasury">{t("payFrom")}</FieldLabel>
            <Select value={treasuryId} onValueChange={setTreasuryId}>
              <SelectTrigger id="settle-treasury" aria-invalid={short}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treasuries
                  .filter((row) => row.currency === "EGP")
                  .map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name} · {formatAmount(row.balance)} EGP
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          {short && treasury ? (
            <FinanceAlert tone="danger">{t("treasuryShort", { name: treasury.name })}</FinanceAlert>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={short || settle.isPending}
            onClick={() =>
              settle.mutate(
                { id: vat.id, treasuryId },
                {
                  onSuccess: (updated) => {
                    toast.success(t("toastSettled", { entry: updated.settlement_entry ?? "", amount: formatAmount(updated.net) }))
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, t("errorSettle"))),
                },
              )
            }
          >
            {t("settleReturn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExportDialog({ vat, open, onOpenChange }: { vat: VatReturn; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceTax")
  const rows: [string, number][] = [
    ...boxLines(t, OUTPUT_BOXES, vat),
    ...boxLines(t, INPUT_BOXES, vat),
    [t("boxLine", { box: 10, label: t("netPayable") }), vat.net],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("exportTitle")}</DialogTitle>
          <DialogDescription>{t("exportDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="border-stroke-default divide-stroke-light divide-y rounded-lg border text-[13px] leading-5">
            {rows.map(([label, value]) => (
              <li key={label} className="flex justify-between gap-4 px-3 py-1.5">
                <span>{label}</span>
                <span className="tabular-nums">{formatAmount(value)}</span>
              </li>
            ))}
          </ul>
          <p className="text-content-tertiary text-[13px] leading-5">
            {t("printNote")}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer aria-hidden />
            {t("print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 07.01 · VAT return — the month's declaration: checks, boxes, file, settle. */
function VatReturnPage({ period }: { period?: string }) {
  const t = useTranslations("FinanceTax")
  const { formatDate } = useFinanceDateFormat()
  const router = useRouter()
  const { data: tabs } = useVatReturns()
  const selected = tabs?.find((row) => row.period === period) ?? tabs?.find((row) => row.status === "draft") ?? tabs?.[tabs.length - 1]
  const { data: vat, isError, refetch } = useVatReturn(selected?.id ?? "")
  const file = useFileVatReturn()
  const resolve = useResolveVatCheck(selected?.id ?? "")
  const [confirming, setConfirming] = React.useState(false)
  const [settling, setSettling] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const open = vat?.checks.filter((check) => !check.clear) ?? []

  return (
    <>
      <FinancePageHeader
        title={t("vatReturn")}
        figure={vat ? <HeaderFigure label={t("netVatPayableEgp")}>{formatAmount(vat.net)}</HeaderFigure> : null}
        actions={
          vat ? (
            <>
              {vat.status === "draft" ? (
                <Button variant="primary" disabled={open.length > 0 || file.isPending} onClick={() => setConfirming(true)}>
                  {t("submitToEta")}
                </Button>
              ) : null}
              {vat.status === "filed" ? (
                <Button variant="primary" onClick={() => setSettling(true)}>
                  {t("recordSettlement")}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setExporting(true)}>
                {t("exportPdf")}
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {tabs ? (
          <div role="group" aria-label={t("returnPeriod")} className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={tab.id === selected?.id}
                onClick={() => router.replace(`/finance/tax/vat-return?period=${tab.period}`)}
                className={cn(
                  "text-content-secondary focus-visible:ring-ring rounded-md px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                  tab.id === selected?.id && "bg-surface-white text-content-primary font-medium shadow-xs",
                )}
              >
                {formatDate(tab.end)}
              </button>
            ))}
          </div>
        ) : null}

        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !vat ? (
          <div aria-busy aria-label={t("loadingVatReturn")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status={`vat-${vat.status}`} label={t(STATUS[vat.status].labelKey)} tone={STATUS[vat.status].tone} />
              <span>
                {periodRange(vat, formatDate)} · <span className="font-mono">EG-01</span>
              </span>
              <span>{t("filingDue", { date: formatDate(vat.due) })}</span>
            </MetaChips>

            {vat.status !== "draft" ? (
              <FinanceAlert
                tone="success"
                className="text-status-success-fg"
                action={
                  vat.settlement_entry ? (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/finance/journals/${vat.settlement_entry}`}>{t("settlementEntry")}</Link>
                    </Button>
                  ) : null
                }
              >
                {vat.acknowledgement ? t("filedToEtaAck", { ack: vat.acknowledgement }) : t("filedToEta")}{" "}
                {vat.status === "settled"
                  ? t("settlementPosted", { amount: formatAmount(vat.net) })
                  : t("recordSettlementHint", { amount: formatAmount(vat.net) })}{" "}
                {t("keepAcknowledgement")}
              </FinanceAlert>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("outputVatEgp")} value={formatAmount(vat.output_vat)} />
              <KpiCard layout="bar" accent="teal" label={t("lessInputVatEgp")} value={formatAmount(vat.input_vat)} />
              <KpiCard layout="bar" accent="danger" label={t("netVatPayableEgp")} value={<span className="text-status-danger-fg">{formatAmount(vat.net)}</span>} />
            </div>

            {vat.status === "draft" ? (
              <FinanceSection title={t("preFilingChecks")} action={<span className="text-content-tertiary text-[13px] leading-5">{t("preFilingChecksHint")}</span>}>
                <ul className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                  {vat.checks.map((check) => {
                    const Icon = check.clear ? CircleCheck : CircleAlert
                    return (
                      <li key={check.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Icon className={cn("size-4 shrink-0", check.clear ? "text-status-success-fg" : "text-status-danger-fg")} aria-label={check.clear ? t("checkClear") : t("checkOpen")} />
                        <span className="text-content-primary flex-1 text-[13px] leading-5">
                          {check.title}
                          {check.resolved && check.count > 0 ? <span className="text-content-tertiary"> · {t("resolved")}</span> : null}
                        </span>
                        {check.count > 0 ? <span className="text-content-secondary text-[13px] tabular-nums">{check.count}</span> : null}
                        {!check.clear ? (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={check.href}>{t("open")}</Link>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={resolve.isPending}
                              onClick={() =>
                                resolve.mutate(check.id, {
                                  onSuccess: () => toast.success(t("toastCheckResolved", { title: check.title })),
                                  onError: (error) => toast.error(errorMessage(error, t("errorResolveCheck"))),
                                })
                              }
                            >
                              {t("markResolved")}
                            </Button>
                          </>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                {open.length > 0 ? (
                  <FinanceAlert tone="warning" className="text-status-warning-fg">
                    {t("checksUnresolved", { count: open.length })}
                  </FinanceAlert>
                ) : (
                  <FinanceAlert tone="success" className="text-status-success-fg">
                    {t("allChecksClear")}
                  </FinanceAlert>
                )}
              </FinanceSection>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
              <BoxTable title={t("outputTaxSales")} rows={OUTPUT_BOXES} boxes={vat.boxes} total={vat.output_vat} totalLabel={t("totalOutputVat")} />
              <BoxTable title={t("inputTaxPurchases")} rows={INPUT_BOXES} boxes={vat.boxes} total={vat.input_vat} totalLabel={t("totalInputVat")} />
            </div>

            <ul className="border-stroke-default bg-surface-white divide-stroke-light max-w-md divide-y rounded-lg border text-[13px] leading-5">
              <li className="flex justify-between px-4 py-2">
                <span>{t("boxOutputVat")}</span>
                <Amount value={vat.output_vat} />
              </li>
              <li className="flex justify-between px-4 py-2">
                <span>{t("lessInputVat")}</span>
                <Amount value={-vat.input_vat} />
              </li>
              <li className="flex justify-between px-4 py-2 font-semibold">
                <span>{t("boxLine", { box: 10, label: t("netVatPayable") })}</span>
                <Amount value={vat.net} emphasis="strong" />
              </li>
            </ul>
            <p className="text-content-tertiary max-w-2xl text-[13px] leading-5">
              {t("filingNote", { range: periodRange(vat, formatDate), amount: formatAmount(vat.net) })}
            </p>

            <SettleDialog vat={vat} open={settling} onOpenChange={setSettling} />
            <ExportDialog vat={vat} open={exporting} onOpenChange={setExporting} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("submitReturnTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("submitReturnDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                vat &&
                file.mutate(vat.id, {
                  onSuccess: (filed) => toast.success(t("toastFiled", { ack: filed.acknowledgement ?? "" })),
                  onError: (error) => toast.error(errorMessage(error, t("errorFileReturn"))),
                })
              }
            >
              {t("submitToEta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { VatReturnPage }
