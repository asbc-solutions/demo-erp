import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"
import { Badge } from "./badge"
import { Card } from "./card"

type IntegrationStatus = "connected" | "disconnected" | "pending" | "error"

const statusBadgeVariant: Record<
  IntegrationStatus,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  connected: "success",
  disconnected: "neutral",
  pending: "warning",
  error: "danger",
}

const STATUS_LABEL_KEY = {
  connected: "integrationConnected",
  disconnected: "integrationConnect",
  pending: "integrationPending",
  error: "integrationError",
} as const satisfies Record<IntegrationStatus, string>

type IntegrationCardProps = Omit<React.ComponentProps<typeof Card>, "title"> & {
  icon: React.ReactNode
  iconBgClassName?: string
  iconColorClassName?: string
  name: React.ReactNode
  description?: React.ReactNode
  status?: IntegrationStatus
  statusLabel?: React.ReactNode
  action?: React.ReactNode
}

function IntegrationCard({
  className,
  icon,
  iconBgClassName,
  iconColorClassName,
  name,
  description,
  status = "disconnected",
  statusLabel: statusLabelProp,
  action,
  variant = "default",
  ...props
}: IntegrationCardProps) {
  const t = useTranslations("Ui")
  return (
    <Card
      data-slot="integration-card"
      variant={variant}
      className={cn("flex-row items-center gap-3 p-4", className)}
      {...props}
    >
      <div
        data-slot="integration-card-icon"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5",
          iconBgClassName ?? "bg-surface-hover",
          iconColorClassName ?? "text-content-secondary",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-content-primary truncate text-sm leading-5 font-medium">
          {name}
        </p>
        {description && (
          <p className="text-content-tertiary truncate text-xs leading-4">
            {description}
          </p>
        )}
      </div>
      {action ?? (
        <Badge variant={statusBadgeVariant[status]}>
          {statusLabelProp ?? t(STATUS_LABEL_KEY[status])}
        </Badge>
      )}
    </Card>
  )
}

export { IntegrationCard }
export type { IntegrationCardProps, IntegrationStatus }
