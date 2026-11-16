"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
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
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Switch } from "@/src/shared/components/ui/switch"

import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { formatPeriod } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { RULE_STATUS } from "../../lib/constants/planning"
import { useRunAllocation, useSaveAllocationRule, useToggleAllocationRule } from "../../lib/mutations/planning"
import { useAllocationRules } from "../../lib/queries/planning"
import type { AllocationRule } from "../../lib/types/planning"
import { SESSION_NOTE } from "../budgets/budgets-page"

const ruleSchema = z.object({
  name: z.string().trim().min(1, "Name the rule."),
  source_accounts: z.string().trim().min(1, "Add at least one source account."),
  basis: z.string().min(1, "Choose the basis."),
  targets: z
    .string()
    .trim()
    .min(1, "Add the target cost centers.")
    .refine((value) => {
      const weights = value.split(",").map((pair) => Number(pair.split(":")[1]))
      return weights.every((weight) => weight > 0) && Math.round(weights.reduce((sum, weight) => sum + weight, 0) * 100) === 10000
    }, "Weights must total 100."),
  active: z.boolean(),
})
type RuleValues = z.infer<typeof ruleSchema>

function toValues(rule: AllocationRule | null): RuleValues {
  if (!rule) return { name: "", source_accounts: "", basis: "headcount", targets: "", active: true }
  return {
    name: rule.name,
    source_accounts: rule.source_accounts.map((row) => row.code).join(", "),
    basis: rule.basis,
    targets: rule.targets.map((row) => `${row.cost_center_id}:${row.weight}`).join(", "),
    active: rule.active,
  }
}

