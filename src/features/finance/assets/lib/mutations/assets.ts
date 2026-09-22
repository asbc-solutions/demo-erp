"use client"

import { useFinanceMutation } from "../../../lib/hooks/use-finance-mutation"
import { unwrap } from "../../../lib/utils/api"
import { assetsApi } from "../api/assets"
import type { EditAssetInput, NewAssetInput, NewCategoryInput } from "../types/assets"

export function useCreateAsset() {
  return useFinanceMutation((input: NewAssetInput) => assetsApi.create(input).then(unwrap))
}

export function useEditAsset() {
  return useFinanceMutation(({ id, input }: { id: string; input: EditAssetInput }) => assetsApi.edit(id, input).then(unwrap))
}

export function useDisposeAsset() {
  return useFinanceMutation(
    ({ id, ...input }: { id: string; proceeds: number; treasury_id: string | null; date: string; reason: string }) =>
      assetsApi.dispose(id, input).then(unwrap),
  )
}

export function useWriteOffAsset() {
  return useFinanceMutation(({ id, reason }: { id: string; reason: string }) => assetsApi.writeOff(id, reason).then(unwrap))
}

export function useSkipDepreciation() {
  return useFinanceMutation(({ assetId, skip }: { assetId: string; skip: boolean }) => assetsApi.skip(assetId, skip).then(unwrap))
}

export function usePostDepreciation() {
  return useFinanceMutation(() => assetsApi.postRun().then(unwrap))
}

export function useCreateAssetCategory() {
  return useFinanceMutation((input: NewCategoryInput) => assetsApi.createCategory(input).then(unwrap))
}
