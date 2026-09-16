/* ------------------------------------------------------------------ */
/* Resolved person references (shared across PM responses)             */
/* ------------------------------------------------------------------ */

/** Display object for an employee, resolved server-side from an id. */
export type PersonRef = {
  id: string
  name: string
  employee_number?: string
  role?: string | null
  department?: string | null
  initials?: string
  avatar_url?: string | null
}
