"use client"

import { useState } from "react"

import { cn } from "@/src/shared/lib/utils/utils"

import { SETTINGS_TABS, type SettingsTab } from "../data/settings-mock"

import { BillingTab } from "./billing-tab"
import { NotificationsTab } from "./notifications-tab"
import { ProfileTab } from "./profile-tab"
import { RolesTab } from "./roles-tab"
import { TeamTab } from "./team-tab"

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>("profile")

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-content-tertiary text-sm leading-5">
          Manage your workspace, team, billing, and notification preferences.
        </p>
      </header>

      <div className="bg-surface-white border-stroke-default flex h-9 w-fit flex-wrap items-center gap-1 rounded-xl border p-1">
        {SETTINGS_TABS.map(({ id, label }) => {
          const isActive = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative inline-flex h-[26px] items-center justify-center rounded-lg px-2.5 text-[12px] leading-[18px] font-medium transition-colors",
                isActive
                  ? "bg-[#f4f4f5] text-content-primary shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                  : "text-content-tertiary hover:text-content-primary",
              )}
            >
              <span>{label}</span>
              {isActive ? (
                <span
                  className="bg-brand-primary absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                  aria-hidden
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <section>
        {tab === "profile" && <ProfileTab />}
        {tab === "team" && <TeamTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "billing" && <BillingTab />}
        {tab === "notifications" && <NotificationsTab />}
      </section>
    </div>
  )
}
