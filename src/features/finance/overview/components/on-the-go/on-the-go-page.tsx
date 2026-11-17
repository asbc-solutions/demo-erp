"use client"

import { useTranslations } from "next-intl"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/components/ui/tabs"

import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { ApproveBillsTab } from "./approve-bills-tab"
import { CloseStatusTab } from "./close-status-tab"
import { ExceptionsTab } from "./exceptions-tab"

/** 01.04 · On the go — approving, checking and noticing; no data entry. */
function OnTheGoPage() {
  const t = useTranslations("FinanceOverview")
  return (
    <>
      <FinancePageHeader title={t("onTheGoTitle")} />
      <FinancePageBody>
        <p className="text-content-secondary max-w-3xl text-sm leading-5">{t("onTheGoIntro")}</p>
        <Tabs defaultValue="approve" className="gap-6">
          <TabsList>
            <TabsTrigger value="approve">{t("tabApproveBill")}</TabsTrigger>
            <TabsTrigger value="close">{t("tabCloseStatus")}</TabsTrigger>
            <TabsTrigger value="exceptions">{t("tabExceptions")}</TabsTrigger>
          </TabsList>
          <TabsContent value="approve">
            <ApproveBillsTab />
          </TabsContent>
          <TabsContent value="close">
            <CloseStatusTab />
          </TabsContent>
          <TabsContent value="exceptions">
            <ExceptionsTab />
          </TabsContent>
        </Tabs>
      </FinancePageBody>
    </>
  )
}

export { OnTheGoPage }
