import { CustomerCardPage } from "@/src/features/finance/money-in/components/customer-card/customer-card-page"

const FinanceCustomerCardRoute = async ({
  params,
}: {
  params: Promise<{ contactId: string }>
}) => {
  const { contactId } = await params
  return <CustomerCardPage customerId={decodeURIComponent(contactId)} />
}

export default FinanceCustomerCardRoute
