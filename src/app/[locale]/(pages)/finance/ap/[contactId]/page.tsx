import { ContactCardPage } from "@/src/features/finance/subledger/components/contact-card/contact-card-page"

const FinanceSupplierCardRoute = async ({
  params,
}: {
  params: Promise<{ contactId: string }>
}) => {
  const { contactId } = await params
  return <ContactCardPage side="payable" contactId={decodeURIComponent(contactId)} />
}

export default FinanceSupplierCardRoute
