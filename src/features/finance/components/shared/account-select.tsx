"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import { useFinanceAccounts } from "../../lib/queries/master-data"

type AccountSelectProps = {
  id?: string
  value: string
  onValueChange: (code: string) => void
  placeholder?: string
  invalid?: boolean
  className?: string
  "aria-label"?: string
  /** Narrow the list, e.g. to fixed-asset cost accounts. */
  filter?: (code: string) => boolean
}

/** Pick a postable ledger account, shown as `code · name`. */
function AccountSelect({
  id,
  value,
  onValueChange,
  placeholder,
  invalid,
  className,
  "aria-label": ariaLabel,
  filter,
}: AccountSelectProps) {
  const t = useTranslations("FinanceShared")
  const { data = [] } = useFinanceAccounts()
  const accounts = filter ? data.filter((account) => filter(account.code)) : data
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        data-slot="account-select"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn("h-9 w-full", className)}
      >
        <SelectValue placeholder={placeholder ?? t("chooseAccount")} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.code} value={account.code}>
            <span className="font-mono text-xs">{account.code}</span> {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { AccountSelect }
