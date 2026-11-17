import * as React from "react"
import { Link } from "@/src/i18n/navigation"

import { cn } from "@/src/shared/lib/utils/utils"

type DocNumberProps = React.ComponentProps<"span"> & {
  /** Makes the number a link to the document. */
  href?: string
}

/** Document and account numbers in monospace, e.g. `JE-2026-100314`. */
function DocNumber({ className, href, children, ...props }: DocNumberProps) {
  const classes = cn(
    "text-content-primary font-mono text-[13px] leading-5 whitespace-nowrap",
    href && "hover:text-brand-primary underline-offset-4 hover:underline",
    className,
  )

  if (href) {
    return (
      <Link data-slot="doc-number" href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <span data-slot="doc-number" className={classes} {...props}>
      {children}
    </span>
  )
}

export { DocNumber }
