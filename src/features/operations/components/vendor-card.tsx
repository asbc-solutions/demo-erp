"use client"

import { FileText, Loader2, Power, RotateCw, Settings } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/src/shared/components/ui/card"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { cn } from "@/src/shared/lib/utils/utils"

import { VENDOR_STATUS_STYLE } from "../data/operations-mock"
import { OPERATIONS_RESOURCES } from "../lib/constants/permissions"
import { useActivateVendor } from "../lib/mutations/vendors"
import type { VendorListItem } from "../lib/types"
import { formatCurrencyAmount, formatDate } from "../lib/utils/format"

import { toastMutationError } from "./shared/operations-error-state"

type ContractTone = "default" | "warning" | "danger"

const TONE: Record<ContractTone, string> = {
  default: "text-content-tertiary",
  warning: "text-brand-warning",
  danger: "text-brand-danger",
}

/** Vendor KPIs treat contracts inside `expiring_within_days` (config default 60) as "soon". */
const EXPIRING_SOON_THRESHOLD_DAYS = 60

function contractTone(vendor: VendorListItem): ContractTone {
  if (vendor.days_to_contract_end === null) return "default"
  if (vendor.days_to_contract_end < 0) return "danger"
  if (vendor.days_to_contract_end <= EXPIRING_SOON_THRESHOLD_DAYS) return "warning"
  return "default"
}

export function VendorCard({
  vendor,
  onRenewClick,
}: Readonly<{ vendor: VendorListItem; onRenewClick: (vendor: VendorListItem) => void }>) {
  const { can } = usePermissions()
  const canManage = can.write(OPERATIONS_RESOURCES.vendors)
  const activateVendor = useActivateVendor()

  const handleActivate = () => {
    activateVendor.mutate(vendor.id, {
      onSuccess: () => toast.success(`${vendor.name} activated.`),
      onError: (err) => toastMutationError(err, "Failed to activate vendor"),
    })
  }

  const tone = contractTone(vendor)

  return (
    <Card variant="elevated" className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-content-primary text-base leading-6 font-medium">
            {vendor.name}
          </h3>
          <span
            className={cn(
              "inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] leading-[15px] font-medium",
              VENDOR_STATUS_STYLE[vendor.status],
            )}
          >
            {vendor.status_label}
          </span>
        </div>
        <span className="bg-[#f4f4f5] inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] leading-[15px] font-medium text-content-tertiary">
          {vendor.category}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-content-tertiary text-[11px] leading-[15.4px]">
          Monthly Spend
        </span>
        <span className="text-content-primary text-[31px] leading-[37.2px] font-semibold tabular-nums">
          {formatCurrencyAmount(vendor.monthly_spend, vendor.currency_code)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-content-tertiary text-[11px] leading-[15.4px]">
          Contract End
        </span>
        <span
          className={cn(
            "text-[11px] leading-[15.4px] tabular-nums",
            TONE[tone],
          )}
        >
          {vendor.contract_end ? formatDate(vendor.contract_end) : "—"}
        </span>
      </div>

      <div className="bg-stroke-default h-px w-full" />

      <div className="flex flex-col gap-1">
        <span className="text-content-secondary text-[11px] leading-[15.4px]">
          {vendor.contact_role || vendor.contact_name || "No contact on file"}
        </span>
        {vendor.contact_email ? (
          <span className="text-content-tertiary truncate text-[11px] leading-[15.4px]">
            {vendor.contact_email}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {vendor.tags.map((tag) => (
          <span
            key={tag}
            className="bg-[#f4f4f5] inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] leading-[15px] font-medium text-content-tertiary"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          className="text-content-tertiary inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-[11px] leading-[15.4px] font-medium hover:text-content-primary"
        >
          <FileText className="size-4" aria-hidden />
          View contract
        </button>
        {/* `primary_action` is a single derived field (never both) — see List Vendors.bru:
            active → manage, pending → activate, inactive → renew. */}
        {vendor.primary_action === "manage" ? (
          <button
            type="button"
            className="bg-surface-page border-stroke-default text-content-secondary inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[11px] leading-[15.4px] font-medium shadow-xs hover:text-content-primary"
          >
            <Settings className="size-4" aria-hidden />
            Manage
          </button>
        ) : null}
        {vendor.primary_action === "activate" && canManage ? (
          <button
            type="button"
            onClick={handleActivate}
            disabled={activateVendor.isPending}
            className="bg-brand-success inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-[11px] leading-[15.4px] font-medium text-white shadow-xs hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {activateVendor.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Power className="size-4" aria-hidden />
            )}
            Activate
          </button>
        ) : null}
        {vendor.primary_action === "renew" && canManage ? (
          <button
            type="button"
            onClick={() => onRenewClick(vendor)}
            className="bg-surface-page border-stroke-default text-brand-warning inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[11px] leading-[15.4px] font-medium shadow-xs"
          >
            <RotateCw className="size-4" aria-hidden />
            Renew
          </button>
        ) : null}
      </div>
    </Card>
  )
}
