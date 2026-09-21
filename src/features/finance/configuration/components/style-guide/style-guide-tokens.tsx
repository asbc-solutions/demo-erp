import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceSection } from "../../../components/shared/finance-section"
import { formatAmount } from "../../../lib/utils/money"

type Swatch = { token: string; role: string; className: string }

const SWATCH_GROUPS: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Surface",
    swatches: [
      { token: "surface-page", role: "Page background", className: "bg-surface-page" },
      { token: "surface-white", role: "Panel", className: "bg-surface-white" },
      { token: "surface-hover", role: "Filter bar / footer", className: "bg-surface-hover" },
      { token: "brand-primary/10", role: "Selected row", className: "bg-brand-primary/10" },
    ],
  },
  {
    title: "Text",
    swatches: [
      { token: "content-primary", role: "Primary", className: "bg-content-primary" },
      { token: "content-secondary", role: "Secondary", className: "bg-content-secondary" },
      { token: "content-tertiary", role: "Muted — AA body", className: "bg-content-tertiary" },
      { token: "content-quaternary", role: "Disabled", className: "bg-content-quaternary" },
    ],
  },
  {
    title: "Stroke",
    swatches: [
      { token: "stroke-default", role: "Decorative", className: "bg-stroke-default" },
      { token: "stroke-input", role: "Control / totals rule", className: "bg-stroke-input" },
      { token: "brand-primary", role: "Focus ring", className: "bg-brand-primary" },
    ],
  },
  {
    title: "Status",
    swatches: [
      { token: "status-success-fg", role: "Posted", className: "bg-status-success-fg" },
      { token: "status-warning-fg", role: "Attention", className: "bg-status-warning-fg" },
      { token: "status-danger-fg", role: "Overdue", className: "bg-status-danger-fg" },
      { token: "status-info-fg", role: "Draft", className: "bg-status-info-fg" },
      { token: "status-neutral-fg", role: "Simulated", className: "bg-status-neutral-fg" },
    ],
  },
  {
    title: "Series",
    swatches: [
      { token: "series-1", role: "Series 1", className: "bg-series-1" },
      { token: "series-2", role: "Series 2", className: "bg-series-2" },
      { token: "series-3", role: "Series 3", className: "bg-series-3" },
      { token: "series-4", role: "Series 4", className: "bg-series-4" },
      { token: "series-5", role: "Series 5", className: "bg-series-5" },
      { token: "series-6", role: "Series 6", className: "bg-series-6" },
    ],
  },
]

const TYPE_SCALE: { spec: string; className: string }[] = [
  { spec: "24 / 32 · Bold — governing figure", className: "text-2xl leading-8 font-bold" },
  { spec: "20 / 28 · SemiBold — page title", className: "text-xl leading-7 font-semibold" },
  { spec: "18 / 26 · SemiBold — section", className: "text-lg leading-[26px] font-semibold" },
  { spec: "16 / 24 · SemiBold — card / drawer", className: "text-base leading-6 font-semibold" },
  { spec: "16 / 24 · Regular — lead", className: "text-base leading-6" },
  { spec: "14 / 20 · Regular — default body", className: "text-sm leading-5" },
  { spec: "14 / 20 · Medium — totals / button", className: "text-sm leading-5 font-medium" },
  { spec: "14 / 20 · SemiBold — grand total", className: "text-sm leading-5 font-semibold" },
  { spec: "13 / 20 · Regular — table cells", className: "text-[13px] leading-5" },
  { spec: "11 / 16 · SemiBold — column headers", className: "text-[11px] leading-4 font-semibold uppercase tracking-[0.5px]" },
  { spec: "11 / 16 · Medium — pills", className: "text-[11px] leading-4 font-medium" },
]

const NUMERIC_CASES: { label: string; value: number }[] = [
  { label: "Positive", value: 4_320_750.5 },
  { label: "Negative", value: -1_250 },
  { label: "Zero", value: 0 },
  { label: "Large", value: 41_286_430 },
]

function StyleGuideTokens() {
  return (
    <>
      <FinanceSection title="Colour tokens">
        <div className="flex flex-col gap-5">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-[0.5px] uppercase">
                {group.title}
              </span>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {group.swatches.map((swatch) => (
                  <div
                    key={swatch.token}
                    className="border-stroke-default bg-surface-white flex flex-col overflow-hidden rounded-lg border"
                  >
                    <span aria-hidden className={cn("border-stroke-default h-12 border-b", swatch.className)} />
                    <span className="flex flex-col px-3 py-2">
                      <span className="text-content-primary font-mono text-xs leading-4">
                        --{swatch.token}
                      </span>
                      <span className="text-content-tertiary text-xs leading-4">{swatch.role}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection title="Typography scale">
        <div className="flex flex-col">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.spec}
              className="border-stroke-default flex flex-wrap items-baseline justify-between gap-4 border-b py-3"
            >
              <span className={cn("text-content-primary", row.className)}>Trial balance</span>
              <span className="text-content-tertiary text-[13px] leading-5">{row.spec}</span>
            </div>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection
        title="Numeric rendering"
        description="Two decimals, thousands separators, negatives in parentheses and a zero that never reads as a dash."
      >
        <div className="border-stroke-default bg-surface-white max-w-md overflow-hidden rounded-lg border">
          <div className="border-stroke-default text-content-tertiary flex justify-between border-b px-3 py-2 text-[11px] leading-4 font-semibold tracking-[0.5px] uppercase">
            <span>Case</span>
            <span>Amount (EGP)</span>
          </div>
          {NUMERIC_CASES.map((row) => (
            <div
              key={row.label}
              className="border-stroke-light flex items-center justify-between border-b px-3 py-2 text-[13px] leading-5 last:border-b-0"
            >
              <span className="text-content-secondary">{row.label}</span>
              <Amount value={row.value} aria-label={`${row.label}: ${formatAmount(row.value)}`} />
            </div>
          ))}
        </div>
      </FinanceSection>
    </>
  )
}

export { StyleGuideTokens }
