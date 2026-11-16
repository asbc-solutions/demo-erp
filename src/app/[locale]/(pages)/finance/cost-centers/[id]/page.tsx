import { CostCenterDetailPage } from "@/src/features/finance/planning/components/cost-centers/cost-center-detail-page"

const FinanceCostCenterRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <CostCenterDetailPage centerId={decodeURIComponent(id)} />
}

export default FinanceCostCenterRoute
