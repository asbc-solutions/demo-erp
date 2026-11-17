"use client"

import * as React from "react"
import { Download, ListFilter, Loader2, Plus, Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Input } from "@/src/shared/components/ui/input"
import { cn } from "@/src/shared/lib/utils/utils"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"

import { SalesErrorState, useToastMutationError } from "../components/shared/sales-error-state"
import { SalesPageSpinner } from "../components/shared/sales-loading"
import { SalesTablePagination } from "../components/shared/sales-table-pagination"
import { SALES_RESOURCES } from "../lib/constants/permissions"
import { useExportCustomers } from "../lib/mutations/customers"
import { useCustomerDirectory } from "../lib/queries/customers"
import { useActiveSalespeople } from "../lib/queries/salespeople"
import type { CustomerListItem, CustomerTab } from "../lib/types"
import { BlockCustomerDialog } from "./components/block-customer-dialog"
import { CustomerDetailView } from "./components/customer-detail-view"
import { CustomersTable } from "./components/customers-table"
import { EditCustomerDialog } from "./components/edit-customer-dialog"
import { NewCustomerDialog } from "./components/new-customer-dialog"
import { UnblockCustomerDialog } from "./components/unblock-customer-dialog"
import { useCustomerView } from "./hooks/use-customer-view"
import { useDebouncedValue } from "./hooks/use-debounced-value"

