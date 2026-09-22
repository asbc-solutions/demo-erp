"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SearchX } from "lucide-react"

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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useGeneralLedger } from "../../lib/queries/ledger"

/**
 * 05.07 · General ledger — one account's movements with a running balance,
 * from its opening to its closing. `contact` opens that contact's control account.
 */
function GeneralLedgerPage({ account = "110101", contact = "" }: { account?: string; contact?: string }) {
  const router = useRouter()
  const { data, isError, isPending, refetch } = useGeneralLedger(account, contact)

  const side = data ? (data.closing >= 0 ? "debit" : "credit") : null

  return (
    <>
      <FinancePageHeader
        title="General ledger"
        figure={
          data ? (
            <HeaderFigure label={`${data.account.code} — ${data.account.name} (${side} balance)`}>
              EGP {formatAmount(Math.abs(data.closing))}
            </HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-4">
          <Field className="w-96">
            <FieldLabel htmlFor="gl-account">Account</FieldLabel>
            <AccountSelect
              id="gl-account"
              value={data?.account.code ?? account}
              onValueChange={(code) => router.push(`/finance/ledger?account=${code}`)}
            />
          </Field>
          {data ? (
            <span className="text-content-tertiary pb-2 text-[13px] leading-5">
              {data.lines.length} movements · Jan–Mar 2026
              {data.contact_name ? ` · control account for ${data.contact_name}` : ""}
            </span>
          ) : null}
        </div>

        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton aria-busy aria-label="Loading ledger" className="h-96 rounded-lg" />
        ) : !data ? (
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title="That account cannot be posted to."
            description="Group accounts roll up their members. Pick a postable account."
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/accounts">Open chart of accounts</Link>
              </Button>
            }
          />
        ) : (
          <div className="border-stroke-default bg-surface-white overflow-x-auto rounded-lg border">
            <Table>
              <caption className="sr-only">{`Ledger for ${data.account.code} ${data.account.name}`}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Entry no.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Debit (EGP)</TableHead>
                  <TableHead className="text-right">Credit (EGP)</TableHead>
                  <TableHead className="text-right">Balance (EGP)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-content-secondary font-medium">
                    Opening balance
                  </TableCell>
                  <TableCell className="text-right">
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
                    <TableCell className="text-right">{row.debit ? <Amount value={row.debit} /> : null}</TableCell>
                    <TableCell className="text-right">{row.credit ? <Amount value={row.credit} /> : null}</TableCell>
                    <TableCell className="text-right">
                      <Amount value={row.balance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Closing balance</TableCell>
                  <TableCell className="text-right">
                    <Amount value={data.debit_total} emphasis="strong" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Amount value={data.credit_total} emphasis="strong" />
                  </TableCell>
                  <TableCell className="text-right">
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
