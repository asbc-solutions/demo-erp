/**
 * The choices offered by the onboarding steps.
 *
 * These live outside the step components because the marketing-tracking
 * dashboard has to turn stored ids (`series_a`, `e_commerce`, …) back into the
 * labels a prospect actually saw. One list, two readers.
 *
 * The onboarding steps render translated copy keyed by `id` (`OnboardingIndustry`,
 * `OnboardingTeamSize`, `OnboardingTools` in `messages/<locale>/onboarding.json`);
 * the English labels below are what the `*Label()` helpers return for callers
 * without a translator, such as the server-side tracking summary.
 */

export const INDUSTRIES = [
  { id: "saas", emoji: "☁️", label: "SaaS" },
  { id: "marketplace", emoji: "🛒", label: "Marketplace" },
  { id: "fintech", emoji: "💳", label: "Fintech" },
  { id: "e_commerce", emoji: "📦", label: "E-commerce" },
  { id: "healthtech", emoji: "🏥", label: "Healthtech" },
  { id: "edtech", emoji: "📚", label: "Edtech" },
  { id: "ai_ml", emoji: "🤖", label: "AI/ML" },
  { id: "other", emoji: "🚀", label: "Other" },
] as const

export const STAGES = [
  { id: "idea", title: "Idea", description: "Just starting out" },
  { id: "pre_seed", title: "Pre-Seed", description: "Early stage" },
  { id: "seed", title: "Seed", description: "Funding secured" },
  { id: "series_a", title: "Series A", description: "Growing fast" },
  { id: "series_b", title: "Series B", description: "Scaling up" },
  { id: "growth", title: "Growth", description: "Expanding" },
  { id: "established", title: "Established", description: "Mature company" },
] as const

export const TEAM_SIZES = [
  { id: "solo", count: "1", description: "Solo founder" },
  { id: "small", count: "2–5", description: "Small team" },
  { id: "growing", count: "6–15", description: "Growing team" },
  { id: "established", count: "16–30", description: "Established" },
  { id: "scaling", count: "30+", description: "Scaling" },
] as const

export const TOOLS = [
  { id: "stripe", emoji: "💳", name: "Stripe", description: "Payment processing" },
  { id: "quickbooks", emoji: "📊", name: "QuickBooks", description: "Accounting" },
  { id: "gusto", emoji: "👥", name: "Gusto", description: "Payroll & HR" },
  { id: "github", emoji: "🐙", name: "GitHub", description: "Repository sync" },
  { id: "notion", emoji: "📝", name: "Notion", description: "Documentation" },
  { id: "slack", emoji: "💬", name: "Slack", description: "Team notifications" },
] as const

export type IndustryId = (typeof INDUSTRIES)[number]["id"]
export type StageId = (typeof STAGES)[number]["id"]
export type TeamSizeId = (typeof TEAM_SIZES)[number]["id"]
export type ToolId = (typeof TOOLS)[number]["id"]

export function industryLabel(id: string): string {
  return INDUSTRIES.find((o) => o.id === id)?.label ?? id
}

export function stageLabel(id: string): string {
  return STAGES.find((o) => o.id === id)?.title ?? id
}

export function teamSizeLabel(id: string): string {
  const option = TEAM_SIZES.find((o) => o.id === id)
  return option ? `${option.count} · ${option.description}` : id
}

export function toolLabel(id: string): string {
  return TOOLS.find((o) => o.id === id)?.name ?? id
}
