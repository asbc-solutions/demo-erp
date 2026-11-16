import { JournalDetailPage } from "@/src/features/finance/ledger/components/journals/journal-detail-page"

const FinanceJournalRoute = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <JournalDetailPage journalId={decodeURIComponent(id)} />
}

export default FinanceJournalRoute
