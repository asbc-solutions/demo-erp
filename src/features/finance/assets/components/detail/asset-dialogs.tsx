"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useBankingOverview } from "../../../banking/lib/queries/banking"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { useCostCenters } from "../../../planning/lib/queries/planning"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount } from "../../../lib/utils/money"
import { useDisposeAsset, useEditAsset, useWriteOffAsset } from "../../lib/mutations/assets"
import type { Asset, AssetsMessageKey } from "../../lib/types/assets"

type DialogProps = { asset: Asset; open: boolean; onOpenChange: (open: boolean) => void }

/** Messages are `FinanceAssets` keys, translated where the error is rendered. */
const msg = (key: AssetsMessageKey) => key

const amountText = (message: AssetsMessageKey) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), message)

// ─── Dispose ─────────────────────────────────────────────────────────────────

const disposeSchema = z
  .object({
    proceeds: amountText("errProceeds"),
    treasury_id: z.string(),
    date: z.string().min(1, msg("errDisposalDate")),
    reason: z.string().trim(),
  })
  .refine((values) => Number(values.proceeds || 0) === 0 || values.treasury_id !== "", {
    message: msg("errProceedsTreasury"),
    path: ["treasury_id"],
  })
type DisposeValues = z.infer<typeof disposeSchema>

