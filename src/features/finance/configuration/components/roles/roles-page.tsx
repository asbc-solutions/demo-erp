"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Plus } from "lucide-react"
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
import type { FinanceRole, Permission } from "../../lib/types/configuration"

const SESSION_NOTE =
  "Saved records live in this session only. The seeded data is never modified, so a reload returns the prototype to its known state."

const PERMISSION_LABELS: Record<Permission, string> = {
  view: "View",
  post: "Post",
  approve: "Approve",
  reverse: "Reverse",
  close: "Close period",
  settings: "Settings",
}

const CAPABILITIES: Record<Permission, string> = {
  view: "read balances, documents and reports",
  post: "post journal entries and vouchers",
  approve: "approve bills and payment runs",
  reverse: "reverse posted entries",
  close: "close, reopen and lock periods",
  settings: "change the posting map and other settings",
}

const roleSchema = z.object({
  name: z.string().trim().min(1, "Name the role."),
  scope: z.enum(["Entity", "Cost center", "Treasury"]),
  may_post: z.boolean(),
  may_approve: z.boolean(),
  may_see_balances: z.boolean(),
})
type RoleValues = z.infer<typeof roleSchema>

const EMPTY: RoleValues = { name: "", scope: "Cost center", may_post: false, may_approve: false, may_see_balances: true }

const SWITCHES: { name: "may_post" | "may_approve" | "may_see_balances"; label: string; hint: string }[] = [
  { name: "may_post", label: "May post", hint: "Can post journal entries to the ledger" },
  { name: "may_approve", label: "May approve", hint: "Can approve bills and payment runs" },
  { name: "may_see_balances", label: "May see balances", hint: "Can read treasury and bank balances" },
]

function NewRoleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
                toast.success(`${role.name} is added to the matrix.`)
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, "The role could not be saved. Try again.")),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>A role is a set of permissions in the Role &amp; Authority Matrix. Saving adds it; no user is assigned to it here.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-4">
              <Field>
                <FieldLabel htmlFor="role-name">Name *</FieldLabel>
                <Input id="role-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="role-scope">Scope *</FieldLabel>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="role-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Entity", "Cost center", "Treasury"].map((scope) => (
                          <SelectItem key={scope} value={scope}>
                            {scope}
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
                        <span className="text-content-primary text-[13px] font-medium">{item.label}</span>
                        <span className="text-content-tertiary text-xs">{item.hint}</span>
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 11.10 · Roles & permissions — the authority matrix, and a preview of what each persona can do. */
function RolesPage() {
  const { data, isError, refetch } = useRoles()
  const persona = useSetPersona()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const permissions = data?.permissions ?? []
  const columns: FinanceColumn<FinanceRole>[] = [
    {
      id: "role",
      header: "Role",
      cell: (row) => (
        <span className="flex flex-col">
          <span className={cn("text-content-primary font-medium", data?.persona_role?.id === row.id && "text-brand-primary")}>{row.name}</span>
          <span className="text-content-tertiary text-xs">
            {row.members} {row.members === 1 ? "member" : "members"} · {row.scope}
          </span>
        </span>
      ),
    },
    ...permissions.map(
      (permission): FinanceColumn<FinanceRole> => ({
        id: permission,
        header: PERMISSION_LABELS[permission],
        align: "center",
        cell: (row) =>
          row.permissions[permission] ? (
            <span className="bg-status-success-fg mx-auto block size-2.5 rounded-full" role="img" aria-label="Allowed" />
          ) : (
            <Minus className="text-content-quaternary mx-auto size-3.5" role="img" aria-label="Not allowed" />
          ),
      }),
    ),
  ]

  const granted = data?.persona_role ? permissions.filter((permission) => data.persona_role?.permissions[permission]) : []

  return (
    <>
      <FinancePageHeader
        title="Roles & permissions"
        figure={data ? <HeaderFigure label="Roles">{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New role
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
            <FinanceSection title="Role">
              <div role="group" aria-label="Preview as" className="bg-surface-hover border-stroke-default flex w-fit rounded-lg border p-1">
                {data.personas.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={data.persona === option.id}
                    disabled={persona.isPending}
                    onClick={() => persona.mutate(option.id, { onError: (error) => toast.error(errorMessage(error, "The role could not be switched. Try again.")) })}
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
                The role governs what you can do, not only what the assistant will answer. Switching it here is a demonstration
                affordance; a real build takes the role from the session.
              </p>
              {data.persona_role ? (
                <p className="text-content-primary text-[13px] leading-5">
                  Previewing as <span className="font-medium">{data.personas.find((option) => option.id === data.persona)?.name}</span>, who
                  holds the {data.persona_role.name} row: you can {granted.map((permission) => CAPABILITIES[permission]).join(", ")}.
                </p>
              ) : null}
              <p className="text-content-secondary max-w-2xl text-[13px] leading-5">
                <strong className="text-content-primary font-semibold">Segregation of duties.</strong> An accountant can post and close
                but cannot reopen or lock a period, so the person who closes a period is not the person who can unlock it.
              </p>
            </FinanceSection>
            <FinanceTable caption="Role and authority matrix" columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <NewRoleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { RolesPage }
