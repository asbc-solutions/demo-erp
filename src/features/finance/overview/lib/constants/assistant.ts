import type { AssistantAnswer } from "../types/assistant"

/**
 * The six starter questions on an empty conversation, from the design. The
 * card shows the translated question; `question` is the canonical English
 * text sent to the demo API, whose topic matching reads English keywords.
 */
export const ASSISTANT_SUGGESTIONS = [
  {
    id: "watchlist",
    titleKey: "suggestionWatchlistTitle",
    questionKey: "suggestionWatchlistQuestion",
    question: "Which treasuries are blocking the March close, and how many unmatched lines each?",
  },
  {
    id: "rule",
    titleKey: "suggestionRuleTitle",
    questionKey: "suggestionRuleQuestion",
    question: "How does the posting map route a credit sale, and where does the tax go?",
  },
  {
    id: "approvers",
    titleKey: "suggestionApproversTitle",
    questionKey: "suggestionApproversQuestion",
    question: "Which bills are at or above the second-approval threshold?",
  },
  {
    id: "filing",
    titleKey: "suggestionFilingTitle",
    questionKey: "suggestionFilingQuestion",
    question: "Can the March VAT return be filed, or are pre-filing checks still open?",
  },
  {
    id: "aging",
    titleKey: "suggestionAgingTitle",
    questionKey: "suggestionAgingQuestion",
    question: "Overdue receivables in EGP by customer, top 5.",
  },
  {
    id: "group",
    titleKey: "suggestionGroupTitle",
    questionKey: "suggestionGroupQuestion",
    question: "What is the consolidated group position this month?",
  },
] as const

export const ASSISTANT_ROLES = [
  { value: "finance-admin", labelKey: "roleAdmin" },
  { value: "finance-treasury", labelKey: "roleTreasury" },
  { value: "finance-tax", labelKey: "roleTax" },
  { value: "finance-viewer", labelKey: "roleViewer" },
] as const

export const DRAFT_STATUS_OPTIONS = [
  { value: "all", labelKey: "draftStatusAll" },
  { value: "opened_in_screen", labelKey: "draftStatusOpenedInScreen" },
  { value: "actioned", labelKey: "draftStatusActioned" },
  { value: "dismissed", labelKey: "draftStatusDismissed" },
  { value: "expired", labelKey: "draftStatusExpired" },
] as const

export const RETENTION_OPTIONS = [30, 90, 180, 365] as const

/** What the assistant will never do, whatever the settings say (`FinanceAssistant` keys). */
export const ASSISTANT_NEVER = [
  "neverPostEntries",
  "neverApprove",
  "neverFileTax",
  "neverPublishPostingMap",
  "neverClosePeriod",
  "neverIssuePaymentRun",
  "neverOutsideScope",
] as const

/** Time the design's last grounded answer was read, shown while the assistant is offline. */
export const LAST_GROUNDED = { time: "14:31" } as const

export type AssistantTurn = {
  id: string
  question: string
  scopeLabel: string
  status: "pending" | "answered" | "failed"
  answer?: AssistantAnswer
}
