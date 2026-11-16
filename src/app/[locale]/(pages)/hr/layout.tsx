"use client"

import { useTranslations } from "next-intl"

import { usePathname } from "@/src/i18n/navigation"

import { useRegisterLayoutHeaderTab } from "@/src/shared/components/layout-header-context"
import { HR_NAV } from "@/src/shared/lib/constants/hr-nav"

/** Shared chrome for every HR section, and the section label in the shell header. */
export default function HrLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const tNav = useTranslations("Nav")
  const pathname = usePathname()
  const activeItem = HR_NAV.find((item) => pathname.startsWith(item.href))
  useRegisterLayoutHeaderTab(activeItem ? tNav(activeItem.labelKey) : "")

  return (
    <div className="bg-surface-page flex flex-1 flex-col gap-6 p-6">{children}</div>
  )
}
