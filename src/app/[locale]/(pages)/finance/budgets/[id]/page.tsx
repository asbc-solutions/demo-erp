import { BudgetDetailPage } from "@/src/features/finance/planning/components/budgets/budget-detail-page"

const FinanceBudgetRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <BudgetDetailPage budgetId={decodeURIComponent(id)} />
}

export default FinanceBudgetRoute
