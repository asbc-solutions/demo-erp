import { useTranslations } from "next-intl"

import { Link } from "@/src/i18n/navigation"

export default function Forbidden() {
  const t = useTranslations("Errors")

  return (
    <main className="bg-surface-white flex grow flex-col items-center justify-center gap-2 px-16 py-32">
      <h1 className="text-brand-danger text-3xl font-bold">{t("forbiddenTitle")}</h1>
      <p className="text-content-tertiary">{t("forbiddenDescription")}</p>
      <Link href="/" className="text-brand-primary hover:text-brand-primary-hover mt-4">
        {t("goHome")}
      </Link>
    </main>
  )
}
