"use client"

import type { TrackingEvent, TrackingPayload } from "./types"

const VISITOR_KEY = "erp_visitor_id"
const SESSION_KEY = "erp_tracking_session"
const ENDPOINT = "/api/tracking/event"
const FLUSH_INTERVAL_MS = 10_000

let queue: TrackingEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listenersBound = false

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value)
  } catch {
    // Private mode / blocked storage — tracking degrades to per-page-load ids.
  }
}

/**
 * Stable per-browser id. Falls back to a fresh id each load when localStorage
 * is unavailable, which is preferable to dropping the visitor entirely.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return ""
  const existing = safeGet(window.localStorage, VISITOR_KEY)
  if (existing) return existing
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  safeSet(window.localStorage, VISITOR_KEY, id)
  return id
}

function buildPayload(events: TrackingEvent[]): string {
  const payload: TrackingPayload = { visitorId: getVisitorId(), events }
  return JSON.stringify(payload)
}

/**
 * `useBeacon` is set on page hide, where `fetch` is routinely cancelled by the
 * browser. `sendBeacon` posts as text/plain, which the route handler accounts for.
 */
function send(events: TrackingEvent[], useBeacon: boolean): void {
  if (events.length === 0) return
  const body = buildPayload(events)

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const delivered = navigator.sendBeacon(ENDPOINT, body)
    if (delivered) return
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Tracking must never surface an error to the visitor.
  })
}

export function flush(useBeacon = false): void {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  const pending = queue
  queue = []
  send(pending, useBeacon)
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS)
}

export function track(event: TrackingEvent): void {
  if (typeof window === "undefined") return
  queue.push(event)
  // Identity and funnel milestones are low-volume and high-value — don't let
  // them sit in the buffer waiting for a page view that may never come.
  if (event.type === "identify" || event.type === "onboarding-complete") {
    flush(false)
    return
  }
  scheduleFlush()
}

export function now(): string {
  return new Date().toISOString()
}

/** Emits `session-start` once per tab session. */
export function startSession(): void {
  if (typeof window === "undefined") return
  if (safeGet(window.sessionStorage, SESSION_KEY)) return
  safeSet(window.sessionStorage, SESSION_KEY, "1")
  track({ type: "session-start", at: now() })
}

export function bindUnloadFlush(): () => void {
  if (typeof window === "undefined" || listenersBound) return () => {}
  listenersBound = true

  const onHide = () => {
    if (document.visibilityState === "hidden") flush(true)
  }
  const onPageHide = () => flush(true)

  document.addEventListener("visibilitychange", onHide)
  window.addEventListener("pagehide", onPageHide)

  return () => {
    document.removeEventListener("visibilitychange", onHide)
    window.removeEventListener("pagehide", onPageHide)
    listenersBound = false
  }
}
