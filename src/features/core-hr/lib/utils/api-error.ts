import type { useTranslations } from "next-intl"

import type { ApiError } from "@/src/shared/lib/types/api"

type SharedTranslator = ReturnType<typeof useTranslations<"HrShared">>

/**
 * A 409 CONFLICT from a protected (soft) delete means the record still has
 * dependents. The backend returns `blocking_counts` either at the top level
 * (branches / departments) or nested under `details` (job grades) — normalise
 * both into a translated, human-readable reason, or return null for non-conflict errors.
 */
export function describeBlockingError(
  err: unknown,
  t: SharedTranslator,
): string | null {
  const e = err as Partial<ApiError>
  if (e?.code !== "CONFLICT") return null
  const counts =
    e.blocking_counts ??
    (e.details?.blocking_counts as Record<string, number> | undefined)
  const parts = counts
    ? Object.entries(counts)
        .filter(([, n]) => typeof n === "number" && n > 0)
        .map(([key, n]) => `${n} ${key}`)
    : []
  return parts.length
    ? t("stillHasAttached", { items: parts.join(", ") })
    : (e.message ?? t("hasActiveDependents"))
}

/** Best-effort message from a rejected API error, with a fallback. */
export function apiErrorMessage(err: unknown, fallback: string) {
  return (err as Partial<ApiError>)?.message ?? fallback
}
