"use client"

import { useState } from "react"
import { Award, CheckCircle2, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { useCertifications } from "../../lib/queries/training"
import type { TrainingCertification, TrainingCertStatus } from "../../lib/types"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  TrainingCertStatus,
  { variant: "success" | "warning" | "danger" | "neutral"; icon: React.ReactNode }
> = {
  active: {
    variant: "success",
    icon: <CheckCircle2 strokeWidth={2} />,
  },
  expiring_soon: {
    variant: "warning",
    icon: <TriangleAlert strokeWidth={2} />,
  },
  expired: {
    variant: "danger",
    icon: <TriangleAlert strokeWidth={2} />,
  },
  revoked: {
    variant: "neutral",
    icon: <TriangleAlert strokeWidth={2} />,
  },
}

const STATUS_FILTERS: { id: TrainingCertStatus | "all" }[] = [
  { id: "all" },
  { id: "active" },
  { id: "expiring_soon" },
  { id: "expired" },
]

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

function employeeLabel(cert: TrainingCertification, fallback: string) {
  return cert.employee_name ?? fallback
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CertificationsTab() {
  const t = useTranslations("HrTraining")
  const [filter, setFilter] = useState<TrainingCertStatus | "all">("all")

  const { data, isLoading, isError } = useCertifications({ per_page: 100 })
  const certs = data?.data ?? []

  const counts: Record<TrainingCertStatus, number> = {
    active: certs.filter((c) => c.status === "active").length,
    expiring_soon: certs.filter((c) => c.status === "expiring_soon").length,
    expired: certs.filter((c) => c.status === "expired").length,
    revoked: certs.filter((c) => c.status === "revoked").length,
  }

  const filtered = certs.filter((c) => filter === "all" || c.status === filter)
  const atRisk = certs.filter(
    (c) => c.status === "expiring_soon" || c.status === "expired",
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.id
          const count = f.id === "all" ? null : counts[f.id]
          return (
            <Button
              key={f.id}
              type="button"
              variant={active ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter(f.id)}
            >
              {t(`certStatus.${f.id}`)}
              {count !== null && (
                <Badge
                  variant="neutral"
                  className={cn(
                    "ms-1 px-1.5 tabular-nums",
                    active && "bg-white/20 text-white",
                  )}
                >
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Renewal alert */}
      {atRisk.length > 0 && (
        <div className="flex gap-4 rounded-[14px] border border-brand-warning/30 bg-brand-warning/5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-warning/15 text-brand-warning">
            <TriangleAlert className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-sm leading-5 font-semibold text-content-primary">
                {t("renewalAlertTitle")}
              </h4>
              <p className="text-sm leading-5 text-brand-warning">
                {t("renewalAlertBody", {
                  expiring: counts.expiring_soon,
                  expired: counts.expired,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {atRisk.map((c) => (
                <span
                  key={c.cert_id}
                  className="inline-flex items-center gap-1 rounded-lg border border-stroke-default bg-surface-white px-2.5 py-1 text-xs text-content-secondary"
                >
                  {employeeLabel(c, t("employeeFallback"))} — {c.cert_name}
                  {c.status === "expired" && (
                    <span className="font-medium text-brand-danger">
                      {t("expiredTag")}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table card */}
      <Card variant="elevated" className="gap-0">
        <div className="flex flex-col gap-1 p-6">
          <h3 className="text-lg leading-7 font-semibold text-content-primary">
            {t("employeeCertifications")}
          </h3>
          <p className="text-sm leading-5 text-content-tertiary">
            {t("employeeCertificationsSubtitle")}
          </p>
        </div>

        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t("colEmployee")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colCertification")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colIssuingBody")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colObtained")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colExpiry")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && (isError || filtered.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-content-tertiary"
                  >
                    {isError
                      ? t("certsLoadError")
                      : t("certsEmpty")}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((cert) => {
                  const status = cert.status in STATUS_CFG ? cert.status : "active"
                  const st = STATUS_CFG[status]
                  const employee = employeeLabel(cert, t("employeeFallback"))
                  return (
                    <TableRow key={cert.cert_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="default"
                            alt={employee}
                            color="neutral"
                          />
                          <span className="text-sm font-medium text-content-primary">
                            {employee}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-content-primary">
                          <Award
                            className="size-4 text-content-quaternary"
                            strokeWidth={1.75}
                          />
                          {cert.cert_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-content-tertiary">
                        {cert.issuing_body ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-content-tertiary">
                        {cert.obtained_date}
                      </TableCell>
                      <TableCell className="tabular-nums text-content-tertiary">
                        {cert.expiry_date ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="gap-1">
                          {st.icon}
                          {t(`certStatus.${status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
