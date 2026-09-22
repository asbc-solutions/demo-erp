import { GeneralLedgerPage } from "@/src/features/finance/ledger/components/general-ledger/general-ledger-page"

const FinanceLedgerRoute = async ({ searchParams }: { searchParams: Promise<{ account?: string; contact?: string }> }) => {
  const { account, contact } = await searchParams
  return <GeneralLedgerPage account={account} contact={contact} />
}

export default FinanceLedgerRoute
