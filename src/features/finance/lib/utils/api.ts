import type { AxiosResponse } from "axios"

import type { ApiResponse } from "@/src/shared/lib/types/api"

export class FinanceRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "FinanceRequestError"
    this.status = status
  }
}

/**
 * Resolve a response to its data, throwing on a 4xx/5xx. The demo adapter
 * resolves every response, so a refusal (e.g. insufficient funds) arrives as
 * data with an error status; this turns it into a rejected mutation.
 */
export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.status >= 400) {
    const body = response.data?.data as { message?: unknown } | null | undefined
    const message = typeof body?.message === "string" ? body.message : "The request could not be completed."
    throw new FinanceRequestError(message, response.status)
  }
  return response.data.data
}

/** The server's own sentence when it gave one, otherwise the fallback. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof FinanceRequestError ? error.message : fallback
}
