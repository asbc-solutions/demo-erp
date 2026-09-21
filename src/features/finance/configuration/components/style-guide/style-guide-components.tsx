"use client"

import * as React from "react"
import { Download, FileSearch, Printer } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Spinner } from "@/src/shared/components/ui/spinner"

import { AgingTiles } from "../../../components/shared/aging-tiles"
import { Amount } from "../../../components/shared/amount"
import { AttentionList } from "../../../components/shared/attention-list"
import { DocNumber } from "../../../components/shared/doc-number"
import { DocumentHistory } from "../../../components/shared/document-history"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  ColumnChooser,
  FilterBar,
  FilterChip,
  FilterIcon,
  FilterSearch,
  GroupBySelect,
  ResultCount,
  SelectionBar,
} from "../../../components/shared/filter-bar"
import { KeyValueList } from "../../../components/shared/key-value-list"
import { StatusPill } from "../../../components/shared/status-pill"
import {
  FINANCE_STATUSES,
  STATUS_FAMILY_COPY,
  STATUS_FAMILY_ORDER,
  type StatusKey,
} from "../../../lib/constants/statuses"

type SampleAccount = { id: string; code: string; name: string; balance: number }

const SAMPLE_COLUMNS: FinanceColumn<SampleAccount>[] = [
  { id: "code", header: "Code", cell: (row) => <DocNumber>{row.code}</DocNumber>, width: "w-40" },
  { id: "name", header: "Name", cell: (row) => row.name, hideable: true },
  {
    id: "balance",
    header: "Balance",
    align: "end",
    cell: (row) => <Amount value={row.balance} />,
    footer: <Amount value={32_274_830} emphasis="strong" />,
  },
]

const SAMPLE_GROUPS = [
  {
    id: "11",
    label: "11 · Current assets",
    summary: { balance: <Amount value={21_118_430} emphasis="strong" /> },
    rows: [
      { id: "110101", code: "110101", name: "Cash on hand", balance: 1_240_000 },
      { id: "110201", code: "110201", name: "CIB current account", balance: 6_482_300 },
    ],
  },
  {
    id: "12",
    label: "12 · Fixed assets",
    summary: { balance: <Amount value={11_156_400} emphasis="strong" /> },
    rows: [
      { id: "120101", code: "120101", name: "Machinery", balance: 13_406_400 },
      { id: "120901", code: "120901", name: "Accumulated depreciation", balance: -2_250_000 },
    ],
  },
]

