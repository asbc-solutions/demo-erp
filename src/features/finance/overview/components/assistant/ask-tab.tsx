"use client"

import * as React from "react"
import { CircleX, PanelRightOpen, Sparkles } from "lucide-react"

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
import { formatTime } from "../../../lib/utils/date"
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
  onAsk: (question: string) => void
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

function EmptyConversation({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Sparkles aria-hidden className="text-brand-primary size-6" />
      <div className="flex flex-col gap-1">
        <h2 className="text-content-primary text-base leading-6 font-semibold">Ask Finance Core</h2>
        <p className="text-content-tertiary text-sm leading-5">
          Search records, explain a rule, compare figures, or find what needs a person today.
        </p>
      </div>
      <div className="grid w-full grid-cols-1 gap-3 text-left md:grid-cols-2">
        {ASSISTANT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onAsk(suggestion.question)}
            className="border-stroke-default bg-surface-hover hover:border-stroke-input focus-visible:ring-brand-primary/20 flex flex-col gap-1.5 rounded-xl border p-3 outline-none transition-colors focus-visible:ring-[3px]"
          >
            <span className="text-content-primary flex items-center gap-1.5 text-[13px] leading-5 font-medium">
              <Sparkles aria-hidden className="text-brand-primary size-3.5" />
              {suggestion.title}
            </span>
            <span className="text-content-tertiary text-[13px] leading-5">{suggestion.question}</span>
          </button>
        ))}
      </div>
      <p className="text-content-tertiary text-[13px] leading-5">
        Answers are read-only — the assistant proposes, people act.
      </p>
    </div>
  )
}

function OfflineConversation({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <CircleX aria-hidden className="text-status-danger-fg size-6" />
      <h2 className="text-content-primary text-sm leading-5 font-semibold">Could not reach the assistant</h2>
      <p className="text-content-tertiary max-w-sm text-[13px] leading-5">
        Retry, or open Briefing — it reads Finance Core directly and needs no model.
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
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
  const [showContext, setShowContext] = React.useState(true)
  const latestAnswer = [...turns].reverse().find((turn) => turn.answer)?.answer
  const roleLabel = ASSISTANT_ROLES.find((role) => role.value === scope.role)?.label ?? ""
  const endRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [turns])

  return (
    <div className="flex flex-col gap-6">
      {offline ? (
        <FinanceAlert tone="danger">
          <strong className="font-semibold">The assistant is unavailable.</strong> The model endpoint
          did not respond (14:49). Briefing and Drafts still work from Finance Core directly, and every
          existing screen is unaffected. Try again in a few minutes.
        </FinanceAlert>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <ScopeSelect
          label="Entity"
          value={scope.entityId}
          options={entityOptions}
          onValueChange={(entityId) => onScopeChange({ ...scope, entityId })}
        />
        <ScopeSelect
          label="Period"
          value={scope.period}
          options={periodOptions}
          onValueChange={(period) => onScopeChange({ ...scope, period })}
        />
        <ScopeSelect
          label="Role"
          value={scope.role}
          options={ASSISTANT_ROLES}
          onValueChange={(role) => onScopeChange({ ...scope, role })}
        />
        {!showContext ? (
          <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setShowContext(true)}>
            <PanelRightOpen aria-hidden />
            Show context
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
                      You · {turn.answer ? formatTime(turn.answer.asked_at) : "now"}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-content-primary text-sm leading-5">{turn.question}</p>
                      <StatusPill status="pending" label={turn.scopeLabel} />
                    </div>
                  </div>
                  {turn.status === "pending" ? (
                    <div className="text-content-tertiary flex items-center gap-2 pl-4 text-[13px] leading-5">
                      <Spinner className="size-3.5" />
                      Reading Finance Core…
                    </div>
                  ) : turn.status === "failed" || !turn.answer ? (
                    <FinanceAlert tone="danger">
                      The assistant did not answer. Nothing was read. Ask again, or open Briefing.
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
