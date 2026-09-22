"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, CircleCheck, Printer } from "lucide-react"
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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useFileVatReturn, useResolveVatCheck, useSettleVatReturn } from "../../lib/mutations/tax"
import { useVatReturn, useVatReturns } from "../../lib/queries/tax"
import type { VatBoxes, VatReturn } from "../../lib/types/tax"

const STATUS: Record<VatReturn["status"], { label: string; tone: "info" | "success" | "neutral" }> = {
  draft: { label: "Draft", tone: "info" },
  filed: { label: "Filed", tone: "neutral" },
  settled: { label: "Settled", tone: "success" },
}

const OUTPUT_BOXES: [number, string, keyof VatBoxes][] = [
  [1, "Total sales", "total_sales"],
  [2, "Taxable sales", "taxable_sales"],
  [3, "Output VAT", "output_vat"],
  [4, "Zero-rated sales", "zero_rated"],
  [5, "Exempt sales", "exempt"],
]

const INPUT_BOXES: [number, string, keyof VatBoxes][] = [
  [6, "Total purchases", "total_purchases"],
  [7, "Input VAT", "input_vat"],
  [8, "Non-recoverable input", "non_recoverable"],
  [9, "Adjustments", "adjustments"],
]

function BoxTable({ title, rows, boxes, total, totalLabel }: { title: string; rows: [number, string, keyof VatBoxes][]; boxes: VatBoxes; total: number; totalLabel: string }) {
  return (
    <FinanceSection title={title}>
      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Box</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Value (EGP)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([box, label, key]) => (
              <TableRow key={box}>
                <TableCell className="tabular-nums">{box}</TableCell>
                <TableCell>{label}</TableCell>
                <TableCell className="text-right">
                  <Amount value={boxes[key]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>{totalLabel}</TableCell>
              <TableCell className="text-right">
                <Amount value={total} emphasis="strong" />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </FinanceSection>
  )
}

function periodRange(row: VatReturn) {
  return `${formatDate(row.start)} — ${formatDate(row.end)}`
}

function SettleDialog({ vat, open, onOpenChange }: { vat: VatReturn; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: treasuries = [] } = useFinanceTreasuries()
  const settle = useSettleVatReturn()
  const [treasuryId, setTreasuryId] = React.useState("bnk-cib-0021")
  const treasury = treasuries.find((row) => row.id === treasuryId)
  const short = treasury ? vat.net > treasury.balance : false
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settle this VAT return?</DialogTitle>
          <DialogDescription>
            Settlement posts the payment entry clearing the VAT control accounts against the treasury you choose. The return
            moves to settled and stops appearing in the close checklist. The entry is reversible.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-content-secondary text-[13px] leading-5">
            Paying <span className="text-content-primary font-medium tabular-nums">{formatAmount(vat.net)} EGP</span> to the ETA for{" "}
            {periodRange(vat)}.
          </p>
          <Field>
            <FieldLabel htmlFor="settle-treasury">Pay from</FieldLabel>
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
            <FinanceAlert tone="danger">{treasury.name} holds less than the amount due. Choose another treasury.</FinanceAlert>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={short || settle.isPending}
            onClick={() =>
              settle.mutate(
                { id: vat.id, treasuryId },
                {
                  onSuccess: (updated) => {
                    toast.success(`The return is settled. ${updated.settlement_entry} paid ${formatAmount(updated.net)} EGP.`)
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, "The return could not be settled. Try again.")),
                },
              )
            }
          >
            Settle return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExportDialog({ vat, open, onOpenChange }: { vat: VatReturn; open: boolean; onOpenChange: (open: boolean) => void }) {
  const rows: [string, number][] = [
    ...OUTPUT_BOXES.map(([box, label, key]): [string, number] => [`${box}. ${label}`, vat.boxes[key]]),
    ...INPUT_BOXES.map(([box, label, key]): [string, number] => [`${box}. ${label}`, vat.boxes[key]]),
    ["10. Net payable", vat.net],
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export the VAT return</DialogTitle>
          <DialogDescription>The declaration boxes as they will be filed.</DialogDescription>
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
            This is a print preview. The browser print dialog renders whatever is on screen — the prototype does not generate a
            stamped PDF.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer aria-hidden />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 07.01 · VAT return — the month's declaration: checks, boxes, file, settle. */
function VatReturnPage({ period }: { period?: string }) {
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
        title="VAT return"
        figure={vat ? <HeaderFigure label="Net VAT payable (EGP)">{formatAmount(vat.net)}</HeaderFigure> : null}
        actions={
          vat ? (
            <>
              {vat.status === "draft" ? (
                <Button variant="primary" disabled={open.length > 0 || file.isPending} onClick={() => setConfirming(true)}>
                  Submit to ETA
                </Button>
              ) : null}
              {vat.status === "filed" ? (
                <Button variant="primary" onClick={() => setSettling(true)}>
                  Record settlement
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setExporting(true)}>
                Export PDF
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {tabs ? (
          <div role="group" aria-label="Return period" className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
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
          <div aria-busy aria-label="Loading VAT return" className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status={`vat-${vat.status}`} label={STATUS[vat.status].label} tone={STATUS[vat.status].tone} />
              <span>
                {periodRange(vat)} · <span className="font-mono">EG-01</span>
              </span>
              <span>Filing due {formatDate(vat.due)}</span>
            </MetaChips>

            {vat.status !== "draft" ? (
              <FinanceAlert
                tone="success"
                className="text-status-success-fg"
                action={
                  vat.settlement_entry ? (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/finance/journals/${vat.settlement_entry}`}>Settlement entry</Link>
                    </Button>
                  ) : null
                }
              >
                This return was filed to the Egyptian Tax Authority
                {vat.acknowledgement ? ` (acknowledgement ${vat.acknowledgement})` : ""}.{" "}
                {vat.status === "settled"
                  ? `A settlement entry was posted for ${formatAmount(vat.net)} EGP.`
                  : `Record the settlement of ${formatAmount(vat.net)} EGP once the payment leaves the bank.`}{" "}
                Keep the acknowledgement number with your records.
              </FinanceAlert>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Output VAT (EGP)" value={formatAmount(vat.output_vat)} />
              <KpiCard layout="bar" accent="teal" label="Less input VAT (EGP)" value={formatAmount(vat.input_vat)} />
              <KpiCard layout="bar" accent="danger" label="Net VAT payable (EGP)" value={<span className="text-status-danger-fg">{formatAmount(vat.net)}</span>} />
            </div>

            {vat.status === "draft" ? (
              <FinanceSection title="Pre-filing checks" action={<span className="text-content-tertiary text-[13px] leading-5">Every check must be clear before the return can be filed.</span>}>
                <ul className="border-stroke-default bg-surface-white divide-stroke-light divide-y overflow-hidden rounded-xl border">
                  {vat.checks.map((check) => {
                    const Icon = check.clear ? CircleCheck : CircleAlert
                    return (
                      <li key={check.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Icon className={cn("size-4 shrink-0", check.clear ? "text-status-success-fg" : "text-status-danger-fg")} aria-label={check.clear ? "Clear" : "Open"} />
                        <span className="text-content-primary flex-1 text-[13px] leading-5">
                          {check.title}
                          {check.resolved && check.count > 0 ? <span className="text-content-tertiary"> · resolved</span> : null}
                        </span>
                        {check.count > 0 ? <span className="text-content-secondary text-[13px] tabular-nums">{check.count}</span> : null}
                        {!check.clear ? (
                          <>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={check.href}>Open</Link>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={resolve.isPending}
                              onClick={() =>
                                resolve.mutate(check.id, {
                                  onSuccess: () => toast.success(`${check.title} is marked resolved.`),
                                  onError: (error) => toast.error(errorMessage(error, "The check could not be resolved. Try again.")),
                                })
                              }
                            >
                              Mark resolved
                            </Button>
                          </>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                {open.length > 0 ? (
                  <FinanceAlert tone="warning" className="text-status-warning-fg">
                    {open.length} pre-filing {open.length === 1 ? "check is" : "checks are"} unresolved
                  </FinanceAlert>
                ) : (
                  <FinanceAlert tone="success" className="text-status-success-fg">
                    Every check is clear. The return can be filed.
                  </FinanceAlert>
                )}
              </FinanceSection>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
              <BoxTable title="Output tax (sales)" rows={OUTPUT_BOXES} boxes={vat.boxes} total={vat.output_vat} totalLabel="Total output VAT" />
              <BoxTable title="Input tax (purchases)" rows={INPUT_BOXES} boxes={vat.boxes} total={vat.input_vat} totalLabel="Total input VAT" />
            </div>

            <ul className="border-stroke-default bg-surface-white divide-stroke-light max-w-md divide-y rounded-lg border text-[13px] leading-5">
              <li className="flex justify-between px-4 py-2">
                <span>Output VAT</span>
                <Amount value={vat.output_vat} />
              </li>
              <li className="flex justify-between px-4 py-2">
                <span>Less input VAT</span>
                <Amount value={-vat.input_vat} />
              </li>
              <li className="flex justify-between px-4 py-2 font-semibold">
                <span>10. Net VAT payable</span>
                <Amount value={vat.net} emphasis="strong" />
              </li>
            </ul>
            <p className="text-content-tertiary max-w-2xl text-[13px] leading-5">
              Filing sends the {periodRange(vat)} return to the ETA and moves {formatAmount(vat.net)} EGP from the VAT control
              accounts to VAT payable. A filed return can&apos;t be edited — you would file an amendment instead.
            </p>

            <SettleDialog vat={vat} open={settling} onOpenChange={setSettling} />
            <ExportDialog vat={vat} open={exporting} onOpenChange={setExporting} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit the return to the ETA?</AlertDialogTitle>
            <AlertDialogDescription>
              Filing sends the declaration and posts the entry moving the VAT control balances to VAT payable. A filed return
              can&apos;t be edited — you would file an amendment instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                vat &&
                file.mutate(vat.id, {
                  onSuccess: (filed) => toast.success(`Filed with the ETA. Acknowledgement ${filed.acknowledgement}.`),
                  onError: (error) => toast.error(errorMessage(error, "The return could not be filed. Try again.")),
                })
              }
            >
              Submit to ETA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { VatReturnPage }
