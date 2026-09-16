export const SALES_RESOURCES = {
  access: "sales.access",
  settings: "sales.settings",
  customer: "sales.customer",
  export: "sales.export",
  report: "sales.report",
  invoice: "sales.invoice",
  order: "sales.order",
  product: "sales.product",
  quotation: "sales.quotation",
  salesperson: "sales.salesperson",
  notification: "sales.notification",
  crmReflection: "sales.crm_reflection",
} as const

export type SalesResource = (typeof SALES_RESOURCES)[keyof typeof SALES_RESOURCES]
