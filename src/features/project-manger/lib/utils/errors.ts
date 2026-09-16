import type { ApiError } from "@/src/shared/lib/types/api"

/**
 * `/pm/me/*` endpoints resolve the current employee from the bearer token and
 * have no employee-id param — an account with no linked `employees` record
 * gets a 401 from all of them, even though the rest of the PM module works
 * fine with the same token.
 */
export function isUnlinkedEmployeeError(error: unknown): boolean {
  return (error as ApiError | null | undefined)?.code === "401"
}
