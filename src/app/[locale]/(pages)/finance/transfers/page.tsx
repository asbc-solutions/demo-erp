import { TransfersPage } from "@/src/features/finance/banking/components/transfers/transfers-page"

const FinanceTransfersRoute = async ({ searchParams }: { searchParams: Promise<{ from?: string }> }) => {
  const { from } = await searchParams
  return <TransfersPage fromTreasuryId={from} />
}

export default FinanceTransfersRoute
