"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("SettingsDeactivateMember")
  const tShared = useTranslations("SettingsShared")
  const tCommon = useTranslations("Common")
  const deactivateMember = useDeactivateMember()

  const handleConfirm = () => {
    if (!member) return
    deactivateMember.mutate(member.id, {
      onSuccess: () => {
        toast.success(t("success", { name: member.name }))
        onOpenChange(false)
      },
      onError: (err) => toastMutationError(err, t("failed"), tShared),
    })
  }

  return (
    <AlertDialog open={member !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title", { name: member?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={deactivateMember.isPending}
            onClick={handleConfirm}
          >
            {deactivateMember.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
