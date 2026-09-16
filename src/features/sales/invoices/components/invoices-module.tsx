"use client"

import { useInvoiceView } from "../hooks/use-invoice-view"
import { InvoiceDetailView } from "./invoice-detail-view"
import { InvoicesListView } from "./invoices-list-view"

export function InvoicesModule() {
  const { view, showList, showDetail } = useInvoiceView()

  if (view.mode === "detail") {
    return <InvoiceDetailView invoiceId={view.invoiceId} onBack={showList} />
  }

  return <InvoicesListView onSelectInvoice={showDetail} />
}
