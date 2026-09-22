"use client"

import * as React from "react"
import { Download, FileUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { RadioGroup, RadioGroupItem } from "@/src/shared/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import {
  Step,
  StepContent,
  StepIndicator,
  StepTitle,
  Stepper,
  type StepStatus,
} from "@/src/shared/components/ui/stepper"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { Label } from "@/src/shared/components/ui/label"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { KeyValueList } from "../../../components/shared/key-value-list"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { downloadCsv, parseCsv } from "../../../lib/utils/csv"
import { useImportRows } from "../../lib/mutations/ledger"
import type { ImportKind } from "../../lib/types/ledger"

type FieldSpec = { key: string; label: string; required?: boolean; numeric?: boolean; aliases: string[]; example: string }

const TARGETS: Record<ImportKind, { label: string; file: string; fields: FieldSpec[] }> = {
  tax_codes: {
    label: "Tax codes",
    file: "taxCode-template.csv",
    fields: [
      { key: "code", label: "Code", required: true, aliases: ["id", "taxcode"], example: "VAT5" },
      { key: "name", label: "Name", required: true, aliases: ["description", "title"], example: "VAT 5% — reduced" },
      { key: "kind", label: "Type", aliases: ["kind", "taxtype"], example: "vat" },
      { key: "rate", label: "Rate", required: true, numeric: true, aliases: ["percent", "percentage"], example: "5" },
      { key: "account_code", label: "Account", aliases: ["accountcode", "glaccount", "ledgeraccount"], example: "210201" },
      { key: "jurisdiction", label: "Jurisdiction", aliases: ["country", "region"], example: "EG" },
    ],
  },
  cost_centers: {
    label: "Cost centers",
    file: "costCenter-template.csv",
    fields: [
      { key: "code", label: "Code", required: true, aliases: ["id"], example: "CC-900" },
      { key: "name", label: "Name", required: true, aliases: ["description", "title"], example: "Pilot plant" },
      { key: "parent_code", label: "Parent", aliases: ["parentcode", "parentcenter"], example: "CC-100" },
      { key: "manager", label: "Manager", aliases: ["owner", "responsible"], example: "Tarek Aziz" },
    ],
  },
  dimensions: {
    label: "Dimensions",
    file: "dimension-template.csv",
    fields: [
      { key: "code", label: "Code", required: true, aliases: ["id"], example: "REGION" },
      { key: "name", label: "Name", required: true, aliases: ["description", "title"], example: "Sales region" },
      { key: "values", label: "Values", aliases: ["options", "members"], example: "Cairo; Delta; Upper Egypt" },
    ],
  },
}

const STEPS = ["File", "Match columns", "Check", "Preview", "Import"] as const
const UNMATCHED = "__none__"

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

type Match = { field: string; by: "Exact name" | "Similar name" | "Not matched" }

function matchColumns(headers: string[], fields: FieldSpec[]): Match[] {
  const used = new Set<string>()
  return headers.map((header) => {
    const name = normalise(header)
    const exact = fields.find((field) => !used.has(field.key) && (normalise(field.label) === name || normalise(field.key) === name))
    const similar = exact ?? fields.find((field) => !used.has(field.key) && field.aliases.includes(name))
    if (!similar) return { field: UNMATCHED, by: "Not matched" }
    used.add(similar.key)
    return { field: similar.key, by: exact ? "Exact name" : "Similar name" }
  })
}

type Checked = { rows: Record<string, string>[]; problems: string[]; usable: number }

