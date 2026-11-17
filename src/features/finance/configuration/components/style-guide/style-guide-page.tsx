"use client"

import { useTranslations } from "next-intl"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { StyleGuideComponents } from "./style-guide-components"
import { StyleGuideTokens } from "./style-guide-tokens"

/** 11.12 · Living style guide — every finance primitive, rendered live. */
function StyleGuidePage() {
  const t = useTranslations("FinanceStyleGuide")
  return (
    <>
      <FinancePageHeader
        title={t("livingStyleGuide")}
        breadcrumbs={[{ label: t("configuration") }, { label: t("styleGuide") }]}
      />
      <FinancePageBody className="gap-10">
        <FinanceAlert tone="info">
          {t("styleGuideIntro")}
        </FinanceAlert>
        <StyleGuideTokens />
        <StyleGuideComponents />
      </FinancePageBody>
    </>
  )
}

export { StyleGuidePage }
