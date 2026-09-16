import * as React from "react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"

export function SettingsSection({
  title,
  unavailableNote,
  children,
}: Readonly<{
  title: string
  unavailableNote?: string
  children: React.ReactNode
}>) {
  return (
    <Card variant="elevated" className="gap-6 overflow-hidden rounded-2xl p-6">
      <div className="border-stroke-light flex min-h-14 items-center justify-between border-b pb-4">
        <h2 className="text-[15px] leading-5.75 font-semibold text-content-primary">
          {title}
        </h2>
        {unavailableNote ? (
          <Badge variant="neutral" className="rounded-full font-normal">
            {unavailableNote}
          </Badge>
        ) : null}
      </div>
      {children}
    </Card>
  )
}
