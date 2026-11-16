"use client"

import * as React from "react"
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
  const update = useUpdateAssistantSettings()
  const [name, setName] = React.useState<string | null>(null)
  const nameId = React.useId()

  if (!settings) return <Skeleton aria-busy aria-label="Loading settings" className="h-96 rounded-xl" />

  const save = (payload: AssistantSettingsPayload, message: string) =>
    update.mutate(payload, {
      onSuccess: () => toast.success(`${message} The change is in the audit log.`),
      onError: () => toast.error("The setting could not be saved. Try again."),
    })

  const toggleGroup = (id: string, checked: boolean) =>
    save(
      { data_groups: { ...settings.data_groups, [id]: checked } },
      checked ? "The assistant can read this group again." : "The assistant can no longer read this group.",
    )

  const groups = settings.groups
  const cash = groups.find((group) => group.id === "cash")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-content-secondary text-sm leading-5">
          What the assistant may read, how long conversations are kept, and the things it will never
          do. Every change here is written to the audit log with before and after.
        </p>
        <p className="text-content-tertiary text-[13px] leading-5">
          Admin only · scope is derived from the Role &amp; Authority Matrix at request time, not set here
        </p>
      </div>

      <FinanceAlert tone="info">
        <strong className="text-content-primary font-semibold">Read only by design.</strong> The
        assistant proposes; people act. Turning a data group off below hides it from the assistant
        entirely — questions that need it return a limited-access answer.
      </FinanceAlert>

      <SettingsCard title="Assistant">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor={nameId} className="text-content-secondary text-[13px] font-normal">
              Name shown to users
            </Label>
            <Input
              id={nameId}
              className="h-9"
              value={name ?? settings.name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => {
                const next = (name ?? "").trim()
                if (name !== null && next && next !== settings.name) {
                  save({ name: next }, "The assistant's name was updated.")
                }
                setName(null)
              }}
            />
          </div>
          <ReadOnlyField label="Model (read only)" value={settings.model} />
          <ReadOnlyField label="Status" value={settings.status} />
        </div>
      </SettingsCard>

      <SettingsCard title="Data groups the assistant may read">
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
                      <span className="text-content-tertiary"> — Module not in this prototype</span>
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
                          "Bank and treasury balance visibility was updated.",
                        )
                      }
                    />
                    <Label
                      htmlFor="assistant-bank-balances"
                      className="text-content-secondary text-[13px] leading-5 font-normal"
                    >
                      Bank and treasury balances (under Cash &amp; banking) — off for every role except
                      Finance · Admin
                    </Label>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Retention">
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col gap-1">
            <Label htmlFor="assistant-retention" className="text-content-secondary text-[13px] font-normal">
              Conversation retention
            </Label>
            <Select
              value={String(settings.retention_days)}
              onValueChange={(value) =>
                save({ retention_days: Number(value) }, `Conversations are now kept for ${value} days.`)
              }
            >
              <SelectTrigger id="assistant-retention" className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETENTION_OPTIONS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch id="assistant-keep-proposals" checked disabled />
            <Label htmlFor="assistant-keep-proposals" className="text-content-secondary text-[13px] font-normal">
              Keep proposals in Drafts — always on, cannot be disabled
            </Label>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="What it will never do">
        <p className="text-content-primary text-sm leading-5 font-semibold">These are not settings.</p>
        <ul className="text-content-secondary flex list-disc flex-col gap-1 ps-5 text-sm leading-5">
          {ASSISTANT_NEVER.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  )
}

export { SettingsTab }
