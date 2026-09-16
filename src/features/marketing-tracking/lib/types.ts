import type { ModuleId } from "@/src/shared/lib/constants/modules"

/* -------------------------------------------------------------------------- */
/*                            Wire format (client → server)                   */
/* -------------------------------------------------------------------------- */

export type OnboardingStepId =
  | "company"
  | "industry"
  | "team-size"
  | "connect-tools"
  | "login"

export const ONBOARDING_STEP_IDS: readonly OnboardingStepId[] = [
  "company",
  "industry",
  "team-size",
  "connect-tools",
  "login",
]

export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  company: "Company name",
  industry: "Industry & stage",
  "team-size": "Team size",
  "connect-tools": "Connect tools",
  login: "Signed in",
}

export type OnboardingAnswers = {
  companyName?: string | null
  industry?: string | null
  stage?: string | null
  teamSize?: string | null
  tools?: string[]
}

export type TrackingEvent =
  | { type: "session-start"; at: string }
  | {
      type: "page-view"
      at: string
      path: string
      module: ModuleId | null
      /** Dwell time on the page being left, in ms. */
      ms: number
    }
  | {
      type: "onboarding-step"
      at: string
      step: OnboardingStepId
      answers: OnboardingAnswers
    }
  | { type: "onboarding-complete"; at: string; answers: OnboardingAnswers }
  | { type: "identify"; at: string; name: string | null; email: string | null }

export type TrackingPayload = {
  visitorId: string
  events: TrackingEvent[]
}

/* -------------------------------------------------------------------------- */
/*                              Stored shape                                  */
/* -------------------------------------------------------------------------- */

export type ModuleStat = {
  views: number
  msSpent: number
  lastVisitAt: string | null
  /** Per-route view counts inside the module, e.g. `/hr/employees`. */
  pages: Record<string, number>
}

export type VisitorOnboarding = {
  industry: string | null
  stage: string | null
  teamSize: string | null
  tools: string[]
  stepsCompleted: OnboardingStepId[]
  completedAt: string | null
}

export type VisitorRecord = {
  visitorId: string
  name: string | null
  email: string | null
  company: string | null
  onboarding: VisitorOnboarding | null
  firstSeenAt: string
  lastSeenAt: string
  sessions: number
  totalViews: number
  totalMs: number
  modules: Partial<Record<ModuleId, ModuleStat>>
}

export type TrackingStoreShape = {
  version: 1
  visitors: Record<string, VisitorRecord>
}

/* -------------------------------------------------------------------------- */
/*                          Summary (server → dashboard)                      */
/* -------------------------------------------------------------------------- */

export type ModuleTotal = {
  moduleId: ModuleId
  label: string
  views: number
  msSpent: number
  /** Distinct visitors who opened the module at least once. */
  visitors: number
}

export type FunnelStep = {
  step: OnboardingStepId
  label: string
  count: number
}

export type BreakdownEntry = {
  key: string
  label: string
  count: number
}

export type TrackingSummary = {
  generatedAt: string
  visitors: VisitorRecord[]
  totals: {
    visitors: number
    identified: number
    completedOnboarding: number
    totalViews: number
    avgModulesExplored: number
  }
  moduleTotals: ModuleTotal[]
  funnel: FunnelStep[]
  breakdowns: {
    industry: BreakdownEntry[]
    stage: BreakdownEntry[]
    teamSize: BreakdownEntry[]
    tools: BreakdownEntry[]
  }
}
