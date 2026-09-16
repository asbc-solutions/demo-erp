"use client"

import { useState } from "react"
import { Check, Loader2, Pencil } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useUpdateRule } from "../lib/mutations/rules"
import { useComplianceFrameworks, useComplianceRules } from "../lib/queries/rules"
import type { ComplianceRule, RuleStatus, UpdateRulePayload } from "../lib/types/rules"
import { ComplianceErrorState, toastMutationError } from "./shared/compliance-error-state"
import { CompliancePageSpinner } from "./shared/compliance-loading"

const STATUS_FILTERS: ReadonlyArray<{ label: string; value: RuleStatus | "all" }> = [
  { label: "All Statuses", value: "all" },
  { label: "Compliant", value: "compliant" },
  { label: "In Progress", value: "in_progress" },
  { label: "Non-compliant", value: "non_compliant" },
]

const SEVERITY_BADGE_VARIANT: Record<ComplianceRule["severity"], "danger" | "warning" | "info"> = {
  critical: "danger",
  warning: "warning",
  info: "info",
}

const STATUS_BADGE_VARIANT: Record<RuleStatus, "success" | "warning" | "danger"> = {
  compliant: "success",
  in_progress: "warning",
  non_compliant: "danger",
}

export function RulesTab() {
  const [frameworkFilter, setFrameworkFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<RuleStatus | "all">("all")
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null)

  const { data: frameworks } = useComplianceFrameworks()
  const { data, isLoading, isError, refetch } = useComplianceRules({
    framework: frameworkFilter === "all" ? undefined : frameworkFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const rules = data?.data ?? []

  const counts = {
    compliant: rules.filter((r) => r.status === "compliant").length,
    in_progress: rules.filter((r) => r.status === "in_progress").length,
    non_compliant: rules.filter((r) => r.status === "non_compliant").length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">{counts.compliant} Compliant</Badge>
        <Badge variant="warning">{counts.in_progress} In Progress</Badge>
        <Badge variant="danger">{counts.non_compliant} Non-compliant</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={frameworkFilter}
          onValueChange={setFrameworkFilter}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {(frameworks ?? []).map((framework) => (
              <SelectItem key={framework.id} value={framework.code}>
                {framework.label} ({framework.rule_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as RuleStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CompliancePageSpinner />
      ) : isError ? (
        <ComplianceErrorState message="Failed to load compliance rules." onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-content-tertiary text-sm">No rules match this filter.</p>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} variant="elevated" className="gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-content-primary text-lg font-semibold">{rule.title}</p>
                      <Badge variant={SEVERITY_BADGE_VARIANT[rule.severity]}>
                        {rule.severity_label}
                      </Badge>
                      <Badge variant="neutral">{rule.framework.label}</Badge>
                      <Badge variant={STATUS_BADGE_VARIANT[rule.status]}>{rule.status_label}</Badge>
                      {rule.is_overdue ? <Badge variant="danger">Overdue</Badge> : null}
                    </div>
                    <p className="text-content-tertiary text-sm">{rule.description}</p>
                    <p className="text-content-tertiary text-xs">
                      {rule.owner?.name ?? "Unassigned"} · Due {rule.due_date ?? "—"}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setEditingRule(rule)}>
                    <Pencil className="size-4" />
                    Update
                  </Button>
                </div>
                {rule.tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {rule.tags.map((tag) => (
                      <Badge key={tag} variant="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {rule.evidence ? (
                  <div className="bg-surface-page text-content-tertiary rounded-lg px-3 py-2 text-sm">
                    {rule.evidence}
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      )}

      <UpdateRuleDialog
        key={editingRule?.id ?? "none"}
        rule={editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
      />
    </div>
  )
}

function UpdateRuleDialog({
  rule,
  onOpenChange,
}: Readonly<{ rule: ComplianceRule | null; onOpenChange: (open: boolean) => void }>) {
  const updateRule = useUpdateRule()
  // The parent remounts this component (via `key={rule?.id}`) whenever a
  // different rule is opened, so these initializers only need to run once.
  const [status, setStatus] = useState<RuleStatus>(rule?.status ?? "non_compliant")
  const [evidence, setEvidence] = useState(rule?.evidence ?? "")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rule) return

    const payload: UpdateRulePayload = {
      status,
      evidence: evidence.trim() || undefined,
    }

    updateRule.mutate(
      { id: rule.id, payload },
      {
        onSuccess: () => {
          toast.success("Rule updated.")
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, "Failed to update rule"),
      },
    )
  }

  return (
    <Dialog open={rule !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update {rule?.code}</DialogTitle>
            <DialogDescription>{rule?.title}</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(value as RuleStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="non_compliant">Non-compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">Evidence</p>
              <Textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                placeholder="Describe the evidence supporting this status..."
                className="min-h-[100px]"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={updateRule.isPending}>
              {updateRule.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
