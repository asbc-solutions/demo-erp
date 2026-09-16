import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { SalesReportsModule } from "@/src/features/sales/reports/components/sales-reports-module"

const SalesReportsPage = () => {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <SalesReportsModule />
    </SalesAccessGate>
  )
}

export default SalesReportsPage
