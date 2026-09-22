import { VatReturnPage } from "@/src/features/finance/tax/components/vat-return/vat-return-page"

const FinanceVatReturnRoute = async ({ searchParams }: { searchParams: Promise<{ period?: string }> }) => {
  const { period } = await searchParams
  return <VatReturnPage period={period} />
}

export default FinanceVatReturnRoute
