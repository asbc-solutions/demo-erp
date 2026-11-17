"use client"

import * as React from "react"
import { Search, SendHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"

type AssistantComposerProps = {
  disabled: boolean
  busy: boolean
  scopeLabel: string
  onSubmit: (question: string) => void
}

/** The question box. Enter sends; the scope the answer will use is stated underneath. */
function AssistantComposer({ disabled, busy, scopeLabel, onSubmit }: AssistantComposerProps) {
  const t = useTranslations("FinanceAssistant")
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
          {t("composerLabel")}
        </label>
        <input
          id={inputId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled}
          placeholder={disabled ? t("composerOfflinePlaceholder") : t("composerPlaceholder")}
          className="text-content-primary placeholder:text-content-tertiary min-w-0 flex-1 bg-transparent py-1 text-sm leading-5 outline-none disabled:cursor-not-allowed"
        />
        <Button type="submit" variant="primary" size="sm" disabled={!canSend}>
          {t("send")}
          <SendHorizontal aria-hidden className="rtl:rotate-180" />
        </Button>
      </form>
      <p className="text-content-tertiary text-[13px] leading-5">{t("scopeLabel", { scope: scopeLabel })}</p>
    </div>
  )
}

export { AssistantComposer }
