import type { Salesperson } from "../types"

export type SalespersonOption = { id: string; name: string }

/**
 * `GET /sales/salespeople/active` only returns reps with `is_active: true`, so a
 * record already assigned to a since-deactivated rep has no matching `<option>`.
 * A native `<select>` given an unmatched value falls back to its first option
 * (uncontrolled) or to a blank selection (controlled) — so opening the dialog to
 * edit an unrelated field and saving would silently reassign the record, or block
 * the save with a misleading "select a salesperson" error.
 *
 * Keeping the current assignee in the list makes the dropdown reflect what is
 * actually stored. Deactivated reps stay selectable only on records that already
 * point at them; they never appear as a choice on anything else.
 */
export function withCurrentSalesperson(
  salespeople: readonly (Salesperson | SalespersonOption)[],
  current: SalespersonOption | null,
): SalespersonOption[] {
  const options = salespeople.map(({ id, name }) => ({ id, name }))
  if (!current?.id || options.some((option) => option.id === current.id)) return options
  return [{ id: current.id, name: current.name }, ...options]
}
