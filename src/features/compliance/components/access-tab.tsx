"use client"

import { useState } from "react"
import { ArrowLeft, Search, ShieldCheck, UserCog } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { cn } from "@/src/shared/lib/utils/utils"

import { useDebouncedValue } from "../hooks/use-debounced-value"
import { useAccessMembers, useAccessRoles, usePermissionMatrix } from "../lib/queries/access"
import type { PermissionMatrixLevel } from "../lib/types/access"
import { ComplianceErrorState } from "./shared/compliance-error-state"
import { ComplianceSectionSpinner } from "./shared/compliance-loading"
import { ComplianceTablePagination } from "./shared/compliance-table-pagination"

type AccessSubTab = "team" | "roles"

const ACCESS_SUB_TABS: readonly AccessSubTab[] = ["team", "roles"]

const PAGE_SIZE = 15
const SEARCH_DEBOUNCE_MS = 300


const MATRIX_LEVEL_CLASS: Record<PermissionMatrixLevel, string> = {
  none: "bg-surface-page text-content-quaternary",
  read: "bg-brand-info/10 text-brand-info",
  write: "bg-brand-primary/15 text-brand-primary",
  approval_required: "bg-brand-warning/15 text-brand-warning",
}

export function AccessTab() {
  const t = useTranslations("ComplianceAccess")
  const [subTab, setSubTab] = useState<AccessSubTab>("team")

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-hover grid w-full max-w-[450px] grid-cols-2 gap-1 rounded-xl p-1">
        {ACCESS_SUB_TABS.map((tab) => {
          const isActive = tab === subTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={cn(
                "text-content-secondary inline-flex h-8 items-center justify-center rounded-lg text-sm font-medium",
                isActive && "bg-surface-white text-content-primary shadow-sm",
              )}
            >
              {t(`subTabs.${tab}`)}
            </button>
          )
        })}
      </div>

      {subTab === "team" ? <TeamMembersPanel /> : <RolesPanel />}
    </div>
  )
}

