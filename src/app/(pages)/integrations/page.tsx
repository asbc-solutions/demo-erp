import { IntegrationsAccessGate } from "@/src/features/integrations/components/integrations-access-gate"
import { IntegrationsView } from "@/src/features/integrations/components/integrations-view"

const IntegrationsPage = () => {
  return (
    <IntegrationsAccessGate>
      <IntegrationsView />
    </IntegrationsAccessGate>
  )
}

export default IntegrationsPage
