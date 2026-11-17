"use client"

import * as React from "react"
import { Loader2, Pencil, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Switch } from "@/src/shared/components/ui/switch"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { SalesErrorState, useToastMutationError } from "../../components/shared/sales-error-state"
import { SalesSectionSpinner } from "../../components/shared/sales-loading"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useCreateSalesperson, useUpdateSalesperson } from "../../lib/mutations/salespeople"
import { useSalespeople } from "../../lib/queries/salespeople"
import type { CreateSalespersonPayload, Salesperson } from "../../lib/types"
import { SettingsSection } from "./settings-section"

function SalespersonDialog({
  open,
  onOpenChange,
  salesperson,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  salesperson: Salesperson | null
}>) {
  const t = useTranslations("SalesSettings")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const createSalesperson = useCreateSalesperson()
  const updateSalesperson = useUpdateSalesperson()
  const [isActive, setIsActive] = React.useState(salesperson?.is_active ?? true)
  const isPending = createSalesperson.isPending || updateSalesperson.isPending

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload: CreateSalespersonPayload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || undefined,
      is_active: isActive,
    }

    const onSettled = {
      onSuccess: () => {
        toast.success(salesperson ? t("salespersonUpdated") : t("salespersonAdded"))
        onOpenChange(false)
      },
      onError: (err: unknown) => toastMutationError(err, t("saveSalespersonFailed")),
    }

    if (salesperson) {
      updateSalesperson.mutate({ id: salesperson.id, payload }, onSettled)
    } else {
      createSalesperson.mutate(payload, onSettled)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{salesperson ? t("editSalesperson") : t("newSalesperson")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{tCommon("name")}</span>
              <Input name="name" defaultValue={salesperson?.name} required autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{tCommon("email")}</span>
              <Input
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                defaultValue={salesperson?.email ?? ""}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{tCommon("status")}</span>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-content-primary">
                  {isActive ? t("active") : t("inactive")}
                </span>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {salesperson ? tCommon("saveChanges") : t("addSalesperson")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SalespeopleSection() {
  const t = useTranslations("SalesSettings")
  const { data, isLoading, isError, refetch } = useSalespeople()
  const [dialogState, setDialogState] = React.useState<{
    open: boolean
    salesperson: Salesperson | null
  }>({ open: false, salesperson: null })
  const { can } = usePermissions()
  const canManage = can.write(SALES_RESOURCES.salesperson)

  const salespeople = data?.data ?? []

  return (
    <SettingsSection title={t("salespeople")}>
      <div className="flex max-w-[1072px] flex-col gap-4">
        {isLoading ? (
          <SalesSectionSpinner />
        ) : isError ? (
          <SalesErrorState message={t("loadSalespeopleFailed")} onRetry={() => void refetch()} />
        ) : (
          <div className="flex flex-col divide-y divide-stroke-light rounded-lg border border-stroke-light">
            {salespeople.length > 0 ? (
              salespeople.map((person) => (
                <div key={person.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-content-primary">
                        {person.name}
                      </span>
                      {!person.is_active ? (
                        <Badge variant="neutral" className="rounded-full font-normal opacity-70">
                          {t("inactive")}
                        </Badge>
                      ) : null}
                    </div>
                    {person.email ? (
                      <p className="truncate text-xs text-content-tertiary">{person.email}</p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("editNamed", { name: person.name })}
                      onClick={() => setDialogState({ open: true, salesperson: person })}
                    >
                      <Pencil aria-hidden />
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-xs text-content-tertiary">
                {t("noSalespeople")}
              </p>
            )}
          </div>
        )}

        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            className="w-fit"
            onClick={() => setDialogState({ open: true, salesperson: null })}
          >
            <Plus aria-hidden />
            {t("addSalesperson")}
          </Button>
        ) : null}
      </div>

      <SalespersonDialog
        key={dialogState.salesperson?.id ?? "new"}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        salesperson={dialogState.salesperson}
      />
    </SettingsSection>
  )
}
