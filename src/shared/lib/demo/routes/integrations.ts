import { collection, defineCollection, findRow } from "../demo-db"
import { route, type DemoRoute } from "../demo-router"
import { INTEGRATION_ROWS } from "../seed/modules"
import { isoDateTime } from "../seed/faker"

defineCollection("integrations", () => [...INTEGRATION_ROWS])

function summarise() {
  const rows = collection("integrations")
  return {
    available: rows.length,
    connected: rows.filter((r) => r.is_connected).length,
    errored: rows.filter((r) => r.status === "error").length,
  }
}

export const integrationsRoutes: DemoRoute[] = [
  route("get", "/integrations", () => ({
    data: collection("integrations"),
    meta: { summary: summarise() },
  })),

  route("post", "/integrations/:id/connect", (req) => {
    const row = findRow("integrations", req.vars.id)
    if (row) {
      row.status = "connected"
      row.status_label = "Connected"
      row.is_connected = true
      row.connected_at = isoDateTime(0)
      row.disconnected_at = null
      row.external_account_ref =
        (req.body.external_account_ref as string) ?? `acct_${Date.now()}`
      row.settings = (req.body.settings as Record<string, unknown>) ?? { environment: "live" }
      row.last_sync = { at: isoDateTime(0), status: "success", message: null }
    }
    return { data: row ?? null }
  }),

  route("post", "/integrations/:id/disconnect", (req) => {
    const row = findRow("integrations", req.vars.id)
    if (row) {
      row.status = "disconnected"
      row.status_label = "Disconnected"
      row.is_connected = false
      row.disconnected_at = isoDateTime(0)
      row.external_account_ref = null
      row.settings = {}
      row.last_sync = { at: null, status: null, message: null }
    }
    return { data: row ?? null }
  }),

  route("post", "/integrations/:id/sync", (req) => {
    const row = findRow("integrations", req.vars.id)
    if (row) {
      row.status = "connected"
      row.status_label = "Connected"
      row.last_sync = { at: isoDateTime(0), status: "success", message: null }
    }
    return { data: row ?? null }
  }),
]
