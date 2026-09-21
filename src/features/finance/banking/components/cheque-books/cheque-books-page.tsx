"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateChequeBook } from "../../lib/mutations/banking"
import { useChequeBooks } from "../../lib/queries/banking"
import { chequeBookSchema, type ChequeBookFormValues } from "../../lib/schema/banking"
import type { ChequeBook } from "../../lib/types/banking"

const COLUMNS: FinanceColumn<ChequeBook>[] = [
  { id: "book", header: "Book", cell: (row) => <DocNumber>{row.code}</DocNumber> },
  { id: "bank", header: "Bank", cell: (row) => row.bank },
  {
    id: "range",
    header: "Number range",
    cell: (row) => (
      <span className="font-mono text-xs">
        {row.first}–{row.last}
      </span>
    ),
  },
  { id: "direction", header: "Direction", cell: (row) => (row.direction === "received" ? "Received" : "Issued") },
  {
    id: "remaining",
    header: "Remaining",
    align: "end",
    cell: (row) => (
      <span className="flex items-center justify-end gap-2 tabular-nums">
        {row.remaining === 0 ? <StatusPill status="closed" label="Used up" /> : null}
        {row.remaining} / {row.size}
      </span>
    ),
  },
  {
    id: "next",
    header: "Next leaf",
    cell: (row) => (row.next_number ? <span className="font-mono text-xs">{row.next_number}</span> : "—"),
  },
]

const EMPTY: ChequeBookFormValues = { treasury_id: "", first: "", leaves: "25", direction: "issued" }

function RegisterBookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: treasuries = [] } = useFinanceTreasuries()
  const banks = treasuries.filter((row) => row.kind === "bank")
  const createBook = useCreateChequeBook()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChequeBookFormValues>({ resolver: zodResolver(chequeBookSchema), defaultValues: EMPTY })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const [first, leaves] = useWatch({ control, name: ["first", "leaves"] })
  const last = Number(first) > 0 && Number(leaves) > 0 ? Number(first) + Number(leaves) - 1 : null

  const submit = (values: ChequeBookFormValues) =>
    createBook.mutate(
      { treasury_id: values.treasury_id, first: Number(values.first), leaves: Number(values.leaves), direction: values.direction },
      {
        onSuccess: (book) => {
          toast.success(`${book.code} reserves ${book.first}–${book.last} on ${book.bank}.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The cheque book could not be registered. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Register book</DialogTitle>
            <DialogDescription>
              A book reserves a continuous number range on one bank account. Ranges never overlap, so a number
              is never reused.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="book-treasury">Bank account *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-treasury" aria-invalid={Boolean(errors.treasury_id)}>
                      <SelectValue placeholder="Choose the bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.treasury_id ? <FieldError>{errors.treasury_id.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="book-first">First number *</FieldLabel>
                <Input id="book-first" inputMode="numeric" className="font-mono" aria-invalid={Boolean(errors.first)} {...register("first")} />
                {errors.first ? <FieldError>{errors.first.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="book-leaves">Leaves *</FieldLabel>
                <Input id="book-leaves" inputMode="numeric" aria-invalid={Boolean(errors.leaves)} {...register("leaves")} />
                {errors.leaves ? <FieldError>{errors.leaves.message}</FieldError> : null}
              </Field>
            </div>
            {last ? <FieldDescription>Reserves {first}–{last}.</FieldDescription> : null}
            <Field>
              <FieldLabel htmlFor="book-direction">Direction *</FieldLabel>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issued">Issued — cheques we write</SelectItem>
                      <SelectItem value="received">Received — cheques we take in</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createBook.isPending}>
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 04.12 · Cheque books — the number ranges reserved on each bank account. */
function ChequeBooksPage() {
  const { data, isError, refetch } = useChequeBooks()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const active = data?.filter((book) => book.remaining > 0).length

  return (
    <>
      <FinancePageHeader
        title="Cheque books"
        figure={data ? <HeaderFigure label="Active books">{active}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            Register book
          </Button>
        }
      />
      <FinancePageBody>
        <FinanceAlert tone="info">
          Each cheque book reserves a continuous number range against a bank treasury. Leaves are consumed in
          order, so a missing number is always visible as a gap rather than reused.
        </FinanceAlert>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <FinanceTable caption="Cheque books" columns={COLUMNS} rows={data ?? []} loading={!data} getRowId={(row) => row.id} />
        )}
      </FinancePageBody>
      <RegisterBookDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { ChequeBooksPage }
