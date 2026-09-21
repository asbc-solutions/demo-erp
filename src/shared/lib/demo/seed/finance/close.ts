import type { Row } from "../../demo-db"
import { FIN_ANCHORS } from "./anchors"

const OWNERS = ["Karim Fouad", "Nour Adel", "Sara Hany", "Omar Deeb", "Hala Mostafa", "Layla Adham"]

type TaskSeed = [title: string, status: "done" | "in_progress" | "blocked" | "not_started", href: string]

/**
 * The March close checklist: 22 tasks, 9 done — the "9 of 22 tasks done" bar
 * on Finance home. Order matches the design's progress strip. Phase 6 (Period
 * close) builds the workspace on the same rows.
 */
const TASKS: TaskSeed[] = [
  ["Reconcile CIB current account", "blocked", "/finance/reconciliation"],
  ["Reconcile Banque Misr USD account", "in_progress", "/finance/reconciliation"],
  ["Post payroll for March", "done", "/finance/journals"],
  ["Resubmit rejected e-invoices", "blocked", "/finance/tax/e-invoicing"],
  ["Clear the suspense account", "not_started", "/finance/ledger"],
  ["Post March depreciation", "in_progress", "/finance/assets/depreciation"],
  ["Run FX revaluation", "not_started", "/finance/fx-revaluation"],
  ["Accrue rent and utilities", "done", "/finance/journals"],
  ["Clear draft journal entries", "blocked", "/finance/journals"],
  ["Record bank charges", "done", "/finance/journals"],
  ["Allocate unallocated receipts", "in_progress", "/finance/ar/allocation"],
  ["Review aged receivables", "in_progress", "/finance/ar/collections"],
  ["Match supplier statements", "done", "/finance/ap"],
  ["Renew the e-invoicing seal certificate", "in_progress", "/finance/tax/e-invoicing"],
  ["Prepare the VAT return", "not_started", "/finance/tax/vat-return"],
  ["Post petty cash vouchers", "done", "/finance/treasuries"],
  ["Reconcile petty cash — Cairo", "done", "/finance/treasuries"],
  ["Review withholding tax", "not_started", "/finance/tax/withholding"],
  ["Reconcile petty cash — Alexandria", "done", "/finance/treasuries"],
  ["Reconcile QNB payroll account", "done", "/finance/reconciliation"],
  ["Post intercompany recharges", "done", "/finance/journals"],
  ["Review cost-center allocations", "in_progress", "/finance/allocation-rules"],
]

export const FIN_CLOSE_TASK_ROWS: Row[] = TASKS.map(([title, status, href], index) => ({
  id: `close-2026-03-${String(index + 1).padStart(2, "0")}`,
  period: "2026-03",
  position: index + 1,
  title,
  status,
  owner: OWNERS[index % OWNERS.length],
  href,
}))

/** Readiness checks that still fail for March — "5 things are still in the way". */
export const FIN_CLOSE_CHECK_ROWS: Row[] = [
  {
    id: "check-drafts",
    title: "No draft entries in the period",
    detail: `${FIN_ANCHORS.ledger.draftEntries} drafts`,
    href: "/finance/journals",
  },
  {
    id: "check-reconciled",
    title: "All bank accounts reconciled",
    detail: `${FIN_ANCHORS.banking.treasuriesUnreconciled} accounts with unmatched lines`,
    href: "/finance/reconciliation",
  },
  {
    id: "check-depreciation",
    title: "Depreciation posted for the period",
    detail: "March run is still a draft",
    href: "/finance/assets/depreciation",
  },
  {
    id: "check-suspense",
    title: "Suspense account at zero",
    detail: `Balance ${FIN_ANCHORS.ledger.suspenseBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    href: "/finance/ledger",
  },
  {
    id: "check-einvoices",
    title: "All e-invoices submitted and cleared",
    detail: `${FIN_ANCHORS.tax.rejectedEInvoices} rejected, ${FIN_ANCHORS.tax.notSubmittedEInvoices} not sent, seal expires in ${FIN_ANCHORS.tax.sealExpiresInDays} days`,
    href: "/finance/tax/e-invoicing",
  },
]
