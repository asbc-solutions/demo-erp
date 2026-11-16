import { Link } from "@/src/i18n/navigation"
import { ArrowDownUp, Banknote, ChartColumn, Scale, type LucideIcon } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"

type Report = { title: string; description: string; icon: LucideIcon; href: string | null }

const REPORTS: Report[] = [
  { title: "Trial balance", description: "Every account's debit and credit, proving the ledger ties out.", icon: Scale, href: "/finance/reports/trial-balance" },
  { title: "Profit & loss", description: "Revenue less expenses for the period — the bottom line.", icon: ChartColumn, href: null },
  { title: "Balance sheet", description: "Assets, liabilities and equity at a point in time.", icon: Banknote, href: null },
  { title: "Cash flow", description: "Where cash came from and went, by activity.", icon: ArrowDownUp, href: null },
]

const CARD = "border-stroke-default bg-surface-white flex flex-col gap-2 rounded-xl border p-5"

/** 10.01 · Report library — the standard statements. */
function ReportLibraryPage() {
  return (
    <>
      <FinancePageHeader title="Reports" figure={<HeaderFigure label="Standard statements">{REPORTS.length}</HeaderFigure>} />
      <FinancePageBody>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => {
            const Icon = report.icon
            const body = (
              <>
                <Icon className="text-brand-primary size-4" aria-hidden />
                <span className="text-content-primary text-sm leading-5 font-medium">{report.title}</span>
                <span className="text-content-secondary text-[13px] leading-5">{report.description}</span>
                {report.href ? null : <span className="text-content-tertiary text-xs leading-4">Not available in this workspace yet.</span>}
              </>
            )
            return (
              <li key={report.title}>
                {report.href ? (
                  <Link
                    href={report.href}
                    className={cn(CARD, "hover:border-stroke-input focus-visible:ring-brand-primary/40 h-full outline-none focus-visible:ring-2")}
                  >
                    {body}
                  </Link>
                ) : (
                  <div aria-disabled className={cn(CARD, "h-full opacity-60")}>
                    {body}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </FinancePageBody>
    </>
  )
}

export { ReportLibraryPage }
