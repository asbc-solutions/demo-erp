import { Sparkles } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"

const SectionLabel = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <p className="text-[11px] leading-4 font-semibold tracking-[0.88px] text-content-quaternary uppercase">
    {children}
  </p>
)

/**
 * Out of scope per spec — stays a hardcoded placeholder, not wired to any
 * endpoint.
 */
export function AiInsightsCard({ orgLabel }: Readonly<{ orgLabel: string }>) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>AI Insights</SectionLabel>
      <Card
        variant="elevated"
        className="relative overflow-hidden rounded-2xl border border-stroke-default border-l-[1.5px] border-l-brand-primary py-11 pl-[22px] pr-5 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
      >
        <div
          className="pointer-events-none absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-primary via-violet-500 to-transparent opacity-40"
          aria-hidden
        />
        <div className="flex gap-4">
          <div className="flex rounded-xl bg-brand-primary/12 p-2 text-brand-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-content-primary">
                Daily Briefing
              </span>
              <span className="inline-flex rounded-lg border border-stroke-default bg-surface-hover px-2 py-0.5 text-[11px] text-content-tertiary">
                Demo
              </span>
            </div>
            <div className="text-xs leading-[18px] text-content-tertiary">
              <p className="mb-2">
                Good morning, {orgLabel}. Your runway has extended by{" "}
                <span className="font-semibold text-brand-success">4 days</span> due
                to a{" "}
                <span className="font-semibold text-content-primary">$12,000</span>{" "}
                payment from Acme Corporation. Two deals in negotiation stage are
                approaching their close dates with a combined value of{" "}
                <span className="font-semibold text-brand-primary">$113,000</span>.
              </p>
              <p>
                Consider following up with TechStart Inc on their proposal response.
              </p>
            </div>
            <p className="text-[11px] text-content-quaternary">
              Nucleus · Sample briefing — connect to AI for live insights
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
