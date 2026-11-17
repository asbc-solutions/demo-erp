"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { chequeBookSchema, type BankingErrorKey, type ChequeBookFormValues } from "../../lib/schema/banking"
import type { ChequeBook } from "../../lib/types/banking"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

function bookColumns(t: BankingT): FinanceColumn<ChequeBook>[] {
  return [
    { id: "book", header: t("colBook"), cell: (row) => <DocNumber>{row.code}</DocNumber> },
    { id: "bank", header: t("colBank"), cell: (row) => row.bank },
    {
      id: "range",
      header: t("colNumberRange"),
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.first}–{row.last}
        </span>
      ),
    },
    {
      id: "direction",
      header: t("colDirection"),
      cell: (row) => (row.direction === "received" ? t("received") : t("colIssued")),
    },
    {
      id: "remaining",
      header: t("colRemaining"),
      align: "end",
      cell: (row) => (
        <span className="flex items-center justify-end gap-2 tabular-nums">
          {row.remaining === 0 ? <StatusPill status="closed" label={t("usedUp")} /> : null}
          {row.remaining} / {row.size}
        </span>
      ),
    },
    {
      id: "next",
      header: t("colNextLeaf"),
      cell: (row) => (row.next_number ? <span className="font-mono text-xs">{row.next_number}</span> : "—"),
    },
  ]
}

const EMPTY: ChequeBookFormValues = { treasury_id: "", first: "", leaves: "25", direction: "issued" }

function RegisterBookDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const errorText = (message?: string) => (message ? t(message as BankingErrorKey) : null)
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
          toast.success(t("bookRegistered", { code: book.code, first: book.first, last: book.last, bank: book.bank }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("bookRegisterFailed"))),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("registerBook")}</DialogTitle>
            <DialogDescription>{t("registerBookDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="book-treasury">{t("bankAccount")} *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-treasury" aria-invalid={Boolean(errors.treasury_id)}>
                      <SelectValue placeholder={t("errorBookTreasury")} />
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
              {errors.treasury_id ? <FieldError>{errorText(errors.treasury_id.message)}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="book-first">{t("firstNumber")} *</FieldLabel>
                <Input id="book-first" inputMode="numeric" className="font-mono" aria-invalid={Boolean(errors.first)} {...register("first")} />
                {errors.first ? <FieldError>{errorText(errors.first.message)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="book-leaves">{t("leaves")} *</FieldLabel>
                <Input id="book-leaves" inputMode="numeric" aria-invalid={Boolean(errors.leaves)} {...register("leaves")} />
                {errors.leaves ? <FieldError>{errorText(errors.leaves.message)}</FieldError> : null}
              </Field>
            </div>
            {last ? <FieldDescription>{t("reservesRange", { first, last })}</FieldDescription> : null}
            <Field>
              <FieldLabel htmlFor="book-direction">{t("colDirection")} *</FieldLabel>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="book-direction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issued">{t("directionIssued")}</SelectItem>
                      <SelectItem value="received">{t("directionReceived")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={createBook.isPending}>
              {t("register")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 04.12 · Cheque books — the number ranges reserved on each bank account. */
function ChequeBooksPage() {
  const t = useTranslations("FinanceBanking")
  const { data, isError, refetch } = useChequeBooks()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const active = data?.filter((book) => book.remaining > 0).length

  return (
    <>
      <FinancePageHeader
        title={t("chequeBooks")}
        figure={data ? <HeaderFigure label={t("activeBooks")}>{active}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("registerBook")}
          </Button>
        }
      />
      <FinancePageBody>
        <FinanceAlert tone="info">{t("chequeBooksNote")}</FinanceAlert>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : (
          <FinanceTable
            caption={t("chequeBooks")}
            columns={bookColumns(t)}
            rows={data ?? []}
            loading={!data}
            getRowId={(row) => row.id}
          />
        )}
      </FinancePageBody>
      <RegisterBookDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { ChequeBooksPage }
