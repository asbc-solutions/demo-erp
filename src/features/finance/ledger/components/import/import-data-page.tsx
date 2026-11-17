"use client"

import * as React from "react"
import { Download, FileUp } from "lucide-react"
import { useTranslations } from "next-intl"
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
import type { ImportKind, LedgerMessageKey, LedgerTranslator } from "../../lib/types/ledger"

type FieldSpec = {
  key: string
  labelKey: LedgerMessageKey
  /** Column heading in the CSV template; also matched by exact name. */
  header: string
  required?: boolean
  numeric?: boolean
  aliases: string[]
  example: string
}

const TARGETS: Record<ImportKind, { labelKey: LedgerMessageKey; actionKey: LedgerMessageKey; file: string; fields: FieldSpec[] }> = {
  tax_codes: {
    labelKey: "importTaxCodes",
    actionKey: "importTaxCodesAction",
    file: "taxCode-template.csv",
    fields: [
      { key: "code", labelKey: "code", header: "Code", required: true, aliases: ["id", "taxcode"], example: "VAT5" },
      { key: "name", labelKey: "name", header: "Name", required: true, aliases: ["description", "title"], example: "VAT 5% — reduced" },
      { key: "kind", labelKey: "type", header: "Type", aliases: ["kind", "taxtype"], example: "vat" },
      { key: "rate", labelKey: "rate", header: "Rate", required: true, numeric: true, aliases: ["percent", "percentage"], example: "5" },
      { key: "account_code", labelKey: "account", header: "Account", aliases: ["accountcode", "glaccount", "ledgeraccount"], example: "210201" },
      { key: "jurisdiction", labelKey: "jurisdiction", header: "Jurisdiction", aliases: ["country", "region"], example: "EG" },
    ],
  },
  cost_centers: {
    labelKey: "importCostCenters",
    actionKey: "importCostCentersAction",
    file: "costCenter-template.csv",
    fields: [
      { key: "code", labelKey: "code", header: "Code", required: true, aliases: ["id"], example: "CC-900" },
      { key: "name", labelKey: "name", header: "Name", required: true, aliases: ["description", "title"], example: "Pilot plant" },
      { key: "parent_code", labelKey: "parent", header: "Parent", aliases: ["parentcode", "parentcenter"], example: "CC-100" },
      { key: "manager", labelKey: "manager", header: "Manager", aliases: ["owner", "responsible"], example: "Tarek Aziz" },
    ],
  },
  dimensions: {
    labelKey: "importDimensions",
    actionKey: "importDimensionsAction",
    file: "dimension-template.csv",
    fields: [
      { key: "code", labelKey: "code", header: "Code", required: true, aliases: ["id"], example: "REGION" },
      { key: "name", labelKey: "name", header: "Name", required: true, aliases: ["description", "title"], example: "Sales region" },
      { key: "values", labelKey: "values", header: "Values", aliases: ["options", "members"], example: "Cairo; Delta; Upper Egypt" },
    ],
  },
}

const STEPS: LedgerMessageKey[] = ["stepFile", "stepMatchColumns", "stepCheck", "stepPreview", "stepImport"]
const UNMATCHED = "__none__"

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

type MatchedBy = "exact" | "similar" | "none"
type Match = { field: string; by: MatchedBy }

const MATCHED_BY_KEY: Record<MatchedBy, LedgerMessageKey> = {
  exact: "matchedExact",
  similar: "matchedSimilar",
  none: "matchedNone",
}

function matchColumns(headers: string[], fields: FieldSpec[]): Match[] {
  const used = new Set<string>()
  return headers.map((header) => {
    const name = normalise(header)
    const exact = fields.find((field) => !used.has(field.key) && (normalise(field.header) === name || normalise(field.key) === name))
    const similar = exact ?? fields.find((field) => !used.has(field.key) && field.aliases.includes(name))
    if (!similar) return { field: UNMATCHED, by: "none" }
    used.add(similar.key)
    return { field: similar.key, by: exact ? "exact" : "similar" }
  })
}

