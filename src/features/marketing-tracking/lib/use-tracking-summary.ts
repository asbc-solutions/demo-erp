"use client"

import { useQuery } from "@tanstack/react-query"

import type { TrackingSummary } from "./types"

const REFRESH_INTERVAL_MS = 30_000

/**
 * Reads the dashboard feed from this app's own route handler.
 *
 * Deliberately plain `fetch`, not the shared `httpClient` — that instance is
 * wired to the offline demo adapter and would never reach the server.
 */
async function fetchSummary(): Promise<TrackingSummary> {
  const response = await fetch("/api/tracking/summary", { cache: "no-store" })
  if (!response.ok) throw new Error(`Tracking summary failed (${response.status})`)
  return (await response.json()) as TrackingSummary
}

export function useTrackingSummary() {
  return useQuery({
    queryKey: ["marketing-tracking", "summary"],
    queryFn: fetchSummary,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })
}
