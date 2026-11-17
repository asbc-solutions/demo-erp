import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { ProductsModule } from "@/src/features/sales/products/components/products-module"

export default function SalesProductsPage() {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.access}>
      <ProductsModule />
    </SalesAccessGate>
  )
}
