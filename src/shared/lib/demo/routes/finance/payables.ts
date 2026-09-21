import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { FIN_ANCHORS } from "../../seed/finance/anchors"
import { FIN_NOW, FIN_TODAY } from "../../seed/finance/calendar"
import { AP_CONTROL_ACCOUNT, INPUT_VAT_ACCOUNT } from "../../seed/finance/master-data"
import { rateFor } from "../../seed/finance/receivables"
import { FIN_COLLECTIONS } from "./collections"
import { nextNumber, subledgerRoutes } from "./subledger"
import { documents, presentDocument, r2 } from "./subledger-model"

const VAT_RATE = 0.14
const EXPENSE_ACCOUNT_PREFIX = "64"

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const decidedToday = (bill: Row) => String(bill.decided_at ?? "").startsWith(FIN_TODAY)

const bills = () => documents("payable").filter((doc) => doc.type === "bill")

/** Bills still waiting for a decision — the approval queue and On the go read the same list. */
export function pendingBills(): Row[] {
  return bills()
    .filter((bill) => bill.approval === "pending" && Number(bill.outstanding) > 0)
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .map((bill) => presentDocument("payable", bill))
}

/** Approved, unpaid bills: what a payment run can pick up. */
function payableBills(): Row[] {
  return bills()
    .filter((bill) => bill.approval === "approved" && Number(bill.outstanding) > 0)
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .map((bill) => presentDocument("payable", bill))
}

/** Treasury balance restated in EGP, and an EGP amount restated in the treasury's currency. */
function inTreasuryCurrency(treasury: Row, amountBase: number): number {
  return r2(amountBase / rateFor(String(treasury.currency)))
}

function insufficientFunds(treasury: Row, needed: number) {
  const currency = String(treasury.currency)
  return {
    status: 422,
    data: {
      message: `${String(treasury.name)} holds ${money(Number(treasury.balance))} ${currency}, and this needs ${money(needed)} ${currency}. Choose another treasury or pay less.`,
    },
  }
}

function presentExpense(expense: Row): Row {
  const treasury = findRow(FIN_COLLECTIONS.treasuries, String(expense.treasury_id))
  const account = findRow(FIN_COLLECTIONS.accounts, String(expense.account_code))
  return {
    ...expense,
    treasury_name: treasury?.name ?? "",
    treasury_account: treasury?.account_code ?? "",
    account_name: account?.name ?? "",
  }
}

