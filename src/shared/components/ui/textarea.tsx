import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // `wrap-anywhere` + `min-w-0` stop a long unbroken string from inflating the
        // textarea's min-content width, which would otherwise blow past the dialog's
        // grid track and push the modal off-screen (`field-sizing-content` amplifies this).
        "border-stroke-default bg-surface-white text-content-primary placeholder:text-content-quaternary field-sizing-content min-h-20 w-full min-w-0 rounded-lg border px-3 py-2 text-sm wrap-anywhere shadow-xs outline-none transition-[color,box-shadow,border-color]",
        "focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 focus-visible:ring-[3px]",
        "disabled:bg-surface-hover disabled:text-content-quaternary/70 disabled:pointer-events-none disabled:cursor-not-allowed",
        "aria-invalid:border-brand-danger aria-invalid:ring-brand-danger/15 aria-invalid:focus-visible:border-brand-danger aria-invalid:focus-visible:ring-brand-danger/20 aria-invalid:ring-[3px]",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
