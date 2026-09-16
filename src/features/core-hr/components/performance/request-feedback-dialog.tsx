"use client"

import { useState } from "react"
import { toast } from "sonner"

import type { ApiError } from "@/src/shared/lib/types/api"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { useEmployees } from "../../lib/queries/employees"
import { useReviewCycles } from "../../lib/queries/performance"
import { useRequest360Feedback } from "../../lib/mutations/performance"
import type { FeedbackRelationship } from "../../lib/types"

const RELATIONSHIPS: { id: FeedbackRelationship; label: string }[] = [
  { id: "peer", label: "Peer" },
  { id: "manager", label: "Manager" },
  { id: "subordinate", label: "Direct report" },
  { id: "self", label: "Self" },
  { id: "external", label: "External" },
]

type RequestFeedbackDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>

export function RequestFeedbackDialog({
  open,
  onOpenChange,
}: RequestFeedbackDialogProps) {
  const [raterEmpId, setRaterEmpId] = useState("")
  const [relationship, setRelationship] = useState<FeedbackRelationship | "">("")

  const { data: employeesData } = useEmployees({ per_page: 100 }, { enabled: open })
  const employees = employeesData?.data ?? []

  const { data: cyclesData } = useReviewCycles({ per_page: 20 }, { enabled: open })
  const cycles = cyclesData?.data ?? []
  const activeCycle =
    cycles.find(
      (cycle) =>
        !["completed", "closed", "archived"].includes(cycle.status),
    ) ?? cycles[0]
  const cycleId = activeCycle?.cycle_id
  const cycleName = activeCycle?.cycle_name ?? "Active review cycle"

  const requestFeedback = useRequest360Feedback()

  const reset = () => {
    setRaterEmpId("")
    setRelationship("")
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const canSubmit = !!cycleId && !!raterEmpId && !!relationship

  const handleSubmit = () => {
    if (!cycleId || !raterEmpId || !relationship) return
    requestFeedback.mutate(
      { cycle_id: cycleId, rater_emp_id: raterEmpId, relationship },
      {
        onSuccess: () => {
          toast.success("Feedback request sent")
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error("Couldn't send request", {
            description:
              (err as unknown as ApiError)?.message ?? "Please try again.",
          })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request 360 feedback</DialogTitle>
          <DialogDescription>
            Ask a colleague to provide multi-rater feedback for the current cycle.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          {/* Cycle (derived, read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label>Review cycle</Label>
            <div className="flex h-10 items-center rounded-lg border border-stroke-default bg-surface-hover px-3 text-sm text-content-secondary">
              {cycleId ? cycleName : "No active review cycle"}
            </div>
            {!cycleId && (
              <p className="text-xs text-brand-danger">
                You need an active appraisal cycle before requesting feedback.
              </p>
            )}
          </div>

          {/* Rater */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rater">Reviewer</Label>
            <Select value={raterEmpId} onValueChange={setRaterEmpId}>
              <SelectTrigger id="rater">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="relationship">Relationship</Label>
            <Select
              value={relationship}
              onValueChange={(v) => setRelationship(v as FeedbackRelationship)}
            >
              <SelectTrigger id="relationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmit || requestFeedback.isPending}
            onClick={handleSubmit}
          >
            {requestFeedback.isPending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
