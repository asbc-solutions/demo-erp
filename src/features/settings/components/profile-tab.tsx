"use client"

import { useState } from "react"
import { Loader2, RotateCcw, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { ResetDemoDataDialog } from "./company-profile/reset-demo-data-dialog"
import { SETTINGS_RESOURCES } from "../lib/constants/permissions"
import { useUpdateCompanyProfile } from "../lib/mutations/company-profile"
import { useCompanyProfile } from "../lib/queries/company-profile"
import type { CompanyProfile } from "../lib/types/company-profile"
import { SettingsAccessGate } from "./shared/settings-access-gate"
import { SettingsPageSpinner } from "./shared/settings-loading"
import { SettingsErrorState, toastMutationError } from "./shared/settings-error-state"

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-content-quaternary text-[12px] leading-[18px] font-medium"
    >
      {children}
    </Label>
  )
}

/**
 * Only mounted once `profile` has loaded (see `ProfileTab` below), so the
 * form fields can seed their local state straight from the initial data —
 * no effect-based sync needed, and no risk of clobbering in-progress edits
 * on a background refetch.
 */
function ProfileTabForm({ profile }: Readonly<{ profile: CompanyProfile }>) {
  const t = useTranslations("SettingsProfile")
  const tShared = useTranslations("SettingsShared")
  const tCommon = useTranslations("Common")
  const updateProfile = useUpdateCompanyProfile()
  const { can } = usePermissions()
  const canWrite = can.write(SETTINGS_RESOURCES.companyProfile)

  const [companyName, setCompanyName] = useState(profile.name ?? "")
  const [industry, setIndustry] = useState(profile.industry ?? "")
  const [website, setWebsite] = useState(profile.website ?? "")
  const [stage, setStage] = useState(profile.stage ?? "")
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const handleCancel = () => {
    setCompanyName(profile.name ?? "")
    setIndustry(profile.industry ?? "")
    setWebsite(profile.website ?? "")
    setStage(profile.stage ?? "")
  }

  const handleSave = () => {
    updateProfile.mutate(
      {
        name: companyName.trim(),
        website: website.trim() || undefined,
        industry: industry || undefined,
        stage: stage || undefined,
      },
      {
        onSuccess: () => toast.success(t("updated")),
        onError: (err) => toastMutationError(err, t("updateFailed"), tShared),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="elevated" className="gap-6 p-6">
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_140px]">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-company-name">{t("companyName")}</FieldLabel>
            <Input
              id="sp-company-name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              disabled={!canWrite}
              className="bg-surface-page h-9 text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("industry")}</FieldLabel>
            <Select value={industry} onValueChange={setIndustry} disabled={!canWrite}>
              <SelectTrigger className="bg-surface-page h-9 text-[14px]">
                <SelectValue placeholder={t("industryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {profile.options.industries.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="sp-website">{t("website")}</FieldLabel>
            <Input
              id="sp-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={!canWrite}
              className="bg-surface-page h-9 text-[14px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t("stage")}</FieldLabel>
            <Select value={stage} onValueChange={setStage} disabled={!canWrite}>
              <SelectTrigger className="bg-surface-page h-9 text-[14px]">
                <SelectValue placeholder={t("stagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {profile.options.stages.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canWrite ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              className="h-9 px-4 text-[12px]"
              disabled={updateProfile.isPending || !companyName.trim()}
              onClick={handleSave}
            >
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {tCommon("saveChanges")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-4 text-[12px]"
              onClick={handleCancel}
              disabled={updateProfile.isPending}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        ) : null}
      </Card>

      {canWrite ? (
        <Card
          variant="elevated"
          className="border-brand-danger/25 flex-row items-start gap-4 px-6 py-12"
        >
          <div className="bg-brand-danger/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <TriangleAlert className="text-brand-danger size-5" aria-hidden />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="text-content-primary text-[12px] leading-[18px] font-medium">
              {t("resetTitle")}
            </h3>
            <p className="text-content-tertiary pb-2 text-[11px] leading-[15.4px]">
              {t("resetDescription")}
            </p>
            <div>
              <Button
                type="button"
                variant="secondary"
                className="bg-surface-page border-brand-danger/30 text-brand-danger hover:bg-surface-page hover:text-brand-danger-hover h-8 px-2.5 text-[12px]"
                onClick={() => setResetDialogOpen(true)}
              >
                <RotateCcw className="size-4" aria-hidden />
                {t("resetButton")}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <ResetDemoDataDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>
  )
}

function ProfileTabContent() {
  const t = useTranslations("SettingsProfile")
  const { data: profile, isLoading, isError, refetch } = useCompanyProfile()

  if (isLoading) {
    return <SettingsPageSpinner />
  }

  if (isError || !profile) {
    return (
      <SettingsErrorState
        message={t("loadError")}
        onRetry={() => void refetch()}
      />
    )
  }

  return <ProfileTabForm profile={profile} />
}

export function ProfileTab() {
  return (
    <SettingsAccessGate resource={SETTINGS_RESOURCES.companyProfile}>
      <ProfileTabContent />
    </SettingsAccessGate>
  )
}
