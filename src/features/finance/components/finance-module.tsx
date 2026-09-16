"use client"

import * as React from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"

import { useRegisterLayoutHeaderTab } from "@/src/shared/components/layout-header-context"

import { FINANCE_TABS, type FinanceTabId } from "../data/finance-mock"
import { FINANCE_RESOURCES } from "../lib/constants/permissions"
import { CashflowTab } from "./cashflow-tab"
import { ExpensesTab } from "./expenses-tab"
import { FinanceAccessGate } from "./finance-access-gate"
import { InvoicesTab } from "./invoices-tab"
import { NewInvoiceForm } from "./new-invoice-form"
import { ReportsTab } from "./reports-tab"

export function FinanceModule() {
  const [activeTab, setActiveTab] = React.useState<FinanceTabId>("invoices")
  const [showNewInvoice, setShowNewInvoice] = React.useState(false)

  const headerTabLabel = showNewInvoice
    ? "New invoice"
    : (FINANCE_TABS.find((t) => t.id === activeTab)?.label ?? "")
  useRegisterLayoutHeaderTab(headerTabLabel)

  if (showNewInvoice) {
    return (
      <div className="bg-surface-page relative flex min-h-0 flex-1 flex-col overflow-auto">
        <FinanceAccessGate resource={FINANCE_RESOURCES.invoices}>
          <NewInvoiceForm onClose={() => setShowNewInvoice(false)} />
        </FinanceAccessGate>
      </div>
    )
  }

  return (
    <div className="bg-surface-page relative flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent"
        aria-hidden
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as FinanceTabId)}
        variant="pill"
        className="gap-6"
      >
        <TabsList className="border-stroke-default bg-surface-white w-fit gap-0 rounded-xl border p-1">
          {FINANCE_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="h-8 rounded-lg px-4 text-[11px] font-medium capitalize text-content-tertiary data-[state=active]:bg-surface-hover data-[state=active]:text-content-primary data-[state=active]:shadow-[0_1px_0_0_var(--color-brand-primary)]"
            >
              {tab.label.toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="invoices" className="flex flex-col gap-4">
          <FinanceAccessGate resource={FINANCE_RESOURCES.invoices}>
            <InvoicesTab onNewInvoice={() => setShowNewInvoice(true)} />
          </FinanceAccessGate>
        </TabsContent>
        <TabsContent value="cashflow">
          <FinanceAccessGate resource={FINANCE_RESOURCES.cashflow}>
            <CashflowTab />
          </FinanceAccessGate>
        </TabsContent>
        <TabsContent value="expenses">
          <FinanceAccessGate resource={FINANCE_RESOURCES.expenses}>
            <ExpensesTab />
          </FinanceAccessGate>
        </TabsContent>
        <TabsContent value="reports">
          <FinanceAccessGate resource={FINANCE_RESOURCES.reports}>
            <ReportsTab />
          </FinanceAccessGate>
        </TabsContent>
      </Tabs>
    </div>
  )
}
