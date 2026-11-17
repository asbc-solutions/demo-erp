import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { InvoicesModule } from "@/src/features/sales/invoices/components/invoices-module"

const InvoicesPage = () => {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <InvoicesModule />
    </SalesAccessGate>
  )
}

export default InvoicesPage