function DisposeDialog({ asset, open, onOpenChange }: DialogProps) {
  const t = useTranslations("FinanceAssets")
  const dispose = useDisposeAsset()
  const { data: banking } = useBankingOverview()
  const treasuries = banking?.treasuries.filter((row) => row.currency === "EGP") ?? []
  const empty: DisposeValues = { proceeds: "", treasury_id: "", date: "2026-03-31", reason: "" }
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisposeValues>({ resolver: zodResolver(disposeSchema), defaultValues: empty })
  React.useEffect(() => {
    if (open) reset({ proceeds: "", treasury_id: "", date: "2026-03-31", reason: "" })
  }, [open, reset])
  const proceeds = Number(useWatch({ control, name: "proceeds" }) || 0)
  const result = proceeds - asset.nbv

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            dispose.mutate(
              {
                id: asset.id,
                proceeds: Number(values.proceeds || 0),
                treasury_id: values.treasury_id || null,
                date: values.date,
                reason: values.reason,
              },
              {
                onSuccess: (retired) => {
                  toast.success(t("toastDisposed", { number: retired.number, entry: retired.entry }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorDispose"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("disposeTitle")}</DialogTitle>
            <DialogDescription>{t("disposeDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dispose-proceeds">{t("proceedsEgp")}</FieldLabel>
                <Input
                  id="dispose-proceeds"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.proceeds)}
                  {...register("proceeds")}
                />
                {errors.proceeds ? <FieldError>{t(errors.proceeds.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="dispose-date">{t("disposalDateRequired")}</FieldLabel>
                <Input id="dispose-date" type="date" aria-invalid={Boolean(errors.date)} {...register("date")} />
                {errors.date ? <FieldError>{t(errors.date.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="dispose-treasury">{t("paidInto")}</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={proceeds === 0}>
                    <SelectTrigger id="dispose-treasury" aria-invalid={Boolean(errors.treasury_id)}>
                      <SelectValue placeholder={proceeds === 0 ? t("noProceeds") : t("chooseTreasury")} />
                    </SelectTrigger>
                    <SelectContent>
                      {treasuries.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.treasury_id ? <FieldError>{t(errors.treasury_id.message as AssetsMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dispose-reason">{t("note")}</FieldLabel>
              <Input id="dispose-reason" placeholder={t("disposeNotePlaceholder")} {...register("reason")} />
            </Field>
            <FinanceAlert tone={result < 0 ? "warning" : "info"}>
              {t("bookValueIs", { amount: formatAmount(asset.nbv) })}{" "}
              {result === 0
                ? t("noGainOrLoss")
                : result > 0
                  ? t("gainOnDisposal", { amount: formatAmount(result) })
                  : t("lossOnDisposal", { amount: formatAmount(-result) })}
            </FinanceAlert>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={dispose.isPending}>
              {t("recordDisposal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Write off ───────────────────────────────────────────────────────────────

const writeOffSchema = z.object({
  reason: z.string().trim().min(1, msg("errWriteOffReason")),
})
type WriteOffValues = z.infer<typeof writeOffSchema>

function WriteOffDialog({ asset, open, onOpenChange }: DialogProps) {
  const t = useTranslations("FinanceAssets")
  const writeOff = useWriteOffAsset()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WriteOffValues>({ resolver: zodResolver(writeOffSchema), defaultValues: { reason: "" } })
  React.useEffect(() => {
    if (open) reset({ reason: "" })
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            writeOff.mutate(
              { id: asset.id, reason: values.reason },
              {
                onSuccess: (retired) => {
                  toast.success(t("toastWrittenOff", { number: retired.number, entry: retired.entry }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorWriteOff"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("writeOffTitle")}</DialogTitle>
            <DialogDescription>{t("writeOffDescription", { amount: formatAmount(asset.nbv) })}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="write-off-reason">{t("reasonRequired")}</FieldLabel>
              <Textarea id="write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{t(errors.reason.message as AssetsMessageKey)}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={writeOff.isPending}>
              {t("writeOffAsset")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit ────────────────────────────────────────────────────────────────────

function editSchema(cost: number) {
  return z.object({
    name: z.string().trim().min(1, msg("errAssetName")),
    cost_center_id: z.string().min(1, msg("errCostCenter")),
    life: z
      .string()
      .trim()
      .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, msg("errUsefulLife")),
    salvage: z
      .string()
      .trim()
      .refine((value) => value !== "" && Number(value) >= 0 && Number(value) < cost, msg("errSalvage")),
  })
}
type EditValues = z.infer<ReturnType<typeof editSchema>>

function EditAssetDialog({ asset, open, onOpenChange }: DialogProps) {
  const t = useTranslations("FinanceAssets")
  const edit = useEditAsset()
  const { data: centers } = useCostCenters()
  const schema = React.useMemo(() => editSchema(asset.cost), [asset.cost])
  const defaults = React.useCallback(
    (): EditValues => ({ name: asset.name, cost_center_id: asset.cost_center_id, life: String(asset.life), salvage: String(asset.salvage) }),
    [asset],
  )
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditValues>({ resolver: zodResolver(schema), defaultValues: defaults() })
  React.useEffect(() => {
    if (open) reset(defaults())
  }, [open, reset, defaults])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            edit.mutate(
              { id: asset.id, input: { name: values.name, cost_center_id: values.cost_center_id, life: Number(values.life), salvage: Number(values.salvage) } },
              {
                onSuccess: (saved) => {
                  toast.success(t("toastAssetSaved", { number: saved.number, amount: formatAmount(saved.monthly_charge) }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveAsset"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("editAssetTitle", { number: asset.number })}</DialogTitle>
            <DialogDescription>{t("editAssetDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="asset-edit-name">{t("nameRequired")}</FieldLabel>
              <Input id="asset-edit-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as AssetsMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-edit-center">{t("costCenterRequired")}</FieldLabel>
              <Controller
                control={control}
                name="cost_center_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="asset-edit-center">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {centers?.items.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.code} · {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="asset-edit-life">{t("usefulLifeRequired")}</FieldLabel>
                <Input id="asset-edit-life" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.life)} {...register("life")} />
                {errors.life ? (
                  <FieldError>{t(errors.life.message as AssetsMessageKey)}</FieldError>
                ) : (
                  <FieldDescription>{t("usefulLifeHint")}</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-edit-salvage">{t("salvageEgpRequired")}</FieldLabel>
                <Input id="asset-edit-salvage" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.salvage)} {...register("salvage")} />
                {errors.salvage ? <FieldError>{t(errors.salvage.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{t("sessionNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={edit.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { DisposeDialog, EditAssetDialog, WriteOffDialog }
