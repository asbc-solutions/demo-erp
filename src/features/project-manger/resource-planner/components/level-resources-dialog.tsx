"use client"

import { CalendarClock, CheckCircle2, Scissors, UserRoundPlus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

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

const LEVELLING_STEPS = [
  { icon: CalendarClock, textKey: "levellingStepPush" },
  { icon: Scissors, textKey: "levellingStepTrim" },
  { icon: UserRoundPlus, textKey: "levellingStepSurface" },
] as const satisfies readonly { icon: LucideIcon; textKey: string }[]

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
  const t = useTranslations("ProjectsResourcePlanner")
  const tCommon = useTranslations("Common")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="pe-10">
          <DialogTitle>{t("levelResources")}</DialogTitle>
          <DialogDescription>
            {resources.length === 0
              ? t("levelNothingOver")
              : t("levelOverCount", { count: resources.length })}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <div className="bg-surface-muted flex flex-col gap-2 rounded-lg px-3 py-2.5">
            <p className="text-content-secondary text-xs leading-5 font-semibold">
              {t("levellingHeading")}
            </p>
            {LEVELLING_STEPS.map(({ icon: Icon, textKey }) => (
              <div key={textKey} className="flex items-start gap-2">
                <Icon
                  className="text-content-tertiary mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                <p className="text-content-tertiary text-xs leading-5">
                  {t(textKey)}
                </p>
              </div>
            ))}
            <p className="text-content-quaternary text-xs leading-5">
              {t("levellingNotConnected")}
            </p>
          </div>

          {resources.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 aria-hidden />}
              title={t("levelEmptyTitle")}
              description={t("levelEmptyDescription")}
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
                        {t("pointsOver", { points: resource.allocationPct - 100 })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={100}
                        color="red"
                        className="bg-surface-muted h-1.5 w-24"
                      />
                      <span className="text-content-tertiary text-xs tabular-nums">
                        {resource.peakPct == null
                          ? t("averageAllocation", { pct: resource.allocationPct })
                          : t("averageAndPeak", {
                              pct: resource.allocationPct,
                              peak: resource.peakPct,
                            })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[13px]"
                    onClick={() => onReassign(resource.id)}
                  >
                    {t("rebalance")}
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
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
