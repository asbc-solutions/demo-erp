"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { RULE_STATUS } from "../../lib/constants/planning"
import { useRunAllocation, useSaveAllocationRule, useToggleAllocationRule } from "../../lib/mutations/planning"
import { useAllocationRules } from "../../lib/queries/planning"
import type { AllocationRule, PlanningMessageKey } from "../../lib/types/planning"

/** Messages are `FinancePlanning` keys, translated where the error is rendered. */
const msg = (key: PlanningMessageKey) => key

const ruleSchema = z.object({
  name: z.string().trim().min(1, msg("errRuleName")),
  source_accounts: z.string().trim().min(1, msg("errSourceAccounts")),
  basis: z.string().min(1, msg("errBasis")),
  targets: z
    .string()
    .trim()
    .min(1, msg("errTargets"))
    .refine((value) => {
      const weights = value.split(",").map((pair) => Number(pair.split(":")[1]))
      return weights.every((weight) => weight > 0) && Math.round(weights.reduce((sum, weight) => sum + weight, 0) * 100) === 10000
    }, msg("errWeights")),
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
  const t = useTranslations("FinancePlanning")
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
                  toast.success(t("toastRuleSaved", { code: saved.code, name: saved.name }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveRule"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{rule ? t("editRule", { name: rule.name }) : t("newRule")}</DialogTitle>
            <DialogDescription>{t("ruleDialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="rule-name">{t("nameRequired")}</FieldLabel>
              <Input id="rule-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="rule-sources">{t("sourceAccountsRequired")}</FieldLabel>
                <Input id="rule-sources" className="font-mono text-xs" placeholder="620101, 620102" aria-invalid={Boolean(errors.source_accounts)} {...register("source_accounts")} />
                {errors.source_accounts ? <FieldError>{t(errors.source_accounts.message as PlanningMessageKey)}</FieldError> : <FieldDescription>{t("sourceAccountsHint")}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-basis">{t("basisRequired")}</FieldLabel>
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
              <FieldLabel htmlFor="rule-targets">{t("targetsRequired")}</FieldLabel>
              <Input id="rule-targets" className="font-mono text-xs" placeholder="CC-110:20, CC-210:35, CC-220:45" aria-invalid={Boolean(errors.targets)} {...register("targets")} />
              {errors.targets ? <FieldError>{t(errors.targets.message as PlanningMessageKey)}</FieldError> : <FieldDescription>{t("targetsHint")}</FieldDescription>}
            </Field>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <div className="flex items-center gap-2.5">
                  <Switch id="rule-active" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="rule-active" className="text-content-secondary text-[13px] font-normal">
                    {t("includeInNextRun")}
                  </Label>
                </div>
              )}
            />
            <p className="text-content-tertiary text-[13px] leading-5">{t("sessionNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RuleCard({ rule, onEdit }: { rule: AllocationRule; onEdit: () => void }) {
  const t = useTranslations("FinancePlanning")
  const { formatPeriod } = useFinanceDateFormat()
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
        <StatusPill status={`rule-${rule.status}`} label={t(status.labelKey)} tone={status.tone} />
        <StatusPill status="prepared" label={rule.basis_label} />
        <div className="ms-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(rule.id, {
                onSuccess: (saved) => toast.success(saved.active ? t("toastRuleResumed", { code: saved.code }) : t("toastRulePaused", { code: saved.code })),
                onError: (error) => toast.error(errorMessage(error, t("errorChangeRule"))),
              })
            }
          >
            {rule.active ? t("pause") : t("resume")}
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>
            {t("edit")}
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 text-[13px] leading-5 md:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-content-tertiary">{t("sourceAccounts")}</span>
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
          <span className="text-content-tertiary">{t("weightsTotal", { total: rule.weights_total })}</span>
          <span className="text-content-primary">
            {t("targetsCount", { count: rule.targets.length })}
            {rule.last_run ? (
              <>
                {" "}
                ·{" "}
                {t.rich("lastRun", {
                  period: formatPeriod(rule.last_run.period),
                  amount: formatAmount(rule.last_run.amount),
                  entry: rule.last_run.entry,
                  doc: (chunks) => <DocNumber href={`/finance/journals/${rule.last_run?.entry}`}>{chunks}</DocNumber>,
                })}
              </>
            ) : null}
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label={t("ruleTargets", { name: rule.name })}>
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
  const t = useTranslations("FinancePlanning")
  const { formatPeriod } = useFinanceDateFormat()
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
        title={t("allocationRules")}
        figure={data ? <HeaderFigure label={t("configuredRules")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" disabled={!data?.pending} onClick={() => setConfirmRun(true)}>
              {t("runAllocation")}
            </Button>
            <Button variant="primary" onClick={() => openRule(null)}>
              <Plus aria-hidden />
              {t("newRule")}
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
              <KpiCard layout="bar" accent="indigo" label={t("activeRules")} value={data.active} caption={data.pending ? t("notYetRun", { count: data.pending, period: formatPeriod(data.period) }) : t("allRun", { period: formatPeriod(data.period) })} />
              <KpiCard layout="bar" accent="teal" label={t("paused")} value={data.paused} />
              <KpiCard layout="bar" accent="amber" label={t("targetCostCenters")} value={data.targets} caption={t("acrossAllRules")} />
            </div>
            <div className="flex flex-col gap-3">
              {data.items.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onEdit={() => openRule(rule)} />
              ))}
            </div>
            <p className="text-content-secondary text-[13px] leading-5">
              {t("allocationInfo")}
            </p>
            <RuleDialog rule={editing} open={dialogOpen} onOpenChange={setDialogOpen} bases={data.bases} />
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirmRun} onOpenChange={setConfirmRun}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{data ? t("runAllocationTitle", { period: formatPeriod(data.period) }) : t("runAllocationTitleGeneric")}</AlertDialogTitle>
            <AlertDialogDescription>{t("runAllocationDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "primary" })}
              onClick={() =>
                run.mutate(undefined, {
                  onSuccess: (result) =>
                    toast.success(
                      t("toastAllocationRun", {
                        count: result.posted.length,
                        amount: formatAmount(result.total),
                        entries: result.posted.map((row) => row.entry).join(", "),
                      }),
                    ),
                  onError: (error) => toast.error(errorMessage(error, t("errorRunAllocation"))),
                })
              }
            >
              {t("runAllocation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { AllocationRulesPage }
