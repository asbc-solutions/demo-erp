import type { Row } from "../../demo-db"
import { FIN_ANCHORS } from "./anchors"

/**
 * Thirteen weeks of closing cash for Finance home: six recorded weeks ending
 * on the week of 31 Mar 2026 (ISO W14, closing at the cash anchor) and seven
 * forecast weeks.
 */
const OPENING_BEFORE_W09 = 5_452_700
const WEEKS: [label: string, closing: number, forecast: boolean][] = [
  ["W09", 6_120_400, false],
  ["W10", 6_583_900, false],
  ["W11", 7_238_200, false],
  ["W12", 7_911_600, false],
  ["W13", 8_052_300, false],
  ["W14", FIN_ANCHORS.cash.total, false],
  ["W15", 8_416_200, true],
  ["W16", 8_158_700, true],
  ["W17", 7_644_100, true],
  ["W18", 7_962_800, true],
  ["W19", 7_503_500, true],
  ["W20", 7_788_400, true],
  ["W21", 7_215_900, true],
]

export const FIN_CASH_WEEK_ROWS: Row[] = WEEKS.map(([label, closing, forecast], index) => ({
  id: label,
  week: label,
  closing,
  net_movement: closing - (index === 0 ? OPENING_BEFORE_W09 : WEEKS[index - 1][1]),
  forecast,
}))

export const FIN_ACTIVITY_ROWS: Row[] = [
  { id: "act-1", at: "2026-03-31T09:00:00.000Z", actor: "Karim Fouad", action: "Posted entry", subject: "JE-2026-000841" },
  { id: "act-2", at: "2026-03-31T05:24:00.000Z", actor: "Nour Adel", action: "Reversed entry", subject: "JE-2026-000838" },
  { id: "act-3", at: "2026-03-31T01:48:00.000Z", actor: "Sara Hany", action: "Created voucher", subject: "PV-2026-0412" },
  { id: "act-4", at: "2026-03-30T22:12:00.000Z", actor: "Omar Deeb", action: "Reconciled account", subject: "QNB Alahli — payroll account" },
  { id: "act-5", at: "2026-03-30T18:36:00.000Z", actor: "Hala Mostafa", action: "Approved bill", subject: "BILL-2026-1987" },
  { id: "act-6", at: "2026-03-30T15:00:00.000Z", actor: "Layla Adham", action: "Changed routing", subject: "Posting map · sale.credit" },
  { id: "act-7", at: "2026-03-30T11:24:00.000Z", actor: "Karim Fouad", action: "Closed period", subject: "February 2026" },
  { id: "act-8", at: "2026-03-30T07:48:00.000Z", actor: "Nour Adel", action: "Imported statement", subject: "CIB — current account 0021" },
]

/** "Needs your attention" on Finance home, worst first. */
export function buildAttentionItems(): Row[] {
  return [
    {
      id: "att-unmatched",
      label: `${FIN_ANCHORS.banking.cibUnmatchedLines} unmatched bank lines on CIB current account`,
      count: FIN_ANCHORS.banking.cibUnmatchedLines,
      tone: "danger",
      href: "/finance/reconciliation",
    },
    {
      id: "att-einvoices",
      label: `${FIN_ANCHORS.tax.rejectedEInvoices} e-invoices rejected by ETA`,
      count: FIN_ANCHORS.tax.rejectedEInvoices,
      tone: "danger",
      href: "/finance/tax/e-invoicing",
    },
    {
      id: "att-seal",
      label: `Seal certificate expires in ${FIN_ANCHORS.tax.sealExpiresInDays} days`,
      count: FIN_ANCHORS.tax.sealExpiresInDays,
      tone: "warning",
      href: "/finance/tax/e-invoicing",
    },
    {
      id: "att-depreciation",
      label: "March depreciation not posted",
      count: 1,
      tone: "warning",
      href: "/finance/assets/depreciation",
    },
    {
      id: "att-receipts",
      label: `${FIN_ANCHORS.receipts.unallocated} receipts unallocated`,
      count: FIN_ANCHORS.receipts.unallocated,
      tone: "warning",
      href: "/finance/ar/allocation",
    },
    {
      id: "att-journals",
      label: `${FIN_ANCHORS.approvals.journalsAwaitingApproval} journals awaiting your approval`,
      count: FIN_ANCHORS.approvals.journalsAwaitingApproval,
      tone: "info",
      href: "/finance/journals",
    },
  ]
}

/** On the go · Exceptions — anything the module thinks is wrong, worst first. */
export function buildExceptionRows(): Row[] {
  return [
    {
      id: "exc-seal",
      label: `The signing certificate expires in ${FIN_ANCHORS.tax.sealExpiresInDays} days`,
      href: "/finance/tax/e-invoicing",
    },
    {
      id: "exc-overdue",
      label: `${FIN_ANCHORS.receivables.overdueInvoices} invoices are overdue`,
      href: "/finance/ar/collections",
    },
    {
      id: "exc-unmatched",
      label: `${FIN_ANCHORS.banking.unmatchedLines} bank lines have not been matched`,
      href: "/finance/reconciliation",
    },
    {
      id: "exc-rejected",
      label: `${FIN_ANCHORS.tax.rejectedEInvoices} documents were rejected by the authority`,
      href: "/finance/tax/e-invoicing",
    },
  ]
}
