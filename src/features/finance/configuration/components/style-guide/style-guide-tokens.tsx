import type { Messages } from "next-intl"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceSection } from "../../../components/shared/finance-section"
import { formatAmount } from "../../../lib/utils/money"

type StyleGuideMessages = Messages["FinanceStyleGuide"]
type StyleGuideKey = {
  [K in keyof StyleGuideMessages]: StyleGuideMessages[K] extends string ? K : never
}[keyof StyleGuideMessages]

type Swatch = { token: string; roleKey: StyleGuideKey; className: string }

const SWATCH_GROUPS: { titleKey: StyleGuideKey; swatches: Swatch[] }[] = [
  {
    titleKey: "groupSurface",
    swatches: [
      { token: "surface-page", roleKey: "rolePageBackground", className: "bg-surface-page" },
      { token: "surface-white", roleKey: "rolePanel", className: "bg-surface-white" },
      { token: "surface-hover", roleKey: "roleFilterBar", className: "bg-surface-hover" },
      { token: "brand-primary/10", roleKey: "roleSelectedRow", className: "bg-brand-primary/10" },
    ],
  },
  {
    titleKey: "groupText",
    swatches: [
      { token: "content-primary", roleKey: "rolePrimary", className: "bg-content-primary" },
      { token: "content-secondary", roleKey: "roleSecondary", className: "bg-content-secondary" },
      { token: "content-tertiary", roleKey: "roleMuted", className: "bg-content-tertiary" },
      { token: "content-quaternary", roleKey: "roleDisabled", className: "bg-content-quaternary" },
    ],
  },
  {
    titleKey: "groupStroke",
    swatches: [
      { token: "stroke-default", roleKey: "roleDecorative", className: "bg-stroke-default" },
      { token: "stroke-input", roleKey: "roleControl", className: "bg-stroke-input" },
      { token: "brand-primary", roleKey: "roleFocusRing", className: "bg-brand-primary" },
    ],
  },
  {
    titleKey: "groupStatus",
    swatches: [
      { token: "status-success-fg", roleKey: "rolePosted", className: "bg-status-success-fg" },
      { token: "status-warning-fg", roleKey: "roleAttention", className: "bg-status-warning-fg" },
      { token: "status-danger-fg", roleKey: "roleOverdue", className: "bg-status-danger-fg" },
      { token: "status-info-fg", roleKey: "roleDraft", className: "bg-status-info-fg" },
      { token: "status-neutral-fg", roleKey: "roleSimulated", className: "bg-status-neutral-fg" },
    ],
  },
  {
    titleKey: "groupSeries",
    swatches: [
      { token: "series-1", roleKey: "series1", className: "bg-series-1" },
      { token: "series-2", roleKey: "series2", className: "bg-series-2" },
      { token: "series-3", roleKey: "series3", className: "bg-series-3" },
      { token: "series-4", roleKey: "series4", className: "bg-series-4" },
      { token: "series-5", roleKey: "series5", className: "bg-series-5" },
      { token: "series-6", roleKey: "series6", className: "bg-series-6" },
    ],
  },
]

const TYPE_SCALE: { size: string; roleKey: StyleGuideKey; className: string }[] = [
  { size: "24 / 32", roleKey: "typeGoverningFigure", className: "text-2xl leading-8 font-bold" },
  { size: "20 / 28", roleKey: "typePageTitle", className: "text-xl leading-7 font-semibold" },
  { size: "18 / 26", roleKey: "typeSection", className: "text-lg leading-[26px] font-semibold" },
  { size: "16 / 24", roleKey: "typeCard", className: "text-base leading-6 font-semibold" },
  { size: "16 / 24", roleKey: "typeLead", className: "text-base leading-6" },
  { size: "14 / 20", roleKey: "typeBody", className: "text-sm leading-5" },
  { size: "14 / 20", roleKey: "typeTotals", className: "text-sm leading-5 font-medium" },
  { size: "14 / 20", roleKey: "typeGrandTotal", className: "text-sm leading-5 font-semibold" },
  { size: "13 / 20", roleKey: "typeTableCells", className: "text-[13px] leading-5" },
  { size: "11 / 16", roleKey: "typeColumnHeaders", className: "text-[11px] leading-4 font-semibold uppercase tracking-[0.5px]" },
  { size: "11 / 16", roleKey: "typePills", className: "text-[11px] leading-4 font-medium" },
]

const NUMERIC_CASES: { labelKey: StyleGuideKey; value: number }[] = [
  { labelKey: "casePositive", value: 4_320_750.5 },
  { labelKey: "caseNegative", value: -1_250 },
  { labelKey: "caseZero", value: 0 },
  { labelKey: "caseLarge", value: 41_286_430 },
]

function StyleGuideTokens() {
  const t = useTranslations("FinanceStyleGuide")
  return (
    <>
      <FinanceSection title={t("colourTokens")}>
        <div className="flex flex-col gap-5">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.titleKey} className="flex flex-col gap-2">
              <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-[0.5px] uppercase">
                {t(group.titleKey)}
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
                      <span className="text-content-tertiary text-xs leading-4">{t(swatch.roleKey)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection title={t("typographyScale")}>
        <div className="flex flex-col">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.roleKey}
              className="border-stroke-default flex flex-wrap items-baseline justify-between gap-4 border-b py-3"
            >
              <span className={cn("text-content-primary", row.className)}>{t("sampleTrialBalance")}</span>
              <span className="text-content-tertiary text-[13px] leading-5">{t("typeSpec", { size: row.size, role: t(row.roleKey) })}</span>
            </div>
          ))}
        </div>
      </FinanceSection>

      <FinanceSection
        title={t("numericRendering")}
        description={t("numericRenderingDescription")}
      >
        <div className="border-stroke-default bg-surface-white max-w-md overflow-hidden rounded-lg border">
          <div className="border-stroke-default text-content-tertiary flex justify-between border-b px-3 py-2 text-[11px] leading-4 font-semibold tracking-[0.5px] uppercase">
            <span>{t("case")}</span>
            <span>{t("amountEgp")}</span>
          </div>
          {NUMERIC_CASES.map((row) => (
            <div
              key={row.labelKey}
              className="border-stroke-light flex items-center justify-between border-b px-3 py-2 text-[13px] leading-5 last:border-b-0"
            >
              <span className="text-content-secondary">{t(row.labelKey)}</span>
              <Amount value={row.value} aria-label={t("caseAmount", { label: t(row.labelKey), amount: formatAmount(row.value) })} />
            </div>
          ))}
        </div>
      </FinanceSection>
    </>
  )
}

export { StyleGuideTokens }
