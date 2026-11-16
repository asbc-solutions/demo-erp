import { TreasuryDetailPage } from "@/src/features/finance/banking/components/treasuries/treasury-detail-page"

const FinanceTreasuryRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <TreasuryDetailPage treasuryId={decodeURIComponent(id)} />
}

export default FinanceTreasuryRoute
