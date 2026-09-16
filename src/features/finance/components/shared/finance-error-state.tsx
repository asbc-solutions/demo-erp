import type { ApiError } from "@/src/shared/lib/types/api"
import { toast } from "sonner"

/** Inline centered "failed to load" fallback — use wherever a query's isError branch renders. */
export function FinanceErrorState({
  message = "Failed to load.",
  onRetry,
}: Readonly<{ message?: string; onRetry?: () => void }>) {
  return (
    <div className="py-12 text-center text-sm text-content-tertiary">
      {message}{" "}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 text-brand-primary underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}

/** Toasts a mutation error, surfacing field-level validation messages from ApiError.details.fields when present. */
export function toastMutationError(err: unknown, fallbackTitle: string) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    const description = Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" · ")
    toast.error("Validation failed", { description })
  } else {
    toast.error(fallbackTitle, {
      description: apiErr.message ?? "Please check the details and try again.",
    })
  }
}
