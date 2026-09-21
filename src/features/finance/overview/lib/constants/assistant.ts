import type { AssistantAnswer } from "../types/assistant"

/** The six starter questions on an empty conversation, from the design. */
export const ASSISTANT_SUGGESTIONS = [
  {
    id: "watchlist",
    title: "Reconciliation watchlist",
    question: "Which treasuries are blocking the March close, and how many unmatched lines each?",
  },
  {
    id: "rule",
    title: "Rule explanation",
    question: "How does the posting map route a credit sale, and where does the tax go?",
  },
  {
    id: "approvers",
    title: "Approver gaps",
    question: "Which bills are at or above the second-approval threshold?",
  },
  {
    id: "filing",
    title: "Filing readiness",
    question: "Can the March VAT return be filed, or are pre-filing checks still open?",
  },
  {
    id: "aging",
    title: "Aging exposure",
    question: "Overdue receivables in EGP by customer, top 5.",
  },
  {
    id: "group",
    title: "Group position",
    question: "What is the consolidated group position this month?",
  },
] as const

export const ASSISTANT_ROLES = [
  { value: "finance-admin", label: "Finance · Admin" },
  { value: "finance-treasury", label: "Finance · Treasury" },
  { value: "finance-tax", label: "Finance · Tax" },
  { value: "finance-viewer", label: "Finance · Viewer" },
] as const

export const DRAFT_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "opened_in_screen", label: "Opened in screen" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
  { value: "expired", label: "Expired" },
] as const

export const RETENTION_OPTIONS = [30, 90, 180, 365] as const

/** What the assistant will never do, whatever the settings say. */
export const ASSISTANT_NEVER = [
  "Post, reverse or edit any journal entry",
  "Approve, reject or route an approval",
  "File or settle a tax return",
  "Publish the posting map",
  "Close or reopen a period",
  "Issue a payment run",
  "Answer outside the Role & Authority Matrix scope",
] as const

/** Time the design's last grounded answer was read, shown while the assistant is offline. */
export const LAST_GROUNDED = { time: "14:31", source: "Cash & banking / Treasuries" } as const

export type AssistantTurn = {
  id: string
  question: string
  scopeLabel: string
  status: "pending" | "answered" | "failed"
  answer?: AssistantAnswer
}
