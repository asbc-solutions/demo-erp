"use client"

import { useQuery } from "@tanstack/react-query"

import { assetsApi } from "../api/assets"
import { assetsKeys } from "../constants/query-keys"

export function useAssetRegister() {
  return useQuery({ queryKey: assetsKeys.register(), queryFn: () => assetsApi.register().then((r) => r.data.data) })
}

export function useAssetDetail(id: string) {
  return useQuery({ queryKey: assetsKeys.detail(id), queryFn: () => assetsApi.detail(id).then((r) => r.data.data ?? null) })
}

export function useDepreciationRun() {
  return useQuery({ queryKey: assetsKeys.depreciation(), queryFn: () => assetsApi.depreciation().then((r) => r.data.data) })
}

export function useAssetCategories() {
  return useQuery({ queryKey: assetsKeys.categories(), queryFn: () => assetsApi.categories().then((r) => r.data.data) })
}
