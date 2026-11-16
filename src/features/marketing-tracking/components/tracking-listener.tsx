"use client"

import * as React from "react"
import { usePathname } from "@/src/i18n/navigation"
import { useSession } from "next-auth/react"

import { resolveModuleFromPath } from "@/src/shared/lib/constants/modules"

import {
  bindUnloadFlush,
  flush,
  now,
  startSession,
  track,
} from "../lib/tracker"

/** The dashboard must never appear in its own numbers. */
const EXCLUDED_PREFIX = "/markting-traking"

/**
 * Mounted once at the root layout so it covers both the public onboarding route
 * and the authenticated shell. Emits a `page-view` carrying the dwell time of
 * the page being *left*, so the first view of a session is recorded when the
 * visitor moves on (or on page hide).
 */
export function TrackingListener() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const previous = React.useRef<{ path: string; enteredAt: number } | null>(null)
  const identified = React.useRef<string | null>(null)

  // Whoever is reading the dashboard is the sales team, not a prospect. Every
  // effect below is gated on this so opening the dashboard doesn't register a
  // visitor of its own.
  const isExcluded = Boolean(pathname?.startsWith(EXCLUDED_PREFIX))

  React.useEffect(() => {
    if (isExcluded) return
    startSession()
    return bindUnloadFlush()
  }, [isExcluded])

  React.useEffect(() => {
    if (!pathname) return

    const emitPrevious = () => {
      const prev = previous.current
      if (!prev) return
      track({
        type: "page-view",
        at: now(),
        path: prev.path,
        module: resolveModuleFromPath(prev.path),
        ms: Date.now() - prev.enteredAt,
      })
      previous.current = null
    }

    emitPrevious()

    if (isExcluded) return

    previous.current = { path: pathname, enteredAt: Date.now() }

    // The pathname effect's cleanup does not run on a hard unload, so the final
    // page of a visit is flushed from the hide handler instead.
    const onHide = () => {
      if (document.visibilityState !== "hidden") return
      emitPrevious()
      flush(true)
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", onHide)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", onHide)
    }
  }, [pathname, isExcluded])

  React.useEffect(() => {
    if (isExcluded || status !== "authenticated") return
    const email = session?.user?.email ?? null
    const name = session?.user?.name ?? null
    if (!email && !name) return
    const key = `${name ?? ""}|${email ?? ""}`
    if (identified.current === key) return
    identified.current = key
    track({ type: "identify", at: now(), name, email })
  }, [isExcluded, status, session?.user?.email, session?.user?.name])

  return null
}
