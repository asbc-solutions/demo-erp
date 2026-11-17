"use client"

import * as React from "react"
import { Check, ListFilter, Loader2, Package, Plus, Search, Settings2 } from "lucide-react"
import { useTranslations } from "next-intl"
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

import { SalesErrorState, useToastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner } from "../../components/shared/sales-loading"
import { SalesTablePagination } from "../../components/shared/sales-table-pagination"
import { formatCurrency } from "../../lib/utils/currency"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useAdjustStock, useCreateProduct } from "../../lib/mutations/products"
import { useProducts } from "../../lib/queries/products"
import type {
  CreateProductPayload,
  ProductListItem,
  ProductType,
  StockStatus,
} from "../../lib/types"

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const SELECT_CLASS_NAME =
  "border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px]"

const TYPE_FILTERS = [
  { value: "all", labelKey: "allTypes" },
  { value: "product", labelKey: "typeProduct" },
  { value: "service", labelKey: "typeService" },
] as const satisfies readonly { value: ProductType | "all"; labelKey: string }[]

const ACTIVE_FILTERS = [
  { value: "all", labelKey: "allStatuses" },
  { value: "active", labelKey: "active" },
  { value: "inactive", labelKey: "inactive" },
] as const satisfies readonly { value: "all" | "active" | "inactive"; labelKey: string }[]

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function StockStatusBadge({ status }: Readonly<{ status: StockStatus }>) {
  const tShared = useTranslations("SalesShared")
  const label = tShared(`stockStatus.${status}`)

  if (status === "out_of_stock") {
    return (
      <Badge variant="danger" className="rounded-full bg-red-100 px-3 font-normal text-red-600">
        {label}
      </Badge>
    )
  }
  if (status === "low_stock") {
    return (
      <Badge variant="warning" className="rounded-full bg-amber-50 px-3 font-normal text-amber-600">
        {label}
      </Badge>
    )
  }
  return (
    <Badge variant="success" className="rounded-full bg-emerald-50 px-3 font-normal text-emerald-600">
      {label}
    </Badge>
  )
}

