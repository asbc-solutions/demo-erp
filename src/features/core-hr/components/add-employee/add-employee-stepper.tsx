import { Briefcase, Check, DollarSign, UserRound, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/src/shared/lib/utils/utils"

export type AddEmployeeStepId = "personal" | "employment" | "compensation"

// Step labels live in `HrAddEmployee.step.<id>`.
type Step = Readonly<{
  id: AddEmployeeStepId
  icon: LucideIcon
}>

const STEPS: Step[] = [
  { id: "personal", icon: UserRound },
  { id: "employment", icon: Briefcase },
  { id: "compensation", icon: DollarSign },
]

export const ADD_EMPLOYEE_STEPS = STEPS

type AddEmployeeStepperProps = Readonly<{
  current: AddEmployeeStepId
  steps?: Step[]
}>

export function AddEmployeeStepper({
  current,
  steps = STEPS,
}: AddEmployeeStepperProps) {
  const t = useTranslations("HrAddEmployee")
  const currentIndex = steps.findIndex((step) => step.id === current)

  return (
    <ol className="flex w-full max-w-[512px] items-start">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCurrent = index === currentIndex
        const isComplete = index < currentIndex
        const isLast = index === steps.length - 1

        return (
          <li
            key={step.id}
            className={cn("flex items-start gap-0", !isLast && "flex-1")}
          >
            <div className="flex w-[102px] flex-col items-center gap-2">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-colors",
                  isComplete && "bg-brand-success text-white",
                  isCurrent &&
                    "bg-brand-primary text-white shadow-[0_0_0_4px_rgba(99,102,241,0.12)]",
                  !isComplete &&
                    !isCurrent &&
                    "bg-surface-hover text-content-quaternary",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? (
                  <Check className="size-4" strokeWidth={2.25} />
                ) : (
                  <Icon className="size-4" strokeWidth={1.75} />
                )}
              </span>
              <span
                className={cn(
                  "text-xs leading-4 font-medium whitespace-nowrap",
                  isCurrent && "text-brand-primary",
                  isComplete && "text-content-secondary",
                  !isCurrent && !isComplete && "text-content-tertiary",
                )}
              >
                {t(`step.${step.id}`)}
              </span>
            </div>

            {!isLast && (
              <div
                aria-hidden
                className={cn(
                  "mt-[19px] h-0.5 flex-1 rounded-full",
                  isComplete ? "bg-brand-success" : "bg-stroke-default",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
