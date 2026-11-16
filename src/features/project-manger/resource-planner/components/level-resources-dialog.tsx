"use client"

import { CalendarClock, CheckCircle2, Scissors, UserRoundPlus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
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
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Progress } from "@/src/shared/components/ui/progress"

import type { AvatarColor } from "../../all-project/data/all-projects-data"

export type OverAllocatedResource = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  /** Average allocation across the period, in percent. */
  allocationPct: number
  /** Worst single week in the heatmap, when the heatmap covers this person. */
  peakPct: number | null
}

const LEVELLING_STEPS: readonly { icon: LucideIcon; text: string }[] = [
  {
    icon: CalendarClock,
    text: "Push the lowest-priority tasks later until each week fits inside the person's capacity.",
  },
  {
    icon: Scissors,
    text: "Trim allocation percentages on bookings that overlap, starting with the ones that have slack.",
  },
  {
    icon: UserRoundPlus,
    text: "Surface whatever still does not fit so it can be reassigned to someone with free capacity.",
  },
]

type LevelResourcesDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  resources: readonly OverAllocatedResource[]
  /** Opens the assign dialog for one person so their load can be rebalanced. */
  onReassign: (employeeId: string) => void
}>

export function LevelResourcesDialog({
  open,
  onOpenChange,
  resources,
  onReassign,
}: LevelResourcesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="pe-10">
          <DialogTitle>Level Resources</DialogTitle>
          <DialogDescription>
            {resources.length === 0
              ? "Nothing is over capacity in the current period."
              : `${resources.length} ${resources.length === 1 ? "person is" : "people are"} booked above 100% in the current period.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <div className="bg-surface-muted flex flex-col gap-2 rounded-lg px-3 py-2.5">
            <p className="text-content-secondary text-xs leading-5 font-semibold">
              What levelling does
            </p>
            {LEVELLING_STEPS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-2">
                <Icon
                  className="text-content-tertiary mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                <p className="text-content-tertiary text-xs leading-5">{text}</p>
              </div>
            ))}
            <p className="text-content-quaternary text-xs leading-5">
              Automatic levelling is not connected in this build, so nothing is
              rescheduled from here — use the assignments below to rebalance by
              hand.
            </p>
          </div>

          {resources.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 aria-hidden />}
              title="No over-allocated resources"
              description="Everyone is at or below 100% for this period. There is nothing to level."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {resources.map((resource) => (
                <li
                  key={resource.id}
                  className="border-stroke-default flex flex-wrap items-center gap-3 rounded-[10px] border px-3 py-2.5"
                >
                  <Avatar color={resource.color} className="size-8 text-[11px]">
                    {resource.initials}
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-content-primary truncate text-[13px] font-medium">
                        {resource.name}
                      </span>
                      <Badge variant="danger" className="text-[11px]">
                        +{resource.allocationPct - 100} pts over
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={100}
                        color="red"
                        className="bg-surface-muted h-1.5 w-24"
                      />
                      <span className="text-content-tertiary text-xs tabular-nums">
                        {resource.allocationPct}% average
                        {resource.peakPct == null
                          ? ""
                          : ` · ${resource.peakPct}% peak week`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[13px]"
                    onClick={() => onReassign(resource.id)}
                  >
                    Rebalance
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 px-4 text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
