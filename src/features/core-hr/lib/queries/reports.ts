"use client"

import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "../api/reports"
import { coreHrKeys } from "../constants/query-keys"
import type {
  AttritionParams,
  DocumentComplianceParams,
  HeadcountParams,
  SalaryCostParams,
  TenureParams,
} from "../types"

export function useKpiDashboard() {
  return useQuery({
    queryKey: coreHrKeys.reports.kpi(),
    queryFn: () => reportsApi.kpiDashboard().then((r) => r.data.data),
  })
}

export function useHeadcountReport(params?: HeadcountParams) {
  return useQuery({
    queryKey: coreHrKeys.reports.headcount(params),
    queryFn: () => reportsApi.headcount(params).then((r) => r.data.data),
  })
}

export function useAttritionReport(params?: AttritionParams) {
  return useQuery({
    queryKey: coreHrKeys.reports.attrition(params),
    queryFn: () => reportsApi.attrition(params).then((r) => r.data.data),
  })
}

export function useSalaryCostReport(params?: SalaryCostParams) {
  return useQuery({
    queryKey: coreHrKeys.reports.salaryCost(params),
    queryFn: () => reportsApi.salaryCost(params).then((r) => r.data.data),
  })
}

export function useDocumentComplianceReport(params?: DocumentComplianceParams) {
  return useQuery({
    queryKey: coreHrKeys.reports.documentCompliance(params),
    queryFn: () => reportsApi.documentCompliance(params).then((r) => r.data.data),
  })
}

export function useTenureReport(params?: TenureParams) {
  return useQuery({
    queryKey: coreHrKeys.reports.tenure(params),
    queryFn: () => reportsApi.tenure(params).then((r) => r.data.data),
  })
}