type Checked = { rows: Record<string, string>[]; problems: string[]; usable: number }

function checkRows(data: string[][], matches: Match[], fields: FieldSpec[], t: LedgerTranslator): Checked {
  const problems: string[] = []
  const seen = new Set<string>()
  const missingFields = fields.filter((field) => field.required && !matches.some((match) => match.field === field.key))
  for (const field of missingFields) problems.push(t("importMissingColumn", { field: t(field.labelKey) }))
  const rows: Record<string, string>[] = []
  data.forEach((cells, index) => {
    const row: Record<string, string> = {}
    matches.forEach((match, column) => {
      if (match.field !== UNMATCHED) row[match.field] = (cells[column] ?? "").trim()
    })
    const line = index + 2
    const empty = fields.filter((field) => field.required && !row[field.key])
    if (missingFields.length === 0 && empty.length > 0) {
      problems.push(t("importRowEmpty", { line, fields: empty.map((field) => t(field.labelKey)).join(", ") }))
      return
    }
    const notNumber = fields.find((field) => field.numeric && row[field.key] && Number.isNaN(Number(row[field.key])))
    if (notNumber) {
      problems.push(t("importRowNotNumber", { line, field: t(notNumber.labelKey), value: row[notNumber.key] }))
      return
    }
    if (row.code && seen.has(row.code)) {
      problems.push(t("importRowDuplicate", { line, code: row.code }))
      return
    }
    if (row.code) seen.add(row.code)
    rows.push(row)
  })
  return { rows: missingFields.length ? [] : rows, problems, usable: missingFields.length ? 0 : rows.length }
}

