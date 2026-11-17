"use client"

import * as React from "react"
import { History, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/components/ui/tabs"

import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceScope } from "../../../lib/context/finance-scope"
import { useFinanceEntities, useFinancePeriods } from "../../../lib/queries/shell"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { AssistantTurn } from "../../lib/constants/assistant"
import { useAskAssistant } from "../../lib/mutations/overview"
import { useAssistantSettings } from "../../lib/queries/overview"
import { AskTab, type AssistantScope } from "./ask-tab"
import { BriefingTab } from "./briefing-tab"
import { DraftsTab } from "./drafts-tab"
import { HistoryDialog } from "./history-dialog"
import { SettingsTab } from "./settings-tab"

/** The assistant answers about the period being closed unless told otherwise. */
const DEFAULT_PERIOD = "2026-03"

type AssistantTab = "ask" | "briefing" | "drafts" | "settings"

/**
 * 01.03 · Assistant — read-only questions over Finance Core. Answers are
 * scripted in the demo layer; "Simulate outage" shows how the screen degrades
 * (Briefing and Drafts keep working because they need no model).
 */
function AssistantPage() {
  const t = useTranslations("FinanceAssistant")
  const { formatPeriodRange } = useFinanceDateFormat()
  const { scope: financeScope } = useFinanceScope()
  const { data: entities = [] } = useFinanceEntities()
  const { data: periods = [] } = useFinancePeriods()
  const { data: settings } = useAssistantSettings()
  const ask = useAskAssistant()

  const [tab, setTab] = React.useState<AssistantTab>("ask")
  const [offline, setOffline] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [turns, setTurns] = React.useState<AssistantTurn[]>([])
  const [scope, setScope] = React.useState<AssistantScope>({
    entityId: financeScope.entityId,
    period: DEFAULT_PERIOD,
    role: "finance-admin",
  })

  const entity = entities.find((row) => row.id === scope.entityId)
  const period = periods.find((row) => row.id === scope.period)
  const periodLabel = period ? formatPeriodRange(period.start_date, period.end_date) : scope.period
  const scopeLabel = `${entity?.code ?? scope.entityId} · ${periodLabel}`
  const enabledGroups = settings
    ? settings.groups.filter((group) => group.available && settings.data_groups[group.id]).length
    : null

  /** `apiQuestion` is sent instead of the shown text, e.g. a starter question's English original. */
  const submit = (question: string, apiQuestion: string = question) => {
    setTab("ask")
    const id = `turn-${Date.now()}`
    if (offline) {
      setTurns((current) => [...current, { id, question, scopeLabel, status: "failed" }])
      return
    }
    setTurns((current) => [...current, { id, question, scopeLabel, status: "pending" }])
    ask.mutate(
      { question: apiQuestion, scope_label: scopeLabel },
      {
        onSuccess: (answer) =>
          setTurns((current) =>
            current.map((turn) => (turn.id === id ? { ...turn, status: "answered", answer } : turn)),
          ),
        onError: () =>
          setTurns((current) =>
            current.map((turn) => (turn.id === id ? { ...turn, status: "failed" } : turn)),
          ),
      },
    )
  }

  return (
    <>
      <FinancePageHeader
        title={t("title")}
        actions={
          <>
            <Button variant="ghost" onClick={() => setOffline((value) => !value)}>
              {offline ? t("restore") : t("simulateOutage")}
            </Button>
            <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
              <History aria-hidden />
              {t("history")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTurns([])
                setTab("ask")
              }}
            >
              <Plus aria-hidden />
              {t("newConversation")}
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <Tabs value={tab} onValueChange={(value) => setTab(value as AssistantTab)} className="gap-6">
          <TabsList>
            <TabsTrigger value="ask">{t("tabAsk")}</TabsTrigger>
            <TabsTrigger value="briefing">{t("tabBriefing")}</TabsTrigger>
            <TabsTrigger value="drafts">{t("tabDrafts")}</TabsTrigger>
            <TabsTrigger value="settings">{t("tabSettings")}</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            {offline ? (
              <StatusPill status="failed" label={t("assistantOffline")} />
            ) : (
              <StatusPill status="posted" label={t("coreConnected")} />
            )}
            {enabledGroups !== null ? (
              <StatusPill status="pending" label={t("dataGroupsCount", { count: enabledGroups })} />
            ) : null}
            <StatusPill status="prepared" label={t("readOnly")} />
            <p className="text-content-tertiary ms-auto text-[13px] leading-5">{t("intro")}</p>
          </div>

          <TabsContent value="ask">
            <AskTab
              offline={offline}
              turns={turns}
              busy={ask.isPending}
              settings={settings}
              scope={scope}
              onScopeChange={setScope}
              entityOptions={entities.map((row) => ({ value: row.id, label: `${row.code} · ${row.name}` }))}
              periodOptions={periods.map((row) => ({
                value: row.id,
                label: formatPeriodRange(row.start_date, row.end_date),
              }))}
              scopeLabel={scopeLabel}
              periodLabel={periodLabel}
              onAsk={submit}
              onRetry={() => toast.info(t("stillUnavailable"))}
            />
          </TabsContent>
          <TabsContent value="briefing">
            <BriefingTab entityCode={entity?.code ?? scope.entityId} scopeLabel={scopeLabel} onAsk={submit} />
          </TabsContent>
          <TabsContent value="drafts">
            <DraftsTab scopeLabel={scopeLabel} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab settings={settings} />
          </TabsContent>
        </Tabs>
      </FinancePageBody>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        retentionDays={settings?.retention_days ?? 90}
        onPick={(question) => {
          setHistoryOpen(false)
          submit(question)
        }}
      />
    </>
  )
}

export { AssistantPage }