/** 03 · Money out — the shared subledger routes plus approvals, payment runs and expenses. */
export const financePayablesRoutes: DemoRoute[] = [
  ...subledgerRoutes("payable", {
    base: "/finance/ap",
    contact: "/finance/ap/suppliers",
    notes: "/finance/ap/debit-notes",
    advances: "/finance/ap/advances",
    vouchers: "/finance/payments",
    notePrefix: "DN-2026-",
    noteStart: 4000,
    voucherPrefix: "PAY-2026-",
    voucherStart: 1023,
  }),

  route("get", "/finance/ap/approvals", () => {
    const items = pendingBills()
    return {
      data: {
        items,
        count: items.length,
        total_base: r2(items.reduce((sum, item) => sum + Number(item.outstanding_base), 0)),
        approved_today: bills().filter((bill) => bill.approval === "approved" && decidedToday(bill)).length,
        sent_back: bills().filter((bill) => bill.approval === "returned" && decidedToday(bill)).length,
        threshold: FIN_ANCHORS.payables.secondApprovalThreshold,
      },
    }
  }),

  route("post", "/finance/ap/approvals/:id/approve", (req) => {
    const bill = findRow(FIN_COLLECTIONS.apDocuments, req.vars.id)
    if (!bill || bill.approval !== "pending") {
      return { status: 404, data: { message: "This bill is no longer waiting for approval." } }
    }
    Object.assign(bill, { approval: "approved", decided_at: FIN_NOW })
    return { data: presentDocument("payable", bill) }
  }),

  /** Sending back returns the bill to its preparer; it leaves the queue and the payables book. */
  route("post", "/finance/ap/approvals/:id/send-back", (req) => {
    const bill = findRow(FIN_COLLECTIONS.apDocuments, req.vars.id)
    if (!bill || bill.approval !== "pending") {
      return { status: 404, data: { message: "This bill is no longer waiting for approval." } }
    }
    Object.assign(bill, {
      approval: "returned",
      decided_at: FIN_NOW,
      returned_reason: String(req.body.reason ?? ""),
    })
    return { data: presentDocument("payable", bill) }
  }),

  route("get", "/finance/ap/payment-runs/candidates", () => ({
    data: { items: payableBills(), payables_account: AP_CONTROL_ACCOUNT },
  })),

  /**
   * Post a payment run: every selected bill is paid in full from one treasury,
   * one posted payment voucher per supplier, and the treasury balance drops.
   */
  route("post", "/finance/ap/payment-runs", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const ids = new Set(((req.body.bill_ids as string[]) ?? []).map(String))
    const selected = bills().filter(
      (bill) => ids.has(String(bill.id)) && bill.approval === "approved" && Number(bill.outstanding) > 0,
    )
    if (!treasury || selected.length === 0) {
      return { status: 422, data: { message: "Choose a treasury and at least one approved bill." } }
    }

    const totalBase = r2(selected.reduce((sum, bill) => sum + Number(bill.outstanding), 0))
    const needed = inTreasuryCurrency(treasury, totalBase)
    if (needed > Number(treasury.balance)) return insufficientFunds(treasury, needed)

    const payments = collection(FIN_COLLECTIONS.payments)
    const runs = new Set(payments.map((payment) => payment.run).filter(Boolean)).size
    const runNumber = `RUN-2026-${String(runs + 1).padStart(3, "0")}`

    const bySupplier = new Map<string, number>()
    for (const bill of selected) {
      const amount = Number(bill.outstanding)
      bySupplier.set(String(bill.contact_id), r2((bySupplier.get(String(bill.contact_id)) ?? 0) + amount))
      Object.assign(bill, {
        allocated: r2(Number(bill.allocated) + amount),
        outstanding: 0,
        status: "paid",
        paid_by_run: runNumber,
      })
    }

    const vouchers = Array.from(bySupplier, ([supplierId, amount]) => {
      const supplier = findRow(FIN_COLLECTIONS.contacts, supplierId)
      const number = nextNumber("PAY-2026-", collection(FIN_COLLECTIONS.payments), 1023, 10)
      const voucher = createRow(FIN_COLLECTIONS.payments, {
        number,
        date: FIN_TODAY,
        contact_id: supplierId,
        treasury_id: treasury.id,
        description: `Payment run ${runNumber} — ${String(supplier?.name ?? "")}`,
        origin: "auto",
        amount,
        currency: "EGP",
        status: "posted",
        allocation: "allocated",
        run: runNumber,
      })
      voucher.id = number
      return number
    })

    treasury.balance = r2(Number(treasury.balance) - needed)

    return {
      data: {
        number: runNumber,
        bill_count: selected.length,
        supplier_count: bySupplier.size,
        total_base: totalBase,
        treasury_id: treasury.id,
        treasury_name: treasury.name,
        payment_numbers: vouchers,
      },
    }
  }),

  route("get", "/finance/expenses", () => {
    const items = collection(FIN_COLLECTIONS.expenses).map(presentExpense)
    return {
      data: {
        items,
        awaiting_count: items.filter((item) => item.status === "awaiting_approval").length,
        vat_rate: VAT_RATE,
        vat_account: INPUT_VAT_ACCOUNT,
        accounts: collection(FIN_COLLECTIONS.accounts)
          .filter((account) => !account.is_group && String(account.code).startsWith(EXPENSE_ACCOUNT_PREFIX))
          .map((account) => ({ code: account.code, name: account.name })),
      },
    }
  }),

  /** Send an expense for approval. VAT is taken out of the gross at the standard rate. */
  route("post", "/finance/expenses", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const account = findRow(FIN_COLLECTIONS.accounts, String(req.body.account_code))
    const amount = r2(Number(req.body.amount))
    const merchant = String(req.body.merchant ?? "").trim()
    const description = String(req.body.description ?? "").trim()
    if (!treasury || !account || !merchant || !description || !(amount > 0) || !req.body.has_receipt) {
      return { status: 422, data: { message: "The expense is missing something it needs." } }
    }
    const net = r2(amount / (1 + VAT_RATE))
    const count = collection(FIN_COLLECTIONS.expenses).length
    const number = `EX-${String(count + 1).padStart(3, "0")}`
    const expense = createRow(FIN_COLLECTIONS.expenses, {
      number,
      merchant,
      description,
      date: String(req.body.date ?? FIN_TODAY),
      treasury_id: treasury.id,
      account_code: account.code,
      amount,
      net,
      vat: r2(amount - net),
      currency: "EGP",
      status: "awaiting_approval",
      submitted_at: FIN_NOW,
    })
    expense.id = number
    return { data: presentExpense(expense) }
  }),

  /** Approve and post: the entry lands on the ledger and the cash leaves the treasury. */
  route("post", "/finance/expenses/:id/approve", (req) => {
    const expense = findRow(FIN_COLLECTIONS.expenses, req.vars.id)
    if (!expense || expense.status !== "awaiting_approval") {
      return { status: 404, data: { message: "This expense is no longer waiting for approval." } }
    }
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(expense.treasury_id))
    if (!treasury) return { status: 422, data: { message: "The treasury no longer exists." } }
    const needed = inTreasuryCurrency(treasury, Number(expense.amount))
    if (needed > Number(treasury.balance)) return insufficientFunds(treasury, needed)
    treasury.balance = r2(Number(treasury.balance) - needed)
    Object.assign(expense, { status: "posted", posted_at: FIN_NOW })
    return { data: presentExpense(expense) }
  }),
]
