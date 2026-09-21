"use client"

import * as React from "react"
import { Search, SendHorizontal } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"

type AssistantComposerProps = {
  disabled: boolean
  busy: boolean
  scopeLabel: string
  onSubmit: (question: string) => void
}

/** The question box. Enter sends; the scope the answer will use is stated underneath. */
function AssistantComposer({ disabled, busy, scopeLabel, onSubmit }: AssistantComposerProps) {
  const [question, setQuestion] = React.useState("")
  const inputId = React.useId()
  const canSend = !disabled && !busy && question.trim().length > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    onSubmit(question.trim())
    setQuestion("")
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={submit}
        className="border-stroke-input bg-surface-white focus-within:border-brand-primary focus-within:ring-brand-primary/15 flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-xs transition-[border-color,box-shadow] focus-within:ring-[3px]"
      >
        <Search aria-hidden className="text-content-quaternary size-4 shrink-0" />
        <label htmlFor={inputId} className="sr-only">
          Ask the finance assistant
        </label>
        <input
          id={inputId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? "The assistant is offline — Briefing and Drafts still work"
              : "Ask about accounts, balances, tax, close or approvals…"
          }
          className="text-content-primary placeholder:text-content-tertiary min-w-0 flex-1 bg-transparent py-1 text-sm leading-5 outline-none disabled:cursor-not-allowed"
        />
        <Button type="submit" variant="primary" size="sm" disabled={!canSend}>
          Send
          <SendHorizontal aria-hidden />
        </Button>
      </form>
      <p className="text-content-tertiary text-[13px] leading-5">Scope: {scopeLabel}</p>
    </div>
  )
}

export { AssistantComposer }
