/**
 * Headline figures copied from the Figma design. Each section seeds documents
 * that add up to these, so a number reads the same on every screen that shows
 * it (cash on hand on Finance home and on Cash position, unmatched lines on
 * the attention list and on the reconciliation badge, …).
 */
export const FIN_ANCHORS = {
  cash: {
    total: 8_701_390,
    bankBalances: 8_187_520,
    cashOnHand: 513_870,
    accounts: 6,
    updatedAt: "2026-03-31T09:14:00.000Z",
  },
  receivables: {
    outstanding: 6_318_400,
    overdue: 5_843_638.88,
  },
  payables: {
    outstanding: 3_914_200,
    dueThisWeek: 454_959.32,
  },
  netResult: {
    period: "2026-03",
    amount: 2_788_400,
  },
  banking: {
    unmatchedLines: 21,
    cibUnmatchedLines: 18,
    bankMisrUnmatchedLines: 3,
  },
  tax: {
    rejectedEInvoices: 4,
    sealExpiresInDays: 14,
  },
  approvals: {
    billsAwaitingApproval: 4,
    journalsAwaitingApproval: 3,
  },
  receipts: {
    unallocated: 5,
  },
  close: {
    tasksDone: 9,
    tasksTotal: 22,
  },
  ledger: {
    journalEntriesInOpenPeriod: 314,
  },
} as const
