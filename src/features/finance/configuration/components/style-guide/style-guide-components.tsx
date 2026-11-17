"use client"

import * as React from "react"
import { Download, FileSearch, Printer } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { StatusPill, useStatusLabel } from "../../../components/shared/status-pill"
import {
  FINANCE_STATUSES,
  STATUS_FAMILY_ORDER,
  type StatusKey,
} from "../../../lib/constants/statuses"

type SampleAccount = { id: string; code: string; name: string; balance: number }

type StyleGuideTranslator = ReturnType<typeof useTranslations<"FinanceStyleGuide">>

function buildSampleColumns(t: StyleGuideTranslator): FinanceColumn<SampleAccount>[] {
  return [
    { id: "code", header: t("code"), cell: (row) => <DocNumber>{row.code}</DocNumber>, width: "w-40" },
    { id: "name", header: t("name"), cell: (row) => row.name, hideable: true },
    {
      id: "balance",
      header: t("balance"),
      align: "end",
      cell: (row) => <Amount value={row.balance} />,
      footer: <Amount value={32_274_830} emphasis="strong" />,
    },
  ]
}

function buildSampleGroups(t: StyleGuideTranslator) {
  return [
    {
      id: "11",
      label: t("sampleCurrentAssets"),
      summary: { balance: <Amount value={21_118_430} emphasis="strong" /> },
      rows: [
        { id: "110101", code: "110101", name: "Cash on hand", balance: 1_240_000 },
        { id: "110201", code: "110201", name: "CIB current account", balance: 6_482_300 },
      ],
    },
    {
      id: "12",
      label: t("sampleFixedAssets"),
      summary: { balance: <Amount value={11_156_400} emphasis="strong" /> },
      rows: [
        { id: "120101", code: "120101", name: "Machinery", balance: 13_406_400 },
        { id: "120901", code: "120901", name: "Accumulated depreciation", balance: -2_250_000 },
      ],
    },
  ]
}

