"use client"

import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button } from "@/src/shared/components/ui/button"

import { useDeactivateMember } from "../../lib/mutations/team"
import type { TeamMember } from "../../lib/types/team"
import { toastMutationError } from "../shared/settings-error-state"

export function DeactivateMemberDialog({
  member,
  onOpenChange,
}: Readonly<{ member: TeamMember | null; onOpenChange: (open: boolean) => void }>) {
  const deactivateMember = useDeactivateMember()

  const handleConfirm = () => {
    if (!member) return
    deactivateMember.mutate(member.id, {
      onSuccess: () => {
        toast.success(`${member.name} deactivated.`)
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to deactivate member"),
    })
  }

  return (
    <AlertDialog open={member !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {member?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their account will be marked inactive and every active session or API token they
            hold is revoked immediately. This does not delete their history — audit, invoice,
            and approval records referencing them are preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={deactivateMember.isPending}
            onClick={handleConfirm}
          >
            {deactivateMember.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Deactivate
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
