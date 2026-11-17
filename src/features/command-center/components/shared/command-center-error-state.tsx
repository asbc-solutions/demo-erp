import { useTranslations } from "next-intl"

/** Inline centered "failed to load" fallback — use wherever a query's isError branch renders. */
export function CommandCenterErrorState({
  message,
  onRetry,
}: Readonly<{ message?: string; onRetry?: () => void }>) {
  const t = useTranslations("CommandCenter")
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
