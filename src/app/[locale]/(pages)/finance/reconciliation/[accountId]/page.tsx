import { ReconciliationPage } from "@/src/features/finance/banking/components/reconciliation/reconciliation-page"

const FinanceAccountReconciliationRoute = async ({ params }: { params: Promise<{ accountId: string }> }) => {
  const { accountId } = await params
  return <ReconciliationPage treasuryId={decodeURIComponent(accountId)} />
}

export default FinanceAccountReconciliationRoute
