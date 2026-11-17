"use client"

import { useState } from "react"
import { Check, Loader2, Pencil } from "lucide-react"
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

const RULE_STATUSES: readonly RuleStatus[] = ["compliant", "in_progress", "non_compliant"]

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
  const t = useTranslations("ComplianceRules")
  const tCompliance = useTranslations("Compliance")
  const tCommon = useTranslations("Common")
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
        <Badge variant="success">
          {t("statusCount.compliant", { count: String(counts.compliant) })}
        </Badge>
        <Badge variant="warning">
          {t("statusCount.in_progress", { count: String(counts.in_progress) })}
        </Badge>
        <Badge variant="danger">
          {t("statusCount.non_compliant", { count: String(counts.non_compliant) })}
        </Badge>
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
            <SelectItem value="all">{t("allFrameworks")}</SelectItem>
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
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {RULE_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {tCompliance(`ruleStatus.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CompliancePageSpinner />
      ) : isError ? (
        <ComplianceErrorState message={t("loadFailed")} onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-content-tertiary text-sm">{t("empty")}</p>
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
                      {rule.is_overdue ? (
                        <Badge variant="danger">{tCompliance("overdue")}</Badge>
                      ) : null}
                    </div>
                    <p className="text-content-tertiary text-sm">{rule.description}</p>
                    <p className="text-content-tertiary text-xs">
                      {tCompliance("ownerDue", {
                        owner: rule.owner?.name ?? tCompliance("unassigned"),
                        date: rule.due_date ?? "—",
                      })}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setEditingRule(rule)}>
                    <Pencil className="size-4" />
                    {tCommon("update")}
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
  const t = useTranslations("ComplianceRules")
  const tCompliance = useTranslations("Compliance")
  const tCommon = useTranslations("Common")
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
          toast.success(t("updatedToast"))
          onOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("updateFailed"), tCompliance),
      },
    )
  }

  return (
    <Dialog open={rule !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("updateTitle", { code: rule?.code ?? "" })}</DialogTitle>
            <DialogDescription>{rule?.title}</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">{tCommon("status")}</p>
              <Select value={status} onValueChange={(value) => setStatus(value as RuleStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tCompliance(`ruleStatus.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-content-primary text-sm font-medium">{t("evidence")}</p>
              <Textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                placeholder={t("evidencePlaceholder")}
                className="min-h-[100px]"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={updateRule.isPending}>
              {updateRule.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
