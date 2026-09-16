import { Lock } from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

type AccessDeniedCardProps = {
  title?: string
  description: string
  className?: string
}

function AccessDeniedCard({
  title = "You don't have access",
  description,
  className,
}: Readonly<AccessDeniedCardProps>) {
  return (
    <Card
      data-slot="access-denied-card"
      variant="elevated"
      className={cn(
        "min-h-64 flex-1 items-center justify-center gap-2 p-6 text-center",
        className,
      )}
    >
      <div
        className="bg-surface-hover flex size-11 items-center justify-center rounded-full"
        aria-hidden
      >
        <Lock className="text-content-tertiary size-5" strokeWidth={1.75} />
      </div>
      <h3 className="text-content-primary text-[14px] leading-[22.4px] font-semibold">
        {title}
      </h3>
      <p className="text-content-tertiary max-w-sm text-[12px] leading-[18px]">
        {description}
      </p>
    </Card>
  )
}

export { AccessDeniedCard }
export type { AccessDeniedCardProps }
