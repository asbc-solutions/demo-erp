"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { KeyValueList } from "../../../components/shared/key-value-list"
import { useFinanceAccounts } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { DEFAULT_COUNTER_ACCOUNT } from "../../lib/constants/reconciliation"
import { useReconciliationActions } from "../../lib/mutations/banking"
import { counterAccountSchema, type CounterAccountFormValues } from "../../lib/schema/banking"
import type { StatementLine } from "../../lib/types/banking"

/** Cash and bank accounts: the bank side is already fixed by the statement. */
const TREASURY_ACCOUNT = /^110[12]/

type CreateEntryDialogProps = {
  treasuryId: string
  line: StatementLine | null
  onOpenChange: (open: boolean) => void
}

/** Create an entry from this line? — a real posting, matched to the line straight away. */
function CreateEntryDialog({ treasuryId, line, onOpenChange }: CreateEntryDialogProps) {
  const { data: accounts = [] } = useFinanceAccounts()
  const { createEntry } = useReconciliationActions(treasuryId)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CounterAccountFormValues>({
    resolver: zodResolver(counterAccountSchema),
    defaultValues: { counter_account: "" },
  })

  React.useEffect(() => {
    if (line) reset({ counter_account: line.amount >= 0 ? DEFAULT_COUNTER_ACCOUNT.in : DEFAULT_COUNTER_ACCOUNT.out })
  }, [line, reset])

  const options = accounts.filter((account) => !TREASURY_ACCOUNT.test(account.code))

  const submit = ({ counter_account }: CounterAccountFormValues) => {
    if (!line) return
    createEntry.mutate(
      { lineId: line.id, counterAccount: counter_account },
      {
        onSuccess: (result) => {
          toast.success(`${result.entry} was posted and matched to ${line.reference}.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The entry could not be created. Try again.")),
      },
    )
  }

  return (
    <Dialog open={Boolean(line)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>Create an entry from this line?</DialogTitle>
            <DialogDescription>
              This posts a balanced entry: the bank side comes from the statement line, the other side from
              the account you choose. The new entry is matched to the line straight away. It is a real
              posting, so it is reversible but not deletable.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {line ? (
              <KeyValueList
                items={[
                  { term: "Date", value: formatDate(line.date) },
                  { term: "Amount", value: formatAmount(line.amount) },
                  { term: "Description", value: line.description },
                  { term: "Source", value: <span className="font-mono">{line.reference}</span> },
                ]}
              />
            ) : null}
            <p className="text-content-secondary text-[13px] leading-5">
              This statement line has no match in the ledger, so it needs an entry. The bank side is fixed by
              the statement; choose the account for the other side.
            </p>
            <Field>
              <FieldLabel htmlFor="counter-account">Counter account</FieldLabel>
              <Controller
                control={control}
                name="counter_account"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="counter-account" aria-invalid={Boolean(errors.counter_account)}>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((account) => (
                        <SelectItem key={account.code} value={account.code}>
                          <span className="font-mono">{account.code}</span> {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.counter_account ? <FieldError>{errors.counter_account.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createEntry.isPending}>
              Create and match
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateEntryDialog }
