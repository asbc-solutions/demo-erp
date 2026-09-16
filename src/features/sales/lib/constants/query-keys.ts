import type {
  CustomerListParams,
  MasterDataParams,
  SalespersonListParams,
  ProductListParams,
  ProductSearchParams,
  QuotationListParams,
  OrderListParams,
  InvoiceListParams,
  TermsTemplateListParams,
  TotalSalesReportParams,
  NotificationListParams,
  CrmReflectionListParams,
} from "../types"

export const salesKeys = {
  dashboard: {
    all: ["sales", "dashboard"] as const,
  },

  customers: {
    all: ["sales", "customers"] as const,
    list: (params?: CustomerListParams) =>
      [...salesKeys.customers.all, "list", params] as const,
    detail: (id: string) => [...salesKeys.customers.all, "detail", id] as const,
  },

  salespeople: {
    all: ["sales", "salespeople"] as const,
    list: (params?: SalespersonListParams) =>
      [...salesKeys.salespeople.all, "list", params] as const,
    active: () => [...salesKeys.salespeople.all, "active"] as const,
    detail: (id: string) => [...salesKeys.salespeople.all, "detail", id] as const,
  },

  masterData: {
    all: ["sales", "master-data"] as const,
    get: (params?: MasterDataParams) =>
      [...salesKeys.masterData.all, params] as const,
  },

  products: {
    all: ["sales", "products"] as const,
    list: (params?: ProductListParams) =>
      [...salesKeys.products.all, "list", params] as const,
    detail: (id: string) => [...salesKeys.products.all, "detail", id] as const,
    search: (params: ProductSearchParams) =>
      [...salesKeys.products.all, "search", params] as const,
  },

  quotations: {
    all: ["sales", "quotations"] as const,
    list: (params?: QuotationListParams) =>
      [...salesKeys.quotations.all, "list", params] as const,
    detail: (id: string) => [...salesKeys.quotations.all, "detail", id] as const,
    pdf: (id: string, lang: string, paper: string) =>
      [...salesKeys.quotations.all, id, "pdf", lang, paper] as const,
  },

  orders: {
    all: ["sales", "orders"] as const,
    list: (params?: OrderListParams) =>
      [...salesKeys.orders.all, "list", params] as const,
    detail: (id: string) => [...salesKeys.orders.all, "detail", id] as const,
    pdf: (id: string, lang: string, paper: string) =>
      [...salesKeys.orders.all, id, "pdf", lang, paper] as const,
  },

  invoices: {
    all: ["sales", "invoices"] as const,
    list: (params?: InvoiceListParams) =>
      [...salesKeys.invoices.all, "list", params] as const,
    detail: (id: string) => [...salesKeys.invoices.all, "detail", id] as const,
    pdf: (id: string, lang: string, paper: string) =>
      [...salesKeys.invoices.all, id, "pdf", lang, paper] as const,
    printUrl: (id: string, lang: string) =>
      [...salesKeys.invoices.all, id, "print-url", lang] as const,
  },

  payments: {
    all: ["sales", "payments"] as const,
    byInvoice: (invoiceId: string) =>
      [...salesKeys.payments.all, "invoice", invoiceId] as const,
  },

  discountApprovals: {
    all: ["sales", "discount-approvals"] as const,
  },

  reports: {
    all: ["sales", "reports"] as const,
    totalSales: (params?: TotalSalesReportParams) =>
      [...salesKeys.reports.all, "total-sales", params] as const,
    byCustomer: (params?: TotalSalesReportParams) =>
      [...salesKeys.reports.all, "by-customer", params] as const,
    bySalesperson: (params?: TotalSalesReportParams) =>
      [...salesKeys.reports.all, "by-salesperson", params] as const,
  },

  settings: {
    all: ["sales", "settings"] as const,
    get: (branchId?: number) =>
      [...salesKeys.settings.all, branchId ?? null] as const,
    numberingPreview: () =>
      [...salesKeys.settings.all, "numbering-preview"] as const,
  },

  companyProfile: {
    all: ["sales", "company-profile"] as const,
    logoUrl: () => [...salesKeys.companyProfile.all, "logo-url"] as const,
  },

  termsTemplates: {
    all: ["sales", "terms-templates"] as const,
    list: (params?: TermsTemplateListParams) =>
      [...salesKeys.termsTemplates.all, "list", params] as const,
  },

  notifications: {
    all: ["sales", "notifications"] as const,
    list: (params?: NotificationListParams) =>
      [...salesKeys.notifications.all, "list", params] as const,
  },

  crmReflections: {
    all: ["sales", "crm-reflections"] as const,
    list: (params?: CrmReflectionListParams) =>
      [...salesKeys.crmReflections.all, "list", params] as const,
  },
}
