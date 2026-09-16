"use client"

import {
  BadgeDollarSign,
  CheckCircle2,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { StatusPill } from "../../all-project/components/project-detail/status-pill"
import { formatMoney } from "../../lib/mappers/cost-budget-mapper"
import { formatApiDate } from "../../lib/mappers/project-mapper"
import {
  usePortfolioBillingMilestones,
  usePortfolioRevenueSummary,
} from "../../lib/queries/billing"

/** "All projects" scope of Billing & Revenue — portfolio roll-up. */
export function PortfolioBillingView() {
  const revenue = usePortfolioRevenueSummary()
  const milestonesQ = usePortfolioBillingMilestones()

  if (revenue.isLoading)
    return <div className="bg-surface-muted h-[40vh] animate-pulse rounded-[14px]" />

  if (revenue.isError || !revenue.data)
    return (
      <Card className="flex h-48 items-center justify-center p-6">
        <p className="text-content-tertiary text-sm">
          Couldn&apos;t load the portfolio revenue summary.
        </p>
      </Card>
    )

  const summary = revenue.data
  const cards: {
    id: string
    label: string
    value: string
    caption: string
    icon: LucideIcon
    accent: string
    tile: string
  }[] = [
    {
      id: "contract",
      label: "Contract Value",
      value: formatMoney(summary.total_contract_value),
      caption: "All active projects",
      icon: Wallet,
      accent: "border-l-brand-primary",
      tile: "bg-brand-primary/10 text-brand-primary",
    },
    {
      id: "invoiced",
      label: "Invoiced",
      value: formatMoney(summary.total_invoiced),
      caption: "Billed to date",
      icon: Receipt,
      accent: "border-l-brand-success",
      tile: "bg-brand-success/10 text-brand-success",
    },
    {
      id: "recognized",
      label: "Recognized",
      value: formatMoney(summary.total_recognized),
      caption: "POC revenue recognition",
      icon: CheckCircle2,
      accent: "border-l-brand-info",
      tile: "bg-brand-info/10 text-brand-info",
    },
    {
      id: "unbilled",
      label: "Unbilled",
      value: formatMoney(summary.unbilled),
      caption: "Recognized minus invoiced",
      icon: BadgeDollarSign,
      accent: "border-l-brand-warning",
      tile: "bg-brand-warning/10 text-brand-warning",
    },
  ]

  const milestones = milestonesQ.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.id}
              variant="elevated"
              className={cn("flex-row items-center gap-3 border-l-4 p-4", card.accent)}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  card.tile,
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-content-tertiary text-[11px] font-medium tracking-wide uppercase">
                  {card.label}
                </span>
                <span className="text-content-primary text-xl leading-[25px] font-bold tabular-nums">
                  {card.value}
                </span>
                <span className="text-content-tertiary text-[12px]">
                  {card.caption}
                </span>
              </div>
            </Card>
          )
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-content-primary text-base leading-6 font-semibold">
              Revenue by Project
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Invoiced</TableHead>
                <TableHead>Recognized</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.by_project.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="text-content-tertiary py-10 text-center text-sm"
                  >
                    No projects with billing data.
                  </TableCell>
                </TableRow>
              ) : (
                summary.by_project.map((row) => (
                  <TableRow key={row.project_id}>
                    <TableCell className="text-content-primary max-w-[220px] truncate text-[13px] font-medium">
                      {row.project_name}
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {formatMoney(row.contract_value)}
                    </TableCell>
                    <TableCell className="text-brand-success text-[13px] font-semibold tabular-nums">
                      {formatMoney(row.invoiced)}
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {formatMoney(row.recognized)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-content-primary text-base leading-6 font-semibold">
              Billing Milestones
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestonesQ.isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="text-content-tertiary py-10 text-center text-sm"
                  >
                    Loading billing milestones…
                  </TableCell>
                </TableRow>
              ) : milestones.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="text-content-tertiary py-10 text-center text-sm"
                  >
                    No billing milestones yet.
                  </TableCell>
                </TableRow>
              ) : (
                milestones.map((m) => (
                  <TableRow key={m.billing_milestone_id}>
                    <TableCell className="text-content-tertiary font-mono text-[12px]">
                      {m.code}
                    </TableCell>
                    <TableCell className="text-content-primary max-w-[180px] truncate text-[13px] font-medium">
                      {m.title}
                    </TableCell>
                    <TableCell className="text-content-secondary max-w-[160px] truncate text-[13px]">
                      {m.project_name}
                    </TableCell>
                    <TableCell className="text-content-secondary text-[13px] tabular-nums">
                      {formatApiDate(m.due_date)}
                    </TableCell>
                    <TableCell className="text-content-primary text-[13px] font-semibold tabular-nums">
                      {formatMoney(m.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={m.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
