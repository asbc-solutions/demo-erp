"use client"

import * as React from "react"
import { CircleX, PanelRightOpen, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Spinner } from "@/src/shared/components/ui/spinner"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import {
  ASSISTANT_ROLES,
  ASSISTANT_SUGGESTIONS,
  type AssistantTurn,
} from "../../lib/constants/assistant"
import type { AssistantSettings } from "../../lib/types/assistant"
import { AssistantAnswerView } from "./assistant-answer"
import { AssistantComposer } from "./assistant-composer"
import { AssistantContextAside } from "./assistant-context-aside"

export type AssistantScopeOption = { value: string; label: string }

export type AssistantScope = { entityId: string; period: string; role: string }

type AskTabProps = {
  offline: boolean
  turns: AssistantTurn[]
  busy: boolean
  settings: AssistantSettings | undefined
  scope: AssistantScope
  onScopeChange: (scope: AssistantScope) => void
  entityOptions: AssistantScopeOption[]
  periodOptions: AssistantScopeOption[]
  scopeLabel: string
  periodLabel: string
  onAsk: (question: string, apiQuestion?: string) => void
  onRetry: () => void
}

function ScopeSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value: string
  options: readonly AssistantScopeOption[]
  onValueChange: (value: string) => void
}) {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-content-secondary text-[13px] leading-5">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="h-9 w-auto min-w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function EmptyConversation({ onAsk }: { onAsk: (question: string, apiQuestion?: string) => void }) {
  const t = useTranslations("FinanceAssistant")
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Sparkles aria-hidden className="text-brand-primary size-6" />
      <div className="flex flex-col gap-1">
        <h2 className="text-content-primary text-base leading-6 font-semibold">{t("askCoreTitle")}</h2>
        <p className="text-content-tertiary text-sm leading-5">{t("askCoreDescription")}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-3 text-start md:grid-cols-2">
        {ASSISTANT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onAsk(t(suggestion.questionKey), suggestion.question)}
            className="border-stroke-default bg-surface-hover hover:border-stroke-input focus-visible:ring-brand-primary/20 flex flex-col gap-1.5 rounded-xl border p-3 outline-none transition-colors focus-visible:ring-[3px]"
          >
            <span className="text-content-primary flex items-center gap-1.5 text-[13px] leading-5 font-medium">
              <Sparkles aria-hidden className="text-brand-primary size-3.5" />
              {t(suggestion.titleKey)}
            </span>
            <span className="text-content-tertiary text-[13px] leading-5">{t(suggestion.questionKey)}</span>
          </button>
        ))}
      </div>
      <p className="text-content-tertiary text-[13px] leading-5">{t("answersReadOnly")}</p>
    </div>
  )
}

function OfflineConversation({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("FinanceAssistant")
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <CircleX aria-hidden className="text-status-danger-fg size-6" />
      <h2 className="text-content-primary text-sm leading-5 font-semibold">{t("unreachableTitle")}</h2>
      <p className="text-content-tertiary max-w-sm text-[13px] leading-5">{t("unreachableDescription")}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  )
}

/** Ask — a scoped conversation with Finance Core, with its grounding alongside. */
function AskTab({
  offline,
  turns,
  busy,
  settings,
  scope,
  onScopeChange,
  entityOptions,
  periodOptions,
  scopeLabel,
  periodLabel,
  onAsk,
  onRetry,
}: AskTabProps) {
  const t = useTranslations("FinanceAssistant")
  const { formatTime } = useFinanceDateFormat()
  const [showContext, setShowContext] = React.useState(true)
  const latestAnswer = [...turns].reverse().find((turn) => turn.answer)?.answer
  const roleOptions = ASSISTANT_ROLES.map((role) => ({ value: role.value, label: t(role.labelKey) }))
  const roleLabel = roleOptions.find((role) => role.value === scope.role)?.label ?? ""
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [turns])

  return (
    <div className="flex flex-col gap-6">
      {offline ? (
        <FinanceAlert tone="danger">
          {t.rich("unavailableAlert", {
            strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
            time: "14:49",
          })}
        </FinanceAlert>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <ScopeSelect
          label={t("entity")}
          value={scope.entityId}
          options={entityOptions}
          onValueChange={(entityId) => onScopeChange({ ...scope, entityId })}
        />
        <ScopeSelect
          label={t("period")}
          value={scope.period}
          options={periodOptions}
          onValueChange={(period) => onScopeChange({ ...scope, period })}
        />
        <ScopeSelect
          label={t("role")}
          value={scope.role}
          options={roleOptions}
          onValueChange={(role) => onScopeChange({ ...scope, role })}
        />
        {!showContext ? (
          <Button variant="secondary" size="sm" className="ms-auto" onClick={() => setShowContext(true)}>
            <PanelRightOpen aria-hidden className="rtl:-scale-x-100" />
            {t("showContext")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div
            aria-live="polite"
            className="border-stroke-input bg-surface-white flex min-h-[420px] flex-col gap-6 rounded-xl border p-4 shadow-xs"
          >
            {offline && turns.length === 0 ? (
              <OfflineConversation onRetry={onRetry} />
            ) : turns.length === 0 ? (
              <EmptyConversation onAsk={onAsk} />
            ) : (
              turns.map((turn) => (
                <div key={turn.id} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-content-tertiary text-[13px] leading-5">
                      {t("youAt", { time: turn.answer ? formatTime(turn.answer.asked_at) : t("now") })}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-content-primary text-sm leading-5">{turn.question}</p>
                      <StatusPill status="pending" label={turn.scopeLabel} />
                    </div>
                  </div>
                  {turn.status === "pending" ? (
                    <div className="text-content-tertiary flex items-center gap-2 ps-4 text-[13px] leading-5">
                      <Spinner className="size-3.5" />
                      {t("readingCore")}
                    </div>
                  ) : turn.status === "failed" || !turn.answer ? (
                    <FinanceAlert tone="danger">
                      {t("didNotAnswer")}
                    </FinanceAlert>
                  ) : (
                    <AssistantAnswerView answer={turn.answer} />
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <AssistantComposer disabled={offline} busy={busy} scopeLabel={scopeLabel} onSubmit={onAsk} />
        </div>

        {showContext ? (
          <AssistantContextAside
            answer={latestAnswer}
            offline={offline}
            settings={settings}
            roleLabel={roleLabel}
            entityCount={entityOptions.length}
            periodLabel={periodLabel}
            onHide={() => setShowContext(false)}
          />
        ) : null}
      </div>
    </div>
  )
}

export { AskTab }
