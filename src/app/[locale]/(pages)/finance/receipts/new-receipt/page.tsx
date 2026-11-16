import { VoucherListPage } from "@/src/features/finance/subledger/components/vouchers/voucher-list-page"

/** 02.05 · Voucher detail — the receipts list with the new receipt voucher open. */
const FinanceNewReceiptRoute = () => <VoucherListPage side="receivable" newVoucher />

export default FinanceNewReceiptRoute
