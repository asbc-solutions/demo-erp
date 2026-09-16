import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  AttritionParams,
  AttritionReport,
  DocumentComplianceParams,
  DocumentComplianceReport,
  HeadcountParams,
  HeadcountReport,
  KpiDashboard,
  ReportExportFormat,
  SalaryCostParams,
  SalaryCostReport,
  TenureParams,
  TenureReport,
} from "../types"

export const reportsApi = {
  kpiDashboard: () =>
    httpClient.get<ApiResponse<KpiDashboard>>("/dashboard/kpi"),

  headcount: (params?: HeadcountParams) =>
    httpClient.get<ApiResponse<HeadcountReport>>("/reports/headcount", { params }),

  attrition: (params?: AttritionParams) =>
    httpClient.get<ApiResponse<AttritionReport>>("/reports/attrition", { params }),

  salaryCost: (params?: SalaryCostParams) =>
    httpClient.get<ApiResponse<SalaryCostReport>>("/reports/salary-cost", { params }),

  documentCompliance: (params?: DocumentComplianceParams) =>
    httpClient.get<ApiResponse<DocumentComplianceReport>>("/reports/document-compliance", { params }),

  tenure: (params?: TenureParams) =>
    httpClient.get<ApiResponse<TenureReport>>("/reports/tenure", { params }),

  exportHeadcount: (params?: HeadcountParams & { format?: ReportExportFormat }) =>
    httpClient.get<Blob>("/reports/headcount/export", { params, responseType: "blob" }),

  exportAttrition: (params?: AttritionParams & { format?: ReportExportFormat }) =>
    httpClient.get<Blob>("/reports/attrition/export", { params, responseType: "blob" }),

  exportSalaryCost: (params?: SalaryCostParams & { format?: ReportExportFormat }) =>
    httpClient.get<Blob>("/reports/salary-cost/export", { params, responseType: "blob" }),

  exportDocumentCompliance: (params?: DocumentComplianceParams & { format?: ReportExportFormat }) =>
    httpClient.get<Blob>("/reports/document-compliance/export", { params, responseType: "blob" }),
}
