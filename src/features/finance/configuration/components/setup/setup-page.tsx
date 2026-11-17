"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { useCompleteSetup } from "../../lib/mutations/configuration"
import { useSetup } from "../../lib/queries/configuration"
import type { ConfigMessageKey, ConfigTranslator, SetupDecision, SetupSummary } from "../../lib/types/configuration"
import { MONTH_NUMBERS, monthName } from "../../lib/utils/months"

const STEPS: ConfigMessageKey[] = ["stepIndustry", "stepCompany", "stepFinancialYear", "stepWhatWeSet"]

function buildDecisionColumns(t: ConfigTranslator): FinanceColumn<SetupDecision>[] {
  return [
    { id: "setting", header: t("setting"), cell: (row) => <span className="text-content-primary font-medium">{row.setting}</span> },
    { id: "value", header: t("weSet"), cell: (row) => row.value },
    { id: "because", header: t("because"), cell: (row) => <span className="text-content-secondary block max-w-md whitespace-normal">{row.because}</span> },
    {
      id: "href",
      header: t("changeItAt"),
      cell: (row) => (
        <Link href={row.href} className="text-brand-primary font-mono text-xs hover:underline">
          {row.href}
        </Link>
      ),
    },
  ]
}

type Choices = { industry: string; entity: string; month: string }

