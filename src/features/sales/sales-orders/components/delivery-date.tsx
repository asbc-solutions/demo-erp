import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

/**
 * `delivery_date` is projected by `GET /sales/orders` and `GET /sales/orders/:id`
 * but **no endpoint in the Sales API can write it** — not
 * `POST /sales/quotations/:id/convert` (which creates every order and copies only
 * customer/lines/totals/terms), not `confirm`, not `PUT .../lines`, not `cancel`,
 * and there is no `PUT /sales/orders/:id` at all. So it is `null` on every row of
 * every tenant, and will stay that way until the backend closes that loop.
 *
 * A bare "—" reads as *this order has no delivery date yet*, which sent the field
 * to the bug tracker once already. Until the field becomes writable, say the true
 * thing instead: nothing records it. See
 * `docs/backend-sales-quotation-expiry-and-delivery-date.md` §2.
 */

export function DeliveryDate({
  value,
  className,
}: Readonly<{ value: string | null; className?: string }>) {
  const t = useTranslations("SalesOrders")

  if (value) return <span className={className}>{value}</span>

  return (
    <span
      className={cn("text-content-quaternary", className)}
      title={t("deliveryNotCapturedHint")}
      aria-label={t("deliveryNotCapturedHint")}
    >
      {t("deliveryNotCaptured")}
    </span>
  )
}
