"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"

interface ErrorProps {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: Readonly<ErrorProps>) {
  const t = useTranslations("Errors")

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-content-primary text-2xl font-bold">{t("somethingWentWrong")}</h1>
      <p className="text-content-tertiary text-sm">{error.message}</p>
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  )
}
