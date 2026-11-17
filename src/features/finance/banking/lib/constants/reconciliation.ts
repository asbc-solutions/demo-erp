import type { StatusTone } from "../../../lib/constants/statuses"
import type { MatchSuggestion } from "../types/banking"

/** "Accept all above 85%" — the bar for a suggestion to be accepted in bulk. */
export const ACCEPT_ALL_FROM = 85

// Why a batch of lines has not matched is explained by the `FinanceBanking`
// enum map `cause.<UnmatchedCause>`, so it is dealt with once rather than line by line.

export const SUGGESTION_TONE: Record<MatchSuggestion["label"], StatusTone> = {
  exact: "success",
  likely: "info",
  possible: "warning",
}

/** Counter accounts suggested for a new entry, by the direction of the money. */
export const DEFAULT_COUNTER_ACCOUNT = { in: "110301", out: "630101" } as const
