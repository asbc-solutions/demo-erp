/** Inline centered "failed to load" fallback — use wherever a query's isError branch renders. */
export function CommandCenterErrorState({
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
          className="ms-1 text-brand-primary underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
