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

import { useCreateVendor } from "../lib/mutations/vendors"
import type { CreateVendorPayload } from "../lib/types"

import { toastMutationError } from "./shared/operations-error-state"

type NewVendorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-content-tertiary flex items-center gap-1 text-xs"
    >
      {children}
      {required ? <span className="text-brand-danger">*</span> : null}
    </Label>
  )
}

export function NewVendorDialog({ open, onOpenChange }: NewVendorDialogProps) {
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [contactName, setContactName] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [monthlySpend, setMonthlySpend] = React.useState("")
  const [contractEnd, setContractEnd] = React.useState("")
  const [tags, setTags] = React.useState("")

  const createVendor = useCreateVendor()

  const isValid = name.trim().length > 0 && category.trim().length > 0

  const reset = () => {
    setName("")
    setCategory("")
    setContactName("")
    setContactEmail("")
    setMonthlySpend("")
    setContractEnd("")
    setTags("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return

    // Wire format requires an array — the form collects a comma-separated string.
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    const payload: CreateVendorPayload = {
      name: name.trim(),
      category: category.trim(),
      contact_name: contactName.trim() || undefined,
      contact_email: contactEmail.trim() || undefined,
      monthly_spend: monthlySpend ? Number(monthlySpend) : undefined,
      contract_end: contractEnd || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    }

    createVendor.mutate(payload, {
      onSuccess: () => {
        toast.success("Vendor added.")
        handleOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to add vendor"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-[16px] leading-[25.6px] font-semibold">
            New Vendor
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="gap-3.5">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-name" required>
                Vendor Name
              </FieldLabel>
              <Input
                id="nv-name"
                placeholder="e.g. Vercel"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-category" required>
                Category
              </FieldLabel>
              <Input
                id="nv-category"
                placeholder="e.g. Infrastructure, Design, Payments"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-contact">Contact Name</FieldLabel>
              <Input
                id="nv-contact"
                placeholder="Account manager name"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-email">Contact Email</FieldLabel>
              <Input
                id="nv-email"
                type="email"
                placeholder="vendor@example.com"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-spend">Monthly Spend</FieldLabel>
              <Input
                id="nv-spend"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={monthlySpend}
                onChange={(event) => setMonthlySpend(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-contract">Contract End Date</FieldLabel>
              <Input
                id="nv-contract"
                type="date"
                value={contractEnd}
                onChange={(event) => setContractEnd(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nv-tags">Tags</FieldLabel>
              <Input
                id="nv-tags"
                placeholder="Comma-separated, e.g. critical, cloud"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="bg-surface-page h-8 text-[12px]"
              />
            </div>
          </DialogBody>
          <DialogFooter className="bg-transparent border-t-0 px-6 pt-0 pb-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full text-[12px]"
              disabled={!isValid || createVendor.isPending}
            >
              {createVendor.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Add Vendor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
