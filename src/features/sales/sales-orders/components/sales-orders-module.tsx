"use client"

import { useOrderView } from "../hooks/use-order-view"
import { OrderDetailView } from "./order-detail-view"
import { OrdersListView } from "./orders-list-view"

export function SalesOrdersModule() {
  const { view, showList, showDetail } = useOrderView()

  if (view.mode === "detail") {
    return <OrderDetailView orderId={view.orderId} onBack={showList} />
  }

  return <OrdersListView onSelectOrder={showDetail} />
}
