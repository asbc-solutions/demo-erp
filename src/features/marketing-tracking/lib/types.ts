import type { Messages } from "next-intl"

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

/** English step names, sent as `FunnelStep.label` by the summary API. */
export const ONBOARDING_STEP_LABELS: Record<OnboardingStepId, string> = {
  company: "Company name",
  industry: "Industry & stage",
  "team-size": "Team size",
  "connect-tools": "Connect tools",
  login: "Signed in",
}

/** `MarketingTrackingSteps` message keys the dashboard renders for each step id. */
export const ONBOARDING_STEP_LABEL_KEYS = {
  company: "company",
  industry: "industry",
  "team-size": "teamSize",
  "connect-tools": "connectTools",
  login: "login",
} as const satisfies Record<OnboardingStepId, keyof Messages["MarketingTrackingSteps"]>

export type OnboardingAnswers = {
  companyName?: string | null
  /** E.164, collected on the company step. */
  phone?: string | null
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
  phone: string | null
  company: string | null
  onboarding: VisitorOnboarding | null
  firstSeenAt: string
  lastSeenAt: string
  sessions: number
  totalViews: number
  totalMs: number
  modules: Partial<Record<ModuleId, ModuleStat>>
}

/**
 * Bumped to 2 when visitors started being matched on phone/email instead of on
 * the localStorage id alone. `readStore` migrates anything older on first read.
 */
export const TRACKING_STORE_VERSION = 2

export type TrackingStoreShape = {
  version: number
  visitors: Record<string, VisitorRecord>
  /**
   * Superseded visitor ids pointing at the record they were merged into. A
   * browser that already has a dead id in localStorage keeps sending it, so
   * every lookup resolves through here before touching `visitors`.
   */
  aliases: Record<string, string>
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
