"use client"

import { useState } from "react"
import { Plus, UserMinus, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { SETTINGS_RESOURCES } from "../lib/constants/permissions"
import { useUpdateMemberRoles } from "../lib/mutations/team"
import { useAssignableRoles, useTeamMembers } from "../lib/queries/team"
import type { TeamMember } from "../lib/types/team"
import { SettingsAccessGate } from "./shared/settings-access-gate"
import { SettingsErrorState, toastMutationError } from "./shared/settings-error-state"
import { SettingsPageSpinner } from "./shared/settings-loading"
import { DeactivateMemberDialog } from "./team/deactivate-member-dialog"
import { InviteMemberDialog } from "./team/invite-member-dialog"

function MemberRow({
  member,
  canManage,
  isSelf,
  onDeactivate,
}: Readonly<{
  member: TeamMember
  canManage: boolean
  isSelf: boolean
  onDeactivate: (member: TeamMember) => void
}>) {
  const { data: roles } = useAssignableRoles()
  const updateRoles = useUpdateMemberRoles()
  const currentRoleId = member.roles[0]?.id ?? ""

  const handleRoleChange = (roleId: string) => {
    updateRoles.mutate(
      { id: member.id, payload: { role_ids: [roleId] } },
      {
        onSuccess: () => toast.success(`${member.name}'s role updated`),
        onError: (err) => toastMutationError(err, "Failed to update member role"),
      },
    )
  }

  return (
    <div className="bg-surface-page border-stroke-default flex items-center gap-4 rounded-xl border px-4 py-3">
      <span
        className="from-brand-primary flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br to-violet-500 text-[12px] leading-4 font-semibold text-white"
        aria-hidden
      >
        {member.initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-content-primary truncate text-[13px] leading-[18px] font-medium">
          {member.name}
          {!member.is_active ? (
            <span className="text-content-quaternary ms-2 text-[11px] font-normal">
              (inactive)
            </span>
          ) : null}
        </span>
        <span className="text-content-tertiary truncate text-[11px] leading-[15.4px]">
          {member.email}
        </span>
      </div>
      {canManage ? (
        <Select
          value={currentRoleId}
          onValueChange={handleRoleChange}
          disabled={updateRoles.isPending}
        >
          <SelectTrigger className="bg-surface-white h-9 w-[160px] text-[12px]">
            <SelectValue placeholder="No role" />
          </SelectTrigger>
          <SelectContent>
            {(roles ?? []).map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="bg-surface-white border-stroke-default inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] leading-[16.5px] font-medium">
          {member.roles.map((role) => role.name).join(", ") || "No role"}
        </span>
      )}
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-content-tertiary hover:text-brand-danger disabled:opacity-40"
          disabled={isSelf}
          title={isSelf ? "You can't deactivate your own account" : "Deactivate member"}
          aria-label={`Deactivate ${member.name}`}
          onClick={() => onDeactivate(member)}
        >
          <UserMinus className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}

function TeamTabContent() {
  const { data, isLoading, isError, refetch } = useTeamMembers()
  const { can } = usePermissions()
  const { data: session } = useSession()
  const canManage = can.write(SETTINGS_RESOURCES.team)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<TeamMember | null>(null)

  const members = data?.data ?? []

  return (
    <Card variant="elevated" className="gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-content-secondary size-5" aria-hidden />
          <h3 className="text-content-primary text-[14px] leading-[22.4px] font-semibold">
            Team Members
          </h3>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="primary"
            className="h-9 px-3 text-[12px]"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Invite Member
          </Button>
        ) : null}
      </div>
      <p className="text-content-tertiary -mt-2 text-[12px] leading-[18px]">
        Manage access and roles
      </p>

      {isLoading ? (
        <SettingsPageSpinner />
      ) : isError ? (
        <SettingsErrorState message="Failed to load team members." onRetry={() => void refetch()} />
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canManage={canManage}
              isSelf={String(member.id) === session?.user?.id}
              onDeactivate={setDeactivateTarget}
            />
          ))}
        </div>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <DeactivateMemberDialog
        member={deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
      />
    </Card>
  )
}

export function TeamTab() {
  return (
    <SettingsAccessGate resource={SETTINGS_RESOURCES.team}>
      <TeamTabContent />
    </SettingsAccessGate>
  )
}
