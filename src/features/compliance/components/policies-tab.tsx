"use client"

import { useState } from "react"
import { Check, CheckCircle2, Loader2, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { useAcknowledgePolicy, useCreatePolicy } from "../lib/mutations/policies"
import { usePolicies } from "../lib/queries/policies"
import type { CreatePolicyPayload, PolicyStatus } from "../lib/types/policies"
import { ComplianceErrorState, toastMutationError } from "./shared/compliance-error-state"
import { CompliancePageSpinner } from "./shared/compliance-loading"
import { ComplianceTablePagination } from "./shared/compliance-table-pagination"

const PAGE_SIZE = 15

const POLICY_STATUSES: readonly PolicyStatus[] = ["draft", "under_review", "active", "archived"]

const STATUS_FILTERS: readonly (PolicyStatus | "all")[] = ["all", ...POLICY_STATUSES]

const STATUS_BADGE_VARIANT: Record<PolicyStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  under_review: "warning",
  draft: "neutral",
  archived: "neutral",
}

export function PoliciesTab() {
  const t = useTranslations("CompliancePolicies")
  const tCompliance = useTranslations("Compliance")
  const tCommon = useTranslations("Common")
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [openNewPolicy, setOpenNewPolicy] = useState(false)

  const { data, isLoading, isError, refetch } = usePolicies({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    per_page: PAGE_SIZE,
  })
  const acknowledgePolicy = useAcknowledgePolicy()

  const policies = data?.data ?? []
  const meta = data?.meta

  const handleAcknowledge = (id: string) => {
    acknowledgePolicy.mutate(id, {
      onSuccess: () => toast.success(t("acknowledgedToast")),
      onError: (err) => toastMutationError(err, t("acknowledgeFailed"), tCompliance),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatusFilter(value)
                setPage(1)
              }}
              className={cn(
                "rounded-lg px-3 py-1 text-xs",
                statusFilter === value
                  ? "bg-brand-primary text-white"
                  : "bg-surface-hover text-content-tertiary",
              )}
            >
              {value === "all" ? tCommon("all") : t(`status.${value}`)}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setOpenNewPolicy(true)}>
          <Plus className="size-4" />
          {t("newPolicy")}
        </Button>
      </div>

      {isLoading ? (
        <CompliancePageSpinner />
      ) : isError ? (
        <ComplianceErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {policies.length === 0 ? (
              <Card className="p-6 text-center lg:col-span-2">
                <p className="text-content-tertiary text-sm">{t("empty")}</p>
              </Card>
            ) : (
              policies.map((policy) => (
                <Card key={policy.id} variant="elevated" className="gap-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{policy.category}</Badge>
                    <span className="text-content-tertiary text-xs">v{policy.version}</span>
                    <Badge variant={STATUS_BADGE_VARIANT[policy.status]}>
                      {policy.status_label}
                    </Badge>
                    {policy.is_review_overdue ? (
                      <Badge variant="danger">{t("reviewOverdue")}</Badge>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-content-primary text-lg font-semibold">{policy.title}</p>
                    <p className="text-content-tertiary text-sm">{policy.summary}</p>
                  </div>
                  <p className="text-content-tertiary text-xs">
                    {t("ownerReview", {
                      owner: policy.owner?.name ?? tCompliance("unassigned"),
                      date: policy.review_date ?? "—",
                    })}
                  </p>
                  <div className="space-y-1">
                    <div className="bg-stroke-default h-1.5 overflow-hidden rounded-full">
                      <span
                        className="bg-brand-primary block h-full rounded-full"
                        style={{
                          width:
                            policy.acknowledgements.required > 0
                              ? `${Math.min(100, (policy.acknowledgements.acknowledged / policy.acknowledgements.required) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <p className="text-content-tertiary text-xs">
                      {t("acknowledgements", { ratio: policy.acknowledgements.ratio })}
                    </p>
                  </div>
                  {policy.acknowledgements.outstanding > 0 ? (
                    <p className="text-brand-warning text-xs">
                      {t("outstanding", {
                        count: policy.acknowledgements.outstanding,
                        value: String(policy.acknowledgements.outstanding),
                      })}
                    </p>
                  ) : (
                    <p className="text-brand-success text-xs">{t("allAcknowledged")}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {policy.acknowledgements.acknowledged_by_me ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3" />
                        {t("acknowledged")}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost-primary"
                        size="sm"
                        onClick={() => handleAcknowledge(policy.id)}
                        disabled={acknowledgePolicy.isPending}
                      >
                        {acknowledgePolicy.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                        {t("acknowledge")}
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
          {meta ? (
            <ComplianceTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemKind="policies"
            />
          ) : null}
        </>
      )}

      <NewPolicyDialog open={openNewPolicy} onOpenChange={setOpenNewPolicy} />
    </div>
  )
}

function NewPolicyDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const t = useTranslations("CompliancePolicies")
  const tCompliance = useTranslations("Compliance")
  const tCommon = useTranslations("Common")
  const createPolicy = useCreatePolicy()
  const [status, setStatus] = useState<PolicyStatus>("draft")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const requiredAckRaw = String(formData.get("required_acknowledgements") ?? "").trim()
    const payload: CreatePolicyPayload = {
      title: String(formData.get("title") ?? "").trim(),
      category: String(formData.get("category") ?? "").trim(),
      version: String(formData.get("version") ?? "").trim() || undefined,
      status,
      summary: String(formData.get("summary") ?? "").trim() || undefined,
      review_date: String(formData.get("review_date") ?? "").trim() || undefined,
      required_acknowledgements: requiredAckRaw ? Number(requiredAckRaw) : undefined,
    }

    createPolicy.mutate(payload, {
      onSuccess: () => {
        toast.success(t("createdToast"))
        form.reset()
        setStatus("draft")
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, t("createFailed"), tCompliance),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">{t("policyTitle")}</p>
              <Input name="title" placeholder={t("policyTitlePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">{t("summary")}</p>
              <Textarea name="summary" placeholder={t("summaryPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">{t("category")}</p>
                <Input name="category" placeholder={t("categoryPlaceholder")} required />
              </div>
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">{t("version")}</p>
                <Input name="version" placeholder="1.0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">{tCommon("status")}</p>
                <Select value={status} onValueChange={(value) => setStatus(value as PolicyStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`status.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">{t("reviewDate")}</p>
                <Input name="review_date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">
                {t("requiredAcknowledgements")}
              </p>
              <Input name="required_acknowledgements" type="number" min={0} placeholder="0" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={createPolicy.isPending}>
              {createPolicy.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              {t("addPolicy")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
