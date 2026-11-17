"use client"

import * as React from "react"
import { CircleHelp } from "lucide-react"
import { useTranslations } from "next-intl"

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
  { keys: ["/"], actionKey: "shortcutFocusSearch" },
  { keys: ["↑", "↓"], actionKey: "shortcutMoveRows" },
  { keys: ["Enter"], actionKey: "shortcutOpenRow" },
  { keys: ["Space"], actionKey: "shortcutSelectRow" },
  { keys: ["Esc"], actionKey: "shortcutCloseDialog" },
] as const

/** Toolbar help: the module's keyboard shortcuts, and an honest note about documentation. */
function FinanceHelp() {
  const t = useTranslations("FinanceShared")
  const tCommon = useTranslations("Common")
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button variant="ghost" size="icon-sm" aria-label={t("helpAriaLabel")} onClick={() => setOpen(true)}>
        <CircleHelp aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("helpTitle")}</DialogTitle>
            <DialogDescription>{t("helpDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <dl className="border-stroke-default divide-stroke-light divide-y rounded-lg border">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.actionKey} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className="border-stroke-input bg-surface-hover text-content-primary min-w-6 rounded-sm border px-1.5 py-0.5 text-center font-mono text-xs">
                        {key}
                      </kbd>
                    ))}
                  </dt>
                  <dd className="text-content-secondary text-[13px] leading-5">{t(shortcut.actionKey)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-content-tertiary text-[13px] leading-5">
              {t("helpPrototypeNote")}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { FinanceHelp }
