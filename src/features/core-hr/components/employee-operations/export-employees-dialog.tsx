"use client"

import { useState } from "react"
import { Download } from "lucide-react"
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
  RadioGroup,
  RadioGroupItem,
} from "@/src/shared/components/ui/radio-group"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  useExportEmployees,
  type EmployeeExportResult,
} from "../../lib/mutations/employees"
import type {
  EmployeeExportFormat,
  EmployeeExportScope,
  EmployeeListItem,
} from "../../lib/types"

type ExportFormat = EmployeeExportFormat
type ExportScope = EmployeeExportScope

type ExportEmployeesDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: EmployeeListItem[]
}>

type ColumnKey =
  | "name"
  | "employee_number"
  | "employment_type"
  | "employment_status"
  | "hire_date"
  | "department"

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "xlsx", label: "XLSX" },
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
]

function triggerDownload(result: EmployeeExportResult) {
  // Signed job URLs serve Content-Disposition: attachment themselves, so a
  // plain navigation-by-anchor works for both variants.
  const href =
    result.kind === "blob" ? URL.createObjectURL(result.blob) : result.url
  const a = document.createElement("a")
  a.href = href
  a.download = result.filename
  a.click()
  if (result.kind === "blob") URL.revokeObjectURL(href)
}

export function ExportEmployeesDialog({
  open,
  onOpenChange,
  employees,
}: ExportEmployeesDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [scope, setScope] = useState<ExportScope>("filtered")
  const [filename, setFilename] = useState("Employees_export")
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>({
    name: true,
    employee_number: true,
    employment_type: true,
    employment_status: true,
    hire_date: true,
    department: false,
  })

  const exportEmployees = useExportEmployees()

  const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "employee_number", label: "Employee #" },
    { key: "employment_type", label: "Type" },
    { key: "employment_status", label: "Status" },
    { key: "hire_date", label: "Hire Date" },
    { key: "department", label: "Department" },
  ]

  const toggle = (key: ColumnKey) =>
    setColumns((c) => ({ ...c, [key]: !c[key] }))

  const selectedCols = COLUMN_DEFS.filter((c) => columns[c.key])

  const handleExport = () => {
    if (selectedCols.length === 0) {
      toast.error("Select at least one column")
      return
    }
    exportEmployees.mutate(
      {
        format,
        // The list's status/department filters are client-side multi-selects
        // that the server's single-valued filter params can't express, so
        // "Current filters only" exports exactly the visible rows by id.
        scope: scope === "all" ? "all" : "selected",
        ...(scope === "all" ? {} : { ids: employees.map((e) => e.id) }),
        columns: selectedCols.map((c) => c.key),
        filename: filename || "Employees_export",
      },
      {
        onSuccess: (result) => {
          triggerDownload(result)
          toast.success("Export ready", {
            description: `Downloading ${result.filename}.`,
          })
          onOpenChange(false)
        },
        onError: (err) => {
          toast.error("Export failed", {
            description:
              (err as { message?: string }).message ??
              "Please try again or narrow the scope.",
          })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1 pe-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              Export Employees
            </DialogTitle>
            <p className="text-content-tertiary text-sm leading-5">
              Choose format and scope for your export
            </p>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-2">
            <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
              Format
            </Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="flex flex-row gap-6"
            >
              {FORMATS.map((f) => (
                <label key={f.value} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={f.value} />
                  {f.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Scope */}
          <div className="flex flex-col gap-2">
            <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
              Scope
            </Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as ExportScope)}
              className="gap-2"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="all" />
                All records
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="filtered" />
                Current filters only
              </label>
              <label
                className={cn(
                  "flex items-center gap-2 text-sm",
                  "text-content-quaternary",
                )}
              >
                <RadioGroupItem value="selected" disabled />
                Selected records (none selected)
              </label>
            </RadioGroup>
          </div>

          {/* Columns */}
          <div className="flex flex-col gap-2">
            <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
              Columns
            </Label>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {COLUMN_DEFS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={columns[c.key]}
                    onCheckedChange={() => toggle(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          {/* Filename */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
              Filename
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-10 flex-1 rounded-md text-sm"
              />
              <span className="text-content-tertiary font-mono text-sm">
                .{format}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              className="rounded-[10px]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="rounded-[10px]"
              disabled={exportEmployees.isPending}
              onClick={handleExport}
            >
              <Download />
              {exportEmployees.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
