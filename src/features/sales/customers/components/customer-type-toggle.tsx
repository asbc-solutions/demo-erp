import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

import type { CustomerType } from "../../lib/types"

/** Two-segment pill toggle for Company/Individual — matches the Figma New/Edit Customer frames. */
export function CustomerTypeToggle({
  value,
  onChange,
}: Readonly<{ value: CustomerType; onChange: (value: CustomerType) => void }>) {
  const t = useTranslations("SalesShared")

  return (
    <div className="border-stroke-default bg-surface-white flex rounded-lg border p-1">
      {(["company", "individual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "h-8 flex-1 rounded-md text-sm font-medium capitalize transition-colors",
            value === option
              ? "bg-brand-primary text-white"
              : "text-content-secondary hover:text-content-primary"
          )}
        >
          {t(`customerType.${option}`)}
        </button>
      ))}
    </div>
  )
}
