"use client"

import { useMemo, useState } from "react"
import { Loader2, ShieldCheck, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/ui/accordion"
import { AccessDeniedCard } from "@/src/shared/components/ui/access-denied-card"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import type { ApiError } from "@/src/shared/lib/types/api"
import type { PermissionLevel } from "@/src/shared/lib/types/permissions"
import { cn } from "@/src/shared/lib/utils/utils"

import { useUpdateRolePermissions } from "../lib/mutations/roles"
import { useRolePermissions, useRoles } from "../lib/queries/roles"

/** Rendered with `t(\`level.${value}\`)` in the `SettingsRoles` namespace. */
const LEVEL_OPTIONS: readonly PermissionLevel[] = [
  "none",
  "read",
  "approval_required",
  "write",
]

function RolePermissionMatrix({ roleId }: Readonly<{ roleId: string }>) {
  const t = useTranslations("SettingsRoles")
  const tCommon = useTranslations("Common")
  const { can } = usePermissions()
  const { data: matrix, isLoading } = useRolePermissions(roleId)
  const updatePermissions = useUpdateRolePermissions(roleId)
  const [edits, setEdits] = useState<Record<string, PermissionLevel>>({})

  const grouped = useMemo(() => {
    const rows = matrix?.permissions ?? []
    const groups = new Map<string, typeof rows>()
    for (const row of rows) {
      const prefix = row.resource.split(".")[0]
      const bucket = groups.get(prefix) ?? []
      bucket.push(row)
      groups.set(prefix, bucket)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [matrix])

  if (isLoading) {
    return <Skeleton className="h-96 flex-1 rounded-[14px]" />
  }

  const changedCount = Object.keys(edits).length

  function levelFor(resource: string, current: PermissionLevel) {
    return edits[resource] ?? current
  }

  function handleSave() {
    const payload = Object.entries(edits).map(([resource, permission_level]) => ({
      resource,
      permission_level,
    }))
    if (payload.length === 0) return
    updatePermissions.mutate(
      { permissions: payload },
      {
        onSuccess: () => {
          toast.success(t("updated"))
          setEdits({})
        },
        onError: (err: unknown) => {
          const apiErr = err as ApiError
          toast.error(t("updateFailed"), {
            description: apiErr.message ?? t("tryAgain"),
          })
        },
      },
    )
  }

  return (
    <Card variant="elevated" className="flex-1 gap-4 p-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <h3 className="text-content-primary text-[13px] leading-[18px] font-semibold">
          {matrix?.role.role_name}
        </h3>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={changedCount === 0 || updatePermissions.isPending}
          onClick={handleSave}
        >
          {updatePermissions.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {changedCount > 0
            ? t("saveWithCount", { count: changedCount })
            : tCommon("save")}
        </Button>
      </div>

      <Accordion type="multiple" className="flex flex-col">
        {grouped.map(([prefix, rows]) => {
          const changedInGroup = rows.filter((row) => row.resource in edits).length
          return (
            <AccordionItem key={prefix} value={prefix}>
              <AccordionTrigger className="px-2">
                <span className="flex items-center gap-2">
                  <span className="text-content-primary text-[12px] leading-[18px] font-semibold uppercase tracking-[0.6px]">
                    {prefix}
                  </span>
                  <Badge variant="neutral">{rows.length}</Badge>
                  {changedInGroup > 0 ? (
                    <Badge variant="primary">
                      {t("changedCount", { count: changedInGroup })}
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("colResource")}</TableHead>
                      <TableHead>{tCommon("description")}</TableHead>
                      <TableHead className="w-48">{t("colLevel")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const level = levelFor(row.resource, row.permission_level)
                      return (
                        <TableRow key={row.resource}>
                          <TableCell className="font-mono text-xs">{row.resource}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                            <Select
                              value={level}
                              onValueChange={(value) =>
                                setEdits((prev) => ({
                                  ...prev,
                                  [row.resource]: value as PermissionLevel,
                                }))
                              }
                            >
                              <SelectTrigger className="h-9 w-44 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LEVEL_OPTIONS.map((option) => {
                                  const disabled = !can.access(row.resource, option)
                                  return (
                                    <SelectItem
                                      key={option}
                                      value={option}
                                      disabled={disabled}
                                      title={disabled ? t("levelTooHigh") : undefined}
                                    >
                                      {t(`level.${option}`)}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Card>
  )
}

export function RolesTab() {
  const t = useTranslations("SettingsRoles")
  const { can, isLoading: permissionsLoading } = usePermissions()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const { data: roles, isLoading: rolesLoading } = useRoles()

  if (permissionsLoading) {
    return <Skeleton className="h-64 rounded-[14px]" />
  }

  if (!can.write("roles")) {
    return (
      <AccessDeniedCard description={t("accessDenied")} />
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Card variant="elevated" className="gap-3 p-4 lg:w-80 lg:shrink-0">
        <div className="flex items-center gap-2 px-2 pt-1">
          <Users className="text-content-secondary size-4" aria-hidden />
          <h3 className="text-content-primary text-[13px] leading-[18px] font-semibold">
            {t("title")}
          </h3>
        </div>
        {rolesLoading ? (
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {(roles ?? []).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-start transition-colors",
                  role.id === selectedRoleId
                    ? "bg-brand-primary/8 text-brand-primary"
                    : "hover:bg-surface-hover text-content-primary",
                )}
              >
                <span className="flex items-center gap-1.5 text-[13px] leading-[18px] font-medium">
                  {role.role_name}
                  {role.is_system ? (
                    <Badge variant="neutral" className="gap-1">
                      <ShieldCheck aria-hidden />
                      {t("system")}
                    </Badge>
                  ) : null}
                </span>
                <span className="text-content-tertiary text-[11px] leading-[15.4px]">
                  {t("userCount", { count: role.user_count })}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selectedRoleId ? (
        <RolePermissionMatrix roleId={selectedRoleId} />
      ) : (
        <Card
          variant="elevated"
          className="flex-1 items-center justify-center p-6 text-center"
        >
          <span className="text-content-tertiary text-sm">
            {t("selectRole")}
          </span>
        </Card>
      )}
    </div>
  )
}
