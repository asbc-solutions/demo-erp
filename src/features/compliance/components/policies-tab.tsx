"use client"

import { useState } from "react"
import { Check, CheckCircle2, Loader2, Plus } from "lucide-react"
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

const STATUS_FILTERS: ReadonlyArray<{ label: string; value: PolicyStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Under Review", value: "under_review" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
]

const STATUS_BADGE_VARIANT: Record<PolicyStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  under_review: "warning",
  draft: "neutral",
  archived: "neutral",
}

export function PoliciesTab() {
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
      onSuccess: () => toast.success("Policy acknowledged."),
      onError: (err) => toastMutationError(err, "Failed to acknowledge policy"),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setStatusFilter(item.value)
                setPage(1)
              }}
              className={cn(
                "rounded-lg px-3 py-1 text-xs",
                statusFilter === item.value
                  ? "bg-brand-primary text-white"
                  : "bg-surface-hover text-content-tertiary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={() => setOpenNewPolicy(true)}>
          <Plus className="size-4" />
          New Policy
        </Button>
      </div>

      {isLoading ? (
        <CompliancePageSpinner />
      ) : isError ? (
        <ComplianceErrorState message="Failed to load policies." onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {policies.length === 0 ? (
              <Card className="p-6 text-center lg:col-span-2">
                <p className="text-content-tertiary text-sm">No policies match this filter.</p>
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
                      <Badge variant="danger">Review overdue</Badge>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-content-primary text-lg font-semibold">{policy.title}</p>
                    <p className="text-content-tertiary text-sm">{policy.summary}</p>
                  </div>
                  <p className="text-content-tertiary text-xs">
                    {policy.owner?.name ?? "Unassigned"} · Review {policy.review_date ?? "—"}
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
                      Acknowledgements {policy.acknowledgements.ratio}
                    </p>
                  </div>
                  {policy.acknowledgements.outstanding > 0 ? (
                    <p className="text-brand-warning text-xs">
                      {policy.acknowledgements.outstanding} team member
                      {policy.acknowledgements.outstanding === 1 ? "" : "s"} haven&apos;t acknowledged
                    </p>
                  ) : (
                    <p className="text-brand-success text-xs">All team members acknowledged</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {policy.acknowledgements.acknowledged_by_me ? (
                      <Badge variant="success">
                        <CheckCircle2 className="size-3" />
                        Acknowledged
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
                        Acknowledge
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
              itemLabel="policies"
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
        toast.success("Policy created.")
        form.reset()
        setStatus("draft")
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to create policy"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Policy</DialogTitle>
            <DialogDescription>
              Add a compliance policy with its title, category, and review details.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">Policy Title</p>
              <Input name="title" placeholder="e.g., Data Classification Policy" required />
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">Summary</p>
              <Textarea name="summary" placeholder="Describe the policy purpose and scope..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">Category</p>
                <Input name="category" placeholder="e.g., Security" required />
              </div>
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">Version</p>
                <Input name="version" placeholder="1.0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">Status</p>
                <Select value={status} onValueChange={(value) => setStatus(value as PolicyStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-content-primary text-sm font-medium">Review Date</p>
                <Input name="review_date" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">Required Acknowledgements</p>
              <Input name="required_acknowledgements" type="number" min={0} placeholder="0" />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createPolicy.isPending}>
              {createPolicy.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              Add Policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
