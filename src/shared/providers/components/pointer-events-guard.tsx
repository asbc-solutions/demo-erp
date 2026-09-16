"use client"

import { useEffect } from "react"

const OPEN_OVERLAY_SELECTOR =
  '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-state="open"][role="menu"], [data-state="open"][role="listbox"]'

/**
 * Defensive guard against a known Radix UI issue: overlapping modals (e.g. a
 * Dialog opened from a DropdownMenuItem's onSelect, or an AlertDialog stacked
 * on a Dialog) can race their focus-trap teardown/setup on fast pointer
 * interactions and leave `document.body.style.pointerEvents = "none"` stuck
 * after every modal has actually closed — freezing the whole page until a
 * hard refresh. This watches for that exact stuck signature (pointer-events
 * locked with nothing actually open) and clears it.
 */
export function PointerEventsGuard() {
  useEffect(() => {
    const clearIfStuck = () => {
      if (document.body.style.pointerEvents !== "none") return
      if (!document.querySelector(OPEN_OVERLAY_SELECTOR)) {
        document.body.style.pointerEvents = ""
      }
    }

    const observer = new MutationObserver(clearIfStuck)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
