import { ChequeDetailPage } from "@/src/features/finance/banking/components/cheques/cheque-detail-page"

const FinanceChequeIssuedRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <ChequeDetailPage direction="issued" chequeId={decodeURIComponent(id)} />
}

export default FinanceChequeIssuedRoute