function AdjustStockDialog({
  open,
  onOpenChange,
  product,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductListItem | null
}>) {
  const t = useTranslations("SalesProducts")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const [delta, setDelta] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [deltaError, setDeltaError] = React.useState<string | null>(null)
  const adjustStock = useAdjustStock()

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDelta("")
      setReason("")
      setDeltaError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product) return
    const deltaValue = Number.parseFloat(delta)
    if (!deltaValue) return
    if (product.stock_on_hand + deltaValue < 0) {
      setDeltaError(t("stockNegative"))
      return
    }

    setDeltaError(null)

    adjustStock.mutate(
      { id: product.id, payload: { delta: deltaValue, reason } },
      {
        onSuccess: (result) => {
          toast.success(t("stockUpdatedToast", { stock: result.stock_on_hand }))
          handleOpenChange(false)
        },
        onError: (err) => toastMutationError(err, t("adjustStockFailed")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("adjustStockTitle", { name: product?.name ?? "" })}</DialogTitle>
            <DialogDescription>
              {t("adjustStockDescription", { stock: product?.stock_on_hand ?? 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{t("delta")}</span>
              <Input
                type="number"
                value={delta}
                onChange={(event) => {
                  setDelta(event.target.value)
                  setDeltaError(null)
                }}
                placeholder={t("deltaPlaceholder")}
                required
                autoFocus
                aria-invalid={!!deltaError}
                aria-describedby={deltaError ? "adjust-stock-delta-error" : undefined}
              />
              {deltaError ? (
                <span id="adjust-stock-delta-error" className="text-xs text-brand-danger">
                  {deltaError}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{t("reason")}</span>
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("reasonPlaceholder")}
                required
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!Number.parseFloat(delta) || !reason.trim() || adjustStock.isPending}
            >
              {adjustStock.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Settings2 aria-hidden />
              )}
              {t("adjustStock")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NewProductDialog({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>) {
  const t = useTranslations("SalesProducts")
  const tCommon = useTranslations("Common")
  const toastMutationError = useToastMutationError()
  const createProduct = useCreateProduct()
  const [fieldErrors, setFieldErrors] = React.useState<{
    unitPrice?: string
    stockOnHand?: string
    lowStockThreshold?: string
  }>({})

  const handleOpenChange = (next: boolean) => {
    if (!next) setFieldErrors({})
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    const defaultTaxRate = String(formData.get("defaultTaxRate") ?? "").trim()
    const unitPrice = Number.parseFloat(String(formData.get("unitPrice") ?? "0"))
    const stockOnHand = Number.parseFloat(String(formData.get("stockOnHand") ?? "0"))
    const lowStockThreshold = Number.parseFloat(
      String(formData.get("lowStockThreshold") ?? "0")
    )
    const trackStock = formData.get("trackStock") === "on"
    const nextErrors: typeof fieldErrors = {}

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      nextErrors.unitPrice = t("unitPricePositive")
    }
    if (trackStock) {
      // A zero threshold makes "Low Stock" unreachable: the status is only raised
      // *below* the threshold, so stock would jump straight from Out of Stock at 0
      // to In Stock at 1, and the alert would never fire.
      const thresholdValid = Number.isFinite(lowStockThreshold) && lowStockThreshold > 0
      if (!thresholdValid) {
        nextErrors.lowStockThreshold = t("thresholdPositive")
      }
      if (
        !Number.isFinite(stockOnHand) ||
        (thresholdValid && stockOnHand <= lowStockThreshold)
      ) {
        nextErrors.stockOnHand = t("stockAboveThreshold")
      }
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    const payload: CreateProductPayload = {
      name: String(formData.get("name") ?? "").trim(),
      sku: String(formData.get("sku") ?? "").trim() || undefined,
      type: String(formData.get("type")) as ProductType,
      default_unit_price: unitPrice,
      default_tax_rate: defaultTaxRate ? Number.parseFloat(defaultTaxRate) : undefined,
      track_stock: trackStock,
      stock_on_hand: stockOnHand,
      low_stock_threshold: lowStockThreshold,
    }

    createProduct.mutate(payload, {
      onSuccess: () => {
        toast.success(t("addedToast"))
        form.reset()
        handleOpenChange(false)
      },
      onError: (err) => toastMutationError(err, t("createFailed")),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("newProduct")}</DialogTitle>
            <DialogDescription>
              {t("newProductDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">{tCommon("name")}</span>
              <Input name="name" placeholder={t("namePlaceholder")} required autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{t("sku")}</span>
              <Input name="sku" placeholder={t("skuPlaceholder")} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">{tCommon("type")}</span>
              <select name="type" className={SELECT_CLASS_NAME} defaultValue="product">
                <option value="product">{t("typeProduct")}</option>
                <option value="service">{t("typeService")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {t("defaultUnitPrice")}
              </span>
              <Input
                name="unitPrice"
                type="number"
                step="0.01"
                defaultValue="0"
                required
                aria-invalid={!!fieldErrors.unitPrice}
                aria-describedby={fieldErrors.unitPrice ? "product-unit-price-error" : undefined}
                onChange={() =>
                  setFieldErrors((errors) => ({ ...errors, unitPrice: undefined }))
                }
              />
              {fieldErrors.unitPrice ? (
                <span id="product-unit-price-error" className="text-xs text-brand-danger">
                  {fieldErrors.unitPrice}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {t("defaultTaxRate")}
              </span>
              <Input name="defaultTaxRate" type="number" min="0" max="100" placeholder={t("taxRatePlaceholder")} />
            </label>
            {/* Spacing and grid placement live on the wrapper, not the label: a
                full-width label would make its padding and trailing whitespace a
                live toggle target for the checkbox. */}
            <div className="pt-6 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-content-secondary">
                <input
                  name="trackStock"
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded border-stroke-default accent-brand-primary"
                />
                {t("trackStock")}
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {t("initialStock")}
              </span>
              <Input
                name="stockOnHand"
                type="number"
                min="0"
                defaultValue="0"
                aria-invalid={!!fieldErrors.stockOnHand}
                aria-describedby={
                  fieldErrors.stockOnHand ? "product-stock-on-hand-error" : undefined
                }
                onChange={() =>
                  setFieldErrors((errors) => ({ ...errors, stockOnHand: undefined }))
                }
              />
              {fieldErrors.stockOnHand ? (
                <span id="product-stock-on-hand-error" className="text-xs text-brand-danger">
                  {fieldErrors.stockOnHand}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">
                {t("lowStockThreshold")}
              </span>
              {/* min="0" blocks negatives natively; the "> 0" rule is enforced in
                  handleSubmit so the inline message renders like the other fields
                  instead of a native tooltip that would preempt it. */}
              <Input
                name="lowStockThreshold"
                type="number"
                min="0"
                defaultValue="1"
                aria-invalid={!!fieldErrors.lowStockThreshold}
                aria-describedby={
                  fieldErrors.lowStockThreshold ? "product-low-stock-threshold-error" : undefined
                }
                onChange={() =>
                  setFieldErrors((errors) => ({ ...errors, lowStockThreshold: undefined }))
                }
              />
              {fieldErrors.lowStockThreshold ? (
                <span
                  id="product-low-stock-threshold-error"
                  className="text-xs text-brand-danger"
                >
                  {fieldErrors.lowStockThreshold}
                </span>
              ) : null}
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={createProduct.isPending}>
              {createProduct.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check aria-hidden />
              )}
              {t("addProduct")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProductsTable({
  products,
  onAdjustStock,
}: Readonly<{
  products: ProductListItem[]
  onAdjustStock: (product: ProductListItem) => void
}>) {
  const t = useTranslations("SalesProducts")
  const tCommon = useTranslations("Common")
  const tShared = useTranslations("SalesShared")

  return (
    <div className="overflow-hidden rounded-2xl border border-stroke-default bg-surface-white shadow-sm">
      <Table className="min-w-[1200px] table-fixed">
        <TableHeader className="bg-surface-white">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[320px] px-5">{t("product")}</TableHead>
            <TableHead className="w-[140px]">{t("sku")}</TableHead>
            <TableHead className="w-[110px]">{tCommon("type")}</TableHead>
            <TableHead className="w-[140px]">{t("unitPrice")}</TableHead>
            <TableHead className="w-[140px]">{t("stockOnHand")}</TableHead>
            <TableHead className="w-[140px]">{tCommon("status")}</TableHead>
            <TableHead className="w-[110px]">{t("active")}</TableHead>
            <TableHead className="w-[120px] px-5 text-end">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length ? (
            products.map((product) => (
              <TableRow key={product.id} className="h-[70px]">
                <TableCell className="px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-brand-primary">
                      <Package className="size-4" aria-hidden />
                    </span>
                    <span className="truncate font-semibold text-content-primary">
                      {product.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 font-mono text-xs text-content-secondary">
                  {product.sku || "—"}
                </TableCell>
                <TableCell className="py-3">{tShared(`productType.${product.type}`)}</TableCell>
                <TableCell className="py-3">{formatCurrency(product.default_unit_price)}</TableCell>
                <TableCell className="py-3">
                  {product.track_stock ? product.stock_on_hand : "—"}
                </TableCell>
                <TableCell className="py-3">
                  {product.track_stock ? (
                    <StockStatusBadge status={product.stock_status} />
                  ) : (
                    <span className="text-xs text-content-quaternary">{t("notTracked")}</span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    variant={product.is_active ? "success" : "neutral"}
                    className={cn(
                      "rounded-full px-3 font-normal",
                      product.is_active && "bg-emerald-50 text-emerald-600",
                    )}
                  >
                    {product.is_active ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3 text-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!product.track_stock}
                    onClick={() => onAdjustStock(product)}
                    className="whitespace-nowrap"
                  >
                    <Settings2 className="size-3.5" aria-hidden />
                    {t("adjustStock")}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-content-tertiary">
                {t("noMatches")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function ProductsModule() {
  const t = useTranslations("SalesProducts")
  const tCommon = useTranslations("Common")
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  const [typeFilter, setTypeFilter] = React.useState<ProductType | "all">("all")
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = React.useState(1)
  const [newProductOpen, setNewProductOpen] = React.useState(false)
  const [adjustingProduct, setAdjustingProduct] = React.useState<ProductListItem | null>(null)
  const { can } = usePermissions()

  const handleFilterChange = (updater: () => void) => {
    updater()
    setPage(1)
  }

  const { data, isLoading, isError, refetch } = useProducts({
    type: typeFilter === "all" ? undefined : typeFilter,
    is_active: activeFilter === "all" ? undefined : activeFilter === "active",
    search: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  })

  const products = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-[22px] overflow-auto bg-surface-page p-4 sm:p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 inset-s-3.5 size-[18px] -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) =>
              handleFilterChange(() => setSearch(event.target.value))
            }
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
              <DropdownMenuLabel>{tCommon("type")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={(value) =>
                  handleFilterChange(() => setTypeFilter(value as ProductType | "all"))
                }
              >
                {TYPE_FILTERS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{tCommon("status")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={activeFilter}
                onValueChange={(value) =>
                  handleFilterChange(() =>
                    setActiveFilter(value as "all" | "active" | "inactive"),
                  )
                }
              >
                {ACTIVE_FILTERS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {can.write(SALES_RESOURCES.product) ? (
            <Button
              type="button"
              variant="primary"
              className="h-10 rounded-[10px] px-4"
              onClick={() => setNewProductOpen(true)}
            >
              <Plus strokeWidth={1.75} aria-hidden />
              {t("newProduct")}
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <SalesPageSpinner />
      ) : isError ? (
        <SalesErrorState message={t("loadListFailed")} onRetry={() => void refetch()} />
      ) : (
        <>
          <ProductsTable products={products} onAdjustStock={setAdjustingProduct} />
          {meta ? (
            <SalesTablePagination
              page={meta.current_page}
              pageCount={meta.last_page}
              total={meta.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="products"
            />
          ) : null}
        </>
      )}

      <NewProductDialog open={newProductOpen} onOpenChange={setNewProductOpen} />
      <AdjustStockDialog
        open={adjustingProduct !== null}
        onOpenChange={(open) => !open && setAdjustingProduct(null)}
        product={adjustingProduct}
      />
    </div>
  )
}
