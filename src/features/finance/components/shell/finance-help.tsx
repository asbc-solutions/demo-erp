"use client"

import * as React from "react"
import { CircleHelp } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"

const SHORTCUTS = [
  { keys: ["/"], action: "Focus search" },
  { keys: ["↑", "↓"], action: "Move between rows in a table" },
  { keys: ["Enter"], action: "Open the focused row" },
  { keys: ["Space"], action: "Select the focused row" },
  { keys: ["Esc"], action: "Close a dialog or drawer" },
]

/** Toolbar help: the module's keyboard shortcuts, and an honest note about documentation. */
function FinanceHelp() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label="Help and keyboard shortcuts" onClick={() => setOpen(true)}>
        <CircleHelp aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Help</DialogTitle>
            <DialogDescription>The shortcuts below work anywhere in the module.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <dl className="border-stroke-default divide-stroke-light divide-y rounded-lg border">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.action} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className="border-stroke-input bg-surface-hover text-content-primary min-w-6 rounded-sm border px-1.5 py-0.5 text-center font-mono text-xs">
                        {key}
                      </kbd>
                    ))}
                  </dt>
                  <dd className="text-content-secondary text-[13px] leading-5">{shortcut.action}</dd>
                </div>
              ))}
            </dl>
            <p className="text-content-tertiary text-[13px] leading-5">
              This build is a prototype. There is no product documentation behind this button yet, and it says so rather than
              opening an empty page.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { FinanceHelp }