function Wizard({ data, onDone }: { data: SetupSummary; onDone: () => void }) {
  const t = useTranslations("FinanceConfiguration")
  const locale = useIntlLocale()
  const decisionColumns = React.useMemo(() => buildDecisionColumns(t), [t])
  const complete = useCompleteSetup()
  const [step, setStep] = React.useState(0)
  const [choices, setChoices] = React.useState<Choices>({
    industry: data.choices?.industry ?? "",
    entity: data.choices?.entity_id ?? data.entities[0]?.id ?? "",
    month: String(data.choices?.year_start_month ?? 1),
  })
  const industry = data.industries.find((row) => row.id === choices.industry)
  const entity = data.entities.find((row) => row.id === choices.entity)
  const decisions: SetupDecision[] = industry
    ? [
        { setting: t("stepCompany"), value: entity?.name ?? choices.entity, because: t("companyBecause"), href: "/finance" },
        {
          setting: t("financialYearStarts"),
          value: t("firstOfMonth", { month: monthName(Number(choices.month), locale) }),
          because: t("financialYearBecause"),
          href: "/finance/settings/fiscal-calendar",
        },
        ...industry.decisions,
      ]
    : []
  const canContinue = step === 0 ? Boolean(industry) : step === 1 ? Boolean(entity) : true

  return (
    <>
      <nav aria-label={t("setupSteps")} className="border-stroke-default border-b">
        <ol className="flex gap-6">
          {STEPS.map((labelKey, index) => (
            <li key={labelKey}>
              <button
                type="button"
                aria-current={index === step ? "step" : undefined}
                disabled={index > step}
                onClick={() => setStep(index)}
                className={cn(
                  "text-content-secondary -mb-px border-b-2 border-transparent pb-3 text-[13px] leading-5 outline-none focus-visible:underline disabled:cursor-default",
                  index === step && "border-brand-primary text-content-primary font-medium",
                )}
              >
                {t(labelKey)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col gap-6">
        <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
          {t("setupIntro")}
        </p>

        {step === 0 ? (
          <FinanceSection
            title={t("industryTitle")}
            description={t("industryDescription")}
          >
            <div role="radiogroup" aria-label={t("stepIndustry")} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.industries.map((option) => {
                const selected = choices.industry === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setChoices((current) => ({ ...current, industry: option.id }))}
                    className={cn(
                      "border-stroke-default bg-surface-white hover:border-stroke-input flex flex-col gap-1 rounded-xl border px-4 py-3.5 text-start outline-none focus-visible:ring-2",
                      selected && "border-brand-primary ring-brand-primary/20 ring-2",
                    )}
                  >
                    <span className="text-content-primary text-sm leading-5 font-medium">{option.name}</span>
                    <span className="text-content-secondary text-xs leading-4">{t("costsAnalysedByValue", { value: option.analysed_by })}</span>
                  </button>
                )
              })}
            </div>
          </FinanceSection>
        ) : null}

        {step === 1 ? (
          <FinanceSection title={t("companyTitle")} description={t("companyDescription")}>
            <Select value={choices.entity} onValueChange={(value) => setChoices((current) => ({ ...current, entity: value }))}>
              <SelectTrigger aria-label={t("stepCompany")} className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.entities.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FinanceSection>
        ) : null}

        {step === 2 ? (
          <FinanceSection title={t("yearStartTitle")} description={t("yearStartDescription")}>
            <Select value={choices.month} onValueChange={(value) => setChoices((current) => ({ ...current, month: value }))}>
              <SelectTrigger aria-label={t("financialYearStarts")} className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NUMBERS.map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {monthName(month, locale, "short")} 2026
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FinanceSection>
        ) : null}

        {step === 3 && industry ? (
          <FinanceSection title={t("whatWeSetTitle")} description={t("defaultsWillApply", { count: decisions.length })}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("taxCodesRegistered")} value={industry.tax_codes.length} caption={industry.tax_codes.join(" · ")} />
              <KpiCard layout="bar" accent="teal" label={t("costsAnalysedBy")} value={industry.analysed_by} />
              <KpiCard layout="bar" accent="amber" label={t("settings")} value={decisions.length} />
            </div>
            <FinanceTable caption={t("defaultsApplies")} columns={decisionColumns} rows={decisions} getRowId={(row) => row.setting} />
          </FinanceSection>
        ) : null}

        <div className="flex gap-2">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
              {t("back")}
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
              {t("continue")}
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={complete.isPending}
              onClick={() =>
                complete.mutate(
                  { industry: choices.industry, entity_id: choices.entity, year_start_month: Number(choices.month) },
                  {
                    onSuccess: () => {
                      toast.success(t("toastSetUp"))
                      onDone()
                    },
                    onError: (error) => toast.error(errorMessage(error, t("errorSetup"))),
                  },
                )
              }
            >
              {t("finishSetup")}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

/** 11.01 · Set up finance — four questions, then every default it applied and where to change it. */
function SetupPage() {
  const t = useTranslations("FinanceConfiguration")
  const decisionColumns = React.useMemo(() => buildDecisionColumns(t), [t])
  const { data, isError, refetch } = useSetup()
  const [rerun, setRerun] = React.useState(false)
  const showSummary = data?.completed && !rerun

  return (
    <>
      <FinancePageHeader
        title={t("setUpFinance")}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/finance">{showSummary ? t("backToFinance") : t("skipSetup")}</Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : showSummary && data.industry ? (
          <>
            <FinanceAlert
              tone="success"
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setRerun(true)}>
                    {t("runSetupAgain")}
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/finance/import">{t("importData")}</Link>
                  </Button>
                </div>
              }
            >
              {t("setupComplete", { industry: data.industry.name })}
              {data.dimension_created ? ` ${t("dimensionAdded", { dimension: data.industry.analysed_by })}` : ""}
            </FinanceAlert>
            <FinanceSection title={t("whatWeSetTitle")} description={t("defaultsWereApplied", { count: data.decisions.length })}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
                <KpiCard layout="bar" accent="indigo" label={t("taxCodesRegistered")} value={data.industry.tax_codes.length} caption={data.industry.tax_codes.join(" · ")} />
                <KpiCard layout="bar" accent="teal" label={t("costsAnalysedBy")} value={data.industry.analysed_by} />
                <KpiCard layout="bar" accent="amber" label={t("settings")} value={data.decisions.length} />
              </div>
              <FinanceTable caption={t("defaultsApplied")} columns={decisionColumns} rows={data.decisions} getRowId={(row) => row.setting} />
            </FinanceSection>
          </>
        ) : (
          <Wizard key={String(rerun)} data={data} onDone={() => setRerun(false)} />
        )}
      </FinancePageBody>
    </>
  )
}

export { SetupPage }
