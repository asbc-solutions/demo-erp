"use client"

import * as React from "react"

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
}

/** Pick a postable ledger account, shown as `code · name`. */
function AccountSelect({
  id,
  value,
  onValueChange,
  placeholder = "Choose an account",
  invalid,
  className,
  "aria-label": ariaLabel,
}: AccountSelectProps) {
  const { data: accounts = [] } = useFinanceAccounts()
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        data-slot="account-select"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn("h-9 w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
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
