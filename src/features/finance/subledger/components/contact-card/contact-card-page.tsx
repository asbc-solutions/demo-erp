"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { UserX } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
  MetaChips,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount, formatPercent, formatRate } from "../../../lib/utils/money"
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useContactCard } from "../../lib/queries/subledger"
import type { ContactCard, Side, SubledgerDocument } from "../../lib/types/subledger"
import { DueCell } from "../shared/aging-bucket-pill"
import { WriteOffDialog } from "./write-off-dialog"

function fxLine(card: ContactCard, base: number) {
  return card.currency === "EGP" ? undefined : { value: base, currency: "EGP", rate: card.rate }
}

type SubledgerT = ReturnType<typeof useTranslations<"FinanceSubledger">>

function itemColumns(card: ContactCard, t: SubledgerT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<SubledgerDocument>[] {
  const amount = (value: number) => <Amount value={value} currency={card.currency} />
  return [
    {
      id: "document",
      header: t("colDocument"),
      cell: (row) => (
        <span className="flex flex-col">
          <DocNumber>{row.number}</DocNumber>
          {!row.in_balance ? (
            <span className="text-content-tertiary text-xs leading-4" title={t("heldOnOwnAccount")}>
              {t("advanceAccount", { account: card.advances_account })}
            </span>
          ) : null}
        </span>
      ),
    },
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    {
      id: "due",
      header: t("colDue"),
      cell: (row) => (row.due_date ? <DueCell date={formatDate(row.due_date)} daysLate={row.days_late} /> : "—"),
    },
    { id: "gross", header: t("colGross"), align: "end", cell: (row) => amount(row.gross) },
    { id: "allocated", header: t("colAllocated"), align: "end", cell: (row) => <Amount value={row.allocated} /> },
    {
      id: "outstanding",
      header: t("colOutstanding"),
      align: "end",
      cell: (row) => (
        <Amount
          value={row.outstanding}
          currency={card.currency}
          emphasis="strong"
          base={fxLine(card, row.outstanding_base)}
        />
      ),
    },
    { id: "status", header: t("colStatus"), cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/**
 * 02.02 · Customer card and 03.02 · Supplier card — one contact's balance,
 * terms and open items.
 */
function ContactCardPage({ side, contactId }: { side: Side; contactId: string }) {
  const t = useTranslations("FinanceSubledger")
  const { formatDate } = useFinanceDateFormat()
  const config = SUBLEDGER_SIDES[side]
  const { data: card, isError, isPending, refetch } = useContactCard(side, contactId)
  const [writeOffOpen, setWriteOffOpen] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t(`contactSingular.${side}`)} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !card) {
    return (
      <>
        <FinancePageHeader title={t(`contactNotFound.${side}`)} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<UserX />}
            title={t(`noContactWithCode.${side}`)}
            description={t(`contactNotFoundDescription.${side}`)}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href={config.href.overview}>{t(`openOverview.${side}`)}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const hasOverdue = (card?.overdue ?? 0) > 0
  const actionHref = card ? config.href.cardAction(card.id) : null
  const limitUsed = card && card.credit_limit > 0 ? (card.balance_base / card.credit_limit) * 100 : 0

  return (
    <>
      <FinancePageHeader
        title={card?.name ?? t(`contactSingular.${side}`)}
        figure={
          card ? (
            <HeaderFigure label={t(`cardFigure.${side}`)}>
              <Amount value={card.balance} currency={card.currency} align="start" base={fxLine(card, card.balance_base)} />
            </HeaderFigure>
          ) : null
        }
        actions={
          card && actionHref ? (
            <>
              <Button variant="primary" asChild>
                <Link href={actionHref}>{t(`cardAction.${side}`)}</Link>
              </Button>
              <Button variant="ghost" disabled={!hasOverdue} onClick={() => setWriteOffOpen(true)}>
                {t("writeOffBalance")}
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/finance/ledger?contact=${card.id}`}>{t("ledger")}</Link>
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!card ? (
          <div aria-busy aria-label={t(`loadingContact.${side}`)} className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={4} className="md:grid-cols-4" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status="prepared" label={t(`contactSingular.${side}`)} />
              <span className="text-content-primary font-mono text-xs" title={t(`controlTitle.${side}`)}>
                {card.control_account}
              </span>
              {card.tax_reg_no ? <span>{t("taxReg", { number: card.tax_reg_no })}</span> : null}
              <StatusPill status="prepared" label={card.currency} />
              <span>{t("termsLabel", { days: card.terms_days })}</span>
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("colBalance")}
                value={`${formatAmount(card.balance)} ${card.currency}`}
                caption={
                  card.currency === "EGP"
                    ? undefined
                    : `≈ ${formatAmount(card.balance_base)} EGP @ ${formatRate(card.rate)}`
                }
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("colOverdue")}
                value={`${formatAmount(card.overdue)} ${card.currency}`}
                caption={t("openItemsCount", { count: card.open_items })}
              />
              {side === "receivable" ? (
                <KpiCard
                  layout="bar"
                  accent="amber"
                  label={t("creditLimit")}
                  value={formatAmount(card.credit_limit)}
                  caption={t("percentUsed", { percent: formatPercent(Math.max(0, limitUsed)) })}
                />
              ) : (
                <KpiCard
                  layout="bar"
                  accent="amber"
                  label={t("avgDaysToPay")}
                  value={card.terms_days}
                  caption={t("contractual")}
                />
              )}
              <KpiCard layout="bar" accent="blue" label={t("colCurrency")} value={card.currency} caption={t("transacting")} />
            </div>

            <FinanceSection title={t("openItems")}>
              <FinanceTable
                caption={t("openItemsFor", { name: card.name })}
                columns={itemColumns(card, t, formatDate)}
                rows={card.items}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">{t(`cardEmpty.${side}`)}</p>}
              />
            </FinanceSection>

            <WriteOffDialog
              side={side}
              open={writeOffOpen}
              onOpenChange={setWriteOffOpen}
              contactId={card.id}
              contactName={card.name}
            />
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { ContactCardPage }
