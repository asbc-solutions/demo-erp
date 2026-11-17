"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
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
import { cn } from "@/src/shared/lib/utils/utils"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useCreateDocument } from "../../lib/mutations/documents"
import {
  uploadDocumentSchema,
  DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  type UploadDocumentFormValues,
} from "../../lib/schema/document"
import type { EmployeeListItem } from "../../lib/types"

type UploadDocumentDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: EmployeeListItem[]
  employeesLoading?: boolean
}>

const DEFAULT_VALUES: UploadDocumentFormValues = {
  document_type: "passport",
  document_category: "identity",
  document_title: "",
  is_mandatory: false,
}

/** The shared schema carries English messages; map the known ones to keys for display. */
const SCHEMA_ERROR_KEYS = {
  "Date must be YYYY-MM-DD": "errorDateFormat",
  "Document type is required": "errorTypeRequired",
  "Category is required": "errorCategoryRequired",
  "Document title is required": "errorTitleRequired",
  "Must be at least 1 day": "errorAlertDaysMin",
  "Expiry date must be after issue date": "errorExpiryAfterIssue",
} as const

function isSchemaErrorMessage(
  message: string,
): message is keyof typeof SCHEMA_ERROR_KEYS {
  return message in SCHEMA_ERROR_KEYS
}

