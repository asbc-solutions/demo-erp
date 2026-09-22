"use client"

import * as React from "react"

import { Field, FieldDescription, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Switch } from "@/src/shared/components/ui/switch"
import { cn } from "@/src/shared/lib/utils/utils"

import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount } from "../../../lib/utils/money"
import { usePostingMap, useSimulation } from "../../lib/queries/configuration"
import type { SimulatedEntry } from "../../lib/types/configuration"

type Line = SimulatedEntry["lines"][number]

function entryColumns(entry: SimulatedEntry): FinanceColumn<Line>[] {
  return [
    {
      id: "account",
      header: "Account",
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-xs">{row.account_code}</span>
          <span className="text-content-primary">{row.name}</span>
        </span>
      ),
      footer: "Total",
    },
    { id: "debit", header: "Total debit", align: "end", cell: (row) => (row.debit ? <Amount value={row.debit} /> : null), footer: <Amount value={entry.debit ?? 0} emphasis="strong" /> },
    { id: "credit", header: "Total credit", align: "end", cell: (row) => (row.credit ? <Amount value={row.credit} /> : null), footer: <Amount value={entry.credit ?? 0} emphasis="strong" /> },
  ]
}

function EntryTable({ title, entry }: { title: string; entry: SimulatedEntry }) {
  return (
    <FinanceSection title={title}>
      {entry.refused ? (
        <FinanceAlert tone="danger">{entry.refused}</FinanceAlert>
      ) : (
        <FinanceTable caption={`${title} entry`} columns={entryColumns(entry)} rows={entry.lines} getRowId={(row) => `${row.account_code}-${row.debit}-${row.credit}`} />
      )}
    </FinanceSection>
  )
}

/** 11.04 · Posting simulator — the exact entry a document would post, before or after staged changes. */
function PostingSimulatorPage() {
  const { data: map, isError: mapError, refetch } = usePostingMap()
  const [ruleId, setRuleId] = React.useState("sale.local")
  const [amountText, setAmountText] = React.useState("100000")
  const [inclusive, setInclusive] = React.useState(false)
  const [useStaged, setUseStaged] = React.useState(false)
  const [view, setView] = React.useState<"result" | "compare">("result")
  const amount = Math.max(0, Number(amountText) || 0)
  const deferredAmount = React.useDeferredValue(amount)
  const { data, error } = useSimulation(ruleId, deferredAmount, inclusive)

  const rule = map?.rules.find((row) => row.id === ruleId)
  const side = rule ? (useStaged && rule.staged ? rule.staged : rule.current) : null
  const entry = data ? (useStaged && data.staged ? data.staged : data.current) : null
  const balanced = entry && !entry.refused ? Math.abs(entry.difference ?? 0) < 0.005 : false

  return (
    <>
      <FinancePageHeader
        title="Posting simulator"
        figure={<HeaderFigure label="Simulated amount (EGP)" size="lg">{formatAmount(amount)}</HeaderFigure>}
        actions={
          <div role="group" aria-label="Result view" className="bg-surface-hover border-stroke-default flex rounded-lg border p-1">
            {(
              [
                ["result", "Resulting entry"],
                ["compare", "Current vs staged entry"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "text-content-secondary rounded-md px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                  view === value && "bg-surface-white text-content-primary font-medium shadow-xs",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <FinancePageBody>
        {mapError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !map ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="sim-event">Document event</FieldLabel>
                <Select value={ruleId} onValueChange={setRuleId}>
                  <SelectTrigger id="sim-event">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {map.rules.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="sim-amount">Amount (EGP)</FieldLabel>
                <Input id="sim-amount" inputMode="decimal" className="text-right tabular-nums" value={amountText} onChange={(event) => setAmountText(event.target.value)} />
                <FieldDescription>{rule?.description}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="sim-inclusive">Tax code {side?.tax_code ? `· ${side.tax_code}` : ""}</FieldLabel>
                <div className="flex h-9 items-center gap-2.5">
                  <Switch id="sim-inclusive" checked={inclusive} disabled={!side?.tax_rate} onCheckedChange={setInclusive} />
                  <Label htmlFor="sim-inclusive" className="text-content-secondary text-[13px] font-normal">
                    Tax-inclusive amount
                  </Label>
                </div>
                <FieldDescription>{side?.tax_rate ? `${side.tax_rate}%` : "No tax on this event"}</FieldDescription>
              </Field>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-content-primary text-[13px] leading-5 font-medium">Simulate against staged map</span>
              <div className="flex items-center gap-2.5">
                <Switch id="sim-staged" checked={useStaged} onCheckedChange={setUseStaged} />
                <Label htmlFor="sim-staged" className="text-content-secondary text-[13px] font-normal">
                  {useStaged ? "Staged map" : "Current map"}
                </Label>
              </div>
              <p className="text-content-tertiary max-w-md text-xs leading-4">
                Off simulates the map as published today. On simulates what the map would do after you publish.
                {useStaged && !rule?.staged ? " This event has no staged change, so both maps post the same entry." : ""}
              </p>
            </div>

            {error ? <FinanceAlert tone="danger">{errorMessage(error, "The simulation could not run. Try again.")}</FinanceAlert> : null}

            {entry ? (
              view === "result" ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
                    <KpiCard layout="bar" accent="indigo" label="Total debit (EGP)" value={formatAmount(entry.debit ?? 0)} />
                    <KpiCard layout="bar" accent="teal" label="Total credit (EGP)" value={formatAmount(entry.credit ?? 0)} />
                    <KpiCard
                      layout="bar"
                      accent={entry.refused ? "danger" : balanced ? "success" : "danger"}
                      label="Difference"
                      value={entry.refused ? "Refused" : formatAmount(entry.difference ?? 0)}
                      caption={entry.refused ? "No entry would be created" : balanced ? "In balance" : "Out of balance"}
                    />
                  </div>
                  <p className="text-content-secondary text-[13px] leading-5">
                    This is the exact entry the posting engine would create. It balances or the document is refused.
                  </p>
                  <EntryTable title={useStaged && data?.staged ? "Staged" : "Current"} entry={entry} />
                </>
              ) : data ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <EntryTable title="Current" entry={data.current} />
                  {data.staged ? (
                    <EntryTable title="Staged" entry={data.staged} />
                  ) : (
                    <FinanceSection title="Staged">
                      <p className="text-content-secondary text-sm leading-5">No staged change for this event — both maps post the same entry.</p>
                    </FinanceSection>
                  )}
                </div>
              ) : null
            ) : null}
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { PostingSimulatorPage }
