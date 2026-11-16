"use client"

import { useState } from "react"
import { Award, CheckCircle2, TriangleAlert } from "lucide-react"

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
  { label: string; variant: "success" | "warning" | "danger" | "neutral"; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    variant: "success",
    icon: <CheckCircle2 strokeWidth={2} />,
  },
  expiring_soon: {
    label: "Expiring Soon",
    variant: "warning",
    icon: <TriangleAlert strokeWidth={2} />,
  },
  expired: {
    label: "Expired",
    variant: "danger",
    icon: <TriangleAlert strokeWidth={2} />,
  },
  revoked: {
    label: "Revoked",
    variant: "neutral",
    icon: <TriangleAlert strokeWidth={2} />,
  },
}

const STATUS_FILTERS: { id: TrainingCertStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "expiring_soon", label: "Expiring Soon" },
  { id: "expired", label: "Expired" },
]

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

function employeeLabel(cert: TrainingCertification) {
  return cert.employee_name ?? "Employee"
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CertificationsTab() {
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
              {f.label}
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
                Certification Renewal Alert
              </h4>
              <p className="text-sm leading-5 text-brand-warning">
                {counts.expiring_soon} certification(s) expiring within 90 days and{" "}
                {counts.expired} expired. Schedule renewal for affected employees.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {atRisk.map((c) => (
                <span
                  key={c.cert_id}
                  className="inline-flex items-center gap-1 rounded-lg border border-stroke-default bg-surface-white px-2.5 py-1 text-xs text-content-secondary"
                >
                  {employeeLabel(c)} — {c.cert_name}
                  {c.status === "expired" && (
                    <span className="font-medium text-brand-danger">(Expired)</span>
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
            Employee Certifications
          </h3>
          <p className="text-sm leading-5 text-content-tertiary">
            Track professional certifications across the organisation.
          </p>
        </div>

        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Employee</TableHead>
                <TableHead className={HEAD_CLASS}>Certification</TableHead>
                <TableHead className={HEAD_CLASS}>Issuing Body</TableHead>
                <TableHead className={HEAD_CLASS}>Obtained</TableHead>
                <TableHead className={HEAD_CLASS}>Expiry</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
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
                      ? "Couldn't load certifications. Please try again."
                      : "No certifications match the current filter."}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((cert) => {
                  const st = STATUS_CFG[cert.status] ?? STATUS_CFG.active
                  return (
                    <TableRow key={cert.cert_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="default"
                            alt={employeeLabel(cert)}
                            color="neutral"
                          />
                          <span className="text-sm font-medium text-content-primary">
                            {employeeLabel(cert)}
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
                          {st.label}
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
