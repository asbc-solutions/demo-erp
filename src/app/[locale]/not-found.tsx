import { useTranslations } from "next-intl"

import { Link } from "@/src/i18n/navigation"

export default function NotFound() {
  const t = useTranslations("Errors")

  return (
    <main className="bg-surface-page flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-heading text-content-primary text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-content-tertiary text-sm leading-5">{t("notFoundDescription")}</p>
      <Link href="/" className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium">
        {t("goHome")}
      </Link>
    </main>
  )
}
