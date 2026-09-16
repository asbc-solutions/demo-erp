import * as React from "react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

type StepShellProps = Readonly<{
  title: string
  description: string
  children: React.ReactNode
  className?: string
}>

export function StepShell({
  title,
  description,
  children,
  className,
}: StepShellProps) {
  return (
    <Card
      variant="elevated"
      className={cn("rounded-[14px] p-6", className)}
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          {title}
        </h2>
        <p className="text-content-tertiary text-sm leading-5">{description}</p>
      </header>

      <div className="mt-6 flex flex-col gap-4">{children}</div>
    </Card>
  )
}
