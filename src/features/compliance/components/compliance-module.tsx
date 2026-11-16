"use client"

import { useState } from "react"
import { Clock3, FileCheck2, Search, Shield, Users } from "lucide-react"

import { useRegisterLayoutHeaderTab } from "@/src/shared/components/layout-header-context"
import { cn } from "@/src/shared/lib/utils/utils"

import { AccessTab } from "./access-tab"
import { AuditTab } from "./audit-tab"
import { ComplianceAccessGate } from "./compliance-access-gate"
import { COMPLIANCE_RESOURCES } from "../lib/constants/permissions"
import { OverviewTab } from "./overview-tab"
import { PoliciesTab } from "./policies-tab"
import { RulesTab } from "./rules-tab"

type ComplianceMainTab = "overview" | "access" | "policies" | "audit" | "rules"

const COMPLIANCE_MAIN_TABS: ReadonlyArray<{
  id: ComplianceMainTab
  label: string
  icon: typeof Shield
  resource: (typeof COMPLIANCE_RESOURCES)[keyof typeof COMPLIANCE_RESOURCES]
}> = [
  { id: "overview", label: "Overview", icon: Shield, resource: COMPLIANCE_RESOURCES.overview },
  { id: "access", label: "Access", icon: Users, resource: COMPLIANCE_RESOURCES.access },
  { id: "policies", label: "Policies", icon: FileCheck2, resource: COMPLIANCE_RESOURCES.policies },
  { id: "audit", label: "Audit", icon: Clock3, resource: COMPLIANCE_RESOURCES.audit },
  { id: "rules", label: "Rules", icon: Search, resource: COMPLIANCE_RESOURCES.rules },
]

export function ComplianceModule() {
  const [tab, setTab] = useState<ComplianceMainTab>("overview")

  const activeTab = COMPLIANCE_MAIN_TABS.find((item) => item.id === tab)
  useRegisterLayoutHeaderTab(activeTab?.label ?? "")

  return (
    <div className="bg-surface-page relative flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
      <div
        className="pointer-events-none absolute top-0 inset-e-0 inset-s-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent"
        aria-hidden
      />

      <div className="border-stroke-default bg-surface-white flex flex-wrap items-center gap-1 rounded-xl border p-1">
        {COMPLIANCE_MAIN_TABS.map((item) => {
          const active = item.id === tab
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "text-content-tertiary inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium",
                active &&
                  "bg-brand-primary text-white shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {tab === "overview" && (
        <ComplianceAccessGate resource={COMPLIANCE_RESOURCES.overview}>
          <OverviewTab />
        </ComplianceAccessGate>
      )}
      {tab === "access" && (
        <ComplianceAccessGate resource={COMPLIANCE_RESOURCES.access}>
          <AccessTab />
        </ComplianceAccessGate>
      )}
      {tab === "policies" && (
        <ComplianceAccessGate resource={COMPLIANCE_RESOURCES.policies}>
          <PoliciesTab />
        </ComplianceAccessGate>
      )}
      {tab === "audit" && (
        <ComplianceAccessGate resource={COMPLIANCE_RESOURCES.audit}>
          <AuditTab />
        </ComplianceAccessGate>
      )}
      {tab === "rules" && (
        <ComplianceAccessGate resource={COMPLIANCE_RESOURCES.rules}>
          <RulesTab />
        </ComplianceAccessGate>
      )}
    </div>
  )
}
