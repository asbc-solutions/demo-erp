"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"

import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { useNumbering } from "../../lib/queries/configuration"
import type { ConfigTranslator, NumberingRow } from "../../lib/types/configuration"

function buildColumns(t: ConfigTranslator, locale: string): FinanceColumn<NumberingRow>[] {
  return [
    { id: "document", header: t("document"), cell: (row) => <span className="text-content-primary font-medium">{row.document}</span> },
    { id: "format", header: t("format"), cell: (row) => <span className="font-mono text-xs">{row.format}</span> },
    { id: "count", header: t("issued"), align: "end", cell: (row) => <span className="tabular-nums">{row.count.toLocaleString(locale)}</span> },
    { id: "next", header: t("nextNumber"), align: "end", cell: (row) => <span className="text-content-primary font-mono text-xs">{row.next}</span> },
  ]
}

/** 11.07 · Document numbering — one sequence per document type, read from the numbers in use. */
function NumberingPage() {
  const t = useTranslations("FinanceConfiguration")
  const locale = useIntlLocale()
  const columns = React.useMemo(() => buildColumns(t, locale), [t, locale])
  const { data, isError, refetch } = useNumbering()
  return (
    <>
      <FinancePageHeader title={t("numbering")} figure={data ? <HeaderFigure label={t("sequences")}>{data.length}</HeaderFigure> : null} />
      <FinancePageBody>
        <p className="text-content-secondary max-w-3xl text-[13px] leading-5">
          {t("numberingInfo")}
        </p>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <FinanceTable caption={t("documentNumbering")} columns={columns} rows={data} getRowId={(row) => row.id} />
        )}
      </FinancePageBody>
    </>
  )
}

export { NumberingPage }
