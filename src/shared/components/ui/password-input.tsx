"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Input } from "./input"

function PasswordInput({
  className,
  ...props
}: Readonly<Omit<React.ComponentProps<"input">, "type">>) {
  const t = useTranslations("Ui")
  const [visible, setVisible] = React.useState(false)

  return (
    <div data-slot="password-input" className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pe-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className="text-content-tertiary hover:text-content-secondary absolute top-1/2 inset-e-3 -translate-y-1/2"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  )
}

export { PasswordInput }
