import type { StatusTone } from "../../../lib/constants/statuses"
import type { CostCenterType, PlanningMessageKey } from "../types/planning"

export const COST_CENTER_TYPES: { value: CostCenterType; labelKey: PlanningMessageKey }[] = [
  { value: "department", labelKey: "typeDepartment" },
  { value: "branch", labelKey: "typeBranch" },
  { value: "project", labelKey: "typeProject" },
]

export const RULE_STATUS: Record<string, { labelKey: PlanningMessageKey; tone: StatusTone }> = {
  ready: { labelKey: "ruleReady", tone: "info" },
  posted: { labelKey: "rulePosted", tone: "success" },
  inactive: { labelKey: "ruleInactive", tone: "neutral" },
}
