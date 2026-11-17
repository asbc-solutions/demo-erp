"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
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
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { useInviteMember } from "../../lib/mutations/team"
import { useAssignableRoles } from "../../lib/queries/team"
import { toastMutationError } from "../shared/settings-error-state"

export function InviteMemberDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const t = useTranslations("SettingsInviteMember")
  const tShared = useTranslations("SettingsShared")
  const tCommon = useTranslations("Common")
  const { data: roles, isLoading: rolesLoading } = useAssignableRoles({ enabled: open })
  const inviteMember = useInviteMember()
  const [roleId, setRoleId] = React.useState("")

  const handleOpenChange = (next: boolean) => {
    if (!next) setRoleId("")
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    if (!roleId) {
      toast.error(t("roleRequired"))
      return
    }

    inviteMember.mutate(
      {
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        role_id: roleId,
      },
      {
        onSuccess: () => {
          toast.success(t("success"), {
            description: t("successDescription"),
          })
          form.reset()
          handleOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("failed"), tShared),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-name" className="text-content-secondary text-xs font-medium">
                {tCommon("name")}
              </Label>
              <Input id="invite-name" name="name" required placeholder="Mona Fahmy" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email" className="text-content-secondary text-xs font-medium">
                {tCommon("email")}
              </Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="mona.fahmy@company.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-secondary text-xs font-medium">{t("role")}</Label>
              <Select value={roleId} onValueChange={setRoleId} disabled={rolesLoading}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={rolesLoading ? t("rolesLoading") : t("rolePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-content-tertiary text-[11px] leading-[15.4px]">
                {t("roleHint")}
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
