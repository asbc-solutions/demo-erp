"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/components/ui/tabs"

import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { ApproveBillsTab } from "./approve-bills-tab"
import { CloseStatusTab } from "./close-status-tab"
import { ExceptionsTab } from "./exceptions-tab"

/** 01.04 · On the go — approving, checking and noticing; no data entry. */
function OnTheGoPage() {
  return (
    <>
      <FinancePageHeader title="On the go" />
      <FinancePageBody>
        <p className="text-content-secondary max-w-3xl text-sm leading-5">
          The three things worth doing from a phone. Finance work away from a desk is approving,
          checking and noticing — not data entry, which is why this is three screens and not eighty.
        </p>
        <Tabs defaultValue="approve" className="gap-6">
          <TabsList>
            <TabsTrigger value="approve">Approve a bill</TabsTrigger>
            <TabsTrigger value="close">Close status</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
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
