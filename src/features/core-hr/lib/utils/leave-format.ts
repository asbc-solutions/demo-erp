/** Format an ISO date (YYYY-MM-DD) as DD/MM/YYYY. Returns "—" for empty input. */
export function formatLeaveDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${date.getFullYear()}`
}

/**
 * Format a leave date range as seen in the design:
 *   single day → "10/02/2026"
 *   range      → "03/03 - 05/03/2026"
 */
export function formatLeaveRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start) return "—"
  if (!end || end === start) return formatLeaveDate(start)

  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return formatLeaveDate(start)
  const dd = String(startDate.getDate()).padStart(2, "0")
  const mm = String(startDate.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm} - ${formatLeaveDate(end)}`
}
