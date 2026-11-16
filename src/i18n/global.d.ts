import type { Locale } from "./routing"

import type common from "./messages/en/common.json"
import type shell from "./messages/en/shell.json"
import type onboarding from "./messages/en/onboarding.json"
import type commandCenter from "./messages/en/command-center.json"
import type compliance from "./messages/en/compliance.json"
import type integrations from "./messages/en/integrations.json"
import type marketingTracking from "./messages/en/marketing-tracking.json"
import type operations from "./messages/en/operations.json"
import type settings from "./messages/en/settings.json"
import type sales from "./messages/en/sales.json"
import type hrPeople from "./messages/en/hr-people.json"
import type hrWorkflows from "./messages/en/hr-workflows.json"
import type financeOperations from "./messages/en/finance-operations.json"
import type financeAccounting from "./messages/en/finance-accounting.json"
import type projectsPortfolio from "./messages/en/projects-portfolio.json"
import type projectsDelivery from "./messages/en/projects-delivery.json"

/** English is the source of truth: `t()` only accepts keys that exist in `messages/en`. */
type Messages =
  typeof common
  & typeof shell
  & typeof onboarding
  & typeof commandCenter
  & typeof compliance
  & typeof integrations
  & typeof marketingTracking
  & typeof operations
  & typeof settings
  & typeof sales
  & typeof hrPeople
  & typeof hrWorkflows
  & typeof financeOperations
  & typeof financeAccounting
  & typeof projectsPortfolio
  & typeof projectsDelivery

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
