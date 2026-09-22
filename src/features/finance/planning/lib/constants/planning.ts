import type { StatusTone } from "../../../lib/constants/statuses"
import type { CostCenterType } from "../types/planning"

export const COST_CENTER_TYPES: { value: CostCenterType; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "branch", label: "Branch" },
  { value: "project", label: "Project" },
]

export const RULE_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  ready: { label: "Ready to run", tone: "info" },
  posted: { label: "Posted", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
}