function apiErrorDescription(err: unknown, fallback: string) {
  const apiErr = err as ApiError
  const fields = apiErr.details?.fields as Record<string, string[]> | undefined
  if (fields) {
    return Object.entries(fields)
      .map(([f, msgs]) => `${f.replace(/_/g, " ")}: ${msgs[0]}`)
      .join(" | ")
  }
  return apiErr.message ?? fallback
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  employees,
  employeesLoading = false,
}: UploadDocumentDialogProps) {
  const t = useTranslations("HrDocuments")
  const tCommon = useTranslations("Common")
  const createDocument = useCreateDocument()
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const [fileError, setFileError] = React.useState("")

  const form = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form

  const isMandatory = watch("is_mandatory")
  const selectedType = watch("document_type")
  const selectedCategory = watch("document_category")

  const errorText = (message?: string) =>
    message && isSchemaErrorMessage(message)
      ? t(SCHEMA_ERROR_KEYS[message])
      : message

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      reset(DEFAULT_VALUES)
      setSelectedEmployeeId("")
      setFile(null)
      setFileError("")
      setDragActive(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const onFile = (f: File | null) => {
    setFile(f)
    if (f) setFileError("")
  }

  const onSubmit = (values: UploadDocumentFormValues) => {
    if (!selectedEmployeeId) {
      toast.error(t("selectEmployeeRequired"))
      return
    }

    if (!file) {
      setFileError(t("fileRequired"))
      return
    }

    const payload = {
      document_type: values.document_type,
      document_category: values.document_category,
      document_title: values.document_title,
      ...(values.document_number ? { document_number: values.document_number } : {}),
      ...(values.issuing_authority ? { issuing_authority: values.issuing_authority } : {}),
      ...(values.issuing_country ? { issuing_country: values.issuing_country } : {}),
      ...(values.issue_date ? { issue_date: values.issue_date } : {}),
      ...(values.expiry_date ? { expiry_date: values.expiry_date } : {}),
      ...(values.alert_days_before !== undefined
        ? { alert_days_before: values.alert_days_before }
        : {}),
      is_mandatory: values.is_mandatory,
      document: file,
    }

    createDocument.mutate(
      { employeeId: selectedEmployeeId, payload },
      {
        onSuccess: (doc) => {
          toast.success(t("uploaded"), {
            description: doc.document_title,
          })
          handleOpenChange(false)
        },
        onError: (err) => {
          toast.error(t("uploadFailed"), {
            description: apiErrorDescription(err, t("checkDetailsRetry")),
          })
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-6"
          noValidate
        >
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-base font-semibold text-content-primary">
              {t("uploadDocument")}
            </DialogTitle>
            <p className="text-content-quaternary text-sm leading-5">
              {t("uploadDescription")}
            </p>
          </div>

          {/* Employee */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-semibold text-content-primary">
              {t("colEmployee")} <span className="text-brand-danger">*</span>
            </Label>
            <Select
              value={selectedEmployeeId || undefined}
              onValueChange={setSelectedEmployeeId}
              disabled={employeesLoading || employees.length === 0}
            >
              <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-sm shadow-xs">
                <SelectValue
                  placeholder={
                    employeesLoading ? t("loadingEmployees") : t("selectEmployee")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name} ({e.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type + Category */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-content-primary">
                {t("documentTypeLabel")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedType}
                onValueChange={(v) =>
                  setValue("document_type", v as UploadDocumentFormValues["document_type"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-[11px] shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-sm">
                      {t(`documentType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-content-primary">
                {t("categoryLabel")} <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(v) =>
                  setValue("document_category", v as UploadDocumentFormValues["document_category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-9 rounded-md border-stroke-default bg-surface-white text-[11px] shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">
                      {t(`documentCategory.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="doc-title"
              className="text-[11px] font-semibold text-content-primary"
            >
              {t("documentTitle")} <span className="text-brand-danger">*</span>
            </Label>
            <Input
              id="doc-title"
              {...register("document_title")}
              placeholder={t("documentTitlePlaceholder")}
              className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
            />
            {errors.document_title && (
              <p className="text-xs text-brand-danger">
                {errorText(errors.document_title.message)}
              </p>
            )}
          </div>

          {/* Number + Country */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="doc-number"
                className="text-[11px] font-semibold text-content-primary"
              >
                {t("documentNumber")}
              </Label>
              <Input
                id="doc-number"
                {...register("document_number")}
                placeholder="P-12345"
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="doc-country"
                className="text-[11px] font-semibold text-content-primary"
              >
                {t("issuingCountry")}
              </Label>
              <Input
                id="doc-country"
                {...register("issuing_country")}
                placeholder="EG"
                maxLength={2}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-sm uppercase"
              />
            </div>
          </div>

          {/* Issue + Expiry */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="doc-issue"
                className="text-[11px] font-semibold text-content-primary"
              >
                {t("issueDate")}
              </Label>
              <Input
                id="doc-issue"
                type="date"
                {...register("issue_date")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-[11px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="doc-expiry"
                className="text-[11px] font-semibold text-content-primary"
              >
                {t("expiryDate")}
              </Label>
              <Input
                id="doc-expiry"
                type="date"
                {...register("expiry_date")}
                className="h-9 rounded-md border-stroke-default bg-surface-white text-[11px]"
              />
              {errors.expiry_date && (
                <p className="text-xs text-brand-danger">
                  {errorText(errors.expiry_date.message)}
                </p>
              )}
            </div>
          </div>

          {/* Mandatory */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="doc-mandatory"
              checked={isMandatory}
              onCheckedChange={(v) =>
                setValue("is_mandatory", v === true, { shouldValidate: true })
              }
            />
            <Label
              htmlFor="doc-mandatory"
              className="cursor-pointer text-[11px] font-semibold text-content-primary"
            >
              {t("mandatoryDocument")}
            </Label>
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                onFile(e.dataTransfer.files?.[0] ?? null)
              }}
              className={cn(
                "border-stroke-default flex flex-col items-center gap-1 rounded-md border border-dashed p-5 transition-colors",
                dragActive && "bg-brand-primary/5 border-brand-primary/40",
                fileError && "border-brand-danger/50"
              )}
            >
              <Upload className="text-content-tertiary size-6" strokeWidth={1.5} />
              <p className="text-content-quaternary text-center text-[11px]">
                {t("dropzone")}
              </p>
              <p className="text-content-quaternary text-center text-[10px]">
                {t("dropzoneHint")}
              </p>
              {file && (
                <p className="text-content-primary mt-1 truncate text-xs font-medium">
                  {file.name}
                </p>
              )}
            </button>
            {fileError && (
              <p className="text-xs text-brand-danger">{fileError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-md border-stroke-default bg-surface-white px-3.5 text-[11px] font-semibold text-content-primary"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createDocument.isPending}
              className="h-9 rounded-md px-3.5 text-[11px] font-semibold disabled:opacity-50"
            >
              {createDocument.isPending ? t("uploading") : tCommon("upload")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
