"use client"

import { useMemo, useState } from "react"
import { Check, Lock, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
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
import { Input } from "@/src/shared/components/ui/input"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Textarea } from "@/src/shared/components/ui/textarea"
import { useIntlLocale } from "@/src/i18n/intl-locale"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { ProjectScopedView } from "../../components/project-scoped-view"
import {
  formatApiDate,
  initialsFromName,
} from "../../lib/mappers/project-mapper"
import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import {
  useChangeRequestAction,
  useCreateChangeRequest,
  useGateAction,
  useLockProject,
  useSetTechnicallyComplete,
  useToggleClosureItem,
} from "../../lib/mutations/governance"
import {
  useClosureChecklist,
  useProjectChangeRequests,
  useProjectGates,
} from "../../lib/queries/governance"
import type {
  ChangeRequestType,
  ClosureItem,
  Gate,
  GateDecisionStatus,
} from "../../lib/types"

const TABS = [
  { id: "gates", labelKey: "tabGates" },
  { id: "changeRequests", labelKey: "tabChangeRequests" },
  { id: "closure", labelKey: "tabClosure" },
] as const
type Tab = (typeof TABS)[number]["id"]

function apiMessage(err: unknown, fallback: string): string {
  return (err as ApiError).message ?? fallback
}

/* ------------------------------------------------------------------ */
/* Gates                                                               */
/* ------------------------------------------------------------------ */

function gateIndicator(status: GateDecisionStatus, sequence: number) {
  if (status === "approved")
    return (
      <span className="bg-brand-success flex size-7 shrink-0 items-center justify-center rounded-full text-white">
        <Check className="size-4" aria-hidden />
      </span>
    )
  if (status === "rejected")
    return (
      <span className="bg-brand-danger flex size-7 shrink-0 items-center justify-center rounded-full text-white">
        <X className="size-4" aria-hidden />
      </span>
    )
  if (status === "pending" || status === "returned")
    return (
      <span className="border-brand-primary text-brand-primary bg-brand-primary/10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-semibold">
        {sequence}
      </span>
    )
  return (
    <span className="bg-surface-muted text-content-tertiary flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold">
      {sequence}
    </span>
  )
}

const CHAIN_STEP_STYLE: Record<string, string> = {
  approved: "bg-brand-success/12 text-brand-success",
  rejected: "bg-brand-danger/12 text-brand-danger",
  pending: "bg-brand-warning/12 text-brand-warning",
}

type GateDecisionInput =
  | { action: "approve"; title: string }
  | { action: "reject"; title: string }
  | { action: "request_info"; title: string }

