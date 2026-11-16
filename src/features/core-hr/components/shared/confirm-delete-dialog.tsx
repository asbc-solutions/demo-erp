"use client"

import { TriangleAlert, X } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"

type ConfirmDeleteDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  isPending?: boolean
  onConfirm: () => void
}>

/**
 * Shared destructive-confirmation modal (branch, department, job grade, …).
 * Matches the Figma design: left-aligned danger header with a top-right close,
 * right-aligned Cancel / Delete actions.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  isPending,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="block max-w-md p-6">
        <AlertDialogCancel
          aria-label="Close"
          className="text-content-tertiary hover:text-content-primary hover:bg-surface-hover absolute top-4 inset-e-4 inline-flex size-7 items-center justify-center rounded-lg border-0 bg-transparent p-0 shadow-none"
        >
          <X className="size-4" aria-hidden />
        </AlertDialogCancel>

        <div className="flex items-start gap-3 pe-6">
          <span
            aria-hidden
            className="bg-brand-danger/10 text-brand-danger flex size-9 shrink-0 items-center justify-center rounded-full"
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-brand-danger text-lg leading-7 font-semibold">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <AlertDialogCancel className="h-9 rounded-md px-4 text-sm font-semibold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            className="h-9 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