/** 05.11 · Import data — spreadsheet in, records out, nothing written until the last step. */
function ImportDataPage() {
  const t = useTranslations("FinanceLedger")
  const [step, setStep] = React.useState(0)
  const [kind, setKind] = React.useState<ImportKind>("tax_codes")
  const [fileName, setFileName] = React.useState("")
  const [headers, setHeaders] = React.useState<string[]>([])
  const [data, setData] = React.useState<string[][]>([])
  const [matches, setMatches] = React.useState<Match[]>([])
  const [result, setResult] = React.useState<{ created: number; skipped: number } | null>(null)
  const importRows = useImportRows()
  const target = TARGETS[kind]
  const checked = React.useMemo(() => checkRows(data, matches, target.fields, t), [data, matches, target.fields, t])
  const inputRef = React.useRef<HTMLInputElement>(null)

  const readFile = async (file: File) => {
    const rows = parseCsv(await file.text())
    if (rows.length < 2) {
      toast.error(t("importNoRows"))
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
    downloadCsv(target.file, target.fields.map((field) => field.header), [target.fields.map((field) => field.example)])

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
  const back = <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>{t("back")}</Button>

  return (
    <>
      <FinancePageHeader title={t("importData")} />
      <FinancePageBody>
        <Stepper orientation="horizontal" aria-label={t("importSteps")}>
          {STEPS.map((labelKey, index) => (
            <Step key={labelKey} status={status(index)} index={index} isLast={index === STEPS.length - 1}>
              <StepIndicator />
              <StepContent>
                <StepTitle>{t(labelKey)}</StepTitle>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <p className="text-content-secondary text-[13px] leading-5">
          {t("importIntro")}
        </p>

        {step === 0 ? (
          <>
            <FinanceSection title={t("importWhatTitle")}>
              <RadioGroup value={kind} onValueChange={(value) => setKind(value as ImportKind)} className="flex flex-wrap gap-6">
                {(Object.keys(TARGETS) as ImportKind[]).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <RadioGroupItem id={`import-${key}`} value={key} />
                    <Label htmlFor={`import-${key}`}>{t(TARGETS[key].labelKey)}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FinanceSection>
            <div className="border-stroke-input bg-surface-white flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
              <span className="text-content-primary text-sm leading-5 font-semibold">{t("chooseCsvFile")}</span>
              <span className="text-content-secondary text-[13px] leading-5">
                {t("chooseCsvHint")}
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
                  {t("chooseFile")}
                </Button>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download aria-hidden />
                  {t("downloadTemplate")}
                </Button>
              </div>
              <span className="text-content-tertiary text-xs leading-4">
                {t("templateHint")}
              </span>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <FinanceSection title={t("matchColumnsTitle")} description={t("matchColumnsDescription")}>
            <p className="text-content-tertiary text-[13px] leading-5">
              {t("rowsReadFrom", { count: data.length, file: fileName })}
            </p>
            <div className="border-stroke-default bg-surface-white overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("yourColumn")}</TableHead>
                    <TableHead>{t("ourField")}</TableHead>
                    <TableHead>{t("matchedBy")}</TableHead>
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
                            setMatches((current) => current.map((match, position) => (position === index ? { field, by: field === UNMATCHED ? "none" : "exact" } : match)))
                          }
                        >
                          <SelectTrigger aria-label={t("fieldFor", { header })} className="h-8 w-56">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNMATCHED}>{t("dontImport")}</SelectItem>
                            {target.fields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {t(field.labelKey)}
                                {field.required ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-content-secondary">{matches[index] ? t(MATCHED_BY_KEY[matches[index].by]) : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={startOver}>{t("back")}</Button>
              <Button variant="primary" onClick={() => setStep(2)}>{t("continue")}</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 2 ? (
          <FinanceSection title={t("whatWeFound")}>
            {checked.problems.length === 0 ? (
              <FinanceAlert tone="success" className="text-status-success-fg">{t("everyRowUsable")}</FinanceAlert>
            ) : (
              <FinanceAlert tone="warning" className="text-status-warning-fg">
                <span className="flex flex-col gap-1">
                  {checked.problems.slice(0, 8).map((problem) => (
                    <span key={problem}>{problem}</span>
                  ))}
                  {checked.problems.length > 8 ? <span>{t("andMore", { count: checked.problems.length - 8 })}</span> : null}
                  <span>{t("problemRowsSkipped")}</span>
                </span>
              </FinanceAlert>
            )}
            <div className="flex gap-2">
              {back}
              <Button variant="primary" disabled={checked.usable === 0} onClick={() => setStep(3)}>{t("continue")}</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 3 ? (
          <FinanceSection title={t("whatImportWillDo")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("recordsCreated")} value={checked.usable} />
              <KpiCard layout="bar" accent="amber" label={t("rowsSkipped")} value={data.length - checked.usable} />
            </div>
            <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    {target.fields.map((field) => (
                      <TableHead key={field.key}>{t(field.labelKey)}</TableHead>
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
              <Button variant="primary" onClick={() => setStep(4)}>{t("continue")}</Button>
            </div>
          </FinanceSection>
        ) : null}

        {step === 4 ? (
          <FinanceSection title={t("stepImport")}>
            {result ? (
              <>
                <FinanceAlert
                  tone="success"
                  className="text-status-success-fg"
                  action={<Button variant="secondary" size="sm" onClick={startOver}>{t("importAnotherFile")}</Button>}
                >
                  {result.skipped
                    ? t("importedWithSkipped", { created: result.created, skipped: result.skipped })
                    : t("imported", { created: result.created })}{" "}
                  {t("savedForSession")}
                </FinanceAlert>
                <KeyValueList
                  items={[
                    { term: t("youAskedFor"), value: t(target.actionKey) },
                    { term: t("recordsCreated"), value: result.created },
                    { term: t("rowsSkipped"), value: result.skipped + (data.length - checked.usable) },
                    { term: t("whatHappened"), value: t("writtenToSession") },
                  ]}
                />
              </>
            ) : (
              <>
                <p className="text-content-secondary text-[13px] leading-5">
                  {t("savedForSession")}
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
                          onError: (error) => toast.error(errorMessage(error, t("errorImport"))),
                        },
                      )
                    }
                  >
                    {t("importRecords", { count: checked.usable })}
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
