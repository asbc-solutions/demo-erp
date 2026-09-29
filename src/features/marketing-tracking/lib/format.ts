import type { ModuleId } from "@/src/shared/lib/constants/modules"

import type { VisitorRecord } from "./types"

export function formatDuration(ms: number): string {
  if (!ms || ms < 1_000) return "0s"
  const totalSeconds = Math.round(ms / 1_000)
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"
  const diff = Date.now() - then
  if (diff < 60_000) return "just now"
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function initialsFor(visitor: VisitorRecord): string {
  const source = visitor.name ?? visitor.email ?? visitor.company ?? "?"
  const parts = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function displayName(visitor: VisitorRecord): string {
  return visitor.name ?? visitor.email ?? "Anonymous visitor"
}

export function modulesExplored(visitor: VisitorRecord): number {
  return Object.values(visitor.modules).filter((stat) => stat && stat.views > 0).length
}

/** The module a visitor spent the most views on — their strongest signal of intent. */
export function topModule(
  visitor: VisitorRecord,
): { moduleId: ModuleId; views: number } | null {
  let best: { moduleId: ModuleId; views: number } | null = null
  for (const [moduleId, stat] of Object.entries(visitor.modules)) {
    if (!stat || stat.views === 0) continue
    if (!best || stat.views > best.views) {
      best = { moduleId: moduleId as ModuleId, views: stat.views }
    }
  }
  return best
}

export function toCsv(visitors: VisitorRecord[], moduleIds: readonly ModuleId[]): string {
  const header = [
    "name",
    "email",
    "phone",
    "company",
    "industry",
    "stage",
    "team_size",
    "tools",
    "first_seen",
    "last_seen",
    "sessions",
    "total_views",
    "total_time_seconds",
    ...moduleIds.map((id) => `${id}_views`),
  ]

  const quote = (text: string) =>
    /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text

  /**
   * Excel reads a cell opening with =, +, - or @ as a formula. Since name and
   * company are typed by the visitor, that is how a spreadsheet export becomes
   * a script that runs when the sales team opens it, so such cells get a
   * leading apostrophe to pin them to text.
   */
  const escape = (value: unknown) => {
    const raw = value === null || value === undefined ? "" : String(value)
    return quote(/^[=+@-]/.test(raw) ? `'${raw}` : raw)
  }

  /**
   * Excel keeps a CSV apostrophe visible and would otherwise mangle
   * "+201011274604" into 2.01011E+11 (dropping any leading 0). Emitting the
   * number as a ="…" string formula shows it verbatim as text; stripping it to
   * digits and "+" first keeps that formula inert.
   */
  const phoneCell = (value: string | null | undefined) => {
    const digits = (value ?? "").replace(/[^\d+]/g, "")
    return digits ? quote(`="${digits}"`) : ""
  }

  const rows = visitors.map((visitor) =>
    [
      escape(visitor.name),
      escape(visitor.email),
      phoneCell(visitor.phone),
      ...[
        visitor.company,
        visitor.onboarding?.industry,
        visitor.onboarding?.stage,
        visitor.onboarding?.teamSize,
        visitor.onboarding?.tools.join(" | "),
        visitor.firstSeenAt,
        visitor.lastSeenAt,
        visitor.sessions,
        visitor.totalViews,
        Math.round(visitor.totalMs / 1_000),
        ...moduleIds.map((id) => visitor.modules[id]?.views ?? 0),
      ].map(escape),
    ].join(","),
  )

  return [header.join(","), ...rows].join("\n")
}
