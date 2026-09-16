import { Spinner } from "@/src/shared/components/ui/spinner"

/** Full-panel centered spinner — use for page-level loading. */
export function IntegrationsPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner className="size-6 text-brand-primary" />
    </div>
  )
}
