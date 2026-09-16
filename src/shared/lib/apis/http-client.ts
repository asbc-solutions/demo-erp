import axios from "axios"
import type { ApiError } from "../types/api"
import { demoAdapter } from "../demo/demo-adapter"

/**
 * Demo mode.
 *
 * Every feature module talks to the backend through this one axios instance, so
 * swapping its adapter is all it takes to take the whole app offline: requests
 * are resolved from the in-memory demo database in `../demo` instead of the
 * network. Nothing above this file changes — queries, mutations, loading states,
 * pagination and error handling all behave exactly as they did.
 *
 * Authentication is deliberately NOT routed through here. `src/auth.ts` posts to
 * the real `/auth/login` with its own axios call, which is the one request that
 * still leaves the browser.
 */
export const httpClient = axios.create({
  headers: { "Content-Type": "application/json" },
  adapter: demoAdapter,
})

/**
 * Kept so mutation call sites keep receiving the `ApiError` shape they handle
 * (`toastMutationError` in every feature's `*-error-state.tsx` reads `.message`
 * and `.details`). The demo adapter resolves rather than rejects, so this only
 * fires for genuine programming errors.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    const payload = data?.error
    const apiError: ApiError = {
      code:
        payload?.code ??
        data?.code ??
        String(error.response?.status ?? "DEMO_ERROR"),
      message:
        payload?.message ??
        data?.message ??
        error.message ??
        "An unexpected error occurred",
      details:
        payload?.details ??
        data?.details ??
        (data?.errors ? { fields: data.errors } : undefined),
      blocking_counts: payload?.blocking_counts ?? data?.blocking_counts,
    }
    return Promise.reject(apiError)
  }
)
