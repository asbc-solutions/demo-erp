import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CalendarRange,
  CheckCircle2,
  DollarSign,
  FileText,
  GraduationCap,
  History,
  Users,
  UsersRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { NavLabelKey } from "@/src/shared/lib/types"

export type HrNavItem = {
  id: string
  labelKey: NavLabelKey
  href: string
  icon: LucideIcon
}

/**
 * The HR sections, each a real route under /hr. Single source for the sidebar
 * submenu and for the section label shown in the shell header.
 */
export const HR_NAV: readonly HrNavItem[] = [
  { id: "employees", labelKey: "hrEmployees", href: "/hr/employees", icon: Users },
  { id: "organization", labelKey: "hrOrganization", href: "/hr/organization", icon: Building2 },
  { id: "job-grades", labelKey: "hrJobGrades", href: "/hr/job-grades", icon: Award },
  { id: "positions", labelKey: "hrPositions", href: "/hr/positions", icon: Briefcase },
  { id: "salaries", labelKey: "hrSalaries", href: "/hr/salaries", icon: DollarSign },
  { id: "leaves", labelKey: "hrLeaves", href: "/hr/leaves", icon: CalendarRange },
  { id: "performance", labelKey: "hrPerformance", href: "/hr/performance", icon: BarChart3 },
  { id: "training", labelKey: "hrTraining", href: "/hr/training", icon: GraduationCap },
  { id: "approvals", labelKey: "hrApprovals", href: "/hr/approvals", icon: CheckCircle2 },
  { id: "reports", labelKey: "hrReports", href: "/hr/reports", icon: BarChart3 },
  { id: "contracts", labelKey: "hrContracts", href: "/hr/contracts", icon: FileText },
  { id: "documents", labelKey: "hrDocuments", href: "/hr/documents", icon: FileText },
  { id: "emergency", labelKey: "hrEmergency", href: "/hr/emergency", icon: UsersRound },
  { id: "audit", labelKey: "hrAudit", href: "/hr/audit", icon: History },
]

export const HR_DEFAULT_ROUTE = HR_NAV[0].href
