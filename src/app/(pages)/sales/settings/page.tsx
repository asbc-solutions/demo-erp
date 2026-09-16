import { SalesAccessGate } from "@/src/features/sales/components/shared/sales-access-gate"
import { SALES_RESOURCES } from "@/src/features/sales/lib/constants/permissions"
import { SalesSettingsModule } from "@/src/features/sales/settings/components/sales-settings-module"

const SalesSettingsPage = () => {
  return (
    <SalesAccessGate resource={SALES_RESOURCES.settings}>
      <SalesSettingsModule />
    </SalesAccessGate>
  )
}

export default SalesSettingsPage
