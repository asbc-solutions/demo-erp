import {
  Baby,
  Briefcase,
  CalendarDays,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Moon,
  Plane,
  Shield,
  type LucideIcon,
} from "lucide-react"

import type {
  AccrualMethod,
  LeaveRequestStatus,
  LeaveTypeCategory,
} from "../types"

export const LEAVE_CATEGORY_LABELS: Record<LeaveTypeCategory, string> = {
  annual: "Annual",
  sick: "Sick",
  maternity: "Maternity",
  paternity: "Paternity",
  unpaid: "Unpaid",
  emergency: "Emergency",
  bereavement: "Bereavement",
  compassionate: "Compassionate",
  hajj: "Hajj",
  study: "Study",
  other: "Other",
}

export const ACCRUAL_METHOD_LABELS: Record<AccrualMethod, string> = {
  annual_lump: "Annual lump sum",
  monthly: "Monthly",
  anniversary: "On anniversary",
  none: "No accrual",
}

export type LeaveCategoryStyle = {
  Icon: LucideIcon
  /** Tailwind classes for the rounded icon container (bg + text). */
  iconClass: string
  /** Solid background colour for legend dots / calendar bars. */
  dotClass: string
  /** Text colour for emphasised figures (e.g. balance numbers). */
  accentText: string
  /** Tinted border for cards (e.g. policy cards). */
  borderClass: string
  /** Tinted background + text for inline info notes. */
  noteClass: string
}

const LEAVE_CATEGORY_STYLE: Record<LeaveTypeCategory, LeaveCategoryStyle> = {
  annual: {
    Icon: CalendarDays,
    iconClass: "bg-brand-success/10 text-brand-success",
    dotClass: "bg-brand-success",
    accentText: "text-brand-success",
    borderClass: "border-brand-success/30",
    noteClass: "bg-brand-success/[0.07] text-brand-success",
  },
  sick: {
    Icon: HeartPulse,
    iconClass: "bg-brand-warning/10 text-brand-warning",
    dotClass: "bg-brand-warning",
    accentText: "text-brand-warning",
    borderClass: "border-brand-warning/30",
    noteClass: "bg-brand-warning/[0.07] text-brand-warning",
  },
  maternity: {
    Icon: Baby,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    dotClass: "bg-violet-500",
    accentText: "text-violet-600 dark:text-violet-300",
    borderClass: "border-violet-500/30",
    noteClass: "bg-violet-500/[0.07] text-violet-600 dark:text-violet-300",
  },
  paternity: {
    Icon: Baby,
    iconClass: "bg-brand-info/10 text-brand-info",
    dotClass: "bg-brand-info",
    accentText: "text-brand-info",
    borderClass: "border-brand-info/30",
    noteClass: "bg-brand-info/[0.07] text-brand-info",
  },
  emergency: {
    Icon: Shield,
    iconClass: "bg-brand-danger/10 text-brand-danger",
    dotClass: "bg-brand-danger",
    accentText: "text-brand-danger",
    borderClass: "border-brand-danger/30",
    noteClass: "bg-brand-danger/[0.07] text-brand-danger",
  },
  unpaid: {
    Icon: Briefcase,
    iconClass: "bg-surface-hover text-content-secondary",
    dotClass: "bg-content-tertiary",
    accentText: "text-content-secondary",
    borderClass: "border-stroke-default",
    noteClass: "bg-surface-hover text-content-secondary",
  },
  bereavement: {
    Icon: HeartHandshake,
    iconClass: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    dotClass: "bg-slate-500",
    accentText: "text-slate-600 dark:text-slate-300",
    borderClass: "border-slate-500/30",
    noteClass: "bg-slate-500/[0.07] text-slate-600 dark:text-slate-300",
  },
  compassionate: {
    Icon: HeartHandshake,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    dotClass: "bg-violet-500",
    accentText: "text-violet-600 dark:text-violet-300",
    borderClass: "border-violet-500/30",
    noteClass: "bg-violet-500/[0.07] text-violet-600 dark:text-violet-300",
  },
  hajj: {
    Icon: Moon,
    iconClass: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    dotClass: "bg-teal-500",
    accentText: "text-teal-600 dark:text-teal-300",
    borderClass: "border-teal-500/30",
    noteClass: "bg-teal-500/[0.07] text-teal-600 dark:text-teal-300",
  },
  study: {
    Icon: GraduationCap,
    iconClass: "bg-brand-primary/10 text-brand-primary",
    dotClass: "bg-brand-primary",
    accentText: "text-brand-primary",
    borderClass: "border-brand-primary/30",
    noteClass: "bg-brand-primary/[0.07] text-brand-primary",
  },
  other: {
    Icon: Plane,
    iconClass: "bg-surface-hover text-content-secondary",
    dotClass: "bg-content-tertiary",
    accentText: "text-content-secondary",
    borderClass: "border-stroke-default",
    noteClass: "bg-surface-hover text-content-secondary",
  },
}

export function getLeaveCategoryStyle(
  category: LeaveTypeCategory | string | undefined
): LeaveCategoryStyle {
  if (category && category in LEAVE_CATEGORY_STYLE) {
    return LEAVE_CATEGORY_STYLE[category as LeaveTypeCategory]
  }
  return LEAVE_CATEGORY_STYLE.other
}

export type LeaveStatusConfig = {
  label: string
  /** Tailwind classes for an inline status pill (bg + text). */
  className: string
  dotClass: string
}

export const LEAVE_REQUEST_STATUS_CONFIG: Record<
  LeaveRequestStatus,
  LeaveStatusConfig
> = {
  draft: {
    label: "Draft",
    className: "bg-surface-hover text-content-secondary",
    dotClass: "bg-content-tertiary",
  },
  pending: {
    label: "Pending",
    className: "bg-brand-warning/12 text-brand-warning",
    dotClass: "bg-brand-warning",
  },
  approved: {
    label: "Approved",
    className: "bg-brand-success/12 text-brand-success",
    dotClass: "bg-brand-success",
  },
  rejected: {
    label: "Rejected",
    className: "bg-brand-danger/12 text-brand-danger",
    dotClass: "bg-brand-danger",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-surface-hover text-content-tertiary",
    dotClass: "bg-content-quaternary",
  },
}
