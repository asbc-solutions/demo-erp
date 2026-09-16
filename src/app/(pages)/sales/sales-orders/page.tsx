import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { SalesOrdersModule } from "@/src/features/sales/sales-orders/components/sales-orders-module"

const SalesOrdersPage = () => {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <SalesOrdersModule />
    </SalesAccessGate>
  )
}

export default SalesOrdersPage
