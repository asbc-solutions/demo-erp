"use client"

import { useState } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { SALES_OWNERS, SALES_STAGES } from "../data/sales-mock"

type NewDealDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewDealDialog({ open, onOpenChange }: NewDealDialogProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [amount, setAmount] = useState("")
  const [stage, setStage] = useState<string>(SALES_STAGES[0])
  const [closeDate, setCloseDate] = useState("")
  const [owner, setOwner] = useState<string>(SALES_OWNERS[0].id)

  const isValid = name.trim().length > 0 && company.trim().length > 0

  const reset = () => {
    setName("")
    setCompany("")
    setAmount("")
    setStage(SALES_STAGES[0])
    setCloseDate("")
    setOwner(SALES_OWNERS[0].id)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-[18px] leading-7 font-semibold">
            New Deal
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd_name" className="text-content-tertiary text-xs">
                Deal Name *
              </Label>
              <Input
                id="nd_name"
                placeholder="Enterprise License"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-surface-page h-10 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd_company" className="text-content-tertiary text-xs">
                Company *
              </Label>
              <Input
                id="nd_company"
                placeholder="Acme Corp"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="bg-surface-page h-10 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd_amount" className="text-content-tertiary text-xs">
                Amount
              </Label>
              <Input
                id="nd_amount"
                type="number"
                inputMode="numeric"
                placeholder="50000"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="bg-surface-page h-10 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-tertiary text-xs">Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="bg-surface-page h-10 text-[13px]">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_STAGES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd_date" className="text-content-tertiary text-xs">
                Close Date
              </Label>
              <Input
                id="nd_date"
                type="date"
                value={closeDate}
                onChange={(event) => setCloseDate(event.target.value)}
                className="bg-surface-page h-10 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-tertiary text-xs">Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="bg-surface-page h-10 text-[13px]">
                  <SelectValue placeholder="Assign owner" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_OWNERS.map((value) => (
                    <SelectItem key={value.id} value={value.id}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter className="bg-transparent border-t-0 px-6 pt-0 pb-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full text-[12px]"
              disabled={!isValid}
            >
              Add Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
