import { useTranslations } from "next-intl"

import {
  INDUSTRIES,
  STAGES,
  TEAM_SIZES,
  toolLabel,
} from "@/src/features/_onboarding/options"

/**
 * Localised labels for the onboarding answers stored on a visitor (`series_a`,
 * `e_commerce`, …). Reads the `Onboarding*` messages owned by the onboarding
 * feature; unknown ids (older payloads) fall back to the raw id. Tool names are
 * brands and stay untranslated.
 */
export function useOnboardingLabels() {
  const tIndustry = useTranslations("OnboardingIndustry")
  const tTeamSize = useTranslations("OnboardingTeamSize")

  return {
    industry(id: string): string {
      const option = INDUSTRIES.find((o) => o.id === id)
      return option ? tIndustry(`industries.${option.id}`) : id
    },
    stage(id: string): string {
      const option = STAGES.find((o) => o.id === id)
      return option ? tIndustry(`stages.${option.id}`) : id
    },
    teamSize(id: string): string {
      const option = TEAM_SIZES.find((o) => o.id === id)
      return option ? `${option.count} · ${tTeamSize(`sizes.${option.id}`)}` : id
    },
    tool(id: string): string {
      return toolLabel(id)
    },
  }
}
