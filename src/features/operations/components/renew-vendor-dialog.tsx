"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"

import { useRenewVendor } from "../lib/mutations/vendors"
import type { VendorListItem } from "../lib/types"

import { toastMutationError } from "./shared/operations-error-state"

/**
 * Confirmed dedicated endpoint: POST /operations/vendors/{id}/renew — requires a future
 * `contract_end`. Callers should remount this with `key={vendor?.id ?? "none"}` (see
 * VendorsTab) so form state resets per-target instead of via an effect.
 */
export function RenewVendorDialog({
  vendor,
  onOpenChange,
}: Readonly<{ vendor: VendorListItem | null; onOpenChange: (open: boolean) => void }>) {
  const [contractEnd, setContractEnd] = React.useState("")
  const renewVendor = useRenewVendor()

  const today = new Date().toISOString().slice(0, 10)
  const isValid = contractEnd.length > 0 && contractEnd > today

  const handleConfirm = () => {
    if (!vendor || !isValid) return
    renewVendor.mutate(
      { id: vendor.id, payload: { contract_end: contractEnd } },
      {
        onSuccess: () => {
          toast.success(`${vendor.name}'s contract renewed.`)
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to renew vendor contract"),
      },
    )
  }

  return (
    <Dialog open={vendor !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-[16px] leading-[25.6px] font-semibold">
            Renew {vendor?.name}&apos;s contract
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="renew-contract-end"
              className="text-content-tertiary flex items-center gap-1 text-xs"
            >
              New Contract End Date
              <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="renew-contract-end"
              type="date"
              min={today}
              value={contractEnd}
              onChange={(event) => setContractEnd(event.target.value)}
              className="bg-surface-page h-9 text-[13px]"
            />
            {contractEnd && !isValid ? (
              <span className="text-brand-danger text-xs">
                Contract end date must be in the future.
              </span>
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter className="bg-transparent border-t-0 px-6 pt-0 pb-6">
          <Button
            type="button"
            variant="primary"
            className="w-full text-[12px]"
            disabled={!isValid || renewVendor.isPending}
            onClick={handleConfirm}
          >
            {renewVendor.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Renew Contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
