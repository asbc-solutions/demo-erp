import type { Row } from "../../demo-db"
import { FIN_ANCHORS } from "./anchors"
import { FIN_CLOSE_CHECK_ROWS } from "./close"

/**
 * The finance assistant is scripted: every answer below is grounded in the
 * same anchors the screens use, so what it says always matches what a screen
 * shows. No model is called.
 */

const money = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const VAT = FIN_ANCHORS.tax.vatReturn
const NOT_READ = ["Payroll salary lines", "Private notes"]
const PROPOSAL_BADGE = "Opens an existing screen · nothing is issued here"

export type AssistantTopic =
  | "watchlist"
  | "close"
  | "rule"
  | "approvers"
  | "filing"
  | "aging"
  | "group"
  | "unknown"

/** Data group each topic reads; a disabled group turns the answer into a limited one. */
export const TOPIC_GROUP: Record<AssistantTopic, string | null> = {
  watchlist: "cash",
  close: "close",
  rule: "ledger",
  approvers: "payables",
  filing: "tax",
  aging: "receivables",
  group: "consolidation",
  unknown: null,
}

/** First match wins, so the narrower topics come before the broad "close" one. */
const KEYWORDS: [AssistantTopic, RegExp][] = [
  ["filing", /\b(vat|filing|file|filed|pre-filing|return|e-invoices?|rejected)\b/i],
  ["approvers", /\b(approv\w*|second|threshold)\b/i],
  ["rule", /\b(posting map|route|routes|routing|rule|unrouted|credit sale)\b/i],
  ["watchlist", /\b(reconcil\w*|unmatched|treasur\w*|banks?|stale)\b/i],
  ["close", /\b(close|closing|blocked|blocking|blockers?|depreciation|unposted)\b/i],
  ["aging", /\b(overdue|aging|ageing|receivables?|customers?)\b/i],
  ["group", /\b(group|consolidat\w*)\b/i],
]

export function topicForQuestion(question: string): AssistantTopic {
  return KEYWORDS.find(([, pattern]) => pattern.test(question))?.[0] ?? "unknown"
}

const CUSTOMER_NAMES: Record<string, string> = {
  "110301": "Nile Contracting Co.",
  "110302": "Delta Cement Company",
  "110303": "Red Sea Resorts Group",
  "110304": "Gulf Engineering Trading",
  "110305": "Suez Canal Logistics",
  "110306": "Alexandria Food Industries",
}

