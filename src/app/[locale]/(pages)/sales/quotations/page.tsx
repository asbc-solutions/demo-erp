import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { QuotationsPage } from "@/src/features/sales/quotations/quotations-page"

export default function SalesQuotationsPage() {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <QuotationsPage />
    </SalesAccessGate>
  )
}
