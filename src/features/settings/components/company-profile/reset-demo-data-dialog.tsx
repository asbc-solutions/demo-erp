"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { signOut } from "next-auth/react"
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
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"

import { useResetDemoData } from "../../lib/mutations/company-profile"
import { toastMutationError } from "../shared/settings-error-state"

const CONFIRM_PHRASE = "RESET"

export function ResetDemoDataDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const [confirmText, setConfirmText] = React.useState("")
  const resetDemoData = useResetDemoData()
  const isValid = confirmText.trim() === CONFIRM_PHRASE

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmText("")
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!isValid) return
    resetDemoData.mutate(undefined, {
      onSuccess: () => {
        toast.success("Demo data reset. Signing you out…", {
          description: "Every session, including yours, was just invalidated.",
        })
        handleOpenChange(false)
        void signOut({ callbackUrl: "/" })
      },
      onError: (err) => toastMutationError(err, "Failed to reset demo data"),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
          <AlertDialogDescription>
            This wipes and reseeds the <strong>entire</strong> database — invoices, employees,
            deals, and company information — for every user. It cannot be undone, and it will
            immediately end every active session, including your own. You will be signed out.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-1.5 px-6 pb-6 text-start">
          <Label htmlFor="reset-demo-confirm" className="text-content-secondary text-xs font-medium">
            Type <span className="text-content-primary font-semibold">{CONFIRM_PHRASE}</span> to
            confirm
          </Label>
          <Input
            id="reset-demo-confirm"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoComplete="off"
            aria-invalid={confirmText.length > 0 && !isValid}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="danger"
            disabled={!isValid || resetDemoData.isPending}
            onClick={handleConfirm}
          >
            {resetDemoData.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Reset Everything
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
