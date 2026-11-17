"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
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
import { Textarea } from "@/src/shared/components/ui/textarea"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useSendWeeklyDigest } from "../../lib/mutations/my-work"
import { useProjects } from "../../lib/queries/projects"
import { useResources } from "../../lib/queries/resources"
import type { DigestSection } from "../../lib/types"

/** Digest sections; each id is a `ProjectsOverview.digestInclude` message key. */
const DIGEST_INCLUDES: DigestSection[] = [
  "health",
  "milestones",
  "risks",
  "focus",
  "budget",
]

type SendWeeklyDigestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendWeeklyDigestDialog({
  open,
  onOpenChange,
}: SendWeeklyDigestDialogProps) {
  const t = useTranslations("ProjectsOverview")
  const tShared = useTranslations("ProjectsShared")
  const tCommon = useTranslations("Common")
  const [projectId, setProjectId] = useState("")
  const [recipients, setRecipients] = useState<string[]>([])
  const [includes, setIncludes] = useState<DigestSection[]>(DIGEST_INCLUDES)
  const [message, setMessage] = useState("")

  const projectsQ = useProjects({ is_active: true, per_page: 100 }, { enabled: open })
  const resourcesQ = useResources({ per_page: 100 }, { enabled: open })
  const sendDigest = useSendWeeklyDigest()

  const projects = projectsQ.data?.data ?? []
  const employees = useMemo(
    () =>
      (resourcesQ.data ?? []).map((r) => ({
        id: r.employee_id,
        label: `${r.first_name} ${r.last_name}`.trim(),
      })),
    [resourcesQ.data],
  )
  const employeeLabel = useMemo(
    () => new Map(employees.map((e) => [e.id, e.label])),
    [employees],
  )

  const reset = () => {
    setProjectId("")
    setRecipients([])
    setIncludes(DIGEST_INCLUDES)
    setMessage("")
  }

  const close = () => {
    onOpenChange(false)
    window.setTimeout(reset, 200)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) close()
    else onOpenChange(true)
  }

  const addRecipient = (id: string) =>
    setRecipients((prev) => (prev.includes(id) ? prev : [...prev, id]))

  const removeRecipient = (id: string) =>
    setRecipients((prev) => prev.filter((r) => r !== id))

  const toggleInclude = (id: DigestSection) =>
    setIncludes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )

  const handleSend = () => {
    if (!projectId) {
      toast.error(t("digestPickProject"), {
        description: t("digestPickProjectDescription"),
      })
      return
    }
    if (recipients.length === 0) {
      toast.error(t("digestAddRecipient"), {
        description: t("digestAddRecipientDescription"),
      })
      return
    }
    sendDigest.mutate(
      {
        project_id: projectId,
        recipient_ids: recipients,
        include: includes,
        note: message.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success(t("digestSent"), {
            description: t("digestSentDescription", {
              count: result.recipient_count,
            }),
          })
          close()
        },
        onError: (err) =>
          toast.error(t("digestSendFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  const selectable = employees.filter((e) => !recipients.includes(e.id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {t("sendWeeklyDigest")}
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            {t("digestDescription")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-content-secondary text-[13px] leading-5 font-semibold">
              {tShared("projectLabel")}
            </span>
            <Select value={projectId || undefined} onValueChange={setProjectId}>
              <SelectTrigger className="w-full text-[13px]">
                <SelectValue
                  placeholder={
                    projectsQ.isLoading
                      ? tShared("loadingProjects")
                      : tShared("selectProject")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-content-secondary text-[13px] leading-5 font-semibold">
              {t("digestRecipients")}
            </span>
            <div className="border-stroke-default flex flex-wrap gap-2 rounded-xl border p-3">
              {recipients.length === 0 ? (
                <span className="text-content-quaternary text-[13px] leading-5">
                  {t("digestNoRecipients")}
                </span>
              ) : (
                recipients.map((id) => (
                  <span
                    key={id}
                    className="bg-brand-primary/[0.08] text-brand-primary inline-flex items-center gap-1.5 rounded-full py-1 pe-1.5 ps-2.5 text-[12px] leading-4 font-medium"
                  >
                    {employeeLabel.get(id) ?? t("digestEmployee")}
                    <button
                      type="button"
                      onClick={() => removeRecipient(id)}
                      className="hover:bg-brand-primary/15 flex size-4 items-center justify-center rounded-full transition-colors"
                      aria-label={t("digestRemoveRecipient", {
                        name: employeeLabel.get(id) ?? t("digestRecipient"),
                      })}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))
              )}
            </div>
            <Select value="" onValueChange={addRecipient}>
              <SelectTrigger className="w-full text-[13px]">
                <SelectValue
                  placeholder={
                    resourcesQ.isLoading
                      ? t("digestLoadingEmployees")
                      : t("digestAddRecipientPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectable.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-content-secondary text-[13px] leading-5 font-semibold">
              {t("digestInclude")}
            </span>
            <div className="flex flex-col gap-2.5 ps-1">
              {DIGEST_INCLUDES.map((item) => (
                <Label
                  key={item}
                  className="text-content-primary flex items-center gap-2.5 text-sm leading-5 font-normal"
                >
                  <Checkbox
                    checked={includes.includes(item)}
                    onCheckedChange={() => toggleInclude(item)}
                  />
                  {t(`digestSection.${item}`)}
                </Label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-content-secondary text-[13px] leading-5 font-semibold">
              {t("digestCustomMessage")}{" "}
              <span className="text-content-quaternary font-normal">
                ({tCommon("optional")})
              </span>
            </span>
            <Textarea
              placeholder={t("digestMessagePlaceholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[88px] text-[13px]"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-[13px]">
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sendDigest.isPending}
            className="text-[13px]"
          >
            {sendDigest.isPending ? t("digestSending") : t("digestSend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