function checkRows(data: string[][], matches: Match[], fields: FieldSpec[]): Checked {
  const problems: string[] = []
  const seen = new Set<string>()
  const missingFields = fields.filter((field) => field.required && !matches.some((match) => match.field === field.key))
  for (const field of missingFields) problems.push(`No column is matched to ${field.label}, which every record needs.`)
  const rows: Record<string, string>[] = []
  data.forEach((cells, index) => {
    const row: Record<string, string> = {}
    matches.forEach((match, column) => {
      if (match.field !== UNMATCHED) row[match.field] = (cells[column] ?? "").trim()
    })
    const line = index + 2
    const empty = fields.filter((field) => field.required && !row[field.key])
    if (missingFields.length === 0 && empty.length > 0) {
      problems.push(`Row ${line}: ${empty.map((field) => field.label).join(", ")} is empty.`)
      return
    }
    const notNumber = fields.find((field) => field.numeric && row[field.key] && Number.isNaN(Number(row[field.key])))
    if (notNumber) {
      problems.push(`Row ${line}: ${notNumber.label} “${row[notNumber.key]}” is not a number.`)
      return
    }
    if (row.code && seen.has(row.code)) {
      problems.push(`Row ${line}: code ${row.code} appears twice in the file.`)
      return
    }
    if (row.code) seen.add(row.code)
    rows.push(row)
  })
  return { rows: missingFields.length ? [] : rows, problems, usable: missingFields.length ? 0 : rows.length }
}

