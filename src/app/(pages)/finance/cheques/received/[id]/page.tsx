import { ChequeDetailPage } from "@/src/features/finance/banking/components/cheques/cheque-detail-page"

const FinanceChequeReceivedRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <ChequeDetailPage direction="received" chequeId={decodeURIComponent(id)} />
}

export default FinanceChequeReceivedRoute
