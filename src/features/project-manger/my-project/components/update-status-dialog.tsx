"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { collaborationApi } from "../../lib/api/collaboration"
import { pmKeys } from "../../lib/constants/query-keys"
import { useProjects } from "../../lib/queries/projects"
import { HEALTH_STATE_KEY } from "../../all-project/data/project-detail-data"

type UpdateStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ProjectHealth = "On Track" | "At Risk" | "Critical"

const HEALTH_OPTIONS: ProjectHealth[] = ["On Track", "At Risk", "Critical"]

const HEALTH_STYLE: Record<ProjectHealth, { active: string; idle: string }> = {
  "On Track": {
    active: "border-brand-success bg-brand-success/10 text-brand-success",
    idle: "border-stroke-default text-content-tertiary hover:text-content-primary",
  },
  "At Risk": {
    active: "border-brand-warning bg-brand-warning/10 text-brand-warning",
    idle: "border-stroke-default text-content-tertiary hover:text-content-primary",
  },
  Critical: {
    active: "border-brand-danger bg-brand-danger/10 text-brand-danger",
    idle: "border-stroke-default text-content-tertiary hover:text-content-primary",
  },
}

export function UpdateStatusDialog({
  open,
  onOpenChange,
}: UpdateStatusDialogProps) {
  const t = useTranslations("ProjectsMyProjects")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const [projectId, setProjectId] = useState("")
  const [health, setHealth] = useState<ProjectHealth>("On Track")
  const [summary, setSummary] = useState("")

  const projectsQ = useProjects({ is_active: true, per_page: 100 }, { enabled: open })
  const projects = projectsQ.data?.data ?? []

  // The update is posted into the project discussion (root-node message) —
  // there is no dedicated status-update endpoint.
  const qc = useQueryClient()
  const postUpdate = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      collaborationApi
        .send(id, { project_id: id, node_type: "project", body })
        .then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: pmKeys.collaboration.messagesAll(id) }),
  })

  const reset = () => {
    setProjectId("")
    setHealth("On Track")
    setSummary("")
  }

  const close = () => {
    onOpenChange(false)
    window.setTimeout(reset, 200)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) close()
    else onOpenChange(true)
  }

  const handleSubmit = () => {
    if (!projectId) {
      toast.error(t("statusPickProject"))
      return
    }
    const healthLabel = tShared(`health.${HEALTH_STATE_KEY[health]}`)
    const projectName =
      projects.find((p) => p.id === projectId)?.name ?? t("statusProjectFallback")
    const body = [t("statusUpdateBody", { health: healthLabel }), summary.trim()]
      .filter(Boolean)
      .join("\n\n")
    postUpdate.mutate(
      { id: projectId, body },
      {
        onSuccess: () => {
          toast.success(t("statusPosted"), {
            description: t("statusPostedDescription", {
              project: projectName,
              health: healthLabel,
            }),
          })
          close()
        },
        onError: (err) =>
          toast.error(t("statusPostFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[640px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {t("statusTitle")}
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            {t("statusDescription")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-wide uppercase">
              {tShared("projectLabel")}
            </span>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-10 w-full text-[13px]">
                <SelectValue
                  placeholder={
                    projectsQ.isLoading
                      ? tCommon("loading")
                      : tShared("selectProject")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-wide uppercase">
              {t("statusHealth")}
            </span>
            <div className="grid grid-cols-3 gap-3">
              {HEALTH_OPTIONS.map((option) => {
                const style = HEALTH_STYLE[option]
                const active = health === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setHealth(option)}
                    className={cn(
                      "h-11 rounded-xl border text-sm leading-5 font-medium transition-colors",
                      active ? style.active : style.idle,
                    )}
                  >
                    {tShared(`health.${HEALTH_STATE_KEY[option]}`)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-content-tertiary text-[11px] leading-4 font-semibold tracking-wide uppercase">
              {t("statusWeeklySummary")}
            </span>
            <Textarea
              placeholder={t("statusSummaryPlaceholder")}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[120px] text-[13px]"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-[13px]">
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={postUpdate.isPending}
            className="text-[13px]"
          >
            {postUpdate.isPending ? t("statusPosting") : t("statusPost")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
