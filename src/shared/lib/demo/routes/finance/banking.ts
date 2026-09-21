import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { convert } from "../../seed/finance/banking"
import { FIN_TODAY } from "../../seed/finance/calendar"
import { EMPLOYEE_CUSTODY_ACCOUNT } from "../../seed/finance/master-data"
import {
  nextEntry,
  postMovement,
  presentMovement,
  presentTreasuries,
  presentTreasury,
  unmatchedTotal,
} from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"

const r2 = (value: number) => Math.round(value * 100) / 100

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const refuse = (message: string) => ({ status: 422, data: { message } })

function dayDiff(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000)
}

// ─── Cheques ─────────────────────────────────────────────────────────────────

/** Where a cheque can go next from each status, by direction. */
const NEXT_STATUS: Record<"received" | "issued", Record<string, string[]>> = {
  received: {
    in_hand: ["deposited", "returned"],
    deposited: ["under_collection"],
    under_collection: ["collected", "bounced"],
    bounced: ["deposited", "returned"],
  },
  issued: {
    written: ["delivered", "cancelled"],
    delivered: ["presented", "cancelled"],
    presented: ["cleared", "bounced"],
    bounced: ["presented", "cancelled"],
  },
}

/** Still in play: due-soon counts and markers only apply to these. */
const LIVE_STATUSES = new Set(["in_hand", "deposited", "under_collection", "written", "delivered", "presented"])
const PROBLEM_STATUSES = new Set(["bounced", "returned", "cancelled"])
const DUE_SOON_DAYS = 14

function presentCheque(cheque: Row): Row {
  const direction = cheque.direction as "received" | "issued"
  const treasury = findRow(FIN_COLLECTIONS.treasuries, String(cheque.treasury_id))
  const live = LIVE_STATUSES.has(String(cheque.status))
  const daysToDue = dayDiff(FIN_TODAY, String(cheque.due_date))
  const movement = collection(FIN_COLLECTIONS.treasuryMovements).find(
    (row) => row.source_type === "cheque" && row.source_id === cheque.id,
  )
  return {
    ...cheque,
    treasury_name: treasury?.name ?? "",
    days_to_due: live ? daysToDue : null,
    due_soon: live && daysToDue >= 0 && daysToDue <= DUE_SOON_DAYS,
    next: NEXT_STATUS[direction][String(cheque.status)] ?? [],
    entry: movement?.entry ?? null,
  }
}

function chequeList(direction: string) {
  const items = collection(FIN_COLLECTIONS.cheques)
    .filter((cheque) => cheque.direction === direction)
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .map(presentCheque)
  return {
    items,
    count: items.length,
    total_base: r2(items.reduce((sum, item) => sum + Number(item.amount), 0)),
    due_soon: items.filter((item) => item.due_soon).length,
    problems: items.filter((item) => PROBLEM_STATUSES.has(String(item.status))).length,
  }
}

function presentBook(book: Row): Row {
  const size = Number(book.last) - Number(book.first) + 1
  const used = collection(FIN_COLLECTIONS.cheques).filter(
    (cheque) =>
      cheque.direction === book.direction &&
      Number(cheque.number) >= Number(book.first) &&
      Number(cheque.number) <= Number(book.last),
  )
  const numbers = new Set(used.map((cheque) => Number(cheque.number)))
  let next: number | null = null
  for (let number = Number(book.first); number <= Number(book.last); number++) {
    if (!numbers.has(number)) {
      next = number
      break
    }
  }
  return { ...book, size, used: used.length, remaining: size - used.length, next_number: next }
}

// ─── Custody ─────────────────────────────────────────────────────────────────

function presentHolder(holder: Row): Row {
  const movements = (holder.movements as Row[]) ?? []
  const advanced = r2(movements.filter((row) => row.type === "advance").reduce((sum, row) => sum + Number(row.amount), 0))
  const settled = r2(-movements.filter((row) => row.type !== "advance").reduce((sum, row) => sum + Number(row.amount), 0))
  const outstanding = r2(advanced - settled)
  const since = movements.filter((row) => row.type === "advance").map((row) => String(row.date)).sort()[0] ?? null
  return {
    ...holder,
    movements: [...movements].sort((a, b) => String(a.date).localeCompare(String(b.date))),
    since,
    advanced,
    settled,
    outstanding,
    status: outstanding > 0 ? "open" : "cleared",
  }
}

