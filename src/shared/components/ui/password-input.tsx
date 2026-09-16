"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Input } from "./input"

function PasswordInput({
  className,
  ...props
}: Readonly<Omit<React.ComponentProps<"input">, "type">>) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div data-slot="password-input" className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="text-content-tertiary hover:text-content-secondary absolute top-1/2 right-3 -translate-y-1/2"
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
