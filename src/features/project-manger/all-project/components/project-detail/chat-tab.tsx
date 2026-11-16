"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, MessagesSquare, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import type { ApiError } from "@/src/shared/lib/types/api"
import { cn } from "@/src/shared/lib/utils/utils"

import { initialsFromName } from "../../../lib/mappers/project-mapper"
import {
  useDeleteMessage,
  useSendMessage,
} from "../../../lib/mutations/collaboration"
import {
  useCollaborationContext,
  useNodeMessages,
} from "../../../lib/queries/collaboration"
import { usePeople } from "../../../lib/queries/tasks"
import type { AvatarColor } from "../../data/all-projects-data"

const AVATAR_COLORS: AvatarColor[] = [
  "primary",
  "info",
  "success",
  "danger",
  "warning",
]

/** Deterministic avatar colour from an id so the same sender stays consistent. */
function colorForId(id: string): AvatarColor {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ChatTab({ projectId }: { projectId?: string }) {
  const [draft, setDraft] = useState("")
  const [sendError, setSendError] = useState<ApiError | null>(null)

  // node-scoped messages live on the project root node.
  const nodeId = projectId ?? ""
  const { data, isLoading, isError } = useNodeMessages(nodeId)
  const contextQ = useCollaborationContext(projectId)
  const sendMessage = useSendMessage(nodeId)
  const deleteMessage = useDeleteMessage(nodeId)

  const messages = useMemo(() => data?.data ?? [], [data])

  // Resolve sender ids → display names via the people resolver.
  const senderIds = useMemo(
    () => messages.map((m) => m.sender_id).filter(Boolean),
    [messages],
  )
  const peopleQ = usePeople(senderIds)
  const people = peopleQ.data

  if (!projectId) {
    return (
      <Card className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="bg-brand-primary/10 text-brand-primary flex size-12 items-center justify-center rounded-full">
          <MessagesSquare className="size-6" aria-hidden />
        </span>
        <p className="text-content-tertiary max-w-sm text-sm">
          Open a project to view its discussion.
        </p>
      </Card>
    )
  }

  // The context endpoint says up front whether this account can post (e.g. the
  // user has no linked employee record). Fall back to the 403 signal on send.
  const postingBlocked =
    contextQ.data?.can_post === false ||
    sendError?.code === "403" ||
    sendError?.code === "FORBIDDEN"
  const blockReason =
    contextQ.data?.block_reason ??
    "You can't post here — your account isn't linked to an employee record. Ask an administrator to link your user to an employee."

  const handleSend = () => {
    const body = draft.trim()
    if (!body || sendMessage.isPending || postingBlocked) return
    sendMessage.mutate(
      { project_id: projectId, node_type: "project", body },
      {
        onSuccess: () => {
          setDraft("")
          setSendError(null)
        },
        onError: (err) => {
          const apiError = err as unknown as ApiError
          setSendError(apiError)
          toast.error("Couldn't send message", { description: apiError.message })
        },
      },
    )
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this message?")) return
    deleteMessage.mutate(id, {
      onSuccess: () => toast.success("Message deleted"),
      onError: (err) =>
        toast.error("Couldn't delete message", {
          description: (err as unknown as ApiError).message,
        }),
    })
  }

  return (
    <Card className="flex h-[calc(100vh-240px)] min-h-[520px] flex-col overflow-hidden p-0">
      {/* Header */}
      <div className="border-stroke-default flex items-center gap-2 border-b px-5 py-3">
        <MessagesSquare className="text-content-tertiary size-4" aria-hidden />
        <span className="text-content-primary text-sm font-semibold">
          Project Discussion
        </span>
        <span className="text-content-tertiary text-xs">
          Messages and updates for this project
        </span>
      </div>

      {/* Conversation */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-muted h-12 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-content-tertiary text-sm">
              Couldn&apos;t load messages.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MessagesSquare
              className="text-content-quaternary size-8"
              aria-hidden
            />
            <p className="text-content-tertiary text-sm">
              No messages yet. Start the conversation below.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const person = people?.[message.sender_id]
            const name = person?.name
            const initials =
              person?.initials ?? (name ? initialsFromName(name) : "?")
            return (
              <div key={message.id} className="group flex gap-3">
                <Avatar
                  color={colorForId(message.sender_id)}
                  className="size-8 shrink-0 text-[11px]"
                >
                  {initials}
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-content-primary text-[13px] font-semibold">
                      {name ?? "Team member"}
                    </span>
                    <span className="text-content-quaternary text-[11px]">
                      {formatTime(message.created_at)}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete message"
                      onClick={() => handleDelete(message.id)}
                      disabled={deleteMessage.isPending}
                      className="text-content-quaternary hover:text-brand-danger ms-auto opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <p className="text-content-secondary text-[13px] leading-[20px] whitespace-pre-wrap">
                    {message.body}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-stroke-default flex flex-col gap-2 border-t p-3">
        {(sendError || postingBlocked) && (
          <div className="bg-brand-danger/8 text-brand-danger flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{postingBlocked ? blockReason : sendError?.message}</span>
          </div>
        )}
        <div
          className={cn(
            "border-stroke-default bg-surface-white flex items-center gap-2 rounded-lg border px-3 py-2",
            postingBlocked && "opacity-60",
          )}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={postingBlocked ? "Posting unavailable" : "Write a message…"}
            aria-label="Message"
            disabled={postingBlocked}
            className="text-content-primary placeholder:text-content-quaternary flex-1 bg-transparent text-[13px] outline-none disabled:cursor-not-allowed"
          />
          <Button
            size="icon-sm"
            variant="primary"
            aria-label="Send"
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending || postingBlocked}
          >
            <Send className={cn("size-4", sendMessage.isPending && "opacity-50")} aria-hidden />
          </Button>
        </div>
      </div>
    </Card>
  )
}