function RuleDialog({
  rule,
  open,
  onOpenChange,
  bases,
}: {
  rule: AllocationRule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  bases: { value: string; label: string }[]
}) {
  const save = useSaveAllocationRule()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RuleValues>({ resolver: zodResolver(ruleSchema), defaultValues: toValues(rule) })
  React.useEffect(() => {
    if (open) reset(toValues(rule))
  }, [open, reset, rule])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            save.mutate(
              { id: rule?.id ?? null, input: values },
              {
                onSuccess: (saved) => {
                  toast.success(`${saved.code} · ${saved.name} saved.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The rule could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{rule ? `Edit · ${rule.name}` : "New rule"}</DialogTitle>
            <DialogDescription>An allocation rule redistributes a shared cost onto operating cost centers during the close. Weights must total 100%.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="rule-name">Name *</FieldLabel>
              <Input id="rule-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="rule-sources">Source accounts *</FieldLabel>
                <Input id="rule-sources" className="font-mono text-xs" placeholder="620101, 620102" aria-invalid={Boolean(errors.source_accounts)} {...register("source_accounts")} />
                {errors.source_accounts ? <FieldError>{errors.source_accounts.message}</FieldError> : <FieldDescription>Expense account codes, comma separated.</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-basis">Basis *</FieldLabel>
                <Controller
                  control={control}
                  name="basis"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="rule-basis">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map((basis) => (
                          <SelectItem key={basis.value} value={basis.value}>
                            {basis.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="rule-targets">Targets *</FieldLabel>
              <Input id="rule-targets" className="font-mono text-xs" placeholder="CC-110:20, CC-210:35, CC-220:45" aria-invalid={Boolean(errors.targets)} {...register("targets")} />
              {errors.targets ? <FieldError>{errors.targets.message}</FieldError> : <FieldDescription>Cost center and weight pairs, e.g. CC-110:20. Weights must total 100.</FieldDescription>}
            </Field>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center gap-2.5">
                  <Switch id="rule-active" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="rule-active" className="text-content-secondary text-[13px] font-normal">
                    Include this rule in the next allocation run
                  </Label>
                </div>
              )}
            />
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RuleCard({ rule, onEdit }: { rule: AllocationRule; onEdit: () => void }) {
  const toggle = useToggleAllocationRule()
  const status = RULE_STATUS[rule.status]
  return (
    <article
      data-slot="allocation-rule"
      aria-labelledby={`rule-${rule.id}`}
      className="border-stroke-default bg-surface-white flex flex-col gap-3 rounded-xl border px-5 py-4"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-content-tertiary font-mono text-xs">{rule.code}</span>
        <h3 id={`rule-${rule.id}`} className="text-content-primary text-sm leading-5 font-semibold">
          {rule.name}
        </h3>
        <StatusPill status={`rule-${rule.status}`} label={status.label} tone={status.tone} />
        <StatusPill status="prepared" label={rule.basis_label} />
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(rule.id, {
                onSuccess: (saved) => toast.success(saved.active ? `${saved.code} is back in the next run.` : `${saved.code} is paused.`),
                onError: (error) => toast.error(errorMessage(error, "The rule could not be changed. Try again.")),
              })
            }
          >
            {rule.active ? "Pause" : "Resume"}
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 text-[13px] leading-5 md:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-content-tertiary">Source accounts</span>
          <span className="text-content-primary">
            {rule.source_accounts.map((account, index) => (
              <React.Fragment key={account.code}>
                {index ? " · " : null}
                <span className="font-mono text-xs">{account.code}</span> {account.name}
              </React.Fragment>
            ))}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-content-tertiary">Weights total {rule.weights_total}%</span>
          <span className="text-content-primary">
            {rule.targets.length} {rule.targets.length === 1 ? "target" : "targets"}
            {rule.last_run ? (
              <>
                {" "}
                · last run {formatPeriod(rule.last_run.period)}, {formatAmount(rule.last_run.amount)} EGP in{" "}
                <DocNumber href={`/finance/journals/${rule.last_run.entry}`}>{rule.last_run.entry}</DocNumber>
              </>
            ) : null}
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label={`${rule.name} targets`}>
        {rule.targets.map((target) => (
          <li key={target.cost_center_id}>
            <Link
              href={`/finance/cost-centers/${target.cost_center_id}`}
              className="border-stroke-default bg-surface-hover text-content-primary hover:border-stroke-input inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] leading-5"
            >
              {target.name}
              <span className="text-content-secondary tabular-nums">{target.weight}%</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}

/** 09.07 · Allocation rules — how shared costs are spread onto operating cost centers at close. */
function AllocationRulesPage() {
  const { data, isError, refetch } = useAllocationRules()
  const run = useRunAllocation()
  const [editing, setEditing] = React.useState<AllocationRule | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [confirmRun, setConfirmRun] = React.useState(false)

  const openRule = (rule: AllocationRule | null) => {
    setEditing(rule)
    setDialogOpen(true)
  }

  return (
    <>
      <FinancePageHeader
        title="Allocation rules"
        figure={data ? <HeaderFigure label="Configured rules">{data.items.length}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" disabled={!data?.pending} onClick={() => setConfirmRun(true)}>
              Run allocation
            </Button>
            <Button variant="primary" onClick={() => openRule(null)}>
              <Plus aria-hidden />
              New rule
            </Button>
          </>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Active rules" value={data.active} caption={data.pending ? `${data.pending} not yet run for ${formatPeriod(data.period)}` : `All run for ${formatPeriod(data.period)}`} />
              <KpiCard layout="bar" accent="teal" label="Paused" value={data.paused} />
              <KpiCard layout="bar" accent="amber" label="Target cost centers" value={data.targets} caption="Across all rules" />
            </div>
            <div className="flex flex-col gap-3">
              {data.items.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onEdit={() => openRule(rule)} />
              ))}
            </div>
            <p className="text-content-secondary text-[13px] leading-5">
              Allocation rules redistribute shared costs onto operating cost centers during the period close, using the basis
              you choose. They post as automatic entries you can trace back to this rule.
            </p>
            <RuleDialog rule={editing} open={dialogOpen} onOpenChange={setDialogOpen} bases={data.bases} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmRun} onOpenChange={setConfirmRun}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run allocation for {data ? formatPeriod(data.period) : "the period"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Each active rule spreads its source accounts across the target cost centers by the weights shown, posting one
              balanced entry dated at period end. Rules that already ran this period are skipped, so nothing is allocated
              twice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                run.mutate(undefined, {
                  onSuccess: (result) =>
                    toast.success(
                      `${result.posted.length} ${result.posted.length === 1 ? "rule" : "rules"} posted, ${formatAmount(result.total)} EGP allocated (${result.posted.map((row) => row.entry).join(", ")}).`,
                    ),
                  onError: (error) => toast.error(errorMessage(error, "The allocation could not run. Try again.")),
                })
              }
            >
              Run allocation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { AllocationRulesPage }
