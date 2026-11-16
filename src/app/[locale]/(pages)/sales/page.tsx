import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { SalesDashboard } from "@/src/features/sales/dashboard/components/sales-dashboard"

const SalesPage = () => {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <SalesDashboard />
    </SalesAccessGate>
  )
}

export default SalesPage
