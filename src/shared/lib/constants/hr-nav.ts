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

export type HrNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

/**
 * The HR sections, each a real route under /hr. Single source for the sidebar
 * submenu and for the section label shown in the shell header.
 */
export const HR_NAV: readonly HrNavItem[] = [
  { id: "employees", label: "Employees", href: "/hr/employees", icon: Users },
  { id: "organization", label: "Organization", href: "/hr/organization", icon: Building2 },
  { id: "job-grades", label: "Job Grades", href: "/hr/job-grades", icon: Award },
  { id: "positions", label: "Positions", href: "/hr/positions", icon: Briefcase },
  { id: "salaries", label: "Salaries", href: "/hr/salaries", icon: DollarSign },
  { id: "leaves", label: "Leaves", href: "/hr/leaves", icon: CalendarRange },
  { id: "performance", label: "Performance", href: "/hr/performance", icon: BarChart3 },
  { id: "training", label: "Training", href: "/hr/training", icon: GraduationCap },
  { id: "approvals", label: "Approvals", href: "/hr/approvals", icon: CheckCircle2 },
  { id: "reports", label: "Reports", href: "/hr/reports", icon: BarChart3 },
  { id: "contracts", label: "Contracts", href: "/hr/contracts", icon: FileText },
  { id: "documents", label: "Documents", href: "/hr/documents", icon: FileText },
  { id: "emergency", label: "Emergency Contacts", href: "/hr/emergency", icon: UsersRound },
  { id: "audit", label: "Audit Log", href: "/hr/audit", icon: History },
]

export const HR_DEFAULT_ROUTE = HR_NAV[0].href
