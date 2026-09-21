"use client"

import * as React from "react"

import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/components/ui/tabs"

import { FinanceErrorState } from "../../../components/shared/finance-states"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { useExpenses } from "../../lib/queries/payables"
import { AwaitingTab } from "./awaiting-tab"
import { CaptureTab } from "./capture-tab"

/** 03.06 · Expenses — capture a receipt, check the coding, send it for approval. */
function ExpensesPage() {
  const { data, isError, refetch } = useExpenses()
  const [tab, setTab] = React.useState("capture")

  return (
    <>
      <FinancePageHeader
        title="Expenses"
        figure={data ? <HeaderFigure label="Awaiting approval">{data.awaiting_count}</HeaderFigure> : null}
      />
      <FinancePageBody>
        <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
          Capture a receipt, check the coding we suggest, and send it for approval. The account we propose
          always says why, so a wrong guess is visible before you accept it.
        </p>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label="Loading expenses" className="flex flex-col gap-4">
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-80 max-w-4xl rounded-lg" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="gap-6">
            <TabsList>
              <TabsTrigger value="capture">Capture</TabsTrigger>
              <TabsTrigger value="awaiting">
                Awaiting approval
                <span className="text-content-tertiary text-xs tabular-nums">{data.awaiting_count}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="capture">
              <CaptureTab list={data} onSubmitted={() => setTab("awaiting")} />
            </TabsContent>
            <TabsContent value="awaiting">
              <AwaitingTab items={data.items} />
            </TabsContent>
          </Tabs>
        )}
      </FinancePageBody>
    </>
  )
}

export { ExpensesPage }
