import { TRACKED_MODULES } from "@/src/shared/lib/constants/modules"
import {
  industryLabel,
  stageLabel,
  teamSizeLabel,
  toolLabel,
} from "@/src/features/_onboarding/options"

import {
  ONBOARDING_STEP_IDS,
  ONBOARDING_STEP_LABELS,
  type BreakdownEntry,
  type TrackingSummary,
  type VisitorRecord,
} from "../types"

function tally(
  visitors: VisitorRecord[],
  pick: (v: VisitorRecord) => string[] | string | null | undefined,
  label: (key: string) => string,
): BreakdownEntry[] {
  const counts = new Map<string, number>()
  for (const visitor of visitors) {
    const raw = pick(visitor)
    if (!raw) continue
    const keys = Array.isArray(raw) ? raw : [raw]
    for (const key of keys) {
      if (!key) continue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: label(key), count }))
    .sort((a, b) => b.count - a.count)
}

export function buildSummary(visitors: VisitorRecord[]): TrackingSummary {
  const sorted = [...visitors].sort((a, b) =>
    a.lastSeenAt < b.lastSeenAt ? 1 : a.lastSeenAt > b.lastSeenAt ? -1 : 0,
  )

  const moduleTotals = TRACKED_MODULES.map((module) => {
    let views = 0
    let msSpent = 0
    let reach = 0
    for (const visitor of sorted) {
      const stat = visitor.modules[module.id]
      if (!stat || stat.views === 0) continue
      views += stat.views
      msSpent += stat.msSpent
      reach += 1
    }
    return {
      moduleId: module.id,
      label: module.label,
      views,
      msSpent,
      visitors: reach,
    }
  }).sort((a, b) => b.views - a.views)

  const modulesExplored = sorted.map(
    (v) => Object.values(v.modules).filter((m) => m && m.views > 0).length,
  )

  const funnel = ONBOARDING_STEP_IDS.map((step) => ({
    step,
    label: ONBOARDING_STEP_LABELS[step],
    count: sorted.filter((v) => v.onboarding?.stepsCompleted.includes(step))
      .length,
  }))

  const identified = sorted.filter((v) => Boolean(v.email)).length
  const completedOnboarding = sorted.filter(
    (v) => Boolean(v.onboarding?.completedAt),
  ).length

  return {
    generatedAt: new Date().toISOString(),
    visitors: sorted,
    totals: {
      visitors: sorted.length,
      identified,
      completedOnboarding,
      totalViews: sorted.reduce((sum, v) => sum + v.totalViews, 0),
      avgModulesExplored: modulesExplored.length
        ? modulesExplored.reduce((sum, n) => sum + n, 0) / modulesExplored.length
        : 0,
    },
    moduleTotals,
    funnel,
    breakdowns: {
      industry: tally(sorted, (v) => v.onboarding?.industry, industryLabel),
      stage: tally(sorted, (v) => v.onboarding?.stage, stageLabel),
      teamSize: tally(sorted, (v) => v.onboarding?.teamSize, teamSizeLabel),
      tools: tally(sorted, (v) => v.onboarding?.tools, toolLabel),
    },
  }
}
