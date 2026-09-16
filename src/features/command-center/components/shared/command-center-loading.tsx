import { Spinner } from "@/src/shared/components/ui/spinner"

/** Full-panel centered spinner — use for page-level loading. */
export function CommandCenterPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner className="size-6 text-brand-primary" />
    </div>
  )
}

/** Inline centered spinner — use inside cards/sections. */
export function CommandCenterSectionSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <Spinner className="size-5 text-content-tertiary" />
    </div>
  )
}
