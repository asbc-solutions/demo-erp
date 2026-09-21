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
    overdueInvoices: 33,
    /** Top of the overdue book; the rest (100,000.00) is spread across small accounts. */
    overdueByCustomer: [
      { contactId: "110303", amount: 1_946_200, oldest: "2025-12-14" },
      { contactId: "110302", amount: 1_412_880, oldest: "2026-01-09" },
      { contactId: "110305", amount: 1_108_450, oldest: "2026-01-21" },
      { contactId: "110306", amount: 694_320, oldest: "2026-02-02" },
      { contactId: "110304", amount: 481_182.83, oldest: "2026-02-10" },
      { contactId: "110301", amount: 100_606.05, oldest: "2026-01-20" },
    ],
  },
  payables: {
    outstanding: 3_914_200,
    dueThisWeek: 454_959.32,
    overdueBills: 13,
    secondApprovalThreshold: 150_000,
  },
  netResult: {
    period: "2026-03",
    amount: 2_788_400,
  },
  banking: {
    unmatchedLines: 21,
    cibUnmatchedLines: 18,
    bankMisrUnmatchedLines: 3,
    treasuriesUnreconciled: 2,
  },
  tax: {
    rejectedEInvoices: 4,
    notSubmittedEInvoices: 2,
    sealExpiresInDays: 14,
    itemsUnmapped: 22,
    itemsTotal: 240,
    vatReturn: {
      id: "VR-2026-03",
      outputVat: 1_842_600,
      inputVat: 1_196_340,
      openChecks: 4,
      totalChecks: 6,
    },
  },
  approvals: {
    journalsAwaitingApproval: 3,
  },
  receipts: {
    unallocated: 5,
  },
  close: {
    blockers: 5,
  },
  ledger: {
    journalEntriesInOpenPeriod: 314,
    draftEntries: 6,
    suspenseAccount: "2199",
    suspenseBalance: 146_500,
  },
} as const
