import { VoucherListPage } from "@/src/features/finance/subledger/components/vouchers/voucher-list-page"

/** 03.05 · Voucher detail — the payments list with the new payment voucher open. */
const FinanceNewPaymentRoute = () => <VoucherListPage side="payable" newVoucher />

export default FinanceNewPaymentRoute
