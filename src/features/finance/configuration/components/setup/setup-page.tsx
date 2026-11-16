"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { toast } from "sonner"

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
import type { SetupDecision, SetupSummary } from "../../lib/types/configuration"

const STEPS = ["Industry", "Company", "Financial year", "What we set"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const DECISION_COLUMNS: FinanceColumn<SetupDecision>[] = [
  { id: "setting", header: "Setting", cell: (row) => <span className="text-content-primary font-medium">{row.setting}</span> },
  { id: "value", header: "We set", cell: (row) => row.value },
  { id: "because", header: "Because", cell: (row) => <span className="text-content-secondary block max-w-md whitespace-normal">{row.because}</span> },
  {
    id: "href",
    header: "Change it at",
    cell: (row) => (
      <Link href={row.href} className="text-brand-primary font-mono text-xs hover:underline">
        {row.href}
      </Link>
    ),
  },
]

type Choices = { industry: string; entity: string; month: string }

function Wizard({ data, onDone }: { data: SetupSummary; onDone: () => void }) {
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
        { setting: "Company", value: entity?.name ?? choices.entity, because: "Each company keeps its own ledger and its own reports.", href: "/finance" },
        { setting: "Financial year starts", value: `1 ${MONTHS[Number(choices.month) - 1]}`, because: "Twelve monthly periods are created from this date, and you close them one at a time.", href: "/finance/settings/fiscal-calendar" },
        ...industry.decisions,
      ]
    : []
  const canContinue = step === 0 ? Boolean(industry) : step === 1 ? Boolean(entity) : true

  return (
    <>
      <nav aria-label="Setup steps" className="border-stroke-default border-b">
        <ol className="flex gap-6">
          {STEPS.map((label, index) => (
            <li key={label}>
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
                {label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-col gap-6">
        <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
          Four questions, then we configure the module and show you exactly what we decided. Every choice is reversible and we
          say where to change each one.
        </p>

        {step === 0 ? (
          <FinanceSection
            title="What does the business do?"
            description="This decides how revenue is recognised, which tax codes are registered, and what you analyse costs by. Nothing here is guessed — the next step lists every decision it makes."
          >
            <div role="radiogroup" aria-label="Industry" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <span className="text-content-secondary text-xs leading-4">Costs analysed by: {option.analysed_by}</span>
                  </button>
                )
              })}
            </div>
          </FinanceSection>
        ) : null}

        {step === 1 ? (
          <FinanceSection title="Which company are you setting up?" description="You can add more companies later. Each keeps its own ledger and its own reports.">
            <Select value={choices.entity} onValueChange={(value) => setChoices((current) => ({ ...current, entity: value }))}>
              <SelectTrigger aria-label="Company" className="w-full max-w-md">
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
          <FinanceSection title="When does the financial year start?" description="Twelve monthly periods are created from this date. You can close them one at a time.">
            <Select value={choices.month} onValueChange={(value) => setChoices((current) => ({ ...current, month: value }))}>
              <SelectTrigger aria-label="Financial year starts" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>
                    {month.slice(0, 3)} 2026
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FinanceSection>
        ) : null}

        {step === 3 && industry ? (
          <FinanceSection title="What we set, and where to change it" description={`${decisions.length} defaults will be applied. Each one says why, and links to where you change it. Nothing is hidden.`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Tax codes registered" value={industry.tax_codes.length} caption={industry.tax_codes.join(" · ")} />
              <KpiCard layout="bar" accent="teal" label="Costs analysed by" value={industry.analysed_by} />
              <KpiCard layout="bar" accent="amber" label="Settings" value={decisions.length} />
            </div>
            <FinanceTable caption="Defaults the setup applies" columns={DECISION_COLUMNS} rows={decisions} getRowId={(row) => row.setting} />
          </FinanceSection>
        ) : null}

        <div className="flex gap-2">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>
              Continue
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
                      toast.success("Finance is set up.")
                      onDone()
                    },
                    onError: (error) => toast.error(errorMessage(error, "Setup could not finish. Try again.")),
                  },
                )
              }
            >
              Finish setup
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

/** 11.01 · Set up finance — four questions, then every default it applied and where to change it. */
function SetupPage() {
  const { data, isError, refetch } = useSetup()
  const [rerun, setRerun] = React.useState(false)
  const showSummary = data?.completed && !rerun

  return (
    <>
      <FinancePageHeader
        title="Set up finance"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/finance">{showSummary ? "Back to finance" : "Skip setup"}</Link>
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
                    Run setup again
                  </Button>
                  <Button variant="primary" size="sm" asChild>
                    <Link href="/finance/import">Import data</Link>
                  </Button>
                </div>
              }
            >
              Setup complete. The module is configured for {data.industry.name.toLowerCase()}. Everything below is editable, and
              this prototype applies the choices to this session only.
              {data.dimension_created ? ` A ${data.industry.analysed_by} dimension was added to Dimensions.` : ""}
            </FinanceAlert>
            <FinanceSection title="What we set, and where to change it" description={`${data.decisions.length} defaults were applied. Each one says why, and links to where you change it. Nothing is hidden.`}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
                <KpiCard layout="bar" accent="indigo" label="Tax codes registered" value={data.industry.tax_codes.length} caption={data.industry.tax_codes.join(" · ")} />
                <KpiCard layout="bar" accent="teal" label="Costs analysed by" value={data.industry.analysed_by} />
                <KpiCard layout="bar" accent="amber" label="Settings" value={data.decisions.length} />
              </div>
              <FinanceTable caption="Defaults the setup applied" columns={DECISION_COLUMNS} rows={data.decisions} getRowId={(row) => row.setting} />
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
