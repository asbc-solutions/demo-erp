"use client"

import { Link } from "@/src/i18n/navigation"
import { ChevronRight, Layers } from "lucide-react"

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

import { useWbsIndex } from "../../lib/queries/hierarchy"

export function WbsIndexView() {
  const { data: rows, isLoading, isError } = useWbsIndex()

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-brand-danger text-sm leading-5">
          Failed to load the WBS summary. Try again later.
        </p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-stroke-default flex items-center gap-2.5 border-b px-5 py-3.5">
        <Layers className="text-content-tertiary size-4" aria-hidden />
        <h2 className="text-content-primary text-base leading-6 font-semibold">
          Work Breakdown by Project
        </h2>
      </div>

      {!rows?.length ? (
        <p className="text-content-tertiary p-8 text-center text-sm leading-5">
          No projects with a work breakdown structure yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="text-end">Phases</TableHead>
              <TableHead className="text-end">Tasks</TableHead>
              <TableHead className="text-end">Levels</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.project_id}>
                <TableCell>
                  <Link
                    href={`/all-project/${row.project_id}`}
                    className="text-content-primary hover:text-brand-primary text-sm leading-5 font-medium"
                  >
                    {row.project_name}
                  </Link>
                </TableCell>
                <TableCell className="text-content-secondary text-end text-sm leading-5 tabular-nums">
                  {row.phases}
                </TableCell>
                <TableCell className="text-content-secondary text-end text-sm leading-5 tabular-nums">
                  {row.tasks}
                </TableCell>
                <TableCell className="text-content-secondary text-end text-sm leading-5 tabular-nums">
                  {row.levels}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/all-project/${row.project_id}`}
                    aria-label={`Open ${row.project_name}`}
                    className="text-content-tertiary hover:text-brand-primary inline-flex"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
