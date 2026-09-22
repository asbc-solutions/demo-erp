import type { Row } from "../../demo-db"

type TaskStatus = "done" | "in_progress" | "not_started"

/**
 * [group, title, description, owner, due, stored status, blocker source]
 *
 * A task with a blocker source is blocked while that source still has items
 * (unmatched lines, unallocated receipts, bills in the approval queue …); the
 * rest are signed off by hand. Nine of the 22 are done, as on Finance home.
 * `{n}` in a description is replaced with the live blocker count.
 */
type TaskSeed = [string, string, string, string, string, TaskStatus, string | null]

const TASKS: TaskSeed[] = [
  ["Cash & banking", "Reconcile CIB current account", "Match the March statement against the ledger.", "Hala Mostafa", "2026-04-05", "in_progress", "unmatched:bnk-cib-0021"],
  ["Cash & banking", "Reconcile Banque Misr USD", "Match the FX bank statement.", "Hala Mostafa", "2026-04-05", "in_progress", "unmatched:bnk-bm-usd-4417"],
  ["Cash & banking", "Count petty cash", "Verify petty cash balances.", "Hala Mostafa", "2026-04-02", "done", null],
  ["Cash & banking", "Clear stale cheques", "Follow up on under-collection cheques.", "Hala Mostafa", "2026-04-02", "done", null],
  ["Receivables", "Review unallocated receipts", "Apply {n} unallocated receipts to invoices.", "Omar Deeb", "2026-04-04", "in_progress", "unallocated_receipts"],
  ["Receivables", "Send customer statements", "Dispatch March statements.", "Omar Deeb", "2026-04-06", "not_started", null],
  ["Receivables", "Review credit notes", "Confirm credit notes match originals.", "Omar Deeb", "2026-04-02", "done", null],
  ["Payables", "Approve pending bills", "Clear the approval queue.", "Sara Hany", "2026-04-03", "in_progress", "pending_bills"],
  ["Payables", "Run supplier payment batch", "Execute the March payment run.", "Sara Hany", "2026-04-07", "not_started", null],
  ["Payables", "Reconcile supplier statements", "Match supplier statements.", "Sara Hany", "2026-04-06", "not_started", null],
  ["Inventory", "Post inventory adjustments", "Reconcile stock counts.", "Nour Adel", "2026-04-02", "done", null],
  ["Inventory", "Value goods in transit", "Confirm in-transit valuation.", "Nour Adel", "2026-04-03", "done", null],
  ["Fixed assets", "Post March depreciation", "The depreciation run is unposted.", "Nour Adel", "2026-04-03", "in_progress", "depreciation"],
  ["Fixed assets", "Review asset disposals", "Confirm the February disposal gain.", "Nour Adel", "2026-04-02", "done", null],
  ["Tax", "Prepare VAT return", "Draft the March VAT declaration.", "Nour Adel", "2026-04-08", "in_progress", null],
  ["Tax", "Clear e-invoice rejections", "{n} documents rejected by ETA.", "Nour Adel", "2026-04-05", "in_progress", "rejected_einvoices"],
  ["Tax", "Remit withholding tax", "Create the WHT remittance batch.", "Nour Adel", "2026-04-04", "done", null],
  ["Payroll", "Post payroll journal", "Import the March payroll summary.", "Nour Adel", "2026-04-02", "done", null],
  ["Payroll", "Reconcile social insurance", "Match SI payable to the schedule.", "Nour Adel", "2026-04-03", "done", null],
  ["Review & sign-off", "Review trial balance", "Confirm balances tie out.", "Karim Fouad", "2026-04-09", "in_progress", null],
  ["Review & sign-off", "FX revaluation", "Run the month-end FX revaluation.", "Karim Fouad", "2026-04-08", "in_progress", "fx_revaluation"],
  ["Review & sign-off", "Controller sign-off", "Final review and sign-off.", "Karim Fouad", "2026-04-10", "not_started", null],
]

const HREF: Record<string, string> = {
  "Reconcile CIB current account": "/finance/reconciliation/bnk-cib-0021",
  "Reconcile Banque Misr USD": "/finance/reconciliation/bnk-bm-usd-4417",
  "Count petty cash": "/finance/treasuries",
  "Clear stale cheques": "/finance/cheques/received",
  "Review unallocated receipts": "/finance/ar/allocation",
  "Send customer statements": "/finance/ar",
  "Review credit notes": "/finance/ar/credit-notes",
  "Approve pending bills": "/finance/ap/approvals",
  "Run supplier payment batch": "/finance/ap/payment-runs",
  "Reconcile supplier statements": "/finance/ap",
  "Post inventory adjustments": "/finance/journals",
  "Value goods in transit": "/finance/journals",
  "Post March depreciation": "/finance/assets/depreciation",
  "Review asset disposals": "/finance/assets",
  "Prepare VAT return": "/finance/tax/vat-return",
  "Clear e-invoice rejections": "/finance/tax/e-invoicing",
  "Remit withholding tax": "/finance/tax/withholding",
  "Post payroll journal": "/finance/journals",
  "Reconcile social insurance": "/finance/ledger?account=210401",
  "Review trial balance": "/finance/reports/trial-balance",
  "FX revaluation": "/finance/fx-revaluation",
  "Controller sign-off": "/finance/close",
}

export const FIN_CLOSE_TASK_ROWS: Row[] = TASKS.map(([group, title, description, owner, due, status, blocker], index) => ({
  id: `close-2026-03-${String(index + 1).padStart(2, "0")}`,
  period: "2026-03",
  position: index + 1,
  group,
  title,
  description,
  owner,
  due_date: due,
  status,
  blocker,
  href: HREF[title] ?? "/finance/close",
}))

/** FY2025 year-end steps; the first two are done. */
export const FIN_YEAR_END_STEPS: Row[] = [
  { id: "periods", position: 1, title: "All monthly periods closed", detail: "Every period in FY2025 must be closed before year-end.", done: true },
  { id: "trial_balance", position: 2, title: "Trial balance reviewed", detail: "Confirm the year-end trial balance ties out.", done: true },
  { id: "adjustments", position: 3, title: "Adjusting entries posted", detail: "Accruals, provisions, and reclassifications booked.", done: false },
  { id: "income_statement", position: 4, title: "Close income statement to retained earnings", detail: "Revenue and expense accounts zeroed into 320101.", done: false },
  { id: "lock", position: 5, title: "Lock the fiscal year", detail: "Seal all periods; no further postings.", done: false },
]
