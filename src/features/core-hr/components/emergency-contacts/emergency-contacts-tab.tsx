"use client"

import { useMemo, useState } from "react"
import { Pencil, Plus, Star, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { useEmergencyContacts } from "../../lib/queries/emergency-contacts"
import { useDeleteEmergencyContact } from "../../lib/mutations/emergency-contacts"
import { useEmployees } from "../../lib/queries/employees"
import type { ApiError } from "@/src/shared/lib/types/api"
import type { EmergencyContact, EmployeeListItem } from "../../lib/types"
import type { HrFilterGroup, HrFilterValues } from "../shared/hr-filter-panel"
import { HrToolbar } from "../shared/hr-toolbar"
import { AddEmergencyContactDialog } from "./add-emergency-contact-dialog"
import { EditEmergencyContactDialog } from "./edit-emergency-contact-dialog"

const EMPTY_CONTACTS: EmergencyContact[] = []
const EMPTY_EMPLOYEES: EmployeeListItem[] = []

const PRIMARY_OPTIONS = [
  { value: "primary", labelKey: "primary" },
  { value: "secondary", labelKey: "notPrimary" },
] as const

function ContactTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          <TableCell className="ps-6">
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-6" />
          </TableCell>
          <TableCell className="pe-6 text-end">
            <Skeleton className="ms-auto h-7 w-16 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

export function EmergencyContactsTab() {
  const t = useTranslations("HrEmergencyContacts")
  const tCommon = useTranslations("Common")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [addOpen, setAddOpen] = useState(false)
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null)

  const { data, isLoading, isError } = useEmergencyContacts({ per_page: 50 })
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    per_page: 100,
  })
  const deleteContact = useDeleteEmergencyContact()

  const contacts = data?.data ?? EMPTY_CONTACTS
  const employees = employeesData?.data ?? EMPTY_EMPLOYEES

  const employeesById = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees]
  )

  const relationshipOptions = useMemo(() => {
    const seen = new Set(
      contacts.map((c) => c.relationship).filter((rel): rel is string => !!rel)
    )
    return Array.from(seen).map((rel) => ({ value: rel, label: rel }))
  }, [contacts])

  const filterGroups: HrFilterGroup[] = [
    { id: "relationship", label: t("relationship"), options: relationshipOptions },
    {
      id: "primary",
      label: t("primaryContact"),
      options: PRIMARY_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    },
  ]

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const relFilter = filters.relationship ?? []
    const primaryFilter = filters.primary ?? []
    return contacts.filter((c) => {
      if (relFilter.length > 0 && !relFilter.includes(c.relationship)) {
        return false
      }
      if (primaryFilter.length > 0) {
        const key = c.is_primary ? "primary" : "secondary"
        if (!primaryFilter.includes(key)) return false
      }
      if (!query) return true
      return [c.full_name, c.relationship, c.phone_primary, c.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [contacts, search, filters])

  function handleDelete(contact: EmergencyContact) {
    deleteContact.mutate(
      { employeeId: contact.employee_id, id: contact.id },
      {
        onSuccess: () =>
          toast.success(t("contactDeleted"), { description: contact.full_name }),
        onError: (err) => {
          const apiErr = err as unknown as ApiError
          if (apiErr.code === "CONFLICT") {
            toast.warning(t("cannotDelete"), {
              description: t("cannotDeleteOnlyContact"),
            })
            return
          }
          toast.error(t("deleteFailed"), {
            description: apiErr.message ?? t("deleteFailedDescription"),
          })
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <HrToolbar
        primary={
          <Button
            variant="primary"
            className="rounded-[10px]"
            onClick={() => setAddOpen(true)}
          >
            <Plus />
            {t("addContact")}
          </Button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        filterGroups={filterGroups}
        filterValues={filters}
        onFilterChange={setFilters}
      />

      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-[12px] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">{t("colContact")}</TableHead>
              <TableHead>{t("colEmployee")}</TableHead>
              <TableHead>{t("relationship")}</TableHead>
              <TableHead>{tCommon("phone")}</TableHead>
              <TableHead>{tCommon("email")}</TableHead>
              <TableHead>{t("primary")}</TableHead>
              <TableHead className="pe-6 text-end">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <ContactTableSkeleton />
          ) : (
            <TableBody>
              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-content-tertiary py-12 text-center text-sm"
                  >
                    {t("loadError")}
                  </TableCell>
                </TableRow>
              )}

              {!isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-content-tertiary py-12 text-center text-sm"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}

              {!isError &&
                filtered.map((contact) => {
                  const employee = employeesById.get(contact.employee_id)
                  const employeeName =
                    employee?.full_name ??
                    t("employeeRef", { id: contact.employee_id.slice(0, 8) })

                  return (
                    <TableRow key={contact.id}>
                      <TableCell className="text-content-primary ps-6 text-sm font-semibold">
                        {contact.full_name}
                      </TableCell>
                      <TableCell className="text-content-tertiary text-sm">
                        {employeeName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-stroke-default bg-surface-hover text-content-secondary rounded-md px-2 py-0.5 text-xs"
                        >
                          {contact.relationship}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-content-secondary font-mono text-sm">
                        {contact.phone_primary}
                      </TableCell>
                      <TableCell className="text-content-tertiary text-sm">
                        {contact.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {contact.is_primary ? (
                          <Star
                            className="text-brand-warning size-4 fill-current"
                            aria-label={t("primaryContact")}
                          />
                        ) : (
                          <span aria-hidden className="text-content-quaternary">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pe-6 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("editContactLabel", { name: contact.full_name })}
                            className="text-content-tertiary hover:text-content-primary"
                            onClick={() => setEditContact(contact)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("deleteContactLabel", { name: contact.full_name })}
                            className="text-brand-danger hover:bg-brand-danger/10 hover:text-brand-danger"
                            disabled={deleteContact.isPending}
                            onClick={() => handleDelete(contact)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          )}
        </Table>
      </div>

      <AddEmergencyContactDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        employees={employees}
        employeesLoading={employeesLoading}
      />

      <EditEmergencyContactDialog
        contact={editContact}
        onOpenChange={(open) => { if (!open) setEditContact(null) }}
      />
    </div>
  )
}
