"use client"

import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { INTEGRATIONS_RESOURCES } from "../lib/constants/permissions"
import { useIntegrations } from "../lib/queries/integrations"
import { IntegrationCard } from "./integration-card"
import { IntegrationsErrorState } from "./shared/integrations-error-state"
import { IntegrationsPageSpinner } from "./shared/integrations-loading"

export function IntegrationsView() {
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
            Connected Apps
          </h2>
          <p className="text-content-tertiary text-[12px] leading-[18px]">
            Sync your tools with Nucleus
          </p>
        </div>

        {summary ? (
          <div className="text-content-tertiary flex items-center gap-3 text-xs leading-4">
            <span>
              <span className="text-content-primary font-semibold">{summary.available}</span>{" "}
              available
            </span>
            <span className="bg-stroke-default h-3 w-px" aria-hidden />
            <span>
              <span className="text-brand-success font-semibold">{summary.connected}</span>{" "}
              connected
            </span>
            <span className="bg-stroke-default h-3 w-px" aria-hidden />
            <span>
              <span className="text-brand-warning font-semibold">{summary.errored}</span> needs
              attention
            </span>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <IntegrationsPageSpinner />
      ) : isError ? (
        <IntegrationsErrorState
          message="Failed to load integrations."
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