export const ASSISTANT_ANSWERS: Record<AssistantTopic, Record<string, unknown>> = {
  watchlist: {
    headline: `${FIN_ANCHORS.banking.treasuriesUnreconciled} treasuries are blocking the March close — ${FIN_ANCHORS.banking.unmatchedLines} unmatched lines in total.`,
    matches: "Banking / Bank reconciliation",
    table: {
      columns: [
        { id: "treasury", label: "Treasury" },
        { id: "count", label: "Unmatched", align: "end" },
        { id: "oldest", label: "Oldest" },
        { id: "href", label: "Where it goes" },
      ],
      rows: [
        { id: "cib", treasury: "CIB — current account 0021", count: FIN_ANCHORS.banking.cibUnmatchedLines, oldest: "3 Mar 2026", href: "/finance/reconciliation" },
        { id: "bm", treasury: "Banque Misr — USD 4417", count: FIN_ANCHORS.banking.bankMisrUnmatchedLines, oldest: "12 Mar 2026", href: "/finance/reconciliation" },
      ],
      footnote: "Showing 2 of 6 cash accounts · the other 4 are reconciled to 31 Mar 2026",
    },
    links: [
      { label: "Banking / Bank reconciliation", href: "/finance/reconciliation" },
      { label: "Overview / Cash position", href: "/finance/cash-position" },
    ],
    proposal: {
      summary: "Match the CIB lines first — they are 18 of the 21 lines holding up the close.",
      badge: PROPOSAL_BADGE,
      facts: [
        { term: "Account", value: "CIB — current account 0021" },
        { term: "Unmatched lines", value: String(FIN_ANCHORS.banking.cibUnmatchedLines) },
        { term: "Statement to", value: "31 Mar 2026" },
        { term: "Status", value: "Blocking the March close" },
      ],
      action: { label: "Open Banking / Bank reconciliation", href: "/finance/reconciliation" },
    },
    grounding: [
      { label: "Banking / Bank reconciliation", detail: `${FIN_ANCHORS.banking.unmatchedLines} lines` },
      { label: "Period close / Close workspace", detail: "22 tasks" },
    ],
    not_read: NOT_READ,
    sources: 2,
  },
  close: {
    headline: `${FIN_CLOSE_CHECK_ROWS.length} readiness checks still fail, so March cannot be closed yet.`,
    matches: "Period close / Close workspace",
    table: {
      columns: [
        { id: "check", label: "Check" },
        { id: "detail", label: "What is in the way" },
        { id: "href", label: "Where it goes" },
      ],
      rows: FIN_CLOSE_CHECK_ROWS.map((check) => ({
        id: check.id,
        check: check.title,
        detail: check.detail,
        href: check.href,
      })),
      footnote: "Depreciation is one of the five: until the March run posts, the period stays open.",
    },
    links: [
      { label: "Period close / Close workspace", href: "/finance/close" },
      { label: "Assets / Depreciation", href: "/finance/assets/depreciation" },
    ],
    proposal: {
      summary: "Post the March depreciation run — it is the only blocker that needs no other team.",
      badge: PROPOSAL_BADGE,
      facts: [
        { term: "Run", value: "DR-2026-03" },
        { term: "Status", value: "Draft" },
        { term: "Blocks", value: "Period close · Depreciation posted for the period" },
      ],
      action: { label: "Open Assets / Depreciation", href: "/finance/assets/depreciation" },
    },
    grounding: [
      { label: "Period close / Close workspace", detail: "5 checks" },
      { label: "Assets / Depreciation", detail: "1 run" },
    ],
    not_read: NOT_READ,
    sources: 2,
  },
  rule: {
    headline: "A credit sale debits trade receivables and credits sales revenue; the 14% VAT goes to VAT output (2102).",
    matches: "Configuration / Posting map",
    table: {
      columns: [
        { id: "line", label: "Line" },
        { id: "account", label: "Account" },
        { id: "side", label: "Side" },
      ],
      rows: [
        { id: "l1", line: "Invoice total", account: "1103 · Trade receivables", side: "Debit" },
        { id: "l2", line: "Net amount", account: "4101 · Sales revenue", side: "Credit" },
        { id: "l3", line: "VAT 14%", account: "2102 · VAT output", side: "Credit" },
      ],
      footnote: "Posting map rule sale.credit · published 01 Jan 2026",
    },
    links: [
      { label: "Configuration / Posting map", href: "/finance/settings/posting-map" },
      { label: "Configuration / Posting simulator", href: "/finance/settings/posting-map/simulate" },
    ],
    proposal: null,
    grounding: [
      { label: "Configuration / Posting map", detail: "1 rule" },
      { label: "Tax & compliance / Tax codes", detail: "VAT 14%" },
    ],
    not_read: NOT_READ,
    sources: 2,
  },
  approvers: {
    headline: `2 bills are at or above the second-approval threshold of EGP ${money(FIN_ANCHORS.payables.secondApprovalThreshold)}.`,
    matches: "Money out / Bill approvals",
    table: {
      columns: [
        { id: "bill", label: "Bill" },
        { id: "supplier", label: "Supplier" },
        { id: "amount", label: "Amount (EGP)", align: "end" },
        { id: "approvals", label: "Approvals" },
      ],
      rows: [
        { id: "b1", bill: "BILL-2026-2003", supplier: "Cairo Logistics Services", amount: money(229_859.44), approvals: "0 of 2" },
        { id: "b2", bill: "BILL-2026-2004", supplier: "El Nasr Accounting Office", amount: money(187_156.44), approvals: "0 of 2" },
      ],
      footnote: "Showing 2 of 6 bills awaiting approval · threshold from Approval policies",
    },
    links: [
      { label: "Money out / Bill approvals", href: "/finance/ap/approvals" },
      { label: "Configuration / Approval policies", href: "/finance/settings/approvals" },
    ],
    proposal: {
      summary: "Route both bills to a second approver before the next payment run picks them up.",
      badge: PROPOSAL_BADGE,
      facts: [
        { term: "Bills", value: "BILL-2026-2003 · BILL-2026-2004" },
        { term: "Combined", value: `EGP ${money(229_859.44 + 187_156.44)}` },
        { term: "Policy", value: "Two approvers at EGP 150,000.00 and above" },
      ],
      action: { label: "Open Money out / Bill approvals", href: "/finance/ap/approvals" },
    },
    grounding: [
      { label: "Money out / Bill approvals", detail: "6 bills" },
      { label: "Configuration / Approval policies", detail: "1 policy" },
    ],
    not_read: NOT_READ,
    sources: 2,
  },
  filing: {
    headline: `${VAT.openChecks} of ${VAT.totalChecks} pre-filing checks are still open — the return cannot be filed.`,
    matches: "Tax & compliance / VAT return",
    table: {
      columns: [
        { id: "check", label: "Check" },
        { id: "count", label: "Count", align: "end" },
        { id: "href", label: "Where it goes" },
      ],
      rows: [
        { id: "c1", check: "Invoices with no tax code", count: 3, href: "/finance/journals" },
        { id: "c2", check: "Tax codes with no account routing", count: 1, href: "/finance/settings/posting-map" },
        { id: "c3", check: "Credit notes without an original", count: 0, href: "/finance/ar/credit-notes" },
        { id: "c4", check: "Suppliers missing a tax registration number", count: 2, href: "/finance/ap" },
      ],
      footnote: `Showing 4 of ${VAT.totalChecks} checks · net payable EGP ${money(VAT.outputVat - VAT.inputVat)}`,
    },
    links: [
      { label: "Tax & compliance / VAT return", href: "/finance/tax/vat-return" },
      { label: "Tax & compliance / E-invoicing", href: "/finance/tax/e-invoicing" },
    ],
    proposal: {
      summary: `Clear the ${VAT.openChecks} open pre-filing checks before filing — the return is blocked until every check reads zero.`,
      badge: PROPOSAL_BADGE,
      facts: [
        { term: "Return", value: VAT.id },
        { term: "Output VAT", value: `EGP ${money(VAT.outputVat)}` },
        { term: "Input VAT", value: `EGP ${money(VAT.inputVat)}` },
        { term: "Status", value: "Blocked until checks clear" },
      ],
      action: { label: "Open Tax & compliance / VAT return", href: "/finance/tax/vat-return" },
    },
    grounding: [
      { label: "Tax & compliance / VAT return", detail: "10 boxes" },
      { label: "Tax & compliance / E-invoicing", detail: `seal expires in ${FIN_ANCHORS.tax.sealExpiresInDays} days` },
      { label: "قانون الضريبة على القيمة المضافة", detail: "1 rule" },
    ],
    not_read: NOT_READ,
    sources: 3,
  },
  aging: {
    headline: `EGP ${money(FIN_ANCHORS.receivables.overdue)} of receivables is overdue; five customers hold most of it.`,
    matches: "Money in / Collections",
    table: {
      columns: [
        { id: "customer", label: "Customer" },
        { id: "amount", label: "Overdue (EGP)", align: "end" },
        { id: "oldest", label: "Oldest" },
      ],
      rows: FIN_ANCHORS.receivables.overdueByCustomer.slice(0, 5).map((entry) => ({
        id: entry.contactId,
        customer: CUSTOMER_NAMES[entry.contactId],
        amount: money(entry.amount),
        oldest: new Date(`${entry.oldest}T00:00:00Z`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      })),
      footnote: `Top 5 of ${FIN_ANCHORS.receivables.overdueInvoices} overdue invoices · EGP ${money(
        FIN_ANCHORS.receivables.overdueByCustomer.slice(0, 5).reduce((sum, entry) => sum + entry.amount, 0),
      )}`,
    },
    links: [
      { label: "Money in / Collections", href: "/finance/ar/collections" },
      { label: "Money in / AR overview", href: "/finance/ar" },
    ],
    proposal: null,
    grounding: [
      { label: "Money in / AR overview", detail: `${FIN_ANCHORS.receivables.overdueInvoices} invoices` },
    ],
    not_read: NOT_READ,
    sources: 1,
  },
  group: {
    headline: "I can't give a group position — consolidation isn't in this prototype.",
    matches: null,
    limited: true,
    table: null,
    links: [{ label: "Overview / Cash position", href: "/finance/cash-position" }],
    proposal: null,
    grounding: [],
    not_read: ["Consolidation — module not in this prototype"],
    sources: 0,
  },
  unknown: {
    headline: "I couldn't ground that question in a finance screen.",
    matches: null,
    limited: true,
    table: null,
    links: [
      { label: "Overview / Finance home", href: "/finance" },
      { label: "Assistant / Briefing", href: "/finance/assistant" },
    ],
    proposal: null,
    grounding: [],
    not_read: [],
    sources: 0,
  },
}

/** Answer when the topic's data group is switched off in Settings. */
export function limitedAnswerFor(groupLabel: string): Record<string, unknown> {
  return {
    headline: `${groupLabel} is switched off for the assistant, so this answer is limited.`,
    matches: null,
    limited: true,
    table: null,
    links: [{ label: "Assistant / Settings", href: "/finance/assistant" }],
    proposal: null,
    grounding: [],
    not_read: [groupLabel],
    sources: 0,
  }
}

export const ASSISTANT_DATA_GROUPS: { id: string; label: string; available: boolean }[] = [
  { id: "ledger", label: "Ledger", available: true },
  { id: "cash", label: "Cash & banking", available: true },
  { id: "receivables", label: "Receivables", available: true },
  { id: "payables", label: "Payables", available: true },
  { id: "tax", label: "Tax & compliance", available: true },
  { id: "assets", label: "Assets", available: true },
  { id: "controlling", label: "Controlling", available: true },
  { id: "close", label: "Period close", available: true },
  { id: "reports", label: "Reports", available: true },
  { id: "consolidation", label: "Consolidation", available: false },
]

export function buildAssistantSettings(): Row[] {
  return [
    {
      id: "settings",
      name: "Assistant",
      model: "Provider · version · updated 18 Mar 2026",
      status: "Connected · last answer 14:49",
      data_groups: Object.fromEntries(
        ASSISTANT_DATA_GROUPS.map((group) => [group.id, group.available]),
      ),
      bank_balances_admin_only: true,
      retention_days: 90,
    },
  ]
}

export const ASSISTANT_DRAFT_ROWS: Row[] = [
  {
    id: "prop-6",
    proposed_at: "2026-03-30T11:20:00.000Z",
    type: "Posting map · route",
    record: "Rule · stamp_tax_contract",
    conversation: "Which events are unrouted?",
    status: "opened_in_screen",
    acted_by: "Finance · Admin",
    acted_at: "2026-03-30T11:24:00.000Z",
    acted_note: null,
    result: "Settings / Posting map (staged)",
  },
  {
    id: "prop-5",
    proposed_at: "2026-03-29T16:02:00.000Z",
    type: "E-invoice · resubmit",
    record: "ED-0042 · ETA",
    conversation: "Which documents were rejected?",
    status: "actioned",
    acted_by: "Nour Adel",
    acted_at: "2026-03-29T16:10:00.000Z",
    acted_note: null,
    result: "Tax / E-invoicing · resubmitted",
  },
  {
    id: "prop-4",
    proposed_at: "2026-03-26T09:41:00.000Z",
    type: "Approver gap",
    record: "Payables · policy",
    conversation: "Which bills lack a second approver?",
    status: "dismissed",
    acted_by: "Finance · Admin",
    acted_at: "2026-03-26T09:45:00.000Z",
    acted_note: null,
    result: "Reason: handled in Approval policies",
  },
  {
    id: "prop-3",
    proposed_at: "2026-03-23T10:05:00.000Z",
    type: "Depreciation run",
    record: "DR-2026-02",
    conversation: "Why is the close blocked?",
    status: "actioned",
    acted_by: "Finance · Admin",
    acted_at: "2026-03-23T10:30:00.000Z",
    acted_note: null,
    result: "Assets / Depreciation · posted",
  },
  {
    id: "prop-2",
    proposed_at: "2026-02-22T13:12:00.000Z",
    type: "VAT pre-filing",
    record: "VR-2026-01",
    conversation: "Can January be filed?",
    status: "expired",
    acted_by: null,
    acted_at: "2026-02-28T00:00:00.000Z",
    acted_note: "period close",
    result: "No action · logged",
  },
  {
    id: "prop-1",
    proposed_at: "2026-02-18T08:55:00.000Z",
    type: "Reconciliation",
    record: "T-05 · Banque Misr USD",
    conversation: "Which accounts are stale?",
    status: "dismissed",
    acted_by: "Finance · Treasury",
    acted_at: "2026-02-18T09:02:00.000Z",
    acted_note: null,
    result: "Reason: duplicate of an open reconciliation",
  },
]

export const ASSISTANT_HISTORY_ROWS: Row[] = [
  { id: "conv-4", question: "Which events are unrouted in the posting map?", scope_label: "EG-01 · 1 Mar — 31 Mar", asked_at: "2026-03-31T11:20:00.000Z" },
  { id: "conv-3", question: "Why is the March close blocked?", scope_label: "EG-01 · 1 Mar — 31 Mar", asked_at: "2026-03-31T10:05:00.000Z" },
  { id: "conv-2", question: "Which bills lack a second approver?", scope_label: "EG-01 · 1 Mar — 31 Mar", asked_at: "2026-03-31T09:41:00.000Z" },
  { id: "conv-1", question: "Which e-invoices were rejected this period?", scope_label: "EG-01 · 1 Mar — 31 Mar", asked_at: "2026-03-30T16:02:00.000Z" },
]

export function buildBriefing(): Record<string, unknown> {
  return {
    computed_at: "2026-03-31T14:49:00.000Z",
    tiles: [
      {
        id: "treasuries",
        label: "Treasuries unreconciled",
        value: FIN_ANCHORS.banking.treasuriesUnreconciled,
        caption: `${FIN_ANCHORS.banking.unmatchedLines} unmatched lines`,
      },
      { id: "blockers", label: "Close blockers", value: FIN_ANCHORS.close.blockers, caption: "Readiness checks failing" },
      {
        id: "seal",
        label: "Days to seal expiry",
        value: FIN_ANCHORS.tax.sealExpiresInDays,
        caption: `${FIN_ANCHORS.tax.itemsUnmapped} of ${FIN_ANCHORS.tax.itemsTotal} items unmapped`,
      },
      { id: "drafts", label: "Draft journal entries", value: FIN_ANCHORS.ledger.draftEntries, caption: "Not posted" },
    ],
    items: [
      { id: "b1", item: "Unmatched bank statement lines", count: FIN_ANCHORS.banking.unmatchedLines, oldest: "2026-03-03", owner: "Finance · treasury", destination: "Bank reconciliation", href: "/finance/reconciliation" },
      { id: "b2", item: "E-invoices rejected by the authority", count: FIN_ANCHORS.tax.rejectedEInvoices, oldest: "2026-03-12", owner: "Finance · tax", destination: "E-invoicing console", href: "/finance/tax/e-invoicing" },
      { id: "b3", item: "Items with no EGS or GS1 code", count: FIN_ANCHORS.tax.itemsUnmapped, oldest: "2026-02-01", owner: "Finance · tax", destination: "E-invoicing console", href: "/finance/tax/e-invoicing" },
      { id: "b4", item: "VAT pre-filing checks open", count: VAT.openChecks, oldest: "2026-03-16", owner: "Finance · tax", destination: "VAT return", href: "/finance/tax/vat-return" },
      { id: "b5", item: "Depreciation runs not posted", count: 1, oldest: "2026-03-31", owner: "Finance · assets", destination: "Depreciation run", href: "/finance/assets/depreciation" },
      { id: "b6", item: "Draft entries in the period", count: FIN_ANCHORS.ledger.draftEntries, oldest: "2026-03-22", owner: "Finance · ledger", destination: "Journal entries", href: "/finance/journals" },
      { id: "b7", item: "E-invoices never submitted", count: FIN_ANCHORS.tax.notSubmittedEInvoices, oldest: "2026-03-18", owner: "Finance · tax", destination: "E-invoicing console", href: "/finance/tax/e-invoicing" },
      { id: "b8", item: "Overdue supplier bills", count: FIN_ANCHORS.payables.overdueBills, oldest: "2026-02-09", owner: "Finance · payables", destination: "Payment runs", href: "/finance/ap/payment-runs" },
      { id: "b9", item: "Suspense account not at zero", count: 1, oldest: "2026-02-28", owner: "Finance · ledger", destination: `Account ${FIN_ANCHORS.ledger.suspenseAccount}`, href: "/finance/ledger" },
    ],
    follow_ups: [
      "Which treasuries are blocking the close?",
      "Can the March VAT return be filed yet?",
      "What happens to the close if depreciation stays unposted?",
    ],
  }
}
