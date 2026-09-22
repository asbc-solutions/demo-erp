"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import type { Asset } from "../../lib/types/assets"

type DialogProps = { asset: Asset; open: boolean; onOpenChange: (open: boolean) => void }

const SESSION_NOTE =
  "Saved records live in this session only. The seeded data is never modified, so a reload returns the prototype to its known state."

const amountText = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), `${label} must be zero or more.`)

// ─── Dispose ─────────────────────────────────────────────────────────────────

const disposeSchema = z
  .object({
    proceeds: amountText("Proceeds"),
    treasury_id: z.string(),
    date: z.string().min(1, "Enter the disposal date."),
    reason: z.string().trim(),
  })
  .refine((values) => Number(values.proceeds || 0) === 0 || values.treasury_id !== "", {
    message: "Choose the treasury the proceeds were paid into.",
    path: ["treasury_id"],
  })
type DisposeValues = z.infer<typeof disposeSchema>

function DisposeDialog({ asset, open, onOpenChange }: DialogProps) {
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
                  toast.success(`${retired.number} is disposed. Entry ${retired.entry} posted.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The disposal could not be recorded. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>Dispose of this asset?</DialogTitle>
            <DialogDescription>
              Disposal removes the asset from service, clears its cost and accumulated depreciation, and books the gain or
              loss against the proceeds. The asset stops depreciating from the disposal date. The entry is posted
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="dispose-proceeds">Proceeds (EGP)</FieldLabel>
                <Input
                  id="dispose-proceeds"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.proceeds)}
                  {...register("proceeds")}
                />
                {errors.proceeds ? <FieldError>{errors.proceeds.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="dispose-date">Disposal date *</FieldLabel>
                <Input id="dispose-date" type="date" aria-invalid={Boolean(errors.date)} {...register("date")} />
                {errors.date ? <FieldError>{errors.date.message}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="dispose-treasury">Paid into</FieldLabel>
              <Controller
                control={control}
                name="treasury_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={proceeds === 0}>
                    <SelectTrigger id="dispose-treasury" aria-invalid={Boolean(errors.treasury_id)}>
                      <SelectValue placeholder={proceeds === 0 ? "No proceeds" : "Choose a treasury"} />
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
              {errors.treasury_id ? <FieldError>{errors.treasury_id.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dispose-reason">Note</FieldLabel>
              <Input id="dispose-reason" placeholder="e.g. Sold to a scrap dealer" {...register("reason")} />
            </Field>
            <FinanceAlert tone={result < 0 ? "warning" : "info"}>
              Book value is {formatAmount(asset.nbv)} EGP. {result === 0 ? "No gain or loss." : result > 0 ? `Gain on disposal of ${formatAmount(result)} EGP.` : `Loss on disposal of ${formatAmount(-result)} EGP.`}
            </FinanceAlert>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={dispose.isPending}>
              Record disposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Write off ───────────────────────────────────────────────────────────────

const writeOffSchema = z.object({
  reason: z.string().trim().min(1, "Record why the asset is being written off. The reason is kept on the asset's history."),
})
type WriteOffValues = z.infer<typeof writeOffSchema>

function WriteOffDialog({ asset, open, onOpenChange }: DialogProps) {
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
                  toast.success(`${retired.number} is written off. Entry ${retired.entry} posted.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The write-off could not be posted. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>Write off this asset?</DialogTitle>
            <DialogDescription>
              A write-off charges the whole remaining book value to expense in this period. There are no proceeds, so the
              loss is the full carrying amount of {formatAmount(asset.nbv)} EGP. This is reported separately from a
              disposal.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="write-off-reason">Reason *</FieldLabel>
              <Textarea id="write-off-reason" rows={3} aria-invalid={Boolean(errors.reason)} {...register("reason")} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={writeOff.isPending}>
              Write off asset
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
    name: z.string().trim().min(1, "The asset needs a name."),
    cost_center_id: z.string().min(1, "Choose a cost center."),
    life: z
      .string()
      .trim()
      .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, "Useful life is a whole number of months above zero."),
    salvage: z
      .string()
      .trim()
      .refine((value) => value !== "" && Number(value) >= 0 && Number(value) < cost, "Salvage must be zero or more and below the asset's cost."),
  })
}
type EditValues = z.infer<ReturnType<typeof editSchema>>

function EditAssetDialog({ asset, open, onOpenChange }: DialogProps) {
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
                  toast.success(`${saved.number} saved. The next run charges ${formatAmount(saved.monthly_charge)} EGP.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The asset could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>Edit · {asset.number}</DialogTitle>
            <DialogDescription>
              Editing changes how the asset depreciates from the next run onward. Depreciation already posted is not
              restated.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="asset-edit-name">Name *</FieldLabel>
              <Input id="asset-edit-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="asset-edit-center">Cost center *</FieldLabel>
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
                <FieldLabel htmlFor="asset-edit-life">Useful life *</FieldLabel>
                <Input id="asset-edit-life" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.life)} {...register("life")} />
                {errors.life ? (
                  <FieldError>{errors.life.message}</FieldError>
                ) : (
                  <FieldDescription>Months. Changing the life re-spreads the remaining net book value.</FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-edit-salvage">Salvage (EGP) *</FieldLabel>
                <Input id="asset-edit-salvage" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.salvage)} {...register("salvage")} />
                {errors.salvage ? <FieldError>{errors.salvage.message}</FieldError> : null}
              </Field>
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={edit.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { DisposeDialog, EditAssetDialog, SESSION_NOTE, WriteOffDialog }