/** 05.11 · Import data — spreadsheet in, records out, nothing written until the last step. */
function ImportDataPage() {
  const [step, setStep] = React.useState(0)
  const [kind, setKind] = React.useState<ImportKind>("tax_codes")
  const [fileName, setFileName] = React.useState("")
  const [headers, setHeaders] = React.useState<string[]>([])
  const [data, setData] = React.useState<string[][]>([])
  const [matches, setMatches] = React.useState<Match[]>([])
  const [result, setResult] = React.useState<{ created: number; skipped: number } | null>(null)
  const importRows = useImportRows()
  const target = TARGETS[kind]
  const checked = React.useMemo(() => checkRows(data, matches, target.fields), [data, matches, target.fields])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const readFile = async (file: File) => {
    const rows = parseCsv(await file.text())
    if (rows.length < 2) {
      toast.error("That file has no rows under its headings. The first row must be your column headings.")
      return
    }
    setFileName(file.name)
    setHeaders(rows[0])
    setData(rows.slice(1))
    setMatches(matchColumns(rows[0], target.fields))
    setResult(null)
    setStep(1)
  }

  const downloadTemplate = () =>
    downloadCsv(target.file, target.fields.map((field) => field.label), [target.fields.map((field) => field.example)])

  const startOver = () => {
    setStep(0)
    setFileName("")
    setHeaders([])
    setData([])
    setMatches([])
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const status = (index: number): StepStatus => (index < step ? "completed" : index === step ? "current" : "upcoming")
  const back = <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>Back</Button>

  return (
    <>
      <FinancePageHeader title="Import data" />
      <FinancePageBody>
        <Stepper orientation="horizontal" aria-label="Import steps">
          {STEPS.map((label, index) => (
            <Step key={label} status={status(index)} index={index} isLast={index === STEPS.length - 1}>
              <StepIndicator />
              <StepContent>
                <StepTitle>{label}</StepTitle>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <p className="text-content-secondary text-[13px] leading-5">
          Bring existing records in from a spreadsheet. Nothing is written until the last step, and you see exactly
          what will be created first.
        </p>

        {step === 0 ? (
          <>
            <FinanceSection title="What are you importing?">
              <RadioGroup value={kind} onValueChange={(value) => setKind(value as ImportKind)} className="flex flex-wrap gap-6">
                {(Object.keys(TARGETS) as ImportKind[]).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <RadioGroupItem id={`import-${key}`} value={key} />
                    <Label htmlFor={`import-${key}`}>{TARGETS[key].label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FinanceSection>
            <div className="border-stroke-input bg-surface-white flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
              <span className="text-content-primary text-sm leading-5 font-semibold">Choose a CSV file</span>
              <span className="text-content-secondary text-[13px] leading-5">
                Export from Excel or Google Sheets as CSV. The first row must be your column headings.
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                id="import-file"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void readFile(file)
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => inputRef.current?.click()}>
                  <FileUp aria-hidden />
                  Choose file
                </Button>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download aria-hidden />
                  Download a template
                </Button>
              </div>
              <span className="text-content-tertiary text-xs leading-4">
                The template has the right headings and one example row, so the first attempt is not a guess.
              </span>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <FinanceSection title="Match your columns to ours" description="We matched what we could and say why. Change anything we got wrong.">
            <p className="text-content-tertiary text-[13px] leading-5">
              {data.length} rows read from {fileName}
            </p>
            <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Your column</TableHead>
                    <TableHead>Our field</TableHead>
                    <TableHead>Matched by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header, index) => (
                    <TableRow key={`${header}-${index}`}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={matches[index]?.field ?? UNMATCHED}
                          onValueChange={(field) =>
                            setMatches((current) => current.map((match, position) => (position === index ? { field, by: field === UNMATCHED ? "Not matched" : "Exact name" } : match)))
                          }
                        >
                          <SelectTrigger aria-label={`Field for ${header}`} className="h-8 w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNMATCHED}>Don’t import</SelectItem>
                            {target.fields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-content-secondary">{matches[index]?.by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={startOver}>Back</Button>
              <Button variant="primary" onClick={() => setStep(2)}>Continue</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 2 ? (
          <FinanceSection title="What we found">
            {checked.problems.length === 0 ? (
              <FinanceAlert tone="success" className="text-status-success-fg">Every row is usable.</FinanceAlert>
            ) : (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                <span className="flex flex-col gap-1">
                  {checked.problems.slice(0, 8).map((problem) => (
                    <span key={problem}>{problem}</span>
                  ))}
                  {checked.problems.length > 8 ? <span>…and {checked.problems.length - 8} more.</span> : null}
                  <span>Rows with a problem are skipped. Fix them in the file and import again to bring them in.</span>
                </span>
              </FinanceAlert>
            )}
            <div className="flex gap-2">
              {back}
              <Button variant="primary" disabled={checked.usable === 0} onClick={() => setStep(3)}>Continue</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 3 ? (
          <FinanceSection title="What the import will do">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Records created" value={checked.usable} />
              <KpiCard layout="bar" accent="amber" label="Rows skipped" value={data.length - checked.usable} />
            </div>
            <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    {target.fields.map((field) => (
                      <TableHead key={field.key}>{field.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checked.rows.slice(0, 10).map((row, index) => (
                    <TableRow key={`${row.code}-${index}`}>
                      {target.fields.map((field) => (
                        <TableCell key={field.key}>{row[field.key] || "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              {back}
              <Button variant="primary" onClick={() => setStep(4)}>Continue</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 4 ? (
          <FinanceSection title="Import">
            {result ? (
              <>
                <FinanceAlert
                  tone="success"
                  className="text-status-success-fg"
                  action={<Button variant="secondary" size="sm" onClick={startOver}>Import another file</Button>}
                >
                  {result.created} records imported{result.skipped ? `, ${result.skipped} skipped because the code already exists` : ""}.
                  Saved for this session. A reload returns the prototype to its starting figures.
                </FinanceAlert>
                <KeyValueList
                  items={[
                    { term: "You asked for", value: `Import ${target.label.toLowerCase()}` },
                    { term: "Records created", value: result.created },
                    { term: "Rows skipped", value: result.skipped + (data.length - checked.usable) },
                    { term: "What happened", value: "The change was written to this session only." },
                  ]}
                />
              </>
            ) : (
              <>
                <p className="text-content-secondary text-[13px] leading-5">
                  Saved for this session. A reload returns the prototype to its starting figures.
                </p>
                <div className="flex gap-2">
                  {back}
                  <Button
                    variant="primary"
                    disabled={importRows.isPending}
                    onClick={() =>
                      importRows.mutate(
                        { kind, rows: checked.rows },
                        {
                          onSuccess: setResult,
                          onError: (error) => toast.error(errorMessage(error, "The import failed. Nothing was written.")),
                        },
                      )
                    }
                  >
                    Import {checked.usable} records
                  </Button>
                </div>
              </>
            )}
          </FinanceSection>
        ) : null}
      </FinancePageBody>
    </>
  )
}

export { ImportDataPage }
