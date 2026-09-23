"use client"

import { type ReactNode, useMemo, useState } from "react"
import { FileText, MoreHorizontal, Plus, RefreshCw } from "lucide-react"

import { AlertCard } from "@/src/shared/components/ui/alert-card"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { useEmployees } from "../../lib/queries/employees"
import {
  useContracts,
  useCurrentEmployeeContract,
  useExpiringContracts,
} from "../../lib/queries/contracts"
import type {
  ContractListItem,
  ContractStatus,
  ContractType,
  EmployeeListItem,
  NoticePeriodUnit,
} from "../../lib/types"
import type {
  HrFilterGroup,
  HrFilterValues,
} from "../shared/hr-filter-panel"
import { HrToolbar } from "../shared/hr-toolbar"
import { NewContractDialog } from "./new-contract-dialog"

const EMPTY_CONTRACTS: ContractListItem[] = []
const EMPTY_EMPLOYEES: EmployeeListItem[] = []

const TYPE_LABEL: Record<ContractType, string> = {
  permanent: "Permanent",
  fixed_term: "Fixed term",
  temporary: "Temporary",
  internship: "Internship",
  contract: "Contract",
  seasonal: "Seasonal",
  secondment: "Secondment",
}

const CONTRACT_STATUS_OPTIONS: readonly { value: ContractStatus; label: string }[] =
  [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "terminated", label: "Terminated" },
    { value: "renewed", label: "Renewed" },
    { value: "suspended", label: "Suspended" },
  ]

const CONTRACT_TYPE_OPTIONS = Object.entries(TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
)

const CONTRACT_FILTER_GROUPS: readonly HrFilterGroup[] = [
  { id: "status", label: "Status", options: CONTRACT_STATUS_OPTIONS },
  { id: "type", label: "Type", options: CONTRACT_TYPE_OPTIONS },
]

const STATUS_STYLES: Record<ContractStatus, string> = {
  draft: "border-stroke-default bg-surface-hover text-content-tertiary",
  active: "border-brand-success/30 bg-brand-success/10 text-brand-success",
  expired: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  terminated: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  renewed: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary",
  suspended: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
}

function ContractTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          <TableCell className="pl-6">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="pr-6 text-right">
            <Skeleton className="ml-auto h-7 w-7 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

function StatusBadge({ status }: Readonly<{ status?: ContractStatus | null }>) {
  if (!status) return <span className="text-content-tertiary">-</span>
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase",
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
      )}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  )
}

function formatDate(date: string | null | undefined) {
  if (!date) return "-"
  return date
}

const NOTICE_UNIT_LABEL: Record<NoticePeriodUnit, { one: string; many: string }> = {
  day: { one: "day", many: "days" },
  week: { one: "week", many: "weeks" },
  month: { one: "month", many: "months" },
}

// Distinct from `days_remaining` (time left until the contract's end date,
// always expressed in days by the API): this is the statutory notice period
// the employee/employer must give before termination, stored as a
// (count, unit) pair so the HR-entered value isn't lossily converted to days.
function formatNoticePeriod(
  days: number | null | undefined,
  unit: NoticePeriodUnit | null | undefined
) {
  if (days == null || !unit) return null
  const label = NOTICE_UNIT_LABEL[unit]
  return `${days} ${days === 1 ? label.one : label.many}`
}

function DaysRemainingCell({
  days,
  label,
}: Readonly<{ days: number | null; label?: string }>) {
  if (days === null) {
    return (
      <span className="text-content-tertiary">{label ?? "Open-ended"}</span>
    )
  }
  if (days < 0) {
    return <span className="font-medium text-brand-danger">Expired</span>
  }
  if (days <= 30) {
    return <span className="font-medium text-brand-warning">{days} days</span>
  }
  return <span className="text-content-secondary">{days} days</span>
}

function getEmployeeDisplay(
  contract: ContractListItem,
  employeesById: Map<string, EmployeeListItem>
) {
  const employee = contract.employee ?? employeesById.get(contract.employee_id)
  return {
    name:
      contract.employee_name ??
      employee?.full_name ??
      `Employee ${contract.employee_id.slice(0, 8)}`,
    number:
      contract.employee_number ??
      employee?.employee_number ??
      contract.employee_id,
  }
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-t border-stroke-light py-3 text-sm first:border-t-0">
      <span className="text-content-tertiary">{label}</span>
      <span className="text-content-primary">{value}</span>
    </div>
  )
}

