"use client"

import { useState } from "react"
import { CreditCard, Download } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { ChangePlanDialog } from "./billing/change-plan-dialog"
import { SETTINGS_RESOURCES } from "../lib/constants/permissions"
import { useDownloadInvoice } from "../lib/mutations/billing"
import { useBillingInvoices, useBillingOverview } from "../lib/queries/billing"
import type { BillingInvoiceStatus } from "../lib/types/billing"
import { SettingsAccessGate } from "./shared/settings-access-gate"
import { SettingsErrorState, toastMutationError } from "./shared/settings-error-state"
import { SettingsPageSpinner, SettingsSectionSpinner } from "./shared/settings-loading"

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-[#f4f4f5] px-3 py-3">
      <span className="text-content-tertiary text-[11px] leading-[15.4px]">{label}</span>
      <span className="text-content-primary text-[12px] leading-[18px] font-medium">
        {value}
      </span>
    </div>
  )
}

const INVOICE_STATUS_VARIANT: Record<BillingInvoiceStatus, "success" | "warning" | "neutral"> = {
  paid: "success",
  open: "warning",
  void: "neutral",
}

function InvoiceHistory() {
  const t = useTranslations("SettingsBilling")
  const tShared = useTranslations("SettingsShared")
  const tCommon = useTranslations("Common")
  const { data: invoices, isLoading, isError, refetch } = useBillingInvoices()
  const downloadInvoice = useDownloadInvoice()

  const handleDownload = (invoiceId: string) => {
    downloadInvoice.mutate(invoiceId, {
      onSuccess: (url) => window.open(url, "_blank"),
      onError: (err) => toastMutationError(err, t("downloadFailed"), tShared),
    })
  }

  if (isLoading) return <SettingsSectionSpinner />
  if (isError) {
    return (
      <SettingsErrorState message={t("invoicesLoadError")} onRetry={() => void refetch()} />
    )
  }
  if (!invoices || invoices.length === 0) {
    return <p className="text-content-tertiary py-6 text-center text-sm">{t("noInvoices")}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("colInvoice")}</TableHead>
          <TableHead>{t("colPeriod")}</TableHead>
          <TableHead>{tCommon("amount")}</TableHead>
          <TableHead>{tCommon("status")}</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="text-content-primary font-medium">
              {invoice.invoice_number}
            </TableCell>
            <TableCell>
              {invoice.period_start} – {invoice.period_end}
            </TableCell>
            <TableCell>
              {invoice.amount} {invoice.currency_code}
            </TableCell>
            <TableCell>
              <Badge variant={INVOICE_STATUS_VARIANT[invoice.status]}>
                {t(`invoiceStatus.${invoice.status}`)}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!invoice.has_document || downloadInvoice.isPending}
                title={invoice.has_document ? t("downloadInvoice") : t("noDocument")}
                aria-label={t("downloadInvoiceNamed", { number: invoice.invoice_number })}
                onClick={() => handleDownload(invoice.id)}
              >
                <Download className="size-4" aria-hidden />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function BillingTabContent() {
  const t = useTranslations("SettingsBilling")
  const { data: overview, isLoading, isError, refetch } = useBillingOverview()
  const { can } = usePermissions()
  const canWrite = can.write(SETTINGS_RESOURCES.billing)
  const [changePlanOpen, setChangePlanOpen] = useState(false)

  if (isLoading) {
    return <SettingsPageSpinner />
  }

  if (isError || !overview) {
    return (
      <SettingsErrorState message={t("loadError")} onRetry={() => void refetch()} />
    )
  }

  const { subscription, payment_method: paymentMethod, available_plans: availablePlans } = overview

  return (
    <div className="flex flex-col gap-4">
      <Card variant="elevated" className="gap-6 p-6">
        {subscription ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col">
                <h3 className="text-content-primary text-[16px] leading-6 font-medium">
                  {subscription.plan.name}
                </h3>
                <p className="text-content-tertiary text-[12px] leading-[18px]">
                  {subscription.plan.price_amount} {subscription.plan.currency_code} /{" "}
                  {subscription.plan.billing_interval}
                </p>
              </div>
              <span className="bg-brand-success/12 text-brand-success inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] leading-[15.4px] font-medium capitalize">
                {subscription.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile label={t("nextBillingDate")} value={subscription.next_billing_date} />
              <StatTile
                label={t("seatsUsed")}
                value={`${subscription.usage.seats_used} / ${subscription.usage.seat_limit}`}
              />
              <StatTile
                label={t("storage")}
                value={t("storageValue", {
                  used: subscription.usage.storage_used_gb,
                  limit: subscription.usage.storage_limit_gb,
                })}
              />
            </div>
          </>
        ) : (
          <p className="text-content-tertiary text-sm">
            {t("noSubscription")}
          </p>
        )}

        {canWrite ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-4 text-[12px]"
              onClick={() => setChangePlanOpen(true)}
            >
              {subscription ? t("changePlan") : t("choosePlan")}
            </Button>
          </div>
        ) : null}
      </Card>

      <Card variant="elevated" className="gap-6 p-6">
        <h3 className="text-content-primary text-[14px] leading-[22.4px] font-semibold">
          {t("paymentMethod")}
        </h3>

        {paymentMethod ? (
          <div className="bg-surface-page border-stroke-default flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="flex items-center gap-3">
              <div className="bg-surface-white border-stroke-default flex size-9 items-center justify-center rounded-lg border">
                <CreditCard className="text-content-secondary size-5" aria-hidden />
              </div>
              <div className="flex flex-col">
                <span className="text-content-primary text-[12px] leading-[18px] capitalize">
                  {t("cardEnding", { brand: paymentMethod.brand, last4: paymentMethod.last4 })}
                </span>
                <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                  {t("cardExpires", {
                    month: String(paymentMethod.exp_month).padStart(2, "0"),
                    year: paymentMethod.exp_year,
                  })}
                </span>
              </div>
            </div>
            {canWrite ? (
              <Button
                type="button"
                variant="secondary"
                className="h-8 px-3 text-[12px]"
                title={t("updatePaymentHint")}
                onClick={() =>
                  toast.info(t("updatePaymentToast"), {
                    description: t("updatePaymentToastDescription"),
                  })
                }
              >
                {t("updatePayment")}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-content-tertiary text-sm">{t("noPaymentMethod")}</p>
        )}
      </Card>

      <Card variant="elevated" className="gap-4 p-6">
        <h3 className="text-content-primary text-[14px] leading-[22.4px] font-semibold">
          {t("invoiceHistory")}
        </h3>
        <InvoiceHistory />
      </Card>

      <ChangePlanDialog
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        currentPlanCode={subscription?.plan.code}
        availablePlans={availablePlans}
      />
    </div>
  )
}

export function BillingTab() {
  return (
    <SettingsAccessGate resource={SETTINGS_RESOURCES.billing}>
      <BillingTabContent />
    </SettingsAccessGate>
  )
}
