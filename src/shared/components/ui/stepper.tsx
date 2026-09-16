import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"

type StepStatus = "completed" | "current" | "upcoming"

const StepContext = React.createContext<{
  status: StepStatus
  index: number
  isLast: boolean
}>({
  status: "upcoming",
  index: 0,
  isLast: false,
})

type StepperProps = React.ComponentProps<"ol"> & {
  orientation?: "vertical" | "horizontal"
}

function Stepper({
  className,
  orientation = "vertical",
  ...props
}: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        "flex w-full",
        orientation === "vertical" ? "flex-col" : "flex-row items-start gap-4",
        className,
      )}
      {...props}
    />
  )
}

type StepProps = Omit<React.ComponentProps<"li">, "children"> & {
  status?: StepStatus
  index?: number
  isLast?: boolean
  children?: React.ReactNode
}

function Step({
  className,
  status = "upcoming",
  index = 0,
  isLast = false,
  children,
  ...props
}: StepProps) {
  const value = React.useMemo(() => ({ status, index, isLast }), [status, index, isLast])
  return (
    <li
      data-slot="step"
      data-status={status}
      className={cn("flex w-full gap-4", className)}
      {...props}
    >
      <StepContext.Provider value={value}>{children}</StepContext.Provider>
    </li>
  )
}

function StepIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { status, index, isLast } = React.useContext(StepContext)
  const showCheck = status === "completed"
  return (
    <div
      data-slot="step-indicator"
      data-status={status}
      className={cn("flex flex-col items-center", className)}
      {...props}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-semibold transition-colors",
          status === "completed" && "bg-brand-success text-white",
          status === "current" && "bg-brand-primary text-white",
          status === "upcoming" &&
            "border-stroke-input bg-surface-white text-content-quaternary border",
        )}
      >
        {children ??
          (showCheck ? (
            <Check className="size-4" strokeWidth={2.5} />
          ) : (
            index + 1
          ))}
      </div>
      {!isLast && (
        <div
          data-slot="step-connector"
          className={cn(
            "mt-1 mb-1 h-12 w-0.5 shrink-0 rounded-full transition-colors",
            status === "completed" ? "bg-brand-success" : "bg-stroke-default",
          )}
        />
      )}
    </div>
  )
}

function StepContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isLast } = React.useContext(StepContext)
  return (
    <div
      data-slot="step-content"
      className={cn(
        "flex flex-col gap-0.5",
        !isLast && "pb-8",
        className,
      )}
      {...props}
    />
  )
}

function StepTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { status } = React.useContext(StepContext)
  return (
    <p
      data-slot="step-title"
      className={cn(
        "text-sm leading-5 font-medium",
        status === "completed" && "text-content-primary",
        status === "current" && "text-brand-primary",
        status === "upcoming" && "text-content-quaternary",
        className,
      )}
      {...props}
    />
  )
}

function StepDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { status } = React.useContext(StepContext)
  return (
    <p
      data-slot="step-description"
      className={cn(
        "text-xs leading-4",
        status === "upcoming" ? "text-content-quaternary" : "text-content-tertiary",
        className,
      )}
      {...props}
    />
  )
}

export {
  Step,
  StepContent,
  StepDescription,
  StepIndicator,
  StepTitle,
  Stepper,
}
export type { StepStatus }
