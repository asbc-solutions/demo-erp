import * as React from "react"

import { cn } from "@/src/shared/lib/utils/utils"

type CircularProgressColor =
  | "indigo"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "violet"

const COLOR_TOKEN: Record<CircularProgressColor, string> = {
  indigo: "var(--color-brand-primary)",
  emerald: "var(--color-brand-success)",
  amber: "var(--color-brand-warning)",
  red: "var(--color-brand-danger)",
  blue: "var(--color-brand-info)",
  violet: "var(--color-violet-500)",
}

type CircularProgressProps = React.ComponentProps<"div"> & {
  /** Progress 0-100. */
  value: number
  /** Outer pixel size of the ring. */
  size?: number
  /** Stroke thickness. */
  strokeWidth?: number
  /** Track + indicator color from the brand palette. */
  color?: CircularProgressColor
  /** Show numeric value as %, otherwise raw. Defaults to false. */
  showPercent?: boolean
  /** Optional label rendered below the value. */
  label?: React.ReactNode
  /** Override the rendered center content (replaces value/label). */
  children?: React.ReactNode
}

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  color = "indigo",
  showPercent = false,
  label,
  children,
  className,
  ...props
}: CircularProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - safeValue / 100)
  const stroke = COLOR_TOKEN[color]

  const valueText = showPercent
    ? `${Math.round(safeValue)}%`
    : Math.round(safeValue).toString()
  const valueClass = size >= 120 ? "text-2xl" : "text-sm"

  return (
    <div
      data-slot="circular-progress"
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size }}
      {...props}
    >
      <progress value={safeValue} max={100} className="sr-only">
        {valueText}
      </progress>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-stroke-default)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            fill="none"
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ?? (
            <span
              className={cn(
                "text-content-primary leading-tight font-bold",
                valueClass,
              )}
            >
              {valueText}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-content-tertiary mt-1 text-[10px] leading-[15px]">
          {label}
        </span>
      )}
    </div>
  )
}

export { CircularProgress }
