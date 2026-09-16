"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
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

import { useCreateFinanceExpense } from "../lib/mutations/expenses"
import { useFinanceExpenseCategories } from "../lib/queries/expenses"
import { toastMutationError } from "./shared/finance-error-state"

type AddExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddExpenseDialog({
  open,
  onOpenChange,
}: Readonly<AddExpenseDialogProps>) {
  const [description, setDescription] = React.useState("")
  const [vendor, setVendor] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined)
  const [amount, setAmount] = React.useState("")
  const [date, setDate] = React.useState(today())
  const [recurring, setRecurring] = React.useState(false)

  const categoriesQuery = useFinanceExpenseCategories({ enabled: open })
  const createExpense = useCreateFinanceExpense()

  const resetForm = () => {
    setDescription("")
    setVendor("")
    setCategoryId(undefined)
    setAmount("")
    setDate(today())
    setRecurring(false)
  }

  const canSubmit =
    description.trim().length > 0 && amount.trim().length > 0 && !createExpense.isPending

  const handleSubmit = (event: React.BaseSyntheticEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    createExpense.mutate(
      {
        description: description.trim(),
        vendor: vendor.trim() || undefined,
        category_id: categoryId,
        amount: Number(amount),
        date,
        recurring,
      },
      {
        onSuccess: () => {
          toast.success("Expense added")
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to add expense"),
      },
    )
  }

  const handleOpenChange = (next: boolean) => {
    if (next) resetForm()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex items-start justify-between gap-4 pr-8">
            <DialogTitle className="text-[18px] leading-[28.8px] font-semibold text-content-primary">
              Add Expense
            </DialogTitle>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <Label
              htmlFor="expense-description"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Description <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AWS Hosting"
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] text-[13px] placeholder:text-content-quaternary"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="expense-vendor"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Vendor
            </Label>
            <Input
              id="expense-vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Amazon"
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] text-[13px] placeholder:text-content-quaternary"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="expense-category"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                id="expense-category"
                className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] text-[13px] shadow-none"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(categoriesQuery.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="expense-amount"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Amount <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="expense-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2400"
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] font-mono text-[13px] placeholder:text-content-quaternary"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="expense-date"
              className="text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Date
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-lg border-[#e4e4e7] bg-[#fafafa] font-mono text-[13px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="expense-recurring"
              checked={recurring}
              onCheckedChange={(v) => setRecurring(v === true)}
              className="size-[13px] rounded-[2.5px] border-[#767676]"
            />
            <Label
              htmlFor="expense-recurring"
              className="cursor-pointer text-[12px] leading-[19.2px] font-semibold text-content-tertiary"
            >
              Recurring
            </Label>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            className="mt-1 h-9 w-full rounded-lg text-[12px] font-normal disabled:opacity-50"
          >
            {createExpense.isPending ? "Adding…" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
