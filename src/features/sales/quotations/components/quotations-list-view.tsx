"use client"

import * as React from "react"
import { AlertTriangle, Check, Copy, Download, ListFilter, Loader2, MoreHorizontal, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Input } from "@/src/shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, toastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { SalesTablePagination } from "../../components/shared/sales-table-pagination"
import { formatCurrency } from "../../lib/utils/currency"
import { getQuotationValidity } from "../../lib/utils/quotation-validity"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useCreateQuotation, useExportQuotations } from "../../lib/mutations/quotations"
import { useCustomer, useCustomerDirectory } from "../../lib/queries/customers"
import { useQuotations } from "../../lib/queries/quotations"
import { useActiveSalespeople } from "../../lib/queries/salespeople"
import type { CreateQuotationPayload, QuotationListItem, QuotationTab } from "../../lib/types"

const QUOTATION_TABS: { value: QuotationTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted", label: "Converted" },
]

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const SELECT_CLASS_NAME =
  "border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px]"

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function QuotationStatusBadge({ label, status }: Readonly<{ label: string; status: string }>) {
  const className = cn(
    "rounded-full px-3 font-normal",
    status === "accepted" && "bg-emerald-50 text-emerald-600",
    status === "sent" && "bg-blue-50 text-blue-600",
    status === "draft" && "bg-zinc-100 text-zinc-600",
    status === "expired" && "bg-zinc-200 text-zinc-500",
    status === "converted" && "bg-violet-100 text-violet-600",
    status === "rejected" && "bg-red-100 text-red-600",
  )
  return (
    <Badge variant="neutral" className={className}>
      {label}
    </Badge>
  )
}

/**
 * The API only counts `days_left` for a quotation it has already sent, so this
 * column has to read the lapsed state off `validity_date` itself — see
 * `lib/utils/quotation-validity.ts`. Gating the chip on `days_left` hid it from
 * every draft, which is exactly the row the warning matters most on.
 */
function ValidityCell({ quotation }: Readonly<{ quotation: QuotationListItem }>) {
  const validity = getQuotationValidity(quotation)

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs">{quotation.validity_date}</span>
      {validity.isExpired ? (
        <span
          className="flex items-center gap-1 text-xs font-medium text-brand-danger"
          title={validity.label}
        >
          <AlertTriangle className="size-3.5" strokeWidth={1.75} aria-hidden />
          Expired
        </span>
      ) : null}
    </div>
  )
}

