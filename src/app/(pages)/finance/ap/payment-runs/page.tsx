import { PaymentRunPage } from "@/src/features/finance/money-out/components/payment-runs/payment-run-page"

const FinancePaymentRunsRoute = async ({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>
}) => {
  const { supplier } = await searchParams
  return <PaymentRunPage supplierId={supplier} />
}

export default FinancePaymentRunsRoute
