import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"

import type { CustomerListItem } from "../../lib/types"

export function CustomerStatusBadge({
  status,
}: Readonly<{ status: CustomerListItem["status"] }>) {
  const t = useTranslations("SalesShared")
  const label = t(`customerStatus.${status}`)

  if (status === "active") {
    return (
      <Badge
        variant="success"
        className="rounded-full bg-emerald-50 px-3 font-normal text-emerald-600"
      >
        {label}
      </Badge>
    )
  }

  if (status === "blocked") {
    return (
      <Badge
        variant="danger"
        className="rounded-full bg-red-100 px-3 font-normal text-red-600"
      >
        {label}
      </Badge>
    )
  }

  return (
    <Badge variant="neutral" className="rounded-full px-3 font-normal">
      {label}
    </Badge>
  )
}
