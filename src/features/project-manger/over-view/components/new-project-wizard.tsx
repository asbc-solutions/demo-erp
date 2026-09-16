"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { cn } from "@/src/shared/lib/utils/utils"

import { useCreateProject } from "../../lib/mutations/projects"
import type { ApiError } from "@/src/shared/lib/types/api"
import {
  INITIAL_PROJECT_FORM,
  PROJECT_TYPE_TO_API,
  WIZARD_STEPS,
  type NewProjectForm,
} from "../data/new-project-data"

import {
  CalendarStep,
  ClassificationStep,
  DetailsStep,
  HierarchyStep,
  ReviewStep,
  StakeholdersStep,
} from "./new-project-steps"

type NewProjectWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StepHeader({ current }: { current: number }) {
  return (
    <ol className="flex items-start">
      {WIZARD_STEPS.map((step, index) => {
        const status =
          index < current
            ? "completed"
            : index === current
              ? "current"
              : "upcoming"
        const isLast = index === WIZARD_STEPS.length - 1
        return (
          <li
            key={step.id}
            className={cn(
              "flex flex-col items-center gap-1.5",
              !isLast && "flex-1",
            )}
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] leading-5 font-semibold transition-colors",
                  status === "completed" && "bg-brand-success text-white",
                  status === "current" && "bg-brand-primary text-white",
                  status === "upcoming" &&
                    "border-stroke-input text-content-quaternary border bg-surface-white",
                )}
              >
                {status === "completed" ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                    index < current ? "bg-brand-success" : "bg-stroke-default",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "text-[12px] leading-4 font-medium",
                status === "current"
                  ? "text-content-primary"
                  : status === "completed"
                    ? "text-content-secondary"
                    : "text-content-quaternary",
                // keep labels aligned under their circle (not the connector)
                !isLast && "self-start pl-0",
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function NewProjectWizard({ open, onOpenChange }: NewProjectWizardProps) {
  const router = useRouter()
  const createProject = useCreateProject()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<NewProjectForm>(INITIAL_PROJECT_FORM)

  const update = (patch: Partial<NewProjectForm>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  const reset = () => {
    setStep(0)
    setForm(INITIAL_PROJECT_FORM)
  }

  const close = () => {
    onOpenChange(false)
    // delay reset until the close animation finishes
    window.setTimeout(reset, 200)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) close()
    else onOpenChange(true)
  }

  const isLast = step === WIZARD_STEPS.length - 1
  const currentStep = WIZARD_STEPS[step]

  const goNext = () => setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  const goBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSaveDraft = () => {
    toast("Saved as draft", {
      description: form.name
        ? `“${form.name}” kept in your drafts.`
        : "You can finish setting it up later.",
    })
    close()
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Project name is required", {
        description: "Add a name in the Details step before submitting.",
      })
      setStep(1)
      return
    }

    const missing: string[] = []
    if (!form.code.trim()) missing.push("project code")
    if (!form.managerId) missing.push("project manager")
    if (!form.branchId) missing.push("branch")
    if (!form.costCentreId) missing.push("cost centre")
    if (!form.startDate) missing.push("start date")
    if (!form.endDate) missing.push("end date")
    if (missing.length > 0) {
      toast.error("Missing required fields", {
        description: `Please set: ${missing.join(", ")} in the Details step.`,
      })
      setStep(1)
      return
    }

    createProject.mutate(
      {
        project_code: form.code.trim(),
        name: form.name.trim(),
        description: form.description || null,
        project_type: PROJECT_TYPE_TO_API[form.type],
        classification: form.classification,
        start_date: form.startDate,
        end_date: form.endDate,
        manager_id: form.managerId,
        branch_id: form.branchId,
        cost_centre_id: form.costCentreId,
        currency_code: form.currencyCode || "EGP",
        budget_amount: form.budgetAmount ? Number(form.budgetAmount) : null,
        template_id: null,
      },
      {
        onSuccess: (project) => {
          toast.success("Project created", {
            description: `"${project.name}" has been created.`,
          })
          close()
          router.push(`/all-project/${project.id}`)
        },
        onError: (err) => {
          const e = err as unknown as ApiError
          toast.error("Couldn't create project", {
            description: e.message ?? "Please try again.",
          })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] max-w-[880px] flex-col gap-0 p-0"
      >
        <DialogHeader className="gap-0.5 px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            New Project
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            Step {step + 1} of {WIZARD_STEPS.length} — {currentStep.label}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-5 pb-4">
          <StepHeader current={step} />
        </div>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-1 pb-5">
          {step === 0 && <ClassificationStep form={form} update={update} />}
          {step === 1 && <DetailsStep form={form} update={update} />}
          {step === 2 && <HierarchyStep />}
          {step === 3 && <StakeholdersStep form={form} update={update} />}
          {step === 4 && <CalendarStep form={form} update={update} />}
          {step === 5 && <ReviewStep form={form} update={update} />}
        </div>

        <div className="border-stroke-default flex items-center justify-between gap-3 border-t px-6 py-4">
          {step === 0 ? (
            <Button
              variant="ghost"
              onClick={close}
              className="text-content-tertiary hover:text-content-primary gap-1 px-2 text-[13px]"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Cancel
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={goBack}
              className="text-content-secondary hover:text-content-primary gap-1 px-2 text-[13px]"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Button>
          )}

          {isLast ? (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                className="text-[13px]"
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={createProject.isPending}
                className="gap-1.5 text-[13px]"
              >
                <Check className="size-4" aria-hidden />
                {createProject.isPending ? "Creating…" : "Create Project"}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={goNext}
              className="gap-1.5 text-[13px]"
            >
              <ChevronRight className="size-4" aria-hidden />
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
