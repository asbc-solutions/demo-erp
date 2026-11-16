"use client"

import * as React from "react"
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
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
import { Textarea } from "@/src/shared/components/ui/textarea"
import { cn } from "@/src/shared/lib/utils/utils"

import { SalesErrorState, toastMutationError } from "../../components/shared/sales-error-state"
import { SalesPageSpinner, SalesSectionSpinner } from "../../components/shared/sales-loading"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { SALES_RESOURCES } from "../../lib/constants/permissions"
import { useCompanyProfile } from "../../lib/queries/company-profile"
import { useSalesSettings, useNumberingPreview } from "../../lib/queries/settings"
import { useTermsTemplates } from "../../lib/queries/terms-templates"
import { useUpdateCompanyProfile, useUploadCompanyLogo } from "../../lib/mutations/company-profile"
import { useUpdateSalesSettings } from "../../lib/mutations/settings"
import {
  useCreateTermsTemplate,
  useDeleteTermsTemplate,
  useUpdateTermsTemplate,
} from "../../lib/mutations/terms-templates"
import { useCompanyLogoUrl } from "../../lib/queries/company-profile"
import type {
  CompanyProfile,
  CreateTermsTemplatePayload,
  SalesSettings,
  TaxMode,
  TermsTemplate,
  TermsTemplateAppliesTo,
} from "../../lib/types"
import { SalespeopleSection } from "./salespeople-section"
import { SettingsSection } from "./settings-section"

function FieldLabel({
  htmlFor,
  children,
}: Readonly<{ htmlFor?: string; children: React.ReactNode }>) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[13px] leading-[18px] font-medium text-content-secondary"
    >
      {children}
    </Label>
  )
}

function CompactSwitch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: Readonly<{
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-brand-primary/30 relative inline-flex h-[21px] w-9 shrink-0 cursor-pointer rounded-full border border-transparent shadow-xs outline-none transition-colors focus-visible:ring-[3px]",
        checked ? "bg-brand-primary" : "bg-content-lightest",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "bg-surface-white pointer-events-none absolute top-px inset-s-px size-[17px] rounded-full shadow-sm transition-transform",
          checked && "translate-x-[15px]",
        )}
      />
    </button>
  )
}

function NumberingRow({
  id,
  label,
  value,
  onChange,
  preview,
}: Readonly<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  preview: string
}>) {
  return (
    <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_182px]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-[9px] font-mono text-[15px]"
        />
      </div>
      <div className="border-stroke-light bg-[#f1f5f9] flex min-h-10 flex-col justify-center gap-0.5 rounded-[9px] border px-3 py-2 dark:bg-surface-hover">
        <span className="text-[10px] leading-4 font-semibold tracking-[0.6px] text-content-quaternary uppercase">
          Next number (saved format)
        </span>
        <span className="font-mono text-[15px] leading-[23px] font-medium text-content-primary">
          {preview}
        </span>
      </div>
    </div>
  )
}

const APPLIES_TO_LABEL: Record<TermsTemplateAppliesTo, string> = {
  quotation: "Quotation",
  order: "Order",
  invoice: "Invoice",
  all: "All Documents",
}

