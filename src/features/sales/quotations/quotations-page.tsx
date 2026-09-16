"use client"

import { QuotationDetailView } from "./components/quotation-detail-view"
import { QuotationsListView } from "./components/quotations-list-view"
import { useQuotationView } from "./hooks/use-quotation-view"

export function QuotationsPage() {
  const { view, showList, showDetail } = useQuotationView()

  if (view.mode === "detail") {
    return <QuotationDetailView quotationId={view.quotationId} onBack={showList} />
  }

  return <QuotationsListView onSelectQuotation={showDetail} />
}
