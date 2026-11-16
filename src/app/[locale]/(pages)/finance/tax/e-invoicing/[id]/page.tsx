import { EDocumentPage } from "@/src/features/finance/tax/components/e-invoicing/e-document-page"

const FinanceEDocumentRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <EDocumentPage documentId={decodeURIComponent(id)} />
}

export default FinanceEDocumentRoute