function GateDecisionDialog({
  gate,
  input,
  onClose,
  onConfirm,
  pending,
}: {
  gate: Gate
  input: GateDecisionInput | null
  onClose: () => void
  onConfirm: (text: string) => void
  pending: boolean
}) {
  const t = useTranslations("ProjectsPhaseGate")
  const tCommon = useTranslations("Common")
  const [text, setText] = useState("")
  const required = input?.action !== "approve"

  return (
    <Dialog
      open={!!input}
      onOpenChange={(next) => {
        if (!next) {
          setText("")
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-[480px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {input?.title}
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            {gate.code} · {gate.name}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-2">
          <span className="text-content-secondary text-[13px] leading-5 font-semibold">
            {input?.action === "approve"
              ? t("notesOptional")
              : input?.action === "reject"
                ? t("reason")
                : t("infoNeeded")}
          </span>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("notePlaceholder")}
            className="min-h-[88px] text-[13px]"
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[13px]">
            {tCommon("cancel")}
          </Button>
          <Button
            variant={input?.action === "reject" ? "danger" : "primary"}
            className="text-[13px]"
            disabled={pending || (required && !text.trim())}
            onClick={() => onConfirm(text.trim())}
          >
            {input?.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GatesTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsPhaseGate")
  const locale = useIntlLocale()
  const { data, isLoading, isError } = useProjectGates(projectId)
  const gateAction = useGateAction(projectId)
  const [decision, setDecision] = useState<
    (GateDecisionInput & { gate: Gate }) | null
  >(null)

  const gates = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.sequence - b.sequence),
    [data],
  )

  // The gate currently "in play": first pending/returned, else first not started.
  const activeGateId =
    gates.find(
      (g) => g.decision_status === "pending" || g.decision_status === "returned",
    )?.id ?? gates.find((g) => g.decision_status === "not_started")?.id

  const runAction = (
    input:
      | { action: "submit"; gateId: string }
      | { action: "approve"; gateId: string; notes?: string }
      | { action: "reject"; gateId: string; reason: string }
      | { action: "request_info"; gateId: string; message: string },
    successLabel: string,
  ) =>
    gateAction.mutate(input, {
      onSuccess: () => {
        toast.success(successLabel)
        setDecision(null)
      },
      onError: (err) => toast.error(t("gateActionFailed"), {
        description: apiMessage(err, t("genericError")),
      }),
    })

  if (isLoading)
    return <div className="bg-surface-muted h-64 animate-pulse rounded-[14px]" />

  if (isError)
    return (
      <Card className="flex h-40 items-center justify-center p-6">
        <p className="text-content-tertiary text-sm">
          {t("gatesLoadError")}
        </p>
      </Card>
    )

  return (
    <Card className="gap-4 p-5">
      <h3 className="text-content-primary text-sm font-semibold">
        {t("gatePipeline")}
      </h3>
      <div className="flex flex-col">
        {gates.map((gate, i) => {
          const isActive = gate.id === activeGateId
          const dateLabel = gate.completed_date
            ? formatApiDate(gate.completed_date, locale)
            : gate.due_date
              ? t("dueDate", { date: formatApiDate(gate.due_date, locale) })
              : null
          return (
            <div key={gate.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                {gateIndicator(gate.decision_status, gate.sequence)}
                {i < gates.length - 1 && (
                  <span className="bg-stroke-light w-px flex-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div
                  className={cn(
                    "border-stroke-light bg-surface-white flex flex-col gap-3 rounded-xl border p-4",
                    isActive && "border-brand-primary/40",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-content-primary text-[14px] font-semibold">
                        {gate.code} · {gate.name}
                      </span>
                      {dateLabel ? (
                        <span className="text-content-tertiary text-[12px]">
                          {dateLabel}
                        </span>
                      ) : null}
                    </div>
                    <StatusPill status={gate.decision_status_label} />
                  </div>

                  {isActive && gate.approval_chain ? (
                    <div className="border-stroke-light flex flex-col gap-2 border-t pt-3">
                      <span className="text-content-tertiary text-[10px] font-semibold tracking-wide uppercase">
                        {t("approvalChain")}
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {gate.approval_chain.map((step) => (
                          <div
                            key={step.step_number}
                            className="flex items-center gap-2"
                          >
                            <Avatar
                              color="neutral"
                              className="size-7 text-[10px]"
                            >
                              {step.employee_name
                                ? initialsFromName(step.employee_name)
                                : "?"}
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-content-primary text-[12px] leading-4 font-medium">
                                {step.employee_name ?? step.approver_role}
                              </span>
                              <span
                                className={cn(
                                  "w-fit rounded px-1.5 text-[10px] leading-4 font-medium",
                                  CHAIN_STEP_STYLE[step.status] ??
                                    "bg-surface-muted text-content-tertiary",
                                )}
                              >
                                {step.status_label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {isActive ? (
                    <div className="flex flex-wrap gap-2">
                      {gate.decision_status === "not_started" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={gateAction.isPending}
                          className="text-[12px]"
                          onClick={() =>
                            runAction(
                              { action: "submit", gateId: gate.id },
                              t("gateSubmitted", { code: gate.code }),
                            )
                          }
                        >
                          {t("submitForReview")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            disabled={gateAction.isPending}
                            className="text-[12px]"
                            onClick={() =>
                              setDecision({
                                action: "approve",
                                title: t("approveGate"),
                                gate,
                              })
                            }
                          >
                            {t("approve")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={gateAction.isPending}
                            className="text-[12px]"
                            onClick={() =>
                              setDecision({
                                action: "request_info",
                                title: t("requestInfo"),
                                gate,
                              })
                            }
                          >
                            {t("requestInfo")}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={gateAction.isPending}
                            className="text-[12px]"
                            onClick={() =>
                              setDecision({
                                action: "reject",
                                title: t("rejectGate"),
                                gate,
                              })
                            }
                          >
                            {t("reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {decision ? (
        <GateDecisionDialog
          gate={decision.gate}
          input={decision}
          pending={gateAction.isPending}
          onClose={() => setDecision(null)}
          onConfirm={(text) => {
            const gateId = decision.gate.id
            if (decision.action === "approve")
              runAction(
                { action: "approve", gateId, notes: text || undefined },
                t("gateApproved", { code: decision.gate.code }),
              )
            else if (decision.action === "reject")
              runAction(
                { action: "reject", gateId, reason: text },
                t("gateRejected", { code: decision.gate.code }),
              )
            else
              runAction(
                { action: "request_info", gateId, message: text },
                t("infoRequested"),
              )
          }}
        />
      ) : null}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Change Requests                                                     */
/* ------------------------------------------------------------------ */

const CR_TYPES = [
  "scope",
  "cost",
  "schedule",
  "technical",
  "other",
] as const satisfies readonly ChangeRequestType[]

function NewChangeRequestDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations("ProjectsPhaseGate")
  const tCommon = useTranslations("Common")
  const [title, setTitle] = useState("")
  const [type, setType] = useState<ChangeRequestType>("scope")
  const [description, setDescription] = useState("")
  const [costImpact, setCostImpact] = useState("")
  const [scheduleImpact, setScheduleImpact] = useState("")

  const createCr = useCreateChangeRequest(projectId)

  const close = () => {
    onOpenChange(false)
    window.setTimeout(() => {
      setTitle("")
      setType("scope")
      setDescription("")
      setCostImpact("")
      setScheduleImpact("")
    }, 200)
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t("crTitleRequired"))
      return
    }
    createCr.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        cost_impact: costImpact ? Number(costImpact) : undefined,
        schedule_impact_days: scheduleImpact
          ? Number(scheduleImpact)
          : undefined,
      },
      {
        onSuccess: (cr) => {
          toast.success(t("crCreated", { code: cr.cr_number }), {
            description: t("crCreatedDescription"),
          })
          close()
        },
        onError: (err) =>
          toast.error(t("crCreateError"), {
            description: apiMessage(err, t("genericError")),
          }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-[560px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            {t("newChangeRequest")}
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            {t("newCrDescription")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-content-secondary text-[13px] font-semibold">
              {t("fieldTitle")}
              <span className="text-brand-danger">*</span>
            </span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className="h-10 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-content-secondary text-[13px] font-semibold">
                {tCommon("type")}
              </span>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ChangeRequestType)}
              >
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CR_TYPES.map((crType) => (
                    <SelectItem key={crType} value={crType}>
                      {t(`crType.${crType}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-content-secondary text-[13px] font-semibold">
                {t("costDelta")}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={costImpact}
                onChange={(e) => setCostImpact(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-content-secondary text-[13px] font-semibold">
                {t("scheduleDeltaDays")}
              </span>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={scheduleImpact}
                onChange={(e) => setScheduleImpact(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-content-secondary text-[13px] font-semibold">
              {tCommon("description")}
            </span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
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
            onClick={handleSubmit}
            disabled={createCr.isPending}
            className="text-[13px]"
          >
            {createCr.isPending ? t("creating") : t("createChangeRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChangeRequestsTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsPhaseGate")
  const tCommon = useTranslations("Common")
  const locale = useIntlLocale()
  const { data, isLoading, isError } = useProjectChangeRequests(projectId)
  const crAction = useChangeRequestAction(projectId)
  const [newCrOpen, setNewCrOpen] = useState(false)

  const rows = data ?? []

  const act = (
    input: Parameters<typeof crAction.mutate>[0],
    successLabel: string,
  ) =>
    crAction.mutate(input, {
      onSuccess: () => toast.success(successLabel),
      onError: (err) =>
        toast.error(t("crActionFailed"), {
          description: apiMessage(err, t("genericError")),
        }),
    })

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-content-primary text-sm font-semibold">
            {t("crTracker")}
          </h3>
          <p className="text-content-tertiary text-xs">
            {t("crTrackerSubtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="gap-1.5 text-[12px]"
          onClick={() => setNewCrOpen(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          {t("newChangeRequest")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t("colCode")}</TableHead>
            <TableHead>{t("fieldTitle")}</TableHead>
            <TableHead>{tCommon("type")}</TableHead>
            <TableHead>{t("colRaised")}</TableHead>
            <TableHead>{t("costDelta")}</TableHead>
            <TableHead>{t("scheduleDelta")}</TableHead>
            <TableHead>{tCommon("status")}</TableHead>
            <TableHead className="text-end">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={8}
                className="text-content-tertiary py-10 text-center text-sm"
              >
                {t("crLoading")}
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={8}
                className="text-content-tertiary py-10 text-center text-sm"
              >
                {t("crLoadError")}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={8}
                className="text-content-tertiary py-10 text-center text-sm"
              >
                {t("crEmpty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((cr) => {
              const costDelta = Number(cr.cost_impact)
              const scheduleDelta = Number(cr.schedule_impact_days)
              return (
                <TableRow key={cr.id}>
                  <TableCell className="text-content-tertiary font-mono text-[12px]">
                    {cr.cr_number}
                  </TableCell>
                  <TableCell className="text-content-primary max-w-[280px] truncate text-[13px] font-medium">
                    {cr.title}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {t(`crType.${cr.type}`)}
                  </TableCell>
                  <TableCell className="text-content-secondary text-[13px]">
                    {formatApiDate(cr.raised_date, locale)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] font-semibold tabular-nums",
                      costDelta > 0
                        ? "text-brand-danger"
                        : costDelta < 0
                          ? "text-brand-success"
                          : "text-content-tertiary",
                    )}
                  >
                    {costDelta > 0 ? "+" : ""}
                    {formatMoney(costDelta)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-[13px] font-semibold tabular-nums",
                      scheduleDelta > 0
                        ? "text-brand-warning"
                        : scheduleDelta < 0
                          ? "text-brand-success"
                          : "text-content-tertiary",
                    )}
                  >
                    {scheduleDelta > 0 ? "+" : ""}
                    {t("daysShort", { days: scheduleDelta })}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={cr.status_label} />
                  </TableCell>
                  <TableCell className="text-end">
                    {cr.status === "draft" ? (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={crAction.isPending}
                        className="h-7 text-[11px]"
                        onClick={() =>
                          act(
                            { action: "submit", crId: cr.id },
                            t("crSubmitted", { code: cr.cr_number }),
                          )
                        }
                      >
                        {tCommon("submit")}
                      </Button>
                    ) : cr.status === "pending_approval" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={crAction.isPending}
                          className="h-7 text-[11px]"
                          onClick={() =>
                            act(
                              { action: "approve", crId: cr.id },
                              t("crApproved", { code: cr.cr_number }),
                            )
                          }
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={crAction.isPending}
                          className="h-7 text-[11px]"
                          onClick={() => {
                            const reason = window.prompt(
                              t("crRejectPrompt", { code: cr.cr_number }),
                            )
                            if (reason?.trim())
                              act(
                                {
                                  action: "reject",
                                  crId: cr.id,
                                  reason: reason.trim(),
                                },
                                t("crRejected", { code: cr.cr_number }),
                              )
                          }}
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    ) : cr.status === "approved" ||
                      cr.status === "on_track" ||
                      cr.status === "blocked" ? (
                      <Select
                        value={cr.status === "approved" ? undefined : cr.status}
                        onValueChange={(v) =>
                          act(
                            {
                              action: "set_status",
                              crId: cr.id,
                              status: v as "on_track" | "blocked" | "completed",
                            },
                            t("crUpdated", { code: cr.cr_number }),
                          )
                        }
                      >
                        <SelectTrigger className="ms-auto h-7 w-[120px] text-[11px]">
                          <SelectValue placeholder={t("executionPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_track">
                            {t("execution.on_track")}
                          </SelectItem>
                          <SelectItem value="blocked">
                            {t("execution.blocked")}
                          </SelectItem>
                          <SelectItem value="completed">
                            {t("execution.completed")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-content-quaternary text-[11px]">
                        —
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <NewChangeRequestDialog
        projectId={projectId}
        open={newCrOpen}
        onOpenChange={setNewCrOpen}
      />
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Closure                                                             */
/* ------------------------------------------------------------------ */

function ClosureTab({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsPhaseGate")
  const { data, isLoading, isError } = useClosureChecklist(projectId)
  const toggleItem = useToggleClosureItem(projectId)
  const technicallyComplete = useSetTechnicallyComplete(projectId)
  const lockProject = useLockProject(projectId)

  const groups = useMemo(() => {
    const byCategory = new Map<string, ClosureItem[]>()
    for (const item of data?.items ?? []) {
      const list = byCategory.get(item.category_label) ?? []
      list.push(item)
      byCategory.set(item.category_label, list)
    }
    return [...byCategory.entries()].map(([title, items]) => ({
      title,
      items: items.sort((a, b) => a.sequence - b.sequence),
    }))
  }, [data])

  if (isLoading)
    return <div className="bg-surface-muted h-40 animate-pulse rounded-[14px]" />

  if (isError || !data)
    return (
      <Card className="flex h-40 items-center justify-center p-6">
        <p className="text-content-tertiary text-sm">
          {t("closureLoadError")}
        </p>
      </Card>
    )

  const { total, complete } = data.summary
  const allDone = total > 0 && complete === total

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-content-primary text-sm font-semibold">
              {t("closureProgress")}
            </h3>
            <p className="text-content-tertiary text-xs">
              {t("closureItemsComplete", { complete, total })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={technicallyComplete.isPending}
              className="text-[12px]"
              onClick={() =>
                technicallyComplete.mutate(undefined, {
                  onSuccess: () =>
                    toast.success(t("technicallyCompleteSuccess")),
                  onError: (err) =>
                    toast.error(t("technicallyCompleteError"), {
                      description: apiMessage(err, t("genericError")),
                    }),
                })
              }
            >
              {t("setTechnicallyComplete")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!allDone || lockProject.isPending}
              className="gap-1.5 text-[12px]"
              title={
                allDone
                  ? undefined
                  : t("lockDisabledHint")
              }
              onClick={() =>
                lockProject.mutate(undefined, {
                  onSuccess: () => toast.success(t("projectLocked")),
                  onError: (err) =>
                    toast.error(t("lockError"), {
                      description: apiMessage(err, t("genericError")),
                    }),
                })
              }
            >
              <Lock className="size-3.5" aria-hidden />
              {t("lockProject")}
            </Button>
          </div>
        </div>
        <Progress
          value={total > 0 ? (complete / total) * 100 : 0}
          color="emerald"
          className="bg-surface-muted h-2.5"
        />
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.title} className="gap-4 p-5">
            <h3 className="text-content-primary text-sm font-semibold">
              {group.title}
            </h3>
            <div className="flex flex-col gap-3">
              {group.items.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={item.is_complete}
                    disabled={toggleItem.isPending}
                    onCheckedChange={(checked) =>
                      toggleItem.mutate(
                        { itemId: item.id, isComplete: checked === true },
                        {
                          onError: (err) =>
                            toast.error(t("itemUpdateError"), {
                              description: apiMessage(err, t("genericError")),
                            }),
                        },
                      )
                    }
                  />
                  <span
                    className={cn(
                      "flex-1 text-[13px]",
                      item.is_complete
                        ? "text-content-tertiary line-through"
                        : "text-content-primary",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.assignee_label ? (
                    <span className="bg-surface-muted text-content-tertiary rounded-md px-2 py-0.5 text-[11px] font-medium">
                      {item.assignee_label}
                    </span>
                  ) : null}
                </label>
              ))}
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

function PhaseGateContent({ projectId }: { projectId: string }) {
  const t = useTranslations("ProjectsPhaseGate")
  const [tab, setTab] = useState<Tab>("gates")

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface-muted flex w-fit items-center gap-0.5 rounded-lg p-0.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === item.id
                ? "bg-surface-white text-brand-primary shadow-sm"
                : "text-content-tertiary hover:text-content-primary",
            )}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {tab === "gates" ? (
        <GatesTab projectId={projectId} />
      ) : tab === "changeRequests" ? (
        <ChangeRequestsTab projectId={projectId} />
      ) : (
        <ClosureTab projectId={projectId} />
      )}
    </div>
  )
}

export function PhaseGateModule() {
  const t = useTranslations("ProjectsPhaseGate")
  return (
    <ProjectScopedView title={t("title")} subtitle={t("subtitle")}>
      {(projectId) => <PhaseGateContent projectId={projectId} />}
    </ProjectScopedView>
  )
}
