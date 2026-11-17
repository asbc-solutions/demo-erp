"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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

import { useStatusLabel } from "../../../components/shared/status-pill"
import { useFinanceContacts, useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { useCreateCheque } from "../../lib/mutations/banking"
import { chequeSchema, type BankingErrorKey, type ChequeFormValues } from "../../lib/schema/banking"
import type { ChequeDirection } from "../../lib/types/banking"

const TODAY = "2026-03-31"

/** Per direction: the contact kind, and `FinanceBanking` keys for its copy. */
export const CHEQUE_COPY = {
  received: { title: "recordCheque", party: "drawer", contactKind: "customer", partyHint: "drawerHint" },
  issued: { title: "writeCheque", party: "payee", contactKind: "supplier", partyHint: "payeeHint" },
} as const

type ChequeDialogProps = {
  direction: ChequeDirection
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Next free leaf of an issued cheque book, suggested as the number. */
  nextNumber?: number | null
}

/** Record cheque / Write cheque — registers it at its opening status; nothing posts until it clears. */
function ChequeDialog({ direction, open, onOpenChange, nextNumber }: ChequeDialogProps) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("FinanceShared")
  const { formatDate } = useFinanceDateFormat()
  const statusLabel = useStatusLabel()
  const errorText = (message?: string) => (message ? t(message as BankingErrorKey) : null)
  const copy = CHEQUE_COPY[direction]
  const { data: contacts = [] } = useFinanceContacts(copy.contactKind)
  const { data: treasuries = [] } = useFinanceTreasuries()
  const banks = treasuries.filter((row) => row.kind === "bank")
  const createCheque = useCreateCheque()

  const empty = React.useMemo<ChequeFormValues>(
    () => ({
      number: direction === "issued" && nextNumber ? String(nextNumber) : "",
      contact_id: "",
      bank: direction === "issued" ? "CIB" : "",
      amount: "",
      issue_date: TODAY,
      due_date: TODAY,
      treasury_id: "bnk-cib-0021",
    }),
    [direction, nextNumber],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChequeFormValues>({ resolver: zodResolver(chequeSchema), defaultValues: empty })

  React.useEffect(() => {
    if (open) reset(empty)
  }, [open, reset, empty])

  const [issueDate, dueDate] = useWatch({ control, name: ["issue_date", "due_date"] })

  const submit = (values: ChequeFormValues) =>
    createCheque.mutate(
      { ...values, direction, amount: Number(values.amount) },
      {
        onSuccess: (cheque) => {
          toast.success(t("chequeSaved", { number: cheque.number, status: statusLabel(cheque.status) }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("chequeSaveFailed"))),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t(copy.title)}</DialogTitle>
            <DialogDescription>{t("chequeDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cheque-number">{t("colChequeNo")} *</FieldLabel>
                <Input id="cheque-number" inputMode="numeric" className="font-mono" aria-invalid={Boolean(errors.number)} {...register("number")} />
                {errors.number ? <FieldError>{errorText(errors.number.message)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-party">{t(copy.party)} *</FieldLabel>
                <Controller
                  control={control}
                  name="contact_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cheque-party" aria-invalid={Boolean(errors.contact_id)}>
                        <SelectValue placeholder={t(copy.partyHint)} />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.contact_id ? <FieldError>{errorText(errors.contact_id.message)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-bank">{t("colBank")} *</FieldLabel>
                <Input id="cheque-bank" placeholder={t("bankPlaceholder")} aria-invalid={Boolean(errors.bank)} {...register("bank")} />
                {errors.bank ? <FieldError>{errorText(errors.bank.message)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-amount">{t("colAmount")} *</FieldLabel>
                <div className="relative">
                  <Input
                    id="cheque-amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pe-14 text-end tabular-nums"
                    aria-invalid={Boolean(errors.amount)}
                    {...register("amount")}
                  />
                  <span className="text-content-tertiary pointer-events-none absolute top-1/2 inset-e-3 -translate-y-1/2 text-[13px]">
                    EGP
                  </span>
                </div>
                {errors.amount ? <FieldError>{errorText(errors.amount.message)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-issued">{t("issueDate")} *</FieldLabel>
                <Input id="cheque-issued" type="date" {...register("issue_date")} />
                <FieldDescription>{issueDate ? formatDate(issueDate) : "—"}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="cheque-due">{t("dueDate")} *</FieldLabel>
                <Input id="cheque-due" type="date" aria-invalid={Boolean(errors.due_date)} {...register("due_date")} />
                {errors.due_date ? (
                  <FieldError>{errorText(errors.due_date.message)}</FieldError>
                ) : (
                  <FieldDescription>{dueDate ? formatDate(dueDate) : "—"}</FieldDescription>
                )}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="cheque-treasury">{t("treasury")} *</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cheque-treasury">
                      <SelectValue placeholder={t("errorBookTreasury")} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">{tShared("sessionOnlyNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={createCheque.isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { ChequeDialog }
