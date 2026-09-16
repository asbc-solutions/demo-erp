import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { Spinner } from "@/src/shared/components/ui/spinner"
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/src/shared/components/ui/table"

/** Full-panel centered spinner — use for page-level or detail-view loading. */
export function HrPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner className="text-brand-primary size-6" />
    </div>
  )
}

/** Inline centered spinner — use inside cards/sections. */
export function HrSectionSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <Spinner className="text-content-tertiary size-5" />
    </div>
  )
}

/** Skeleton rows for the employee table. */
export function HrTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="pl-6">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-14 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="pr-6 text-right">
            <Skeleton className="ml-auto h-7 w-7 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

/** Skeleton rows for an org-panel list (branches / departments). */
export function HrOrgListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <li key={i} className="flex items-center gap-3 rounded-[10px] px-2 py-2">
          <Skeleton className="size-4 shrink-0 rounded" />
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </li>
      ))}
    </>
  )
}