function TermsTemplateDialog({
  open,
  onOpenChange,
  template,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TermsTemplate | null
}>) {
  const createTemplate = useCreateTermsTemplate()
  const updateTemplate = useUpdateTermsTemplate()
  const isPending = createTemplate.isPending || updateTemplate.isPending

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload: CreateTermsTemplatePayload = {
      name: String(formData.get("name") ?? "").trim(),
      applies_to: String(formData.get("appliesTo")) as TermsTemplateAppliesTo,
      body_en: String(formData.get("bodyEn") ?? "").trim() || undefined,
      body_ar: String(formData.get("bodyAr") ?? "").trim() || undefined,
      is_default: formData.get("isDefault") === "on",
      is_active: formData.get("isActive") === "on",
    }

    const onSettled = {
      onSuccess: () => {
        toast.success(template ? "Template updated" : "Template created")
        onOpenChange(false)
      },
      onError: (err: unknown) => toastMutationError(err, "Failed to save template"),
    }

    if (template) {
      updateTemplate.mutate({ id: template.id, payload }, onSettled)
    } else {
      createTemplate.mutate(payload, onSettled)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{template ? "Edit Template" : "New Terms Template"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">Name</span>
              <Input name="name" defaultValue={template?.name} required autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-content-secondary">Applies to</span>
              <select
                name="appliesTo"
                defaultValue={template?.applies_to ?? "all"}
                className="border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px]"
              >
                {Object.entries(APPLIES_TO_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm text-content-secondary">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={template?.is_active ?? true}
                  className="size-4 rounded border-stroke-default accent-brand-primary"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-content-secondary">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={template?.is_default ?? false}
                  className="size-4 rounded border-stroke-default accent-brand-primary"
                />
                Default
              </label>
            </div>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">Terms (English)</span>
              <Textarea name="bodyEn" defaultValue={template?.body_en ?? ""} />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-content-secondary">Terms (Arabic)</span>
              <Textarea name="bodyAr" defaultValue={template?.body_ar ?? ""} dir="rtl" />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {template ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TermsTemplatesSection() {
  const { data: templates, isLoading, isError, refetch } = useTermsTemplates()
  const deleteTemplate = useDeleteTermsTemplate()
  const [dialogState, setDialogState] = React.useState<{ open: boolean; template: TermsTemplate | null }>({
    open: false,
    template: null,
  })
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const { can } = usePermissions()

  const handleDelete = () => {
    if (!deletingId) return
    deleteTemplate.mutate(deletingId, {
      onSuccess: () => {
        toast.success("Template deleted")
        setDeletingId(null)
      },
      onError: (err) => {
        toastMutationError(err, "Failed to delete template")
        setDeletingId(null)
      },
    })
  }

  return (
    <SettingsSection title="Terms & Conditions Templates">
      <div className="flex max-w-[1072px] flex-col gap-4">
        {isLoading ? (
          <SalesSectionSpinner />
        ) : isError ? (
          <SalesErrorState message="Failed to load templates." onRetry={() => void refetch()} />
        ) : (
          <div className="flex flex-col divide-y divide-stroke-light rounded-lg border border-stroke-light">
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-content-primary">{template.name}</span>
                      <Badge variant="neutral" className="rounded-full font-normal">
                        {template.applies_to_label}
                      </Badge>
                      {template.is_default ? (
                        <Badge variant="success" className="rounded-full font-normal">
                          Default
                        </Badge>
                      ) : null}
                      {!template.is_active ? (
                        <Badge variant="neutral" className="rounded-full font-normal opacity-70">
                          Inactive
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-content-tertiary">
                      {template.body_en || template.body_ar || "No terms text."}
                    </p>
                  </div>
                  {can.write(SALES_RESOURCES.settings) ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => setDialogState({ open: true, template })}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${template.name}`}
                        className="text-brand-danger"
                        onClick={() => setDeletingId(template.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-xs text-content-tertiary">
                No terms templates yet.
              </p>
            )}
          </div>
        )}

        {can.write(SALES_RESOURCES.settings) ? (
          <Button
            type="button"
            variant="secondary"
            className="w-fit"
            onClick={() => setDialogState({ open: true, template: null })}
          >
            <Plus aria-hidden />
            Add Template
          </Button>
        ) : null}
      </div>

      <TermsTemplateDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
        template={dialogState.template}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>Delete template?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <div className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteTemplate.isPending}
              onClick={(event) => {
                event.preventDefault()
                handleDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}

function CompanyProfileSection({ profile }: Readonly<{ profile: CompanyProfile }>) {
  const [name, setName] = React.useState(profile.company_name)
  const [taxNumber, setTaxNumber] = React.useState(profile.company_tax_number)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const updateProfile = useUpdateCompanyProfile()
  const uploadLogo = useUploadCompanyLogo()
  const { data: logoUrl } = useCompanyLogoUrl(profile.has_logo)
  const { can } = usePermissions()

  const handleSave = () => {
    updateProfile.mutate(
      { company_name: name, company_tax_number: taxNumber },
      {
        onSuccess: () => toast.success("Company profile saved"),
        onError: (err) => toastMutationError(err, "Failed to save company profile"),
      },
    )
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    uploadLogo.mutate(file, {
      onSuccess: () => toast.success("Logo uploaded"),
      onError: (err) => toastMutationError(err, "Failed to upload logo"),
    })
    event.target.value = ""
  }

  return (
    <SettingsSection title="Company Profile">
      <div className="flex max-w-[1072px] flex-col gap-[18px]">
        <div className="grid gap-[18px] sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="company-name">Company Name</FieldLabel>
            <Input
              id="company-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 rounded-[9px] text-[15px]"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="company-tax-number">Tax Number</FieldLabel>
            <Input
              id="company-tax-number"
              value={taxNumber}
              onChange={(event) => setTaxNumber(event.target.value)}
              className="h-10 rounded-[9px] text-[15px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dynamic signed URL, not a static asset
            <img
              src={logoUrl}
              alt="Company logo"
              className="size-16 rounded-lg border border-stroke-light object-contain"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg border border-dashed border-stroke-light text-[10px] text-content-quaternary">
              No logo
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploadLogo.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadLogo.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload aria-hidden />
              )}
              Upload Logo
            </Button>
            <span className="text-[11px] text-content-quaternary">
              PNG, JPG, or SVG — max 2MB.
            </span>
          </div>
        </div>

        {can.write(SALES_RESOURCES.settings) ? (
          <div>
            <Button type="button" variant="primary" disabled={updateProfile.isPending} onClick={handleSave}>
              {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save Company Profile
            </Button>
          </div>
        ) : null}
      </div>
    </SettingsSection>
  )
}

function GeneralSettingsForm({ settings }: Readonly<{ settings: SalesSettings }>) {
  const [quotationFormat, setQuotationFormat] = React.useState(settings.quotation_number_format)
  const [salesOrderFormat, setSalesOrderFormat] = React.useState(settings.order_number_format)
  const [invoiceFormat, setInvoiceFormat] = React.useState(settings.invoice_number_format)
  const [taxRate, setTaxRate] = React.useState(String(settings.default_tax_rate))
  const [taxMode, setTaxMode] = React.useState<TaxMode>(settings.tax_mode)
  const [validity, setValidity] = React.useState(String(settings.default_validity_days))
  const [autoExpire, setAutoExpire] = React.useState(settings.auto_expire_quotations)

  const { data: preview } = useNumberingPreview()
  const updateSettings = useUpdateSalesSettings()
  const { can } = usePermissions()

  const handleSave = () => {
    updateSettings.mutate(
      {
        quotation_number_format: quotationFormat,
        order_number_format: salesOrderFormat,
        invoice_number_format: invoiceFormat,
        default_tax_rate: Number.parseFloat(taxRate) || 0,
        tax_mode: taxMode,
        default_validity_days: Number.parseInt(validity, 10) || 0,
        auto_expire_quotations: autoExpire,
      },
      {
        onSuccess: () => toast.success("Sales settings saved"),
        onError: (err) => toastMutationError(err, "Failed to save sales settings"),
      },
    )
  }

  return (
    <>
      <SettingsSection title="Document Numbering">
        <div className="flex max-w-[1072px] flex-col gap-[18px]">
          <NumberingRow
            id="quotation-format"
            label="Quotation Format"
            value={quotationFormat}
            onChange={setQuotationFormat}
            preview={preview?.quotation ?? "—"}
          />
          <NumberingRow
            id="sales-order-format"
            label="Sales Order Format"
            value={salesOrderFormat}
            onChange={setSalesOrderFormat}
            preview={preview?.order ?? "—"}
          />
          <NumberingRow
            id="invoice-format"
            label="Invoice Format"
            value={invoiceFormat}
            onChange={setInvoiceFormat}
            preview={preview?.invoice ?? "—"}
          />
          <p className="text-xs leading-[18px] text-content-tertiary">
            Tokens: {"{YYYY}"} = year, {"{####}"} = zero-padded sequence. Preview is the
            next number under the currently saved format (advisory only).
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="Tax Configuration">
        <div className="grid max-w-[1072px] gap-[18px] sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="default-tax-rate">Default Tax Rate (%)</FieldLabel>
            <Input
              id="default-tax-rate"
              type="number"
              min="0"
              max="100"
              value={taxRate}
              onChange={(event) => setTaxRate(event.target.value)}
              className="h-10 rounded-[9px] text-[15px]"
            />
          </div>
          <div className="flex flex-col items-start gap-1.5">
            <FieldLabel>Tax Mode</FieldLabel>
            <Select value={taxMode} onValueChange={(value) => setTaxMode(value as TaxMode)}>
              <SelectTrigger
                aria-label="Tax Mode"
                className="h-10 w-auto min-w-[138px] rounded-[9px] text-[14px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Tax Exclusive</SelectItem>
                <SelectItem value="inclusive">Tax Inclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Quotation Validity">
        <div className="flex max-w-[1072px] flex-col gap-[18px]">
          <div className="flex max-w-[364px] flex-col gap-1.5">
            <FieldLabel htmlFor="default-validity">Default Validity (days)</FieldLabel>
            <Input
              id="default-validity"
              type="number"
              min="1"
              value={validity}
              onChange={(event) => setValidity(event.target.value)}
              className="h-10 rounded-[9px] text-[15px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <CompactSwitch
              checked={autoExpire}
              onCheckedChange={setAutoExpire}
              label="Auto-expire quotations past validity"
            />
            <span className="text-[15px] leading-[23px] font-medium text-content-secondary">
              Auto-expire quotations past validity
            </span>
          </div>
        </div>
      </SettingsSection>

      {can.write(SALES_RESOURCES.settings) ? (
        <div>
          <Button type="button" variant="primary" disabled={updateSettings.isPending} onClick={handleSave}>
            {updateSettings.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Save Changes
          </Button>
        </div>
      ) : null}
    </>
  )
}

export function SalesSettingsModule() {
  const settingsQuery = useSalesSettings()
  const companyProfileQuery = useCompanyProfile()

  if (settingsQuery.isLoading || companyProfileQuery.isLoading) {
    return <SalesPageSpinner />
  }

  if (settingsQuery.isError || !settingsQuery.data || companyProfileQuery.isError || !companyProfileQuery.data) {
    return (
      <SalesErrorState
        message="Failed to load sales settings."
        onRetry={() => {
          void settingsQuery.refetch()
          void companyProfileQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="bg-surface-page flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <GeneralSettingsForm settings={settingsQuery.data} />
      <CompanyProfileSection profile={companyProfileQuery.data} />
      <SalespeopleSection />
      <TermsTemplatesSection />

      <SettingsSection title="Discount Rules" unavailableNote="Not yet available from backend">
        <div className="flex max-w-[509px] flex-col gap-[18px] opacity-60">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="max-discount">Max Discount % before approval</FieldLabel>
            <Input id="max-discount" type="number" min="0" max="100" value="15" disabled />
            <p className="text-xs leading-[22px] text-content-tertiary">
              No backend endpoint exists yet to configure the discount-approval matrix
              (see docs/sales.md §4.7) — this section is a preview of the intended UI.
            </p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Approval Workflows" unavailableNote="Not yet available from backend">
        <div className="flex max-w-[1072px] flex-col gap-[18px] opacity-60">
          <div className="flex items-center gap-3">
            <CompactSwitch checked disabled onCheckedChange={() => {}} label="Require manager approval for over-limit discounts" />
            <span className="text-[15px] leading-[23px] font-medium text-content-secondary">
              Require manager approval for over-limit discounts
            </span>
          </div>
          <div className="flex max-w-[509px] flex-col gap-1.5">
            <FieldLabel>Approver role / person</FieldLabel>
            <Select value="Sales Manager" disabled>
              <SelectTrigger aria-label="Approver role or person" className="h-10 rounded-[9px] text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}
