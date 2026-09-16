"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Switch } from "@/src/shared/components/ui/switch"

import { useSaveNotificationPreferences } from "../lib/mutations/notifications"
import { useNotificationPreferences } from "../lib/queries/notifications"
import type { NotificationPreference } from "../lib/types/notifications"
import { SettingsErrorState, toastMutationError } from "./shared/settings-error-state"
import { SettingsPageSpinner } from "./shared/settings-loading"

/**
 * Only mounted once `initialPreferences` has loaded (see `NotificationsTab`
 * below), so local state can seed straight from it — no effect-based sync
 * needed, and no risk of clobbering unsaved toggles on a background refetch.
 */
function NotificationsTabForm({
  initialPreferences,
}: Readonly<{ initialPreferences: NotificationPreference[] }>) {
  const savePreferences = useSaveNotificationPreferences()
  const [preferences, setPreferences] = useState(initialPreferences)

  const togglePreference = (key: string) => {
    setPreferences((current) =>
      current.map((preference) =>
        preference.key === key
          ? { ...preference, enabled: !preference.enabled }
          : preference,
      ),
    )
  }

  const handleCancel = () => {
    setPreferences(initialPreferences)
  }

  const handleSave = () => {
    savePreferences.mutate(
      {
        preferences: preferences.map(({ key, enabled }) => ({ key, enabled })),
      },
      {
        onSuccess: (saved) => {
          setPreferences(saved)
          toast.success("Notification preferences saved")
        },
        onError: (err) => toastMutationError(err, "Failed to save preferences"),
      },
    )
  }

  return (
    <Card variant="elevated" className="gap-6 p-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-content-primary text-[14px] leading-[22.4px] font-semibold">
          Notification Preferences
        </h3>
        <p className="text-content-tertiary text-[12px] leading-[18px]">
          Choose what you want to be notified about
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {preferences.map((preference) => (
          <label
            key={preference.key}
            htmlFor={`np-${preference.key}`}
            className="bg-surface-page border-stroke-default flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-content-primary text-[12px] leading-[18px] font-medium">
                {preference.title}
              </span>
              <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                {preference.description}
              </span>
            </div>
            <Switch
              id={`np-${preference.key}`}
              checked={preference.enabled}
              onCheckedChange={() => togglePreference(preference.key)}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-4 text-[12px]"
          onClick={handleCancel}
          disabled={savePreferences.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-9 px-4 text-[12px]"
          disabled={savePreferences.isPending}
          onClick={handleSave}
        >
          {savePreferences.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save Preferences
        </Button>
      </div>
    </Card>
  )
}

export function NotificationsTab() {
  const { data, isLoading, isError, refetch } = useNotificationPreferences()

  if (isLoading) {
    return <SettingsPageSpinner />
  }

  if (isError || !data) {
    return (
      <SettingsErrorState
        message="Failed to load notification preferences."
        onRetry={() => void refetch()}
      />
    )
  }

  return <NotificationsTabForm initialPreferences={data} />
}
