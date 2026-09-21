import { CustodyDetailPage } from "@/src/features/finance/banking/components/custody/custody-detail-page"

const FinanceCustodyHolderRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <CustodyDetailPage holderId={decodeURIComponent(id)} />
}

export default FinanceCustodyHolderRoute
