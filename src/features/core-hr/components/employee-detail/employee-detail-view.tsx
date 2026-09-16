"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  FileText,
  History,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

import type { Employee } from "../../lib/types"
import { EmployeeSummaryCard } from "./employee-summary-card"
import { DocumentsTab } from "./tabs/documents-tab"
import { EmergencyTab } from "./tabs/emergency-tab"
import { EmploymentTab } from "./tabs/employment-tab"
import { HistoryTab } from "./tabs/history-tab"
import { PersonalInfoTab } from "./tabs/personal-info-tab"
import { SalaryTab } from "./tabs/salary-tab"

export type EmployeeDetailTabId =
  | "personal"
  | "employment"
  | "salary"
  | "documents"
  | "emergency"
  | "history"

type EmployeeDetailViewProps = Readonly<{
  employee: Employee
  onBack: () => void
  initialTab?: EmployeeDetailTabId
}>

type DetailTab = Readonly<{
  id: EmployeeDetailTabId
  label: string
  icon: LucideIcon
}>

const TABS: DetailTab[] = [
  { id: "personal", label: "Personal Info", icon: UserRound },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "salary", label: "Salary", icon: DollarSign },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "emergency", label: "Emergency", icon: ShieldAlert },
  { id: "history", label: "History", icon: History },
]

export function EmployeeDetailView({
  employee,
  onBack,
  initialTab = "personal",
}: EmployeeDetailViewProps) {
  const [activeTab, setActiveTab] = useState<EmployeeDetailTabId>(initialTab)

  return (
    <div className="flex w-full flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="text-content-tertiary hover:text-content-primary inline-flex h-8 w-fit items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Back to Employees
      </button>

      <EmployeeSummaryCard employee={employee} />

      <nav
        aria-label="Employee sections"
        className="border-stroke-default bg-surface-hover/40 flex flex-wrap items-center gap-1 rounded-[12px] border p-1"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-[8px] px-3 text-sm font-medium transition-colors",
                "[&_svg]:size-4 [&_svg]:shrink-0",
                isActive
                  ? "bg-surface-white text-content-primary shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] [&_svg]:text-content-primary"
                  : "text-content-tertiary hover:text-content-primary [&_svg]:text-content-tertiary",
              )}
            >
              <Icon strokeWidth={1.75} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div role="tabpanel" aria-label={`${activeTab} panel`}>
        {activeTab === "personal" && <PersonalInfoTab employee={employee} />}
        {activeTab === "employment" && <EmploymentTab employee={employee} />}
        {activeTab === "salary" && <SalaryTab employeeId={employee.id} />}
        {activeTab === "documents" && <DocumentsTab employeeId={employee.id} />}
        {activeTab === "emergency" && <EmergencyTab employeeId={employee.id} />}
        {activeTab === "history" && <HistoryTab employeeId={employee.id} />}
      </div>
    </div>
  )
}
