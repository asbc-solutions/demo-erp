"use client"

import type { VariantProps } from "class-variance-authority"
import {
  CreditCard,
  FileText,
  GitBranch,
  Hash,
  LayoutGrid,
  Loader2,
  Plug,
  Puzzle,
  Receipt,
  RefreshCw,
  Unplug,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge, type badgeVariants } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import {
  useConnectIntegration,
  useDisconnectIntegration,
  useRecordSync,
} from "../lib/mutations/integrations"
import type { Integration, IntegrationProvider, IntegrationStatus } from "../lib/types/integration"
import { toastMutationError } from "./shared/integrations-error-state"

/** Maps each supported provider to its closest lucide icon (CLAUDE.md §6). */
const PROVIDER_ICON: Record<IntegrationProvider, LucideIcon> = {
  stripe: CreditCard,
  quickbooks: Receipt,
  gusto: Users,
  github: GitBranch,
  notion: FileText,
  slack: Hash,
  google_workspace: LayoutGrid,
  zapier: Zap,
}

/** Fallback for a provider the backend added before the frontend map caught up. */
const FALLBACK_ICON: LucideIcon = Puzzle

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

const STATUS_BADGE_VARIANT: Record<IntegrationStatus, BadgeVariant> = {
  connected: "success",
  error: "warning",
  disconnected: "neutral",
}

function formatSyncDate(iso: string | null, intlLocale: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(intlLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function IntegrationCard({
  integration,
  canManage,
}: Readonly<{ integration: Integration; canManage: boolean }>) {
  const t = useTranslations("IntegrationsCard")
  const tIntegrations = useTranslations("Integrations")
  const intlLocale = useIntlLocale()
  const Icon = PROVIDER_ICON[integration.provider] ?? FALLBACK_ICON
  const name = integration.label

  const connect = useConnectIntegration()
  const disconnect = useDisconnectIntegration()
  const recordSync = useRecordSync()

  const isConnected = integration.status !== "disconnected"
  const isMutating = connect.isPending || disconnect.isPending || recordSync.isPending
  const lastSyncedAt = formatSyncDate(integration.last_sync.at, intlLocale)

  const handleConnect = () => {
    connect.mutate(
      { provider: integration.provider },
      {
        onSuccess: () => toast.success(t("connectedToast", { name })),
        onError: (err) => toastMutationError(err, t("connectFailed", { name }), tIntegrations),
      },
    )
  }

  const handleDisconnect = () => {
    disconnect.mutate(integration.provider, {
      onSuccess: () => toast.success(t("disconnectedToast", { name })),
      onError: (err) => toastMutationError(err, t("disconnectFailed", { name }), tIntegrations),
    })
  }

  const handleSync = () => {
    recordSync.mutate(
      { provider: integration.provider },
      {
        onSuccess: (data) =>
          toast.success(
            data.status === "error"
              ? t("syncNeedsAttention", { name })
              : t("syncedToast", { name }),
          ),
        onError: (err) => toastMutationError(err, t("syncFailed", { name }), tIntegrations),
      },
    )
  }

  return (
    <Card variant="elevated" className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="bg-surface-hover flex size-10 items-center justify-center rounded-xl">
          <Icon className="text-content-secondary size-6" aria-hidden />
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[integration.status]}>
          {integration.status_label}
        </Badge>
      </div>

      <h3 className="text-content-primary pt-3 text-base leading-6 font-medium">
        {integration.label}
      </h3>
      <p className="text-content-tertiary pt-1 text-[11px] leading-[15.4px]">
        {integration.description}
      </p>

      <p className="text-content-quaternary pt-2 pb-3 text-[11px] leading-[15.4px]">
        {integration.status === "error" && integration.last_sync.message
          ? integration.last_sync.message
          : lastSyncedAt
            ? t("lastSynced", { date: lastSyncedAt })
            : t("neverSynced")}
      </p>

      {canManage ? (
        isConnected ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-8 flex-1 text-[12px]"
              onClick={handleSync}
              disabled={isMutating}
            >
              {recordSync.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              {t("syncNow")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="border-stroke-default bg-surface-page text-brand-danger hover:bg-brand-danger/5 hover:text-brand-danger h-8 flex-1 text-[12px]"
              onClick={handleDisconnect}
              disabled={isMutating}
            >
              {disconnect.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Unplug className="size-3.5" aria-hidden />
              )}
              {t("disconnect")}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            className="h-8 w-full text-[12px]"
            onClick={handleConnect}
            disabled={isMutating}
          >
            {connect.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Plug className="size-3.5" aria-hidden />
            )}
            {t("connect")}
          </Button>
        )
      ) : null}
    </Card>
  )
}
