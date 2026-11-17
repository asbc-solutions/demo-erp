"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { FileUp, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useImportStatement } from "../../lib/mutations/banking"
import { useLatestImport } from "../../lib/queries/banking"
import type { ImportedLine } from "../../lib/types/banking"

const DEFAULT_TREASURY_ID = "bnk-cib-0021"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

/** Pill tone per match result; the label is the `FinanceBanking` enum map `importMatch`. */
const MATCH_TONE: Record<ImportedLine["match"], "success" | "warning" | "muted"> = {
  auto: "success",
  review: "warning",
  duplicate: "muted",
}

function columns(currency: string, t: BankingT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<ImportedLine>[] {
  return [
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    { id: "reference", header: t("colReference"), cell: (row) => <DocNumber>{row.reference}</DocNumber> },
    { id: "memo", header: t("colMemo"), cell: (row) => row.memo },
    { id: "amount", header: t("amountIn", { currency }), align: "end", cell: (row) => <Amount value={row.amount} /> },
    {
      id: "match",
      header: t("colMatch"),
      cell: (row) => (
        <StatusPill status={`import-${row.match}`} label={t(`importMatch.${row.match}`)} tone={MATCH_TONE[row.match]} />
      ),
    },
  ]
}

/**
 * 04.06 · Statement import — read the bank's file, auto-match what is already
 * on the books, and send the rest to the reconciliation workspace.
 */
function StatementImportPage() {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
  const { data: treasuries = [] } = useFinanceTreasuries()
  const banks = treasuries.filter((row) => row.kind === "bank")
  const [treasuryId, setTreasuryId] = React.useState(DEFAULT_TREASURY_ID)
  const [confirming, setConfirming] = React.useState(false)
  const { data: latest, isPending } = useLatestImport(treasuryId)
  const importStatement = useImportStatement()
  const treasury = banks.find((row) => row.id === treasuryId)

  const runImport = () =>
    importStatement.mutate(treasuryId, {
      onSuccess: (result) =>
        toast.success(
          result.skipped === result.parsed
            ? t("importAllDuplicates", { count: result.parsed })
            : t("importDone", { count: result.parsed - result.skipped, treasury: result.treasury_name }),
        ),
      onError: (error) => toast.error(errorMessage(error, t("importFailed"))),
    })

  return (
    <>
      <FinancePageHeader
        title={t("importTitle")}
        figure={<HeaderFigure label={t("linesParsed")}>{latest?.parsed ?? 0}</HeaderFigure>}
        actions={
          latest ? (
            <Button variant="primary" asChild>
              <Link href={`/finance/reconciliation/${treasuryId}`}>{t("continueToReconciliation")}</Link>
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-72">
            <FieldLabel htmlFor="import-treasury">{t("bankTreasury")}</FieldLabel>
            <Select value={treasuryId} onValueChange={setTreasuryId}>
              <SelectTrigger id="import-treasury" className="h-9">
                <SelectValue placeholder={t("chooseBankAccount")} />
              </SelectTrigger>
              <SelectContent>
                {banks.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name} — {row.bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <span className="text-content-tertiary flex h-9 items-center gap-1.5 text-[13px] leading-5">
            <Info className="size-3.5" aria-hidden />
            {t("generatedData")}
          </span>
          <Button variant="secondary" disabled={!treasury || importStatement.isPending} onClick={() => setConfirming(true)}>
            <FileUp aria-hidden />
            {t("uploadStatement")}
          </Button>
        </div>

        {isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !latest ? (
          <EmptyState
            variant="card"
            icon={<FileUp />}
            title={t("importEmptyTitle")}
            description={t("importEmptyDescription")}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("linesParsed")}
                value={latest.parsed}
                caption={latest.skipped > 0 ? t("alreadyImportedCount", { count: latest.skipped }) : undefined}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("importMatch.auto")}
                value={latest.auto_matched}
                caption={t("needReviewCount", { count: latest.review })}
              />
              <KpiCard layout="bar" accent="amber" label={t("intoTreasury")} value={latest.treasury_name} />
            </div>
            <FinanceAlert tone="info">{t("importNote")}</FinanceAlert>
            <FinanceSection title={t("parsedLines")}>
              <FinanceTable
                caption={t("parsedLinesCaption", { treasury: latest.treasury_name })}
                columns={columns(latest.currency, t, formatDate)}
                rows={latest.lines}
                getRowId={(row) => `${row.reference}-${row.date}`}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("importConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("importConfirmDescription", { account: treasury?.name ?? t("thisAccount") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={runImport}>
              {t("importStatement")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { StatementImportPage }
