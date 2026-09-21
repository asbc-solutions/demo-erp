import {
  Ban,
  BadgeCheck,
  Check,
  CheckCheck,
  CircleAlert,
  CircleSlash,
  CircleX,
  Clock,
  CornerUpLeft,
  Eraser,
  FileCheck2,
  Hourglass,
  Landmark,
  PackageCheck,
  Send,
  ShieldCheck,
  ShieldX,
  Undo2,
  type LucideIcon,
} from "lucide-react"

/**
 * The finance status vocabulary. Every status belongs to one of four families,
 * and the family is carried by the pill's border and marker as well as colour,
 * so "submitted" can never be read as "posted" in greyscale.
 *
 *  - internal   — ours and still reversible; nothing has left the building.
 *  - external   — an authority, bank or counterparty has it (dashed + marker).
 *  - accounting — the ledger moved or the period is sealed.
 *  - failed     — it stopped and needs a person (marker, danger).
 */
export type StatusFamily = "internal" | "external" | "accounting" | "failed"

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "muted"

export type StatusMeta = {
  label: string
  family: StatusFamily
  tone: StatusTone
  icon?: LucideIcon
}

export const FINANCE_STATUSES = {
  // Internal progress
  draft: { label: "draft", family: "internal", tone: "info" },
  prepared: { label: "prepared", family: "internal", tone: "neutral" },
  validated: { label: "validated", family: "internal", tone: "info" },
  queued: { label: "queued", family: "internal", tone: "info" },
  pending: { label: "pending", family: "internal", tone: "info" },
  in_progress: { label: "in progress", family: "internal", tone: "info" },
  open: { label: "open", family: "internal", tone: "warning" },
  partial: { label: "partial", family: "internal", tone: "warning" },
  unapplied: { label: "unapplied", family: "internal", tone: "warning" },
  unallocated: { label: "unallocated", family: "internal", tone: "warning" },
  revised: { label: "revised", family: "internal", tone: "warning" },
  not_sent: { label: "not sent", family: "internal", tone: "neutral" },
  ready: { label: "ready", family: "internal", tone: "info" },
  in_hand: { label: "in hand", family: "internal", tone: "neutral" },
  written: { label: "written", family: "internal", tone: "neutral" },
  opened_in_screen: { label: "opened in screen", family: "internal", tone: "info" },
  dismissed: { label: "dismissed", family: "internal", tone: "neutral" },
  expired: { label: "expired", family: "internal", tone: "warning" },
  unreconciled: { label: "unreconciled", family: "internal", tone: "warning" },
  simulated: { label: "simulated", family: "internal", tone: "neutral" },
  done: { label: "done", family: "internal", tone: "success" },
  blocked: { label: "blocked", family: "internal", tone: "danger" },

  // External decision
  submitted: { label: "submitted", family: "external", tone: "info", icon: Send },
  under_collection: { label: "under collection", family: "external", tone: "info", icon: Hourglass },
  deposited: { label: "deposited", family: "external", tone: "info", icon: Landmark },
  accepted: { label: "accepted", family: "external", tone: "success", icon: CheckCheck },
  cleared: { label: "cleared", family: "external", tone: "success", icon: Check },
  valid: { label: "valid", family: "external", tone: "success", icon: ShieldCheck },
  approved: { label: "approved", family: "external", tone: "success", icon: BadgeCheck },
  cancel_requested: { label: "cancel requested", family: "external", tone: "warning", icon: Ban },
  filed: { label: "filed", family: "external", tone: "info", icon: FileCheck2 },
  delivered: { label: "delivered", family: "external", tone: "info", icon: PackageCheck },
  presented: { label: "presented", family: "external", tone: "warning", icon: Send },
  cancelled: { label: "cancelled", family: "external", tone: "neutral", icon: CircleSlash },
  rejected: { label: "rejected", family: "external", tone: "danger", icon: CircleX },
  invalid: { label: "invalid", family: "external", tone: "danger", icon: ShieldX },

  // Accounting
  posted: { label: "posted", family: "accounting", tone: "success" },
  settled: { label: "settled", family: "accounting", tone: "success" },
  paid: { label: "paid", family: "accounting", tone: "success" },
  applied: { label: "applied", family: "accounting", tone: "success" },
  allocated: { label: "allocated", family: "accounting", tone: "success" },
  collected: { label: "collected", family: "accounting", tone: "success" },
  reconciled: { label: "reconciled", family: "accounting", tone: "success" },
  matched: { label: "matched", family: "accounting", tone: "success" },
  closed: { label: "closed", family: "accounting", tone: "neutral" },
  locked: { label: "locked", family: "accounting", tone: "neutral" },
  in_service: { label: "in service", family: "accounting", tone: "success" },
  disposed: { label: "disposed", family: "accounting", tone: "neutral" },
  actioned: { label: "actioned", family: "accounting", tone: "success" },

  // Failed
  failed: { label: "failed", family: "failed", tone: "danger", icon: CircleAlert },
  bounced: { label: "bounced", family: "failed", tone: "danger", icon: Undo2 },
  returned: { label: "returned", family: "failed", tone: "danger", icon: CornerUpLeft },
  written_off: { label: "written off", family: "failed", tone: "danger", icon: Eraser },
  void: { label: "void", family: "failed", tone: "danger", icon: Ban },
  overdue: { label: "overdue", family: "failed", tone: "danger", icon: Clock },
} satisfies Record<string, StatusMeta>

export type StatusKey = keyof typeof FINANCE_STATUSES

export const STATUS_FAMILY_ORDER: readonly StatusFamily[] = [
  "internal",
  "external",
  "accounting",
  "failed",
]

export const STATUS_FAMILY_COPY: Record<StatusFamily, { title: string; description: string }> = {
  internal: {
    title: "Internal progress",
    description: "Ours, and still reversible. Nothing has left the building and the ledger has not moved.",
  },
  external: {
    title: "External decision",
    description: "An authority, bank or counterparty has it. Submitted is not accepted, and neither is posted.",
  },
  accounting: {
    title: "Accounting",
    description: "The general ledger moved, or the period is now sealed. These are the states that change a report.",
  },
  failed: {
    title: "Failed",
    description: "It stopped and needs a person. Never let one of these read as merely pending.",
  },
}

export function getStatusMeta(status: string): StatusMeta {
  return (
    (FINANCE_STATUSES as Record<string, StatusMeta>)[status] ?? {
      label: status.replace(/_/g, " "),
      family: "internal",
      tone: "neutral",
    }
  )
}