function QuotationActions({
  quotation,
  onOpen,
}: Readonly<{ quotation: QuotationListItem; onOpen: () => void }>) {
  const copy = (value: string) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(value).catch(() => {})
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${quotation.number}`}
          className="text-content-tertiary"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(quotation.number)}>
          <Copy aria-hidden />
          Copy quotation number
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function QuotationsTable({
  quotations,
  customerSalespeopleByName,
  onSelectQuotation,
}: Readonly<{
  quotations: QuotationListItem[]
  customerSalespeopleByName: ReadonlyMap<string, string>
  onSelectQuotation: (id: string) => void
}>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[1260px] table-fixed">
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[160px] px-5">Quotation #</TableHead>
            <TableHead className="w-[280px]">Customer</TableHead>
            <TableHead className="w-[150px] text-right">Total</TableHead>
            <TableHead className="w-[190px]">Validity Date</TableHead>
            <TableHead className="w-[160px]">Status</TableHead>
            <TableHead className="w-[190px]">Salesperson</TableHead>
            <TableHead className="w-[72px] px-5 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.length ? (
            quotations.map((quotation) => (
              <TableRow
                key={quotation.id}
                className="h-16 cursor-pointer"
                onClick={() => onSelectQuotation(quotation.id)}
              >
                <TableCell className="px-5 py-3 font-mono text-[13px] font-medium text-content-primary">
                  {quotation.number}
                </TableCell>
                <TableCell className="truncate py-3 font-medium text-content-primary">
                  {quotation.customer_name}
                </TableCell>
                <TableCell className="py-3 text-right font-bold text-content-primary">
                  {formatCurrency(quotation.grand_total)}
                </TableCell>
                <TableCell className="py-3">
                  <ValidityCell quotation={quotation} />
                </TableCell>
                <TableCell className="py-3">
                  <QuotationStatusBadge status={quotation.status} label={quotation.status_label} />
                </TableCell>
                <TableCell className="truncate py-3 text-xs text-content-secondary">
                  {customerSalespeopleByName.get(
                    (quotation.customer_name ?? "").trim().toLocaleLowerCase()
                  ) ??
                    quotation.salesperson_name}
                </TableCell>
                <TableCell
                  className="px-5 py-3 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <QuotationActions
                    quotation={quotation}
                    onOpen={() => onSelectQuotation(quotation.id)}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-content-tertiary">
                No quotations match the current filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function NewQuotationDialog({
  open,
  onOpenChange,
  onCreated,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}>) {
  const { data: customerDirectory = [] } = useCustomerDirectory({ enabled: open })
  const createQuotation = useCreateQuotation()
  const customers = customerDirectory.filter((customer) => customer.status === "active")
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("")
  const { data: selectedCustomer, isLoading: isCustomerLoading } = useCustomer(selectedCustomerId)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const validityDays = String(formData.get("validityDays") ?? "").trim()

    const payload: CreateQuotationPayload = {
      customer_id: String(formData.get("customer")),
      salesperson_id: selectedCustomer?.assigned_salesperson_id ?? "",
      quotation_date: String(formData.get("quotationDate") ?? "") || undefined,
      validity_days: validityDays ? Number.parseInt(validityDays, 10) : undefined,
      terms_and_conditions: String(formData.get("terms") ?? "").trim() || undefined,
    }

    createQuotation.mutate(payload, {
      onSuccess: (quotation) => {
        toast.success("Draft quotation created — add line items to begin.")
        setSelectedCustomerId("")
        onOpenChange(false)
        onCreated(quotation.id)
      },
      onError: (err) => toastMutationError(err, "Failed to create quotation"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Quotation</DialogTitle>
            <DialogDescription>
              Creates a draft — you&apos;ll add line items on the next screen.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">Customer</span>
              <select
                name="customer"
                className={SELECT_CLASS_NAME}
                required
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
              >
                <option value="" disabled>
                  Select a customer…
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">Salesperson</span>
              <Input
                value={
                  isCustomerLoading
                    ? "Loading assigned salesperson…"
                    : selectedCustomer?.assigned_salesperson_name ??
                      "Select a customer first"
                }
                readOnly
                aria-label="Customer's assigned salesperson"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">Quotation date</span>
              <Input name="quotationDate" type="date" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">Validity (days)</span>
              <Input name="validityDays" type="number" min="1" placeholder="Uses default" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">
                Terms &amp; conditions
              </span>
              <textarea
                name="terms"
                rows={2}
                className="border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                createQuotation.isPending ||
                isCustomerLoading ||
                !selectedCustomer?.assigned_salesperson_id
              }
            >
              {createQuotation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              Create Quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function QuotationsListView({
  onSelectQuotation,
}: Readonly<{ onSelectQuotation: (id: string) => void }>) {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [activeTab, setActiveTab] = React.useState<QuotationTab>("all")
  const [salespersonFilter, setSalespersonFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [newQuotationOpen, setNewQuotationOpen] = React.useState(false)

  const handleTabChange = (tab: QuotationTab) => {
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

  const { data, isLoading, isError, refetch } = useQuotations({
    tab: activeTab,
    salesperson_id: salespersonFilter === "all" ? undefined : salespersonFilter,
    q: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })
  const { data: salespeople = [] } = useActiveSalespeople()
  const { data: customerDirectory = [] } = useCustomerDirectory()
  const exportQuotations = useExportQuotations()
  const { can } = usePermissions()

  const quotations = data?.data ?? []
  const meta = data?.meta
  const customerSalespeopleByName = React.useMemo(
    () =>
      new Map(
        customerDirectory.map((customer) => [
          customer.name.trim().toLocaleLowerCase(),
          customer.assigned_salesperson_name,
        ] as const)
      ),
    [customerDirectory]
  )

  const handleExport = () => {
    exportQuotations.mutate(
      {
        format: "csv",
        scope: "filtered",
        filters: {
          tab: activeTab,
          salesperson_id: salespersonFilter === "all" ? undefined : salespersonFilter,
          q: debouncedSearch || undefined,
        },
      },
      {
        onSuccess: (url) => window.open(url, "_blank"),
        onError: (err) => toastMutationError(err, "Failed to export quotations"),
      },
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by quotation # or customer…"
            aria-label="Search quotations"
            className="h-10 rounded-[10px] pl-10 shadow-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10 rounded-[10px] px-4">
                <ListFilter strokeWidth={1.75} aria-hidden />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Salesperson</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={salespersonFilter} onValueChange={handleSalespersonChange}>
                <DropdownMenuRadioItem value="all">All salespeople</DropdownMenuRadioItem>
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
              disabled={exportQuotations.isPending}
            >
              {exportQuotations.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download strokeWidth={1.75} aria-hidden />
              )}
              Export
            </Button>
          ) : null}
          {can.write(SALES_RESOURCES.quotation) ? (
            <Button
              type="button"
              variant="primary"
              className="h-10 rounded-[10px] px-4"
              onClick={() => setNewQuotationOpen(true)}
            >
              <Plus strokeWidth={1.75} aria-hidden />
              New Quotation
            </Button>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Quotation status"
        className="flex w-full shrink-0 items-center overflow-x-auto border-b border-stroke-default"
      >
        {QUOTATION_TABS.map((tab) => {
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
                selected && "text-brand-primary after:bg-brand-primary",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "flex min-w-6 items-center justify-center rounded-full bg-surface-hover px-1.5 py-0.5 text-xs font-semibold text-content-tertiary",
                  selected && "bg-brand-primary/10 text-brand-primary",
                )}
              >
                {meta?.tabs[tab.value] ?? 0}
              </span>
            </button>
          )
        })}
      </nav>

      {isLoading ? (
        <SalesPageSpinner />
      ) : isError ? (
        <SalesErrorState message="Failed to load quotations." onRetry={() => void refetch()} />
      ) : (
        <>
          <QuotationsTable
            quotations={quotations}
            customerSalespeopleByName={customerSalespeopleByName}
            onSelectQuotation={onSelectQuotation}
          />
          {meta ? (
            <SalesTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="quotations"
            />
          ) : null}
        </>
      )}

      <NewQuotationDialog
        open={newQuotationOpen}
        onOpenChange={setNewQuotationOpen}
        onCreated={onSelectQuotation}
      />
    </div>
  )
}
