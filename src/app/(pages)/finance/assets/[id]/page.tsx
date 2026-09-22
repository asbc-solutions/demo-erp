import { AssetDetailPage } from "@/src/features/finance/assets/components/detail/asset-detail-page"

const FinanceAssetRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <AssetDetailPage assetId={decodeURIComponent(id)} />
}

export default FinanceAssetRoute
