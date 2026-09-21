"use client"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StyleGuideComponents } from "./style-guide-components"
import { StyleGuideTokens } from "./style-guide-tokens"

/** 11.12 · Living style guide — every finance primitive, rendered live. */
function StyleGuidePage() {
  return (
    <>
      <FinancePageHeader
        title="Living style guide"
        breadcrumbs={[{ label: "Configuration" }, { label: "Style guide" }]}
      />
      <FinancePageBody className="gap-10">
        <FinanceAlert tone="info">
          This is a real screen in the app, not documentation. Flip the theme from the header —
          everything here is live and drawn from the same tokens and components as the finance
          screens.
        </FinanceAlert>
        <StyleGuideTokens />
        <StyleGuideComponents />
      </FinancePageBody>
    </>
  )
}

export { StyleGuidePage }