const CUSTOMER_TABS = [
  { value: "all", labelKey: "tabAll" },
  { value: "active", labelKey: "tabActive" },
  { value: "inactive", labelKey: "tabInactive" },
  { value: "blocked", labelKey: "tabBlocked" },
] as const satisfies readonly { value: CustomerTab; labelKey: string }[]

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export function CustomersPage() {
  const t = useTranslations("SalesCustomers")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [activeTab, setActiveTab] = React.useState<CustomerTab>("all")
  const [salespersonFilter, setSalespersonFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [newCustomerOpen, setNewCustomerOpen] = React.useState(false)
  const [editCustomerId, setEditCustomerId] = React.useState<string | null>(null)
  const [blockTarget, setBlockTarget] = React.useState<CustomerListItem | null>(null)
  const [unblockTarget, setUnblockTarget] = React.useState<CustomerListItem | null>(null)
  const { view, showList, showDetail } = useCustomerView()

  const handleTabChange = (tab: CustomerTab) => {
    setActiveTab(tab)
    setPage(1)
  }
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleSalespersonChange = (value: string) => {
    setSalespersonFilter(value)
    setPage(1)
  }

  const { data: customerDirectory = [], isLoading, isError, refetch } = useCustomerDirectory()
  const { data: salespeople = [] } = useActiveSalespeople()
  const exportCustomers = useExportCustomers()
  const { can } = usePermissions()
  const canManageCustomers = can.write(SALES_RESOURCES.customer)

  if (view.mode === "detail") {
    return (
      <CustomerDetailView
        customerId={view.customerId}
        canManage={canManageCustomers}
        onBack={showList}
      />
    )
  }

  const selectedSalespersonName = salespeople.find(
    (person) => person.id === salespersonFilter
  )?.name
  const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase()
  const searchMatches = customerDirectory.filter((customer) => {
    if (!normalizedSearch) return true
    return [customer.name, customer.phone, customer.email].some((value) =>
      value.toLocaleLowerCase().includes(normalizedSearch)
    )
  })
  const filterMatches =
    salespersonFilter === "all"
      ? searchMatches
      : searchMatches.filter(
          (customer) => customer.assigned_salesperson_name === selectedSalespersonName
        )
  const tabCounts = {
    all: filterMatches.length,
    active: filterMatches.filter((customer) => customer.status === "active").length,
    inactive: filterMatches.filter((customer) => customer.status === "inactive").length,
    blocked: filterMatches.filter((customer) => customer.status === "blocked").length,
  }
  const tabMatches =
    activeTab === "all"
      ? filterMatches
      : filterMatches.filter((customer) => customer.status === activeTab)
  const pageCount = Math.max(1, Math.ceil(tabMatches.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const filteredCustomers = tabMatches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleExport = () => {
    exportCustomers.mutate(
      {
        format: "csv",
        scope: "filtered",
        filters: {
          tab: activeTab,
          q: debouncedSearch || undefined,
        },
      },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, t("exportFailed")),
      }
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-5.5 overflow-auto bg-surface-page p-4 sm:p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 inset-s-3.5 size-4.5 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="h-10 rounded-[10px] ps-10 shadow-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10 rounded-[10px] px-4">
                <ListFilter strokeWidth={1.75} aria-hidden />
                {tCommon("filter")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("salesperson")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={salespersonFilter}
                onValueChange={handleSalespersonChange}
              >
                <DropdownMenuRadioItem value="all">
                  {t("allSalespeople")}
                </DropdownMenuRadioItem>
                {salespeople.map((person) => (
                  <DropdownMenuRadioItem key={person.id} value={person.id}>
                    {person.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {can.write(SALES_RESOURCES.export) ? (
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-[10px] px-4"
              onClick={handleExport}
              disabled={exportCustomers.isPending}
            >
              {exportCustomers.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download strokeWidth={1.75} aria-hidden />
              )}
              {tCommon("export")}
            </Button>
          ) : null}
          {canManageCustomers ? (
            <Button
              type="button"
              variant="primary"
              className="h-10 rounded-[10px] px-4"
              onClick={() => setNewCustomerOpen(true)}
            >
              <Plus strokeWidth={1.75} aria-hidden />
              {t("newCustomer")}
            </Button>
          ) : null}
        </div>
      </div>

      <nav
        aria-label={t("statusTabsLabel")}
        className="flex w-full shrink-0 items-center overflow-x-auto border-b border-stroke-default"
      >
        {CUSTOMER_TABS.map((tab) => {
          const selected = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-medium text-content-tertiary transition-colors hover:text-content-primary",
                "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent",
                selected && "text-brand-primary after:bg-brand-primary"
              )}
            >
              {t(tab.labelKey)}
              <span
                className={cn(
                  "flex min-w-6 items-center justify-center rounded-full bg-surface-hover px-1.5 py-0.5 text-xs font-semibold text-content-tertiary",
                  selected && "bg-brand-primary/10 text-brand-primary"
                )}
              >
                {tabCounts[tab.value]}
              </span>
            </button>
          )
        })}
      </nav>

      {isLoading ? (
        <SalesPageSpinner />
      ) : isError ? (
        <SalesErrorState message={t("loadListFailed")} onRetry={() => void refetch()} />
      ) : (
        <>
          <CustomersTable
            customers={filteredCustomers}
            canManage={canManageCustomers}
            onSelectCustomer={showDetail}
            onEdit={(customer) => setEditCustomerId(customer.id)}
            onBlock={(customer) => setBlockTarget(customer)}
            onUnblock={(customer) => setUnblockTarget(customer)}
          />
          {tabMatches.length > 0 ? (
            <SalesTablePagination
              page={currentPage}
              pageCount={pageCount}
              total={tabMatches.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="customers"
            />
          ) : null}
        </>
      )}

      <NewCustomerDialog
        key={newCustomerOpen ? "open" : "closed"}
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
      />
      <EditCustomerDialog
        customerId={editCustomerId}
        open={editCustomerId !== null}
        onOpenChange={(open) => {
          if (!open) setEditCustomerId(null)
        }}
      />
      <BlockCustomerDialog
        key={blockTarget?.id ?? "none"}
        customer={blockTarget}
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null)
        }}
      />
      <UnblockCustomerDialog
        customer={unblockTarget}
        onOpenChange={(open) => {
          if (!open) setUnblockTarget(null)
        }}
      />
    </div>
  )
}