function addCustodyMovement(holder: Row, movement: Omit<Row, "id">) {
  const movements = (holder.movements as Row[]) ?? []
  holder.movements = [...movements, { ...movement, id: `${String(holder.id)}-${movements.length + 1}` }]
}

/** 04 · Banking — treasuries, transfers, cheques, cheque books and employee custody. */
export const financeBankingRoutes: DemoRoute[] = [
  route("get", "/finance/treasuries", () => ({ data: presentTreasuries() })),

  route("get", "/finance/banking/overview", () => {
    const treasuries = presentTreasuries()
    return {
      data: {
        total_base: r2(treasuries.reduce((sum, row) => sum + Number(row.base_balance), 0)),
        accounts: treasuries.length,
        banks: treasuries.filter((row) => row.kind === "bank").length,
        tills: treasuries.filter((row) => row.kind === "cash").length,
        unmatched_lines: unmatchedTotal(),
        currencies: Array.from(new Set(treasuries.map((row) => String(row.currency)))),
        treasuries,
      },
    }
  }),

  route("get", "/finance/treasuries/:id", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, req.vars.id)
    if (!treasury) return { status: 404, data: null }
    const movements = collection(FIN_COLLECTIONS.treasuryMovements)
      .filter((row) => row.treasury_id === treasury.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const net = r2(movements.reduce((sum, row) => sum + Number(row.amount), 0))
    return {
      data: {
        ...presentTreasury(treasury),
        opening_balance: r2(Number(treasury.balance) - net),
        days_since_reconciled: treasury.last_reconciled ? dayDiff(String(treasury.last_reconciled), FIN_TODAY) : null,
        movements: movements.map(presentMovement),
      },
    }
  }),

  route("get", "/finance/transfers", () => {
    const items = collection(FIN_COLLECTIONS.transfers).map((transfer) => ({
      ...transfer,
      from_name: findRow(FIN_COLLECTIONS.treasuries, String(transfer.from_treasury_id))?.name ?? "",
      to_name: findRow(FIN_COLLECTIONS.treasuries, String(transfer.to_treasury_id))?.name ?? "",
    }))
    return { data: items }
  }),

  /** One balanced entry: debit the receiving treasury, credit the sending one. */
  route("post", "/finance/transfers", (req) => {
    const from = findRow(FIN_COLLECTIONS.treasuries, String(req.body.from_treasury_id))
    const to = findRow(FIN_COLLECTIONS.treasuries, String(req.body.to_treasury_id))
    const amount = r2(Number(req.body.amount))
    if (!from || !to) return refuse("Choose both treasuries.")
    if (from.id === to.id) return refuse("Money has to move between two different treasuries.")
    if (!(amount > 0)) return refuse("Enter a transfer amount greater than zero.")
    if (amount > Number(from.balance)) {
      return refuse(`${String(from.name)} holds ${money(Number(from.balance))} ${String(from.currency)}, less than this transfer.`)
    }
    const count = collection(FIN_COLLECTIONS.transfers).length
    const number = `TRA-2026-${1300 + count}`
    const received = convert(amount, String(from.currency), String(to.currency))
    const date = String(req.body.date ?? FIN_TODAY)
    const entry = nextEntry()
    const common = { date, source: number, source_type: "transfer", source_id: number, entry }
    postMovement({ ...common, treasury_id: String(from.id), description: `Transfer to ${String(to.name)}`, amount: -amount })
    postMovement({ ...common, treasury_id: String(to.id), description: `Transfer from ${String(from.name)}`, amount: received })
    const transfer = createRow(FIN_COLLECTIONS.transfers, {
      number,
      date,
      from_treasury_id: from.id,
      to_treasury_id: to.id,
      amount,
      currency: from.currency,
      received,
      note: String(req.body.note ?? ""),
      entry,
    })
    transfer.id = number
    return { data: { ...transfer, from_name: from.name, to_name: to.name } }
  }),

  route("get", "/finance/cheques/books", () => ({
    data: collection(FIN_COLLECTIONS.chequeBooks).map(presentBook),
  })),

  route("post", "/finance/cheques/books", (req) => {
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const first = Math.trunc(Number(req.body.first))
    const leaves = Math.trunc(Number(req.body.leaves))
    const direction = req.body.direction === "received" ? "received" : "issued"
    if (!treasury || treasury.kind !== "bank") return refuse("Choose the bank account the book belongs to.")
    if (!(first > 0) || !(leaves > 0)) return refuse("Enter the first number and how many leaves the book has.")
    const last = first + leaves - 1
    const overlap = collection(FIN_COLLECTIONS.chequeBooks).find(
      (book) => book.direction === direction && first <= Number(book.last) && last >= Number(book.first),
    )
    if (overlap) return refuse(`That range overlaps ${String(overlap.code)}. Cheque numbers are never reused.`)
    const count = collection(FIN_COLLECTIONS.chequeBooks).length
    const code = `CB-${String(count + 1).padStart(2, "0")}`
    const book = createRow(FIN_COLLECTIONS.chequeBooks, {
      code,
      bank: treasury.bank,
      treasury_id: treasury.id,
      first,
      last,
      direction,
    })
    book.id = code
    return { data: presentBook(book) }
  }),

  route("get", "/finance/cheques", (req) => ({
    data: chequeList(req.params.direction === "issued" ? "issued" : "received"),
  })),

  route("get", "/finance/cheques/:id", (req) => {
    const cheque = findRow(FIN_COLLECTIONS.cheques, req.vars.id)
    return cheque ? { data: presentCheque(cheque) } : { status: 404, data: null }
  }),

  /** Register a cheque at its opening status. Nothing posts until it clears. */
  route("post", "/finance/cheques", (req) => {
    const direction = req.body.direction === "issued" ? "issued" : "received"
    const number = String(req.body.number ?? "").trim()
    const contact = findRow(FIN_COLLECTIONS.contacts, String(req.body.contact_id))
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const amount = r2(Number(req.body.amount))
    if (!/^\d+$/.test(number)) return refuse("Enter the cheque number as digits.")
    if (!contact || !treasury || !(amount > 0)) return refuse("The cheque is missing something it needs.")
    if (collection(FIN_COLLECTIONS.cheques).some((row) => row.direction === direction && row.number === number)) {
      return refuse(`Cheque ${number} is already in the register.`)
    }
    if (direction === "issued") {
      const book = collection(FIN_COLLECTIONS.chequeBooks).find(
        (row) => row.direction === "issued" && Number(number) >= Number(row.first) && Number(number) <= Number(row.last),
      )
      if (!book) return refuse(`Cheque ${number} is not in any registered cheque book.`)
    }
    const status = direction === "received" ? "in_hand" : "written"
    const issueDate = String(req.body.issue_date ?? FIN_TODAY)
    const cheque = createRow(FIN_COLLECTIONS.cheques, {
      number,
      direction,
      contact_id: contact.id,
      party_name: contact.name,
      bank: String(req.body.bank ?? "").trim() || String(treasury.bank ?? ""),
      treasury_id: treasury.id,
      issue_date: issueDate,
      due_date: String(req.body.due_date ?? issueDate),
      amount,
      currency: treasury.currency,
      status,
      history: [{ status, date: FIN_TODAY }],
    })
    cheque.id = `${direction === "received" ? "CHR" : "CHI"}-${number}`
    return { data: presentCheque(cheque) }
  }),

  /** Move a cheque along; collecting or clearing posts it to its treasury. */
  route("post", "/finance/cheques/:id/status", (req) => {
    const cheque = findRow(FIN_COLLECTIONS.cheques, req.vars.id)
    if (!cheque) return { status: 404, data: null }
    const direction = cheque.direction as "received" | "issued"
    const target = String(req.body.status)
    if (!(NEXT_STATUS[direction][String(cheque.status)] ?? []).includes(target)) {
      return refuse(`This cheque is ${String(cheque.status).replace(/_/g, " ")}, so it cannot be marked ${target.replace(/_/g, " ")}.`)
    }
    if (target === "cleared") {
      const treasury = findRow(FIN_COLLECTIONS.treasuries, String(cheque.treasury_id))
      if (treasury && Number(cheque.amount) > Number(treasury.balance)) {
        return refuse(`${String(treasury.name)} holds ${money(Number(treasury.balance))}, less than this cheque.`)
      }
    }
    if (target === "collected" || target === "cleared") {
      postMovement({
        treasury_id: String(cheque.treasury_id),
        description: `Cheque ${String(cheque.number)} — ${String(cheque.party_name)}`,
        source: `CHQ-${String(cheque.number)}`,
        source_type: "cheque",
        source_id: String(cheque.id),
        amount: target === "collected" ? Number(cheque.amount) : -Number(cheque.amount),
      })
    }
    cheque.status = target
    cheque.history = [...((cheque.history as Row[]) ?? []), { status: target, date: FIN_TODAY }]
    return { data: presentCheque(cheque) }
  }),

  route("get", "/finance/employees", () => ({ data: collection(FIN_COLLECTIONS.employees) })),

  route("get", "/finance/custody", () => {
    const items = collection(FIN_COLLECTIONS.custody).map(presentHolder)
    return {
      data: {
        items,
        open_count: items.filter((item) => item.status === "open").length,
        outstanding: r2(items.reduce((sum, item) => sum + Number(item.outstanding), 0)),
        account: EMPLOYEE_CUSTODY_ACCOUNT,
      },
    }
  }),

  route("get", "/finance/custody/:id", (req) => {
    const holder = findRow(FIN_COLLECTIONS.custody, req.vars.id)
    return holder ? { data: presentHolder(holder) } : { status: 404, data: null }
  }),

  /** Record an advance as a receivable from the employee. It does not pay the money out. */
  route("post", "/finance/custody", (req) => {
    const employee = findRow(FIN_COLLECTIONS.employees, String(req.body.employee_id))
    const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id))
    const amount = r2(Number(req.body.amount))
    const description = String(req.body.description ?? "").trim()
    if (!employee || !treasury || !(amount > 0) || !description) {
      return refuse("The advance is missing something it needs.")
    }
    const holder =
      findRow(FIN_COLLECTIONS.custody, String(employee.id)) ??
      Object.assign(
        createRow(FIN_COLLECTIONS.custody, {
          employee_id: employee.id,
          name: employee.name,
          role: employee.role,
          treasury_id: treasury.id,
          movements: [],
        }),
        { id: employee.id },
      )
    holder.treasury_id = treasury.id
    addCustodyMovement(holder, { date: String(req.body.date ?? FIN_TODAY), memo: description, type: "advance", amount })
    return { data: presentHolder(holder) }
  }),

  /**
   * Settle: expense claims reduce the custody; unspent cash handed back goes
   * into the treasury. Partial settlements are allowed.
   */
  route("post", "/finance/custody/:id/settle", (req) => {
    const holder = findRow(FIN_COLLECTIONS.custody, req.vars.id)
    if (!holder) return { status: 404, data: null }
    const expenses = r2(Number(req.body.expenses ?? 0))
    const returned = r2(Number(req.body.cash_returned ?? 0))
    const outstanding = Number(presentHolder(holder).outstanding)
    if (expenses < 0 || returned < 0 || expenses + returned <= 0) return refuse("Enter what is being settled.")
    if (r2(expenses + returned) > outstanding) {
      return refuse(`Only ${money(outstanding)} is outstanding. Settle that much or less.`)
    }
    const date = String(req.body.date ?? FIN_TODAY)
    if (expenses > 0) addCustodyMovement(holder, { date, memo: "Expense settlement", type: "settle", amount: -expenses })
    if (returned > 0) {
      const treasury = findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id ?? holder.treasury_id))
      if (!treasury) return refuse("Choose the treasury the cash goes back to.")
      postMovement({
        treasury_id: String(treasury.id),
        date,
        description: `Custody returned — ${String(holder.name)}`,
        source: `CUS-${String(holder.id)}`,
        source_type: "custody",
        source_id: String(holder.id),
        amount: returned,
      })
      addCustodyMovement(holder, { date, memo: "Cash returned", type: "return", amount: -returned })
    }
    return { data: presentHolder(holder) }
  }),

  route("post", "/finance/custody/:id/write-off", (req) => {
    const holder = findRow(FIN_COLLECTIONS.custody, req.vars.id)
    if (!holder) return { status: 404, data: null }
    const outstanding = Number(presentHolder(holder).outstanding)
    const reason = String(req.body.reason ?? "").trim()
    if (!(outstanding > 0)) return refuse("Nothing is outstanding to write off.")
    if (!reason) return refuse("Record why the custody is being written off.")
    addCustodyMovement(holder, { date: FIN_TODAY, memo: `Written off — ${reason}`, type: "write_off", amount: -outstanding })
    return { data: presentHolder(holder) }
  }),
]
