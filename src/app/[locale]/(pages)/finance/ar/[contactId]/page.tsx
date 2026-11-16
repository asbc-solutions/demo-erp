import { ContactCardPage } from "@/src/features/finance/subledger/components/contact-card/contact-card-page"

const FinanceCustomerCardRoute = async ({
  params,
}: {
  params: Promise<{ contactId: string }>
}) => {
  const { contactId } = await params
  return <ContactCardPage side="receivable" contactId={decodeURIComponent(contactId)} />
}

export default FinanceCustomerCardRoute
