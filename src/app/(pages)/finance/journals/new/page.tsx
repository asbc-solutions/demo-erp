import { JournalFormPage } from "@/src/features/finance/ledger/components/journals/journal-form-page"

const FinanceNewJournalRoute = async ({ searchParams }: { searchParams: Promise<{ template?: string }> }) => {
  const { template } = await searchParams
  return <JournalFormPage templateId={template} />
}

export default FinanceNewJournalRoute
