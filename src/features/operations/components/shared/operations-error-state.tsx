import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"

export type OperationsSharedTranslator = ReturnType<typeof useTranslations<"OperationsShared">>

/** Inline centered "failed to load" fallback — use wherever a query's isError branch renders. */
export function OperationsErrorState({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry?: () => void }>) {
  const t = useTranslations("OperationsShared")
  const tCommon = useTranslations("Common")
  return (
    <div className="py-12 text-center text-sm text-content-tertiary">
      {message ?? t("loadFailed")}{" "}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ms-1 text-brand-primary underline"
        >
          {tCommon("retry")}
        </button>
      ) : null}
    </div>
  )
}

/**
 * Toasts a mutation error, surfacing field-level validation messages from ApiError.details.fields
 * when present. `t` is the caller's `useTranslations("OperationsShared")`.
 */
export function toastMutationError(
  err: unknown,
  fallbackTitle: string,
  t: OperationsSharedTranslator,
) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    const description = Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" · ")
    toast.error(t("validationFailed"), { description })
  } else {
    toast.error(fallbackTitle, {
      description: apiErr.message ?? t("checkDetails"),
    })
  }
}
