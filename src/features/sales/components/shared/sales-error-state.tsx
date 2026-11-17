"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"

/** Inline centered "failed to load" fallback — use wherever a query's isError branch renders. */
export function SalesErrorState({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry?: () => void }>) {
  const t = useTranslations("SalesShared")

  return (
    <div className="py-12 text-center text-sm text-content-tertiary">
      {message ?? t("failedToLoad")}{" "}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ms-1 text-brand-primary underline"
        >
          {t("tryAgain")}
        </button>
      ) : null}
    </div>
  )
}

/**
 * Returns a toaster for mutation errors, surfacing field-level validation messages from
 * ApiError.details.fields when present.
 */
export function useToastMutationError() {
  const t = useTranslations("SalesShared")

  return (err: unknown, fallbackTitle: string) => {
    const apiErr = err as ApiError
    const fields = apiErr.details?.fields as Record<string, string[]> | undefined
    if (fields) {
      const description = Object.entries(fields)
        .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
        .join(" · ")
      toast.error(t("validationFailed"), { description })
    } else {
      toast.error(fallbackTitle, {
        description: apiErr.message ?? t("checkDetailsAndRetry"),
      })
    }
  }
}
