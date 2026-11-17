import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/src/shared/components/ui/alert"

export function EmployeeNotLinkedAlert() {
  const t = useTranslations("ProjectsShared")
  return (
    <Alert variant="warning">
      <AlertTitle>{t("employeeNotLinkedTitle")}</AlertTitle>
      <AlertDescription>{t("employeeNotLinkedDescription")}</AlertDescription>
    </Alert>
  )
}
