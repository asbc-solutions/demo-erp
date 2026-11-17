"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { SearchX } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { AccountSelect } from "../../../components/shared/account-select"
import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useGeneralLedger } from "../../lib/queries/ledger"

/**
 * 05.07 · General ledger — one account's movements with a running balance,
 * from its opening to its closing. `contact` opens that contact's control account.
 */
function GeneralLedgerPage({ account = "110101", contact = "" }: { account?: string; contact?: string }) {
  const t = useTranslations("FinanceLedger")
  const { formatDate } = useFinanceDateFormat()
  const router = useRouter()
  const { data, isError, isPending, refetch } = useGeneralLedger(account, contact)

  const side = data ? (data.closing >= 0 ? "debit" : "credit") : null

  return (
    <>
      <FinancePageHeader
        title={t("generalLedger")}
        figure={
          data ? (
            <HeaderFigure label={t(side === "credit" ? "glFigureLabelCredit" : "glFigureLabelDebit", { code: data.account.code, name: data.account.name })}>
              {t("egpAmount", { amount: formatAmount(Math.abs(data.closing)) })}
            </HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-96">
            <FieldLabel htmlFor="gl-account">{t("account")}</FieldLabel>
            <AccountSelect
              id="gl-account"
              value={data?.account.code ?? account}
              onValueChange={(code) => router.push(`/finance/ledger?account=${code}`)}
            />
          </Field>
          {data ? (
            <span className="text-content-tertiary pb-2 text-[13px] leading-5">
              {t("glMovements", { count: data.lines.length })}
              {data.contact_name ? t("glControlAccountFor", { name: data.contact_name }) : ""}
            </span>
          ) : null}
        </div>

        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton aria-busy aria-label={t("loadingLedger")} className="h-96 rounded-lg" />
        ) : !data ? (
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("glNotPostableTitle")}
            description={t("glNotPostableDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/accounts">{t("openChartOfAccounts")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">{t("glCaption", { code: data.account.code, name: data.account.name })}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("entryNo")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("source")}</TableHead>
                  <TableHead className="text-end">{t("debitEgp")}</TableHead>
                  <TableHead className="text-end">{t("creditEgp")}</TableHead>
                  <TableHead className="text-end">{t("balanceEgp")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-content-secondary font-medium">
                    {t("openingBalance")}
                  </TableCell>
                  <TableCell className="text-end">
                    <Amount value={data.opening} emphasis="strong" />
                  </TableCell>
                </TableRow>
                {data.lines.map((row, index) => (
                  <TableRow key={`${row.entry}-${index}`}>
                    <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                    <TableCell>
                      <Link href={`/finance/journals/${row.entry}`} className="hover:underline">
                        <DocNumber>{row.entry}</DocNumber>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-72 truncate">{row.description}</TableCell>
                    <TableCell className="text-content-secondary">{row.source}</TableCell>
                    <TableCell className="text-end">{row.debit ? <Amount value={row.debit} /> : null}</TableCell>
                    <TableCell className="text-end">{row.credit ? <Amount value={row.credit} /> : null}</TableCell>
                    <TableCell className="text-end">
                      <Amount value={row.balance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>{t("closingBalance")}</TableCell>
                  <TableCell className="text-end">
                    <Amount value={data.debit_total} emphasis="strong" />
                  </TableCell>
                  <TableCell className="text-end">
                    <Amount value={data.credit_total} emphasis="strong" />
                  </TableCell>
                  <TableCell className="text-end">
                    <Amount value={data.closing} emphasis="strong" />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </FinancePageBody>
    </>
  )
}

export { GeneralLedgerPage }
