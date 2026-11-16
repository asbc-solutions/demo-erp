"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { UserX } from "lucide-react"

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
import { formatDate } from "../../../lib/utils/date"
import { formatAmount, formatPercent, formatRate } from "../../../lib/utils/money"
import { SUBLEDGER_SIDES } from "../../lib/constants/sides"
import { useContactCard } from "../../lib/queries/subledger"
import type { ContactCard, Side, SubledgerDocument } from "../../lib/types/subledger"
import { DueCell } from "../shared/aging-bucket-pill"
import { WriteOffDialog } from "./write-off-dialog"

function fxLine(card: ContactCard, base: number) {
  return card.currency === "EGP" ? undefined : { value: base, currency: "EGP", rate: card.rate }
}

function itemColumns(card: ContactCard): FinanceColumn<SubledgerDocument>[] {
  const amount = (value: number) => <Amount value={value} currency={card.currency} />
  return [
    {
      id: "document",
      header: "Document",
      cell: (row) => (
        <span className="flex flex-col">
          <DocNumber>{row.number}</DocNumber>
          {!row.in_balance ? (
            <span className="text-content-tertiary text-xs leading-4" title="Held on its own account">
              Advance · {card.advances_account}
            </span>
          ) : null}
        </span>
      ),
    },
    { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
    {
      id: "due",
      header: "Due",
      cell: (row) => (row.due_date ? <DueCell date={formatDate(row.due_date)} daysLate={row.days_late} /> : "—"),
    },
    { id: "gross", header: "Gross", align: "end", cell: (row) => amount(row.gross) },
    { id: "allocated", header: "Allocated", align: "end", cell: (row) => <Amount value={row.allocated} /> },
    {
      id: "outstanding",
      header: "Outstanding",
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
    { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
  ]
}

/**
 * 02.02 · Customer card and 03.02 · Supplier card — one contact's balance,
 * terms and open items.
 */
function ContactCardPage({ side, contactId }: { side: Side; contactId: string }) {
  const config = SUBLEDGER_SIDES[side]
  const { data: card, isError, isPending, refetch } = useContactCard(side, contactId)
  const [writeOffOpen, setWriteOffOpen] = React.useState(false)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={config.contact.singular} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !card) {
    return (
      <>
        <FinancePageHeader title={`${config.contact.singular} not found`} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<UserX />}
            title={`There is no ${config.contact.lower} with this code.`}
            description={`It may have been merged or the link is out of date. Pick the ${config.contact.lower} from ${config.overview.title}.`}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href={config.href.overview}>Open {config.overview.title}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  const hasOverdue = (card?.overdue ?? 0) > 0
  const action = card ? config.card.action(card.id) : null
  const limitUsed = card && card.credit_limit > 0 ? (card.balance_base / card.credit_limit) * 100 : 0

  return (
    <>
      <FinancePageHeader
        title={card?.name ?? config.contact.singular}
        figure={
          card ? (
            <HeaderFigure label={config.card.figure}>
              <Amount value={card.balance} currency={card.currency} align="start" base={fxLine(card, card.balance_base)} />
            </HeaderFigure>
          ) : null
        }
        actions={
          card && action ? (
            <>
              <Button variant="primary" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
              <Button variant="ghost" disabled={!hasOverdue} onClick={() => setWriteOffOpen(true)}>
                Write off balance
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/finance/ledger?contact=${card.id}`}>Ledger</Link>
              </Button>
            </>
          ) : null
        }
      />
      <FinancePageBody>
        {!card ? (
          <div aria-busy aria-label={`Loading ${config.contact.lower}`} className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={4} className="md:grid-cols-4" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status="prepared" label={config.contact.singular} />
              <span className="text-content-primary font-mono text-xs" title={config.card.controlTitle}>
                {card.control_account}
              </span>
              {card.tax_reg_no ? <span>Tax reg. {card.tax_reg_no}</span> : null}
              <StatusPill status="prepared" label={card.currency} />
              <span>{card.terms_days}-day terms</span>
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label="Balance"
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
                label="Overdue"
                value={`${formatAmount(card.overdue)} ${card.currency}`}
                caption={`${card.open_items} open items`}
              />
              {side === "receivable" ? (
                <KpiCard
                  layout="bar"
                  accent="amber"
                  label="Credit limit (EGP)"
                  value={formatAmount(card.credit_limit)}
                  caption={`${formatPercent(Math.max(0, limitUsed))} used`}
                />
              ) : (
                <KpiCard
                  layout="bar"
                  accent="amber"
                  label="Avg. days to pay"
                  value={card.terms_days}
                  caption="Contractual"
                />
              )}
              <KpiCard layout="bar" accent="blue" label="Currency" value={card.currency} caption="Transacting" />
            </div>

            <FinanceSection title="Open items">
              <FinanceTable
                caption={`Open items for ${card.name}`}
                columns={itemColumns(card)}
                rows={card.items}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">{config.card.empty}</p>}
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