function TeamMembersPanel() {
  const t = useTranslations("ComplianceAccess")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const { data, isLoading, isError, refetch } = useAccessMembers({
    search: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })

  const members = data?.data ?? []
  const meta = data?.meta
  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 inset-s-3 size-4 -translate-y-1/2 text-content-quaternary"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="h-9 ps-9"
        />
      </div>

      {isLoading ? (
        <ComplianceSectionSpinner />
      ) : isError ? (
        <ComplianceErrorState message={t("membersLoadFailed")} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card variant="elevated" className="p-3">
              <p className="text-content-tertiary px-2 py-1 text-sm">
                {meta
                  ? t("teamMembersCount", { total: String(meta.total) })
                  : t("teamMembers")}
              </p>
              <div className="flex flex-col gap-1">
                {members.length === 0 ? (
                  <p className="text-content-tertiary px-2 py-4 text-sm">{t("noMembers")}</p>
                ) : (
                  members.map((member) => {
                    const isSelected = member.id === selectedMemberId
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className={cn(
                          "hover:bg-surface-hover flex items-center justify-between rounded-xl px-3 py-2 text-start",
                          isSelected && "bg-brand-primary/10",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="bg-surface-hover text-content-secondary inline-flex size-8 items-center justify-center rounded-full text-xs">
                            {member.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="text-content-primary truncate text-sm font-medium">
                              {member.name}
                            </p>
                            <p className="text-content-tertiary truncate text-xs">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            member.is_active ? "bg-brand-success" : "bg-brand-warning",
                          )}
                          aria-label={member.is_active ? t("active") : t("inactive")}
                        />
                      </button>
                    )
                  })
                )}
              </div>
            </Card>

            <Card variant="elevated" className="p-5">
              {selectedMember ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-surface-hover text-content-secondary inline-flex size-10 items-center justify-center rounded-full text-xs">
                      {selectedMember.initials}
                    </span>
                    <div>
                      <p className="text-content-primary text-lg font-semibold">
                        {selectedMember.name}
                      </p>
                      <p className="text-content-tertiary text-sm">{selectedMember.email}</p>
                    </div>
                    <Badge variant={selectedMember.is_active ? "success" : "warning"} className="ms-auto">
                      {selectedMember.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-content-primary text-sm font-medium">{t("assignedRoles")}</p>
                    {selectedMember.roles.length === 0 ? (
                      <p className="text-content-tertiary text-sm">{t("noRolesAssigned")}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.roles.map((role) => (
                          <Badge key={role.id} variant="primary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-content-tertiary text-sm">
                    {t("readOnlyNote")}
                  </p>
                </div>
              ) : (
                <div className="text-content-tertiary flex min-h-[240px] flex-col items-center justify-center gap-2 text-sm">
                  <UserCog className="size-8" />
                  <p>{t("noUserSelected")}</p>
                  <p>{t("selectMemberHint")}</p>
                </div>
              )}
            </Card>
          </div>

          {meta ? (
            <ComplianceTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemKind="members"
            />
          ) : null}
        </>
      )}
    </div>
  )
}

function RolesPanel() {
  const t = useTranslations("ComplianceAccess")
  const [showMatrix, setShowMatrix] = useState(false)
  const { data: roles, isLoading, isError, refetch } = useAccessRoles()

  if (showMatrix) {
    return <PermissionMatrixView onBack={() => setShowMatrix(false)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-content-primary text-[32px] leading-10 font-semibold">
            {t("roles")}
          </p>
          <p className="text-content-tertiary text-sm">{t("rolesSubtitle")}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowMatrix(true)}>
          <ShieldCheck className="size-4" />
          {t("viewMatrix")}
        </Button>
      </div>

      {isLoading ? (
        <ComplianceSectionSpinner />
      ) : isError ? (
        <ComplianceErrorState message={t("rolesLoadFailed")} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(roles ?? []).map((role) => (
            <Card key={role.id} variant="elevated" className="gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-content-primary text-base font-semibold">{role.name}</p>
                {role.is_system ? <Badge variant="neutral">{t("predefined")}</Badge> : null}
              </div>
              <p className="text-content-tertiary text-sm">{role.description}</p>
              <div className="flex items-center gap-4 pt-1">
                <div>
                  <p className="text-content-primary text-lg font-semibold">{role.member_count}</p>
                  <p className="text-content-tertiary text-xs">{t("members")}</p>
                </div>
                <div>
                  <p className="text-content-primary text-lg font-semibold">
                    {role.granted_resource_count}
                  </p>
                  <p className="text-content-tertiary text-xs">{t("resourcesGranted")}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PermissionMatrixView({ onBack }: Readonly<{ onBack: () => void }>) {
  const t = useTranslations("ComplianceAccess")
  const { data, isLoading, isError, refetch } = usePermissionMatrix()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="icon" onClick={onBack} aria-label={t("backToRoles")}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <div>
          <p className="text-content-primary text-2xl font-semibold">{t("matrixTitle")}</p>
          <p className="text-content-tertiary text-sm">{t("matrixSubtitle")}</p>
        </div>
      </div>

      {isLoading ? (
        <ComplianceSectionSpinner />
      ) : isError || !data ? (
        <ComplianceErrorState
          message={t("matrixLoadFailed")}
          onRetry={() => void refetch()}
        />
      ) : (
        <Card className="overflow-hidden rounded-[10px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="border-stroke-default bg-surface-hover/90 border-b backdrop-blur-[4px]">
                <tr>
                  <th className="sticky inset-s-0 z-10 min-w-[220px] bg-surface-hover/90 px-4 py-3 text-start text-xs font-medium tracking-[0.6px] text-content-quaternary uppercase backdrop-blur-[4px]">
                    {t("resource")}
                  </th>
                  {data.roles.map((role) => (
                    <th key={role.id} className="px-3 py-3 text-center">
                      <p className="text-content-primary text-xs leading-4 font-semibold">
                        {role.name}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.resources.map((resource) => (
                  <tr key={resource.resource} className="border-stroke-default border-b">
                    <td className="sticky inset-s-0 z-[1] bg-surface-white px-4 py-3 text-sm leading-5 font-medium text-content-primary">
                      {resource.resource}
                      <p className="text-content-tertiary text-xs font-normal">
                        {resource.description}
                      </p>
                    </td>
                    {data.roles.map((role) => {
                      const level = resource.by_role[role.id] ?? "none"
                      return (
                        <td key={role.id} className="px-3 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex min-w-[76px] items-center justify-center rounded-[10px] px-2 py-1 text-xs font-medium",
                              MATRIX_LEVEL_CLASS[level],
                            )}
                          >
                            {t(`matrixLevel.${level}`)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
