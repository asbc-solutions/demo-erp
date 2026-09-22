import type { StatusTone } from "../../../lib/constants/statuses"
import type { MatchSuggestion, UnmatchedCause } from "../types/banking"

/** "Accept all above 85%" — the bar for a suggestion to be accepted in bulk. */
export const ACCEPT_ALL_FROM = 85

/** Why a batch of lines has not matched, so it is dealt with once rather than line by line. */
export const CAUSE_COPY: Record<UnmatchedCause, string> = {
  other_way:
    "Money moved the other way. Nothing in the ledger has the same direction, so these are probably the wrong account or a transfer.",
  amount_differs:
    "A close entry exists but the amount differs. Usually a fee, a partial payment or an FX difference.",
  resembles: "Something resembles these but not closely enough to suggest. Match by hand if you recognise it.",
  no_candidate: "The ledger has nothing like these. Create an entry from each statement line.",
}

export const SUGGESTION_TONE: Record<MatchSuggestion["label"], StatusTone> = {
  exact: "success",
  likely: "info",
  possible: "warning",
}

/** Counter accounts suggested for a new entry, by the direction of the money. */
export const DEFAULT_COUNTER_ACCOUNT = { in: "110301", out: "630101" } as const
