import { Link } from "@/src/i18n/navigation"
import { ArrowDownUp, Banknote, ChartColumn, Scale, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import type { ReportsMessageKey } from "../../lib/types/reports"

type Report = { titleKey: ReportsMessageKey; descriptionKey: ReportsMessageKey; icon: LucideIcon; href: string | null }

const REPORTS: Report[] = [
  { titleKey: "trialBalance", descriptionKey: "trialBalanceDescription", icon: Scale, href: "/finance/reports/trial-balance" },
  { titleKey: "profitAndLoss", descriptionKey: "profitAndLossDescription", icon: ChartColumn, href: null },
  { titleKey: "balanceSheet", descriptionKey: "balanceSheetDescription", icon: Banknote, href: null },
  { titleKey: "cashFlow", descriptionKey: "cashFlowDescription", icon: ArrowDownUp, href: null },
]

const CARD = "border-stroke-default bg-surface-white flex flex-col gap-2 rounded-xl border p-5"

/** 10.01 · Report library — the standard statements. */
function ReportLibraryPage() {
  const t = useTranslations("FinanceReports")
  return (
    <>
      <FinancePageHeader title={t("reports")} figure={<HeaderFigure label={t("standardStatements")}>{REPORTS.length}</HeaderFigure>} />
      <FinancePageBody>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => {
            const Icon = report.icon
            const body = (
              <>
                <Icon className="text-brand-primary size-4" aria-hidden />
                <span className="text-content-primary text-sm leading-5 font-medium">{t(report.titleKey)}</span>
                <span className="text-content-secondary text-[13px] leading-5">{t(report.descriptionKey)}</span>
                {report.href ? null : <span className="text-content-tertiary text-xs leading-4">{t("notAvailableYet")}</span>}
              </>
            )
            return (
              <li key={report.titleKey}>
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
