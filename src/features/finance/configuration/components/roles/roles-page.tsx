"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Switch } from "@/src/shared/components/ui/switch"
import { cn } from "@/src/shared/lib/utils/utils"

import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateRole, useSetPersona } from "../../lib/mutations/configuration"
import { useRoles } from "../../lib/queries/configuration"
import type { ConfigMessageKey, FinanceRole, Permission } from "../../lib/types/configuration"

const PERMISSION_LABEL_KEY: Record<Permission, ConfigMessageKey> = {
  view: "permView",
  post: "permPost",
  approve: "permApprove",
  reverse: "permReverse",
  close: "permClose",
  settings: "permSettings",
}

const CAPABILITY_KEY: Record<Permission, ConfigMessageKey> = {
  view: "capView",
  post: "capPost",
  approve: "capApprove",
  reverse: "capReverse",
  close: "capClose",
  settings: "capSettings",
}

const SCOPES = ["Entity", "Cost center", "Treasury"] as const
const SCOPE_LABEL_KEY: Record<(typeof SCOPES)[number], ConfigMessageKey> = {
  Entity: "scopeEntity",
  "Cost center": "scopeCostCenter",
  Treasury: "scopeTreasury",
}
const scopeKey = (scope: string): ConfigMessageKey | undefined => SCOPE_LABEL_KEY[scope as (typeof SCOPES)[number]]

/** Messages are `FinanceConfiguration` keys, translated where the error is rendered. */
const msg = (key: ConfigMessageKey) => key

const roleSchema = z.object({
  name: z.string().trim().min(1, msg("errRoleName")),
  scope: z.enum(["Entity", "Cost center", "Treasury"]),
  may_post: z.boolean(),
  may_approve: z.boolean(),
  may_see_balances: z.boolean(),
})
type RoleValues = z.infer<typeof roleSchema>

const EMPTY: RoleValues = { name: "", scope: "Cost center", may_post: false, may_approve: false, may_see_balances: true }

const SWITCHES: { name: "may_post" | "may_approve" | "may_see_balances"; labelKey: ConfigMessageKey; hintKey: ConfigMessageKey }[] = [
  { name: "may_post", labelKey: "mayPost", hintKey: "mayPostHint" },
  { name: "may_approve", labelKey: "mayApprove", hintKey: "mayApproveHint" },
  { name: "may_see_balances", labelKey: "maySeeBalances", hintKey: "maySeeBalancesHint" },
]

function NewRoleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceConfiguration")
  const create = useCreateRole()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleValues>({ resolver: zodResolver(roleSchema), defaultValues: EMPTY })
  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(values, {
              onSuccess: (role) => {
                toast.success(t("toastRoleAdded", { name: role.name }))
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, t("errorSaveRole"))),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newRole")}</DialogTitle>
            <DialogDescription>{t("newRoleDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-4">
              <Field>
                <FieldLabel htmlFor="role-name">{t("nameRequired")}</FieldLabel>
                <Input id="role-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
                {errors.name ? <FieldError>{t(errors.name.message as ConfigMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="role-scope">{t("scopeRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="role-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCOPES.map((scope) => (
                          <SelectItem key={scope} value={scope}>
                            {t(SCOPE_LABEL_KEY[scope])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-3">
              {SWITCHES.map((item) => (
                <Controller
                  key={item.name}
                  control={control}
                  name={item.name}
                  render={({ field }) => (
                    <div className="flex items-start gap-2.5">
                      <Switch id={`role-${item.name}`} checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                      <Label htmlFor={`role-${item.name}`} className="flex flex-col items-start gap-0.5 font-normal">
                        <span className="text-content-primary text-[13px] font-medium">{t(item.labelKey)}</span>
                        <span className="text-content-tertiary text-xs">{t(item.hintKey)}</span>
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{t("sessionNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 11.10 · Roles & permissions — the authority matrix, and a preview of what each persona can do. */
function RolesPage() {
  const t = useTranslations("FinanceConfiguration")
  const { data, isError, refetch } = useRoles()
  const persona = useSetPersona()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const permissions = data?.permissions ?? []
  const scopeLabel = (scope: string) => {
    const key = scopeKey(scope)
    return key ? t(key) : scope
  }
  const columns: FinanceColumn<FinanceRole>[] = [
    {
      id: "role",
      header: t("role"),
      cell: (row) => (
        <span className="flex flex-col">
          <span className={cn("text-content-primary font-medium", data?.persona_role?.id === row.id && "text-brand-primary")}>{row.name}</span>
          <span className="text-content-tertiary text-xs">
            {t("membersCount", { count: row.members })} · {scopeLabel(row.scope)}
          </span>
        </span>
      ),
    },
    ...permissions.map(
      (permission): FinanceColumn<FinanceRole> => ({
        id: permission,
        header: t(PERMISSION_LABEL_KEY[permission]),
        align: "center",
        cell: (row) =>
          row.permissions[permission] ? (
            <span className="bg-status-success-fg mx-auto block size-2.5 rounded-full" role="img" aria-label={t("allowed")} />
          ) : (
            <Minus className="text-content-quaternary mx-auto size-3.5" role="img" aria-label={t("notAllowed")} />
          ),
      }),
    ),
  ]

  const granted = data?.persona_role ? permissions.filter((permission) => data.persona_role?.permissions[permission]) : []

  return (
    <>
      <FinancePageHeader
        title={t("rolesAndPermissions")}
        figure={data ? <HeaderFigure label={t("roles")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newRole")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <FinanceSection title={t("role")}>
              <div role="group" aria-label={t("previewAs")} className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
                {data.personas.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={data.persona === option.id}
                    disabled={persona.isPending}
                    onClick={() => persona.mutate(option.id, { onError: (error) => toast.error(errorMessage(error, t("errorSwitchRole"))) })}
                    className={cn(
                      "text-content-secondary rounded-md px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                      data.persona === option.id && "bg-surface-white text-content-primary font-medium shadow-xs",
                    )}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
                {t("roleGovernsInfo")}
              </p>
              {data.persona_role ? (
                <p className="text-content-primary text-[13px] leading-5">
                  {t.rich("previewingAs", {
                    persona: data.personas.find((option) => option.id === data.persona)?.name ?? "",
                    role: data.persona_role.name,
                    capabilities: granted.map((permission) => t(CAPABILITY_KEY[permission])).join(t("listSeparator")),
                    strong: (chunks) => <span className="font-medium">{chunks}</span>,
                  })}
                </p>
              ) : null}
              <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
                {t.rich("segregationOfDuties", {
                  strong: (chunks) => <strong className="text-content-primary font-semibold">{chunks}</strong>,
                })}
              </p>
            </FinanceSection>
            <FinanceTable caption={t("roleMatrixCaption")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <NewRoleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { RolesPage }
