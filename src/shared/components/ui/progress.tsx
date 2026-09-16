"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

const progressTrackVariants = cva(
  "bg-stroke-default relative w-full overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "default" },
  },
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-transform",
  {
    variants: {
      color: {
        indigo: "bg-brand-primary",
        emerald: "bg-brand-success",
        amber: "bg-brand-warning",
        red: "bg-brand-danger",
        blue: "bg-brand-info",
        violet: "bg-violet-500",
      },
    },
    defaultVariants: { color: "indigo" },
  },
)

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressTrackVariants> &
  VariantProps<typeof progressIndicatorVariants> & {
    /** Show diagonal stripes overlay (matches Figma "Animated / Striped"). */
    striped?: boolean
    /** Animate the stripes. Implies `striped`. */
    animated?: boolean
  }

function Progress({
  className,
  value,
  size,
  color,
  striped = false,
  animated = false,
  ...props
}: ProgressProps) {
  const showStripes = striped || animated
  const safeValue = Math.min(100, Math.max(0, value ?? 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={safeValue}
      className={cn(progressTrackVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          progressIndicatorVariants({ color }),
          showStripes &&
            "bg-[linear-gradient(45deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem]",
          animated && "animate-progress-stripes",
        )}
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress, progressIndicatorVariants, progressTrackVariants }
