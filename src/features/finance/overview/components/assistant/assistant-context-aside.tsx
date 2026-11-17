import { Check, Minus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

import { LAST_GROUNDED } from "../../lib/constants/assistant"
import type { AssistantAnswer, AssistantSettings } from "../../lib/types/assistant"

function AsideHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-stroke-default text-content-primary border-b pb-2 text-base leading-6 font-semibold">
      {children}
    </h3>
  )
}

type AssistantContextAsideProps = {
  answer: AssistantAnswer | undefined
  offline: boolean
  settings: AssistantSettings | undefined
  roleLabel: string
  entityCount: number
  periodLabel: string
  onHide: () => void
}

/** What the latest answer read (and did not), the scope, and the data groups in play. */
function AssistantContextAside({
  answer,
  offline,
  settings,
  roleLabel,
  entityCount,
  periodLabel,
  onHide,
}: AssistantContextAsideProps) {
  const t = useTranslations("FinanceAssistant")
  return (
    <aside
      aria-label={t("answerContext")}
      className="border-stroke-input bg-surface-white flex w-full shrink-0 flex-col gap-5 self-start rounded-xl border p-4 lg:sticky lg:top-4 lg:w-80"
    >
      <div className="flex items-center justify-between">
        <span className="text-content-secondary text-[13px] leading-5 font-medium">{t("context")}</span>
        <Button variant="ghost" size="sm" onClick={onHide}>
          {t("hide")}
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <AsideHeading>{t("grounding")}</AsideHeading>
        {answer && answer.grounding.length > 0 ? (
          <>
            <ul className="flex flex-col gap-2">
              {answer.grounding.map((source) => (
                <li key={source.label} className="flex items-baseline justify-between gap-3 text-[13px] leading-5">
                  <span dir="auto" className="text-content-primary">
                    {source.label}
                  </span>
                  <span className="text-content-tertiary shrink-0">{source.detail}</span>
                </li>
              ))}
            </ul>
            {answer.not_read.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-content-secondary text-xs leading-4 font-medium">{t("didNotRead")}</span>
                <span className="text-content-tertiary text-[13px] leading-5">
                  {answer.not_read.join(" · ")}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-content-tertiary text-[13px] leading-5">
            {offline
              ? t("offlineNothingRead", { time: LAST_GROUNDED.time })
              : answer
                ? t("nothingReadForAnswer")
                : t("noAnswerYet")}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <AsideHeading>{t("scope")}</AsideHeading>
        <dl className="flex flex-col gap-3">
          {[
            [t("role"), roleLabel],
            [t("entities"), String(entityCount)],
            [t("period"), periodLabel],
          ].map(([term, value]) => (
            <div key={term} className="flex flex-col gap-0.5">
              <dt className="text-content-secondary text-[13px] leading-5">{term}</dt>
              <dd className="text-content-primary text-sm leading-5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <AsideHeading>{t("dataGroups")}</AsideHeading>
        <ul className="flex flex-col gap-1">
          {(settings?.groups ?? []).map((group) => {
            const enabled = group.available && Boolean(settings?.data_groups[group.id])
            const Icon = enabled ? Check : Minus
            return (
              <li key={group.id} className="flex items-center justify-between gap-3 text-[13px] leading-5">
                <span className={cn("flex items-center gap-1.5", enabled ? "text-content-primary" : "text-content-tertiary")}>
                  <Icon
                    aria-hidden
                    className={cn("size-3.5", enabled ? "text-status-success-fg" : "text-content-quaternary")}
                  />
                  {group.label}
                  <span className="sr-only">{enabled ? t("readable") : t("notReadable")}</span>
                </span>
                {!group.available ? (
                  <span className="text-content-tertiary text-xs leading-4">{t("moduleNotInPrototype")}</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>
    </aside>
  )
}

export { AssistantContextAside }
