"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { cn } from "@/src/shared/lib/utils/utils"

import { useChangePlan } from "../../lib/mutations/billing"
import type { BillingPlan } from "../../lib/types/billing"
import { toastMutationError } from "../shared/settings-error-state"

export function ChangePlanDialog({
  open,
  onOpenChange,
  currentPlanCode,
  availablePlans,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanCode?: string
  availablePlans: BillingPlan[]
}>) {
  const t = useTranslations("SettingsChangePlan")
  const tShared = useTranslations("SettingsShared")
  const tCommon = useTranslations("Common")
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(null)
  const changePlan = useChangePlan()

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedPlanId(null)
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!selectedPlanId) return
    changePlan.mutate(
      { plan_id: selectedPlanId },
      {
        onSuccess: () => {
          toast.success(t("success"))
          handleOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("failed"), tShared),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-3">
          {availablePlans.length === 0 ? (
            <p className="text-content-tertiary text-sm">{t("noPlans")}</p>
          ) : (
            availablePlans.map((plan) => {
              const isCurrent = plan.code === currentPlanCode
              const isSelected = plan.id === selectedPlanId
              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-stroke-default bg-surface-page hover:bg-surface-hover",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-content-primary text-sm font-medium">
                      {plan.name}
                      {isCurrent ? (
                        <span className="text-content-tertiary ms-2 text-xs font-normal">
                          {t("current")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-content-tertiary text-xs">
                      {plan.seat_limit ? `${t("seats", { count: plan.seat_limit })} · ` : ""}
                      {plan.storage_limit_gb ? t("storage", { size: plan.storage_limit_gb }) : ""}
                    </span>
                  </div>
                  <span className="text-content-primary text-sm font-semibold">
                    {plan.price_amount} {plan.currency_code}/{plan.billing_interval}
                  </span>
                </button>
              )
            })
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!selectedPlanId || changePlan.isPending}
            onClick={handleConfirm}
          >
            {changePlan.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
