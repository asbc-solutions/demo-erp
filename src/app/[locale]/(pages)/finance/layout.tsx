"use client"

import { useTranslations } from "next-intl"

import { usePathname } from "@/src/i18n/navigation"

import { FinanceSectionGate } from "@/src/features/finance/components/shell/finance-section-gate"
import { FinanceToolbar } from "@/src/features/finance/components/shell/finance-toolbar"
import { FinanceScopeProvider } from "@/src/features/finance/lib/context/finance-scope"
import { matchFinanceNav } from "@/src/features/finance/lib/utils/nav"
import { useRegisterLayoutHeaderTab } from "@/src/shared/components/layout-header-context"

/** Shared chrome for every finance route: scope, toolbar, section gate. */
export default function FinanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tNav = useTranslations("Nav")
  const pathname = usePathname()
  const activeItem = matchFinanceNav(pathname)?.item
  useRegisterLayoutHeaderTab(activeItem ? tNav(activeItem.labelKey) : "")

  return (
    <FinanceScopeProvider>
      <div className="bg-surface-page flex flex-1 flex-col">
        <FinanceToolbar />
        <FinanceSectionGate>{children}</FinanceSectionGate>
      </div>
    </FinanceScopeProvider>
  )
}