function StatusVocabulary() {
  return (
    <FinanceSection
      title="Status vocabulary"
      description="Every status in the module belongs to one of four families. The family is carried by the border and marker as well as colour, so the difference survives greyscale and colour-blindness."
    >
      <FinanceAlert tone="warning">
        Confusing these is the expensive mistake. Someone who reads submitted as posted will close a
        period they should not have.
      </FinanceAlert>
      <div className="flex flex-col gap-5">
        {STATUS_FAMILY_ORDER.map((family) => {
          const keys = (Object.keys(FINANCE_STATUSES) as StatusKey[]).filter(
            (key) => FINANCE_STATUSES[key].family === family,
          )
          return (
            <div key={family} className="flex flex-col gap-2">
              <h3 className="text-content-primary text-sm leading-5 font-semibold">
                {STATUS_FAMILY_COPY[family].title}
              </h3>
              <p className="text-content-tertiary max-w-2xl text-[13px] leading-5">
                {STATUS_FAMILY_COPY[family].description}
              </p>
              <div className="flex flex-wrap gap-2">
                {keys.map((key) => (
                  <StatusPill key={key} status={key} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </FinanceSection>
  )
}

function StyleGuideComponents() {
  const [status, setStatus] = React.useState("all")
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>(["110101", "110201", "120101"])

  return (
    <>
      <FinanceSection title="Components">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">
            Post entry
          </Button>
          <Button variant="secondary" size="sm">
            Save draft
          </Button>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button variant="danger" size="sm">
            Reverse
          </Button>
          <Button variant="primary" size="sm" disabled aria-busy>
            <Spinner />
            Posting
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status="posted" />
          <StatusPill status="draft" />
          <StatusPill status="unreconciled" />
          <StatusPill status="overdue" />
          <StatusPill status="simulated" />
          <StatusPill status="void" tone="muted" family="internal" />
        </div>
        <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard layout="bar" accent="indigo" label="Cash on hand" value="5,731,150.00" caption="6 accounts" />
          <KpiCard layout="bar" accent="teal" label="Receivables" value="6,318,400.00" caption="1,748,400.00 overdue" />
          <KpiCard layout="bar" accent="amber" label="Payables" value="3,914,200.00" caption="due this week" />
        </div>
        <div className="flex max-w-4xl flex-col gap-3">
          <FinanceAlert
            tone="warning"
            action={
              <Button variant="secondary" size="sm">
                Renew
              </Button>
            }
          >
            The seal certificate expires in 9 days. Submissions will fail after 14 Apr 2026 until
            it&apos;s renewed. Renew the certificate with your provider and upload it in Finance
            settings.
          </FinanceAlert>
          <FinanceAlert tone="danger">
            This entry doesn&apos;t balance. Debits total 42,000.00 and credits total 41,500.00, a
            difference of 500.00. Adjust a line so both sides match, then post.
          </FinanceAlert>
          <FinanceAlert tone="success">
            Reconciliation complete. Difference is 0.00 across 42 matched lines. The statement is
            now stamped and locked for March.
          </FinanceAlert>
        </div>
      </FinanceSection>

      <StatusVocabulary />

      <FinanceSection
        title="Copy patterns — the three-sentence error"
        description="What happened, why it matters, and what to do next — always in that order."
      >
        <div className="flex max-w-4xl flex-col gap-3">
          <FinanceAlert tone="danger">
            The period is closed. Entries dated 15 Feb 2026 can&apos;t be posted while February is
            locked. Change the date to a date in an open period, or reopen February from Financial
            periods.
          </FinanceAlert>
          <FinanceAlert tone="danger">
            The tax authority rejected this document. Error 4004: item code EGS-1120 isn&apos;t
            registered for your activity. Map the item to a valid EGS or GS1 code in Items, then
            resubmit.
          </FinanceAlert>
        </div>
      </FinanceSection>

      <FinanceSection title="Loading and empty states">
        <FinanceTilesSkeleton />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmptyState
            variant="card"
            icon={<FileSearch />}
            title="No entries match these filters."
            description="Clear a filter or widen the period to see more journal entries."
            actions={
              <Button variant="secondary" size="sm">
                Clear filters
              </Button>
            }
          />
          <FinanceErrorState onRetry={() => undefined} />
        </div>
      </FinanceSection>

      <FinanceSection title="Aging">
        <AgingTiles
          buckets={[
            { id: "current", label: "Current", amount: 3_180_000 },
            { id: "1-30", label: "1–30", amount: 1_420_000 },
            { id: "31-60", label: "31–60", amount: 892_400 },
            { id: "61-90", label: "61–90", amount: 486_000 },
            { id: "90+", label: "90+", amount: 340_000 },
          ]}
        />
      </FinanceSection>

      <FinanceSection title="Document history">
        <DocumentHistory
          events={[
            {
              id: "e1",
              title: "Posted entry",
              actor: "Karim Fouad",
              at: "2026-03-31T09:14:00.000Z",
              reference: "JE-2026-000841",
            },
            { id: "e2", title: "Created draft", actor: "Hala Mostafa", at: "2026-03-30T17:02:00.000Z" },
          ]}
        />
      </FinanceSection>

      <FinanceSection title="Needs your attention">
        <AttentionList
          items={[
            { id: "a1", label: "18 unmatched bank lines on CIB current account", count: 18, tone: "danger" },
            { id: "a2", label: "Seal certificate expires in 14 days", count: 14, tone: "warning" },
            { id: "a3", label: "3 journals awaiting your approval", count: 3, tone: "info" },
          ]}
        />
      </FinanceSection>

      <FinanceSection title="Finance components">
        <div className="flex flex-wrap items-start gap-10">
          <div className="flex flex-col gap-1">
            <span className="text-content-tertiary font-mono text-xs">Amount</span>
            <Amount
              value={125_000}
              currency="USD"
              base={{ value: 6_078_750, currency: "EGP", rate: 48.63 }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-content-tertiary font-mono text-xs">KeyValueList</span>
            <KeyValueList
              items={[
                { term: "Entity", value: "EG-01" },
                { term: "Period", value: "March 2026" },
                { term: "Base currency", value: "EGP" },
              ]}
            />
          </div>
        </div>

        <FilterBar>
          <FilterSearch />
          <FilterIcon />
          <FilterChip
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "posted", label: "posted" },
              { value: "draft", label: "draft" },
            ]}
          />
          <ResultCount>42 entries</ResultCount>
        </FilterBar>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <GroupBySelect
            value={groupBy}
            onValueChange={setGroupBy}
            options={[
              { value: "none", label: "No grouping" },
              { value: "type", label: "Account type" },
            ]}
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Download aria-hidden />
              Export
            </Button>
            <Button variant="secondary" size="sm">
              <Printer aria-hidden />
              Print
            </Button>
            <ColumnChooser
              columns={[
                { id: "name", label: "Name" },
                { id: "balance", label: "Balance" },
              ]}
              hiddenIds={hiddenIds}
              onHiddenIdsChange={setHiddenIds}
            />
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <SelectionBar count={selectedIds.length} onClear={() => setSelectedIds([])}>
            <Button variant="secondary" size="sm">
              Export selected
            </Button>
          </SelectionBar>
        ) : null}

        <FinanceTable
          caption="Sample chart of accounts"
          columns={SAMPLE_COLUMNS}
          groups={SAMPLE_GROUPS}
          getRowId={(row) => row.id}
          hiddenColumnIds={hiddenIds}
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
        />
      </FinanceSection>
    </>
  )
}

export { StyleGuideComponents }
