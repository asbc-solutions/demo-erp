import { Spinner } from "@/src/shared/components/ui/spinner"

/** Full-panel centered spinner — use for tab-level loading. */
export function SettingsPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner className="text-brand-primary size-6" />
    </div>
  )
}

/** Inline centered spinner — use inside cards/sections. */
export function SettingsSectionSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <Spinner className="text-content-tertiary size-5" />
    </div>
  )
}
