"use client"

import { useTranslations } from "next-intl"

import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { INTEGRATIONS_RESOURCES } from "../lib/constants/permissions"
import { useIntegrations } from "../lib/queries/integrations"
import { IntegrationCard } from "./integration-card"
import { IntegrationsErrorState } from "./shared/integrations-error-state"
import { IntegrationsPageSpinner } from "./shared/integrations-loading"

export function IntegrationsView() {
  const t = useTranslations("Integrations")
  const { data, isLoading, isError, refetch } = useIntegrations()
  const { can } = usePermissions()
  const canManage = can.write(INTEGRATIONS_RESOURCES.integrations)

  const integrations = data?.data ?? []
  const summary = data?.meta.summary

  return (
    <div className="bg-surface-page flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-content-primary text-[20px] leading-7 font-medium">
            {t("title")}
          </h2>
          <p className="text-content-tertiary text-[12px] leading-[18px]">
            {t("subtitle")}
          </p>
        </div>

        {summary ? (
          <div className="text-content-tertiary flex items-center gap-3 text-xs leading-4">
            <span>
              {t.rich("available", {
                count: String(summary.available),
                n: (chunks) => (
                  <span className="text-content-primary font-semibold">{chunks}</span>
                ),
              })}
            </span>
            <span className="bg-stroke-default h-3 w-px" aria-hidden />
            <span>
              {t.rich("connected", {
                count: String(summary.connected),
                n: (chunks) => (
                  <span className="text-brand-success font-semibold">{chunks}</span>
                ),
              })}
            </span>
            <span className="bg-stroke-default h-3 w-px" aria-hidden />
            <span>
              {t.rich("needsAttention", {
                count: String(summary.errored),
                n: (chunks) => (
                  <span className="text-brand-warning font-semibold">{chunks}</span>
                ),
              })}
            </span>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <IntegrationsPageSpinner />
      ) : isError ? (
        <IntegrationsErrorState
          message={t("listLoadFailed")}
          onRetry={() => void refetch()}
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              canManage={canManage}
            />
          ))}
        </section>
      )}
    </div>
  )
}
