"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronRight, Plus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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

import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount } from "../../../lib/utils/money"
import { useCreatePolicy } from "../../lib/mutations/configuration"
import { useApprovalPolicies } from "../../lib/queries/configuration"
import type { ApprovalPolicy } from "../../lib/types/configuration"

const SESSION_NOTE =
  "Saved records live in this session only. The seeded data is never modified, so a reload returns the prototype to its known state."

const policySchema = z.object({
  name: z.string().trim().min(1, "Name the policy."),
  type: z.string().min(1, "Choose what the policy applies to."),
  threshold: z
    .string()
    .trim()
    .refine((value) => value !== "" && Number(value) >= 0, "Enter an amount, or 0 for any amount."),
  approvers: z.enum(["1", "2", "3"]),
})
type PolicyValues = z.infer<typeof policySchema>

const EMPTY: PolicyValues = { name: "", type: "bill", threshold: "50000", approvers: "2" }

function NewPolicyDialog({ open, onOpenChange, types }: { open: boolean; onOpenChange: (open: boolean) => void; types: { value: string; label: string }[] }) {
  const create = useCreatePolicy()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PolicyValues>({ resolver: zodResolver(policySchema), defaultValues: EMPTY })
  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(
              { name: values.name, type: values.type, threshold: Number(values.threshold), approvers: Number(values.approvers) },
              {
                onSuccess: (policy) => {
                  toast.success(`${policy.name} is active: ${policy.approvers.join(" → ")}.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The policy could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>New policy</DialogTitle>
            <DialogDescription>
              An approval policy decides how many approvers a document needs. Saving adds the policy; documents already in flight
              keep the policy they started under.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="policy-name">Name *</FieldLabel>
              <Input id="policy-name" placeholder="e.g. Supplier bills over EGP 50k" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="policy-type">Type *</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="policy-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="policy-approvers">Approvers required *</FieldLabel>
                <Controller
                  control={control}
                  name="approvers"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="policy-approvers">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3"].map((count) => (
                          <SelectItem key={count} value={count}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="policy-threshold">Threshold (EGP) *</FieldLabel>
              <Input id="policy-threshold" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.threshold)} {...register("threshold")} />
              {errors.threshold ? <FieldError>{errors.threshold.message}</FieldError> : <FieldDescription>Documents above this amount need the approvers. 0 means any amount.</FieldDescription>}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PolicyCard({ policy }: { policy: ApprovalPolicy }) {
  return (
    <article data-slot="approval-policy" className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border px-5 py-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-content-primary text-sm leading-5 font-semibold">{policy.name}</h3>
        <StatusPill status="prepared" label={policy.type_label} />
        <span className="text-content-secondary ms-auto text-[13px] tabular-nums">
          Threshold {policy.threshold === null ? "Any" : formatAmount(policy.threshold).replace(/\.00$/, "")}
        </span>
      </header>
      <ol className="flex flex-wrap items-center gap-1.5" aria-label="Approvers in order">
        {policy.approvers.map((approver, index) => (
          <li key={approver} className="flex items-center gap-1.5">
            {index ? <ChevronRight className="text-content-tertiary size-3.5" aria-hidden /> : null}
            <span className="border-stroke-default bg-surface-hover text-content-primary rounded-md border px-2.5 py-1 text-[13px] leading-5">{approver}</span>
          </li>
        ))}
      </ol>
      {policy.waiting !== null ? (
        <p className="text-content-tertiary text-xs leading-4">
          {policy.waiting ? `${policy.waiting} ${policy.waiting === 1 ? "document is" : "documents are"} waiting under this policy.` : "Nothing is waiting under this policy."}
        </p>
      ) : null}
    </article>
  )
}

/** 11.08 · Approval policies — who has to approve what, above which amount. */
function ApprovalPoliciesPage() {
  const { data, isError, refetch } = useApprovalPolicies()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  return (
    <>
      <FinancePageHeader
        title="Approval policies"
        figure={data ? <HeaderFigure label="Active policies">{data.active}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New policy
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {data.items.map((policy) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
            <NewPolicyDialog open={dialogOpen} onOpenChange={setDialogOpen} types={data.types} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { ApprovalPoliciesPage }
