import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { CustomersPage } from "@/src/features/sales/customers/customers-page"

export default function SalesCustomersPage() {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <CustomersPage />
    </SalesAccessGate>
  )
}