function ContractDetailsDialog({
  contract,
  employeesById,
  onOpenChange,
}: Readonly<{
  contract: ContractListItem | null
  employeesById: Map<string, EmployeeListItem>
  onOpenChange: (open: boolean) => void
}>) {
  // Notice period only comes back from the "current contract" endpoint —
  // there's no by-id lookup for past contracts, so it's unavailable there.
  const { data: currentContract } = useCurrentEmployeeContract(
    contract?.is_current ? contract.employee_id : ""
  )

  if (!contract) return null

  const employee = getEmployeeDisplay(contract, employeesById)
  const noticePeriod = formatNoticePeriod(
    contract.notice_period_days ?? currentContract?.notice.notice_period_days,
    contract.notice_period_unit ?? currentContract?.notice.notice_period_unit
  )

  return (
    <Dialog open={!!contract} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-lg font-semibold text-content-primary">
              {contract.contract_number}
            </DialogTitle>
            <p className="text-sm leading-5 text-content-tertiary">
              {employee.name} ({employee.number})
            </p>
          </div>

          <div className="flex flex-col">
            <DetailRow
              label="Type"
              value={
                contract.contract_type_label ??
                TYPE_LABEL[contract.contract_type]
              }
            />
            <DetailRow
              label="Status"
              value={<StatusBadge status={contract.contract_status} />}
            />
            <DetailRow
              label="Start date"
              value={formatDate(contract.start_date)}
            />
            <DetailRow label="End date" value={formatDate(contract.end_date)} />
            <DetailRow
              label="Remaining"
              value={
                <DaysRemainingCell
                  days={contract.days_remaining}
                  label={contract.days_remaining_label}
                />
              }
            />
            <DetailRow
              label="Current"
              value={contract.is_current ? "Yes" : "No"}
            />
            {noticePeriod && (
              <DetailRow label="Notice period" value={noticePeriod} />
            )}
            <DetailRow label="Renewals" value={contract.renewal_count} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ContractsTab() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [newContractOpen, setNewContractOpen] = useState(false)
  const [viewContract, setViewContract] = useState<ContractListItem | null>(
    null
  )
  const [renewContract, setRenewContract] = useState<ContractListItem | null>(
    null
  )

  const { data, isLoading, isError } = useContracts({ per_page: 50 })
  const { data: expiringData } = useExpiringContracts(90)
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    per_page: 100,
  })

  const contracts = data?.data ?? EMPTY_CONTRACTS
  const employees = employeesData?.data ?? EMPTY_EMPLOYEES

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  )

  const expiringSoon =
    expiringData?.meta.count ??
    contracts.filter((contract) => {
      if (contract.days_remaining === null) return false
      return contract.days_remaining >= 0 && contract.days_remaining <= 90
    }).length

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const statusFilter = filters.status ?? []
    const typeFilter = filters.type ?? []

    return contracts.filter((contract) => {
      if (
        statusFilter.length > 0 &&
        !statusFilter.includes(contract.contract_status)
      ) {
        return false
      }
      if (
        typeFilter.length > 0 &&
        !typeFilter.includes(contract.contract_type)
      ) {
        return false
      }
      if (!query) return true

      const employee = getEmployeeDisplay(contract, employeesById)
      return [
        employee.name,
        employee.number,
        contract.contract_number,
        contract.contract_type_label,
        contract.contract_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [contracts, employeesById, search, filters])

  return (
    <div className="flex flex-col gap-4">
      {expiringSoon > 0 && (
        <AlertCard
          variant="warning"
          title={`${expiringSoon} contract${expiringSoon === 1 ? "" : "s"} expiring within 90 days`}
          description="Review and initiate renewal process"
        />
      )}

      <div className="flex flex-col gap-4 rounded-[14px] border border-stroke-default bg-surface-white p-5">
        <HrToolbar
          primary={
            <Button
              variant="primary"
              className="rounded-[10px]"
              onClick={() => setNewContractOpen(true)}
            >
              <Plus />
              New Contract
            </Button>
          }
          searchValue={search}
          onSearchChange={setSearch}
          filterGroups={CONTRACT_FILTER_GROUPS}
          filterValues={filters}
          onFilterChange={setFilters}
        />

        <div className="overflow-hidden rounded-[12px] border border-stroke-default">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Employee</TableHead>
                <TableHead>Contract #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Remaining</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <ContractTableSkeleton />
            ) : (
              <TableBody>
                {isError && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-sm text-content-tertiary"
                    >
                      Failed to load contracts.
                    </TableCell>
                  </TableRow>
                )}

                {!isError && filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-sm text-content-tertiary"
                    >
                      No contracts found.
                    </TableCell>
                  </TableRow>
                )}

                {!isError &&
                  filtered.map((contract) => {
                    const employee = getEmployeeDisplay(contract, employeesById)
                    const canRenew =
                      contract.is_current &&
                      contract.contract_status === "active" &&
                      contract.employee_id.length > 0

                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="pl-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-content-primary">
                              {employee.name}
                            </span>
                            <span className="text-xs leading-4 text-content-tertiary">
                              {employee.number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-content-tertiary">
                          {contract.contract_number}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-md border-stroke-default bg-surface-hover px-2 py-0.5 text-[11px] tracking-[0.4px] text-content-secondary uppercase"
                          >
                            {contract.contract_type_label ??
                              TYPE_LABEL[contract.contract_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-content-tertiary">
                          {formatDate(contract.start_date)}
                        </TableCell>
                        <TableCell className="text-content-secondary">
                          {formatDate(contract.end_date)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={contract.contract_status} />
                        </TableCell>
                        <TableCell>
                          <DaysRemainingCell
                            days={contract.days_remaining}
                            label={contract.days_remaining_label}
                          />
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${contract.contract_number}`}
                                className="mx-auto text-content-tertiary hover:text-content-primary"
                              >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-[180px]"
                            >
                              <DropdownMenuItem
                                className="gap-2"
                                onSelect={() => setViewContract(contract)}
                              >
                                <FileText
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                                View Contract
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                disabled={!canRenew}
                                onSelect={() => setRenewContract(contract)}
                              >
                                <RefreshCw
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                                Renew Contract
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      <NewContractDialog
        open={newContractOpen}
        onOpenChange={setNewContractOpen}
        employees={employees}
        employeesLoading={employeesLoading}
      />

      <NewContractDialog
        open={!!renewContract}
        onOpenChange={(open) => {
          if (!open) setRenewContract(null)
        }}
        employees={employees}
        employeesLoading={employeesLoading}
        mode="renew"
        initialContract={renewContract}
      />

      <ContractDetailsDialog
        contract={viewContract}
        employeesById={employeesById}
        onOpenChange={(open) => {
          if (!open) setViewContract(null)
        }}
      />
    </div>
  )
}
