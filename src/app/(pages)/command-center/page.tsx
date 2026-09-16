import { CommandCenterAccessGate } from "@/src/features/command-center/components/command-center-access-gate"
import { CommandCenterView } from "@/src/features/command-center/components/command-center-view"

const CommandCenterPage = () => {
  return (
    <CommandCenterAccessGate>
      <CommandCenterView />
    </CommandCenterAccessGate>
  )
}

export default CommandCenterPage