function StatusVocabulary() {
  const t = useTranslations("FinanceStyleGuide")
  return (
    <FinanceSection
      title={t("statusVocabulary")}
      description={t("statusVocabularyDescription")}
    >
      <FinanceAlert tone="warning">
        {t("statusVocabularyWarning")}
      </FinanceAlert>
      <div className="flex flex-col gap-5">
        {STATUS_FAMILY_ORDER.map((family) => {
          const keys = (Object.keys(FINANCE_STATUSES) as StatusKey[]).filter(
            (key) => FINANCE_STATUSES[key].family === family,
          )
          return (
            <div key={family} className="flex flex-col gap-2">
              <h3 className="text-content-primary text-sm leading-5 font-semibold">
                {t(`familyTitle.${family}`)}
              </h3>
              <p className="text-content-tertiary max-w-2xl text-[13px] leading-5">
                {t(`familyDescription.${family}`)}
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
  const t = useTranslations("FinanceStyleGuide")
  const statusLabel = useStatusLabel()
  const sampleColumns = React.useMemo(() => buildSampleColumns(t), [t])
  const sampleGroups = React.useMemo(() => buildSampleGroups(t), [t])
  const [status, setStatus] = React.useState("all")
  const [groupBy, setGroupBy] = React.useState("none")
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>(["110101", "110201", "120101"])

  return (
    <>
      <FinanceSection title={t("components")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm">
            {t("postEntry")}
          </Button>
          <Button variant="secondary" size="sm">
            {t("saveDraft")}
          </Button>
          <Button variant="ghost" size="sm">
            {t("cancel")}
          </Button>
          <Button variant="danger" size="sm">
            {t("reverse")}
          </Button>
          <Button variant="primary" size="sm" disabled aria-busy>
            <Spinner />
            {t("posting")}
          </Button>
          <Button variant="secondary" size="sm" disabled>
            {t("disabled")}
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
          <KpiCard layout="bar" accent="indigo" label={t("kpiCashOnHand")} value="5,731,150.00" caption={t("kpiAccounts", { count: 6 })} />
          <KpiCard layout="bar" accent="teal" label={t("kpiReceivables")} value="6,318,400.00" caption={t("kpiOverdue", { amount: "1,748,400.00" })} />
          <KpiCard layout="bar" accent="amber" label={t("kpiPayables")} value="3,914,200.00" caption={t("kpiDueThisWeek")} />
        </div>
        <div className="flex max-w-4xl flex-col gap-3">
          <FinanceAlert
            tone="warning"
            action={
              <Button variant="secondary" size="sm">
                {t("renew")}
              </Button>
            }
          >
            {t("sampleCertificateAlert")}
          </FinanceAlert>
          <FinanceAlert tone="danger">
            {t("sampleUnbalancedAlert")}
          </FinanceAlert>
          <FinanceAlert tone="success">
            {t("sampleReconciledAlert")}
          </FinanceAlert>
        </div>
      </FinanceSection>

      <StatusVocabulary />

      <FinanceSection
        title={t("copyPatterns")}
        description={t("copyPatternsDescription")}
      >
        <div className="flex max-w-4xl flex-col gap-3">
          <FinanceAlert tone="danger">
            {t("samplePeriodClosedError")}
          </FinanceAlert>
          <FinanceAlert tone="danger">
            {t("sampleRejectedError")}
          </FinanceAlert>
        </div>
      </FinanceSection>

      <FinanceSection title={t("loadingAndEmpty")}>
        <FinanceTilesSkeleton />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmptyState
            variant="card"
            icon={<FileSearch />}
            title={t("sampleEmptyTitle")}
            description={t("sampleEmptyDescription")}
            actions={
              <Button variant="secondary" size="sm">
                {t("clearFilters")}
              </Button>
            }
          />
          <FinanceErrorState onRetry={() => undefined} />
        </div>
      </FinanceSection>

      <FinanceSection title={t("aging")}>
        <AgingTiles
          buckets={[
            { id: "current", label: t("agingCurrent"), amount: 3_180_000 },
            { id: "1-30", label: "1–30", amount: 1_420_000 },
            { id: "31-60", label: "31–60", amount: 892_400 },
            { id: "61-90", label: "61–90", amount: 486_000 },
            { id: "90+", label: "90+", amount: 340_000 },
          ]}
        />
      </FinanceSection>

      <FinanceSection title={t("documentHistory")}>
        <DocumentHistory
          events={[
            {
              id: "e1",
              title: t("historyPostedEntry"),
              actor: "Karim Fouad",
              at: "2026-03-31T09:14:00.000Z",
              reference: "JE-2026-000841",
            },
            { id: "e2", title: t("historyCreatedDraft"), actor: "Hala Mostafa", at: "2026-03-30T17:02:00.000Z" },
          ]}
        />
      </FinanceSection>

      <FinanceSection title={t("needsAttention")}>
        <AttentionList
          items={[
            { id: "a1", label: t("attentionUnmatched", { count: 18, account: "CIB current account" }), count: 18, tone: "danger" },
            { id: "a2", label: t("attentionCertificate", { count: 14 }), count: 14, tone: "warning" },
            { id: "a3", label: t("attentionApprovals", { count: 3 }), count: 3, tone: "info" },
          ]}
        />
      </FinanceSection>

      <FinanceSection title={t("financeComponents")}>
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
                { term: t("entity"), value: "EG-01" },
                { term: t("period"), value: t("sampleMarch2026") },
                { term: t("baseCurrency"), value: "EGP" },
              ]}
            />
          </div>
        </div>

        <FilterBar>
          <FilterSearch />
          <FilterIcon />
          <FilterChip
            label={t("status")}
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "posted", label: statusLabel("posted") },
              { value: "draft", label: statusLabel("draft") },
            ]}
          />
          <ResultCount>{t("entriesCount", { count: 42 })}</ResultCount>
        </FilterBar>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <GroupBySelect
            value={groupBy}
            onValueChange={setGroupBy}
            options={[
              { value: "none", label: t("noGrouping") },
              { value: "type", label: t("accountType") },
            ]}
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <Download aria-hidden />
              {t("export")}
            </Button>
            <Button variant="secondary" size="sm">
              <Printer aria-hidden />
              {t("print")}
            </Button>
            <ColumnChooser
              columns={[
                { id: "name", label: t("name") },
                { id: "balance", label: t("balance") },
              ]}
              hiddenIds={hiddenIds}
              onHiddenIdsChange={setHiddenIds}
            />
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <SelectionBar count={selectedIds.length} onClear={() => setSelectedIds([])}>
            <Button variant="secondary" size="sm">
              {t("exportSelected")}
            </Button>
          </SelectionBar>
        ) : null}

        <FinanceTable
          caption={t("sampleChartCaption")}
          columns={sampleColumns}
          groups={sampleGroups}
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
