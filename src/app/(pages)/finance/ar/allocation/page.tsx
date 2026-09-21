import { ReceiptAllocationPage } from "@/src/features/finance/money-in/components/allocation/receipt-allocation-page"

const FinanceReceiptAllocationRoute = async ({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>
}) => {
  const { customer } = await searchParams
  return <ReceiptAllocationPage initialCustomerId={customer} />
}

export default FinanceReceiptAllocationRoute
