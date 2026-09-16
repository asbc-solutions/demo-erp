import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base — Figma: h-10 (40px), rounded-[10px], px-3, white bg, gray-200 border
        "border-stroke-default bg-surface-white text-content-primary placeholder:text-content-quaternary h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow,border-color]",
        // Focus — Figma: indigo border + 2px indigo/10 ring
        "focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 focus-visible:ring-[3px]",
        // File input
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Disabled — Figma: gray-100 bg + 50% gray-400 text
        "disabled:bg-surface-hover disabled:text-content-quaternary/70 disabled:placeholder:text-content-quaternary/50 disabled:pointer-events-none disabled:cursor-not-allowed",
        // Invalid (error) — Figma: red border + red ring
        "aria-invalid:border-brand-danger aria-invalid:ring-brand-danger/15 aria-invalid:focus-visible:border-brand-danger aria-invalid:focus-visible:ring-brand-danger/20 aria-invalid:ring-[3px]",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
