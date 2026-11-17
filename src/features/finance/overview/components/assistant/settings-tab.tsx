"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Card } from "@/src/shared/components/ui/card"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { Switch } from "@/src/shared/components/ui/switch"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { ASSISTANT_NEVER, RETENTION_OPTIONS } from "../../lib/constants/assistant"
import { useUpdateAssistantSettings } from "../../lib/mutations/overview"
import type { AssistantSettings, AssistantSettingsPayload } from "../../lib/types/assistant"

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  const headingId = React.useId()
  return (
    <Card aria-labelledby={headingId} className="gap-4 rounded-xl p-5" role="region">
      <h3
        id={headingId}
        className="border-stroke-default text-content-primary border-b pb-3 text-base leading-6 font-semibold"
      >
        {title}
      </h3>
      {children}
    </Card>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-content-secondary text-[13px] font-normal">
        {label}
      </Label>
      <Input id={id} value={value} readOnly disabled className="h-9" />
    </div>
  )
}

/** Settings — what the assistant may read and how long it keeps things. Admin only. */
function SettingsTab({ settings }: { settings: AssistantSettings | undefined }) {
  const t = useTranslations("FinanceAssistant")
  const update = useUpdateAssistantSettings()
  const [name, setName] = React.useState<string | null>(null)
  const nameId = React.useId()

  if (!settings) return <Skeleton aria-busy aria-label={t("loadingSettings")} className="h-96 rounded-xl" />

  const save = (payload: AssistantSettingsPayload, message: string) =>
    update.mutate(payload, {
      onSuccess: () => toast.success(t("settingSaved", { message })),
      onError: () => toast.error(t("settingSaveFailed")),
    })

  const toggleGroup = (id: string, checked: boolean) =>
    save(
      { data_groups: { ...settings.data_groups, [id]: checked } },
      checked ? t("groupReadableAgain") : t("groupNoLongerReadable"),
    )

  const groups = settings.groups
  const cash = groups.find((group) => group.id === "cash")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-content-secondary text-sm leading-5">{t("settingsIntro")}</p>
        <p className="text-content-tertiary text-[13px] leading-5">{t("settingsAdminOnly")}</p>
      </div>

      <FinanceAlert tone="info">
        {t.rich("readOnlyByDesign", {
          strong: (chunks) => <strong className="text-content-primary font-semibold">{chunks}</strong>,
        })}
      </FinanceAlert>

      <SettingsCard title={t("title")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={nameId} className="text-content-secondary text-[13px] font-normal">
              {t("nameShownToUsers")}
            </Label>
            <Input
              id={nameId}
              className="h-9"
              value={name ?? settings.name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                const next = (name ?? "").trim()
                if (name !== null && next && next !== settings.name) {
                  save({ name: next }, t("nameUpdated"))
                }
                setName(null)
              }}
            />
          </div>
          <ReadOnlyField label={t("modelReadOnly")} value={settings.model} />
          <ReadOnlyField label={t("colStatus")} value={settings.status} />
        </div>
      </SettingsCard>

      <SettingsCard title={t("dataGroupsMayRead")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          {groups.map((group) => {
            const id = `assistant-group-${group.id}`
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={id}
                    checked={group.available && Boolean(settings.data_groups[group.id])}
                    disabled={!group.available || update.isPending}
                    onCheckedChange={(checked) => toggleGroup(group.id, checked === true)}
                  />
                  <Label htmlFor={id} className="text-content-primary text-sm font-normal">
                    {group.label}
                    {!group.available ? (
                      <span className="text-content-tertiary"> — {t("moduleNotInPrototype")}</span>
                    ) : null}
                  </Label>
                </div>
                {group.id === cash?.id ? (
                  <div className="flex items-start gap-2.5 ps-7">
                    <Checkbox
                      id="assistant-bank-balances"
                      checked={settings.bank_balances_admin_only}
                      disabled={!settings.data_groups.cash || update.isPending}
                      onCheckedChange={(checked) =>
                        save(
                          { bank_balances_admin_only: checked === true },
                          t("bankVisibilityUpdated"),
                        )
                      }
                    />
                    <Label
                      htmlFor="assistant-bank-balances"
                      className="text-content-secondary text-[13px] leading-5 font-normal"
                    >
                      {t("bankBalancesAdminOnly")}
                    </Label>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard title={t("retention")}>
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col gap-1">
            <Label htmlFor="assistant-retention" className="text-content-secondary text-[13px] font-normal">
              {t("conversationRetention")}
            </Label>
            <Select
              value={String(settings.retention_days)}
              onValueChange={(value) =>
                save({ retention_days: Number(value) }, t("retentionUpdated", { days: Number(value) }))
              }
            >
              <SelectTrigger id="assistant-retention" className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {t("daysCount", { count: days })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="assistant-keep-proposals" checked disabled />
            <Label htmlFor="assistant-keep-proposals" className="text-content-secondary text-[13px] font-normal">
              {t("keepProposals")}
            </Label>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t("neverTitle")}>
        <p className="text-content-primary text-sm leading-5 font-semibold">{t("notSettings")}</p>
        <ul className="text-content-secondary flex list-disc flex-col gap-1 ps-5 text-sm leading-5">
          {ASSISTANT_NEVER.map((rule) => (
            <li key={rule}>{t(rule)}</li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  )
}

export { SettingsTab }
