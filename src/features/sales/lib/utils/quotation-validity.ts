import type { Quotation, QuotationListItem, QuotationStatus } from "../types"

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Statuses that have already left the validity window — expiry is moot for them. */
const CLOSED_STATUSES: ReadonlySet<QuotationStatus> = new Set([
  "accepted",
  "rejected",
  "converted",
])

/**
 * Whole days between two calendar dates, ignoring clocks entirely.
 *
 * `validity_date` is a plain `YYYY-MM-DD` with no time or zone, so it must be
 * compared as a calendar date. `new Date("2026-05-09")` parses as **UTC**
 * midnight while `new Date()` is local, which flips the answer by a day for
 * every user west of UTC. Normalising both sides through `Date.UTC` removes the
 * offset and the DST discontinuity in one step.
 */
function daysBetweenCalendarDates(from: Date, toIsoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(toIsoDate)
  if (!match) return null

  const [, year, month, day] = match
  const target = Date.UTC(Number(year), Number(month) - 1, Number(day))
  const today = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())

  return Math.round((target - today) / MS_PER_DAY)
}

/**
 * Message key (in `SalesShared.validity`) plus the day count it interpolates as `{count}`,
 * so the label is translated where it renders.
 */
export type QuotationValidityLabel = {
  key: "expired" | "unknown" | "expiresToday" | "daysLeft" | "expiredDaysAgo"
  count: number
}

export type QuotationValidity = {
  /**
   * Days until `validity_date`, inclusive of the validity date itself:
   * `1` = expires tomorrow, `0` = expires today, `-3` = lapsed three days ago.
   * `null` only when `validity_date` is missing or unparseable.
   */
  daysLeft: number | null
  /** The validity date is in the past and the quotation is still open. */
  isExpired: boolean
  /** What the "Days Left" field says, as a `SalesShared.validity` key + count. */
  label: QuotationValidityLabel
}

/**
 * Derives the validity state of a quotation from its `validity_date`.
 *
 * The API only counts `days_left` once a quotation is **sent** — `POST
 * .../send` is documented as the point where "the validity countdown starts",
 * so every `draft` row comes back with `days_left: null` (see `bruno/Sales/
 * Quotations/List Quotations.bru`, whose own example is a draft with a null
 * countdown). Server-side auto-expiry follows the same rule: `expired` is a
 * transition out of `sent`, so a draft that was never sent keeps `status:
 * "draft"` however far past its validity date it drifts.
 *
 * That left the UI with no expiry signal at all for drafts — the list gated its
 * "Expired" chip on `days_left`, so the chip could never render for one, and
 * the detail page printed a bare "—". Both screens already have `validity_date`,
 * which is an absolute calendar date and needs no countdown to interpret, so
 * the lapsed state is derived from it here.
 *
 * Whether the server *should* expire a stale draft is an open product
 * question — see `docs/backend-sales-quotation-expiry-and-delivery-date.md` §1.
 *
 * `days_left` still wins when the server sends one: it owns its own countdown,
 * and disagreeing with it on screen would only trade one confusing number for
 * another. Expiry itself is always decided by the date, since that is the part
 * the server declines to answer for drafts.
 */
export function getQuotationValidity(
  quotation: Pick<Quotation | QuotationListItem, "validity_date" | "days_left" | "status">,
  now: Date = new Date(),
): QuotationValidity {
  const derived = daysBetweenCalendarDates(now, quotation.validity_date)

  if (quotation.status === "expired") {
    return { daysLeft: derived, isExpired: true, label: { key: "expired", count: 0 } }
  }

  if (derived === null) {
    const fallback = quotation.days_left
    return {
      daysLeft: fallback,
      isExpired: false,
      label: fallback === null ? { key: "unknown", count: 0 } : formatDaysLeft(fallback),
    }
  }

  const isExpired = derived < 0 && !CLOSED_STATUSES.has(quotation.status)
  const daysLeft = quotation.days_left ?? derived

  return {
    daysLeft,
    isExpired,
    label: isExpired ? formatExpiredSince(derived) : formatDaysLeft(daysLeft),
  }
}

function formatDaysLeft(days: number): QuotationValidityLabel {
  if (days < 0) return formatExpiredSince(days)
  if (days === 0) return { key: "expiresToday", count: 0 }
  return { key: "daysLeft", count: days }
}

function formatExpiredSince(days: number): QuotationValidityLabel {
  return { key: "expiredDaysAgo", count: Math.abs(days) }
}
