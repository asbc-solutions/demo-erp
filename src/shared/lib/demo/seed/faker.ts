/**
 * Tiny deterministic generators for demo fixtures.
 *
 * Deterministic matters: the same prospect walking the demo twice should see the
 * same numbers, and a screenshot taken today should still match next week.
 */

export function makeRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 1_000_000) / 1_000_000
  }
}

export function pick<T>(rand: () => number, values: readonly T[]): T {
  return values[Math.floor(rand() * values.length) % values.length]
}

export function intBetween(rand: () => number, min: number, max: number): number {
  return Math.floor(min + rand() * (max - min + 1))
}

export function moneyBetween(
  rand: () => number,
  min: number,
  max: number,
  step = 50,
): number {
  return Math.round((min + rand() * (max - min)) / step) * step
}

/** A fixed "today" keeps relative dates stable across sessions. */
export const DEMO_TODAY = new Date("2026-09-16T09:00:00.000Z")

export function isoDay(offsetDays: number): string {
  const d = new Date(DEMO_TODAY)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function isoDateTime(offsetHours: number): string {
  const d = new Date(DEMO_TODAY)
  d.setUTCHours(d.getUTCHours() + offsetHours)
  return d.toISOString()
}

export function monthLabels(count: number): string[] {
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]
  const out: string[] = []
  const start = DEMO_TODAY.getUTCMonth() - (count - 1)
  for (let i = 0; i < count; i += 1) {
    out.push(names[(((start + i) % 12) + 12) % 12])
  }
  return out
}

export const FIRST_NAMES = [
  "Omar", "Laila", "Youssef", "Nour", "Karim", "Hana", "Tarek", "Salma",
  "Adam", "Mariam", "Hassan", "Dina", "Ziad", "Farah", "Amir", "Rana",
  "Khaled", "Yasmin", "Sherif", "Mona", "Bassel", "Noha", "Ahmed", "Reem",
] as const

export const LAST_NAMES = [
  "Ibrahim", "Adel", "Mansour", "Hafez", "Saleh", "Fawzy", "Nasser", "Rashid",
  "Zaki", "Darwish", "Kamal", "Halim", "Sabry", "Gaber", "Lotfy", "Shafik",
] as const

export function personName(rand: () => number): string {
  return `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
}

export function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@nucleus-demo.com`
}

export const COMPANY_NAMES = [
  "Delta Logistics", "Cairo Metalworks", "NileSoft", "Horizon Retail",
  "Blue Harbour Foods", "Atlas Manufacturing", "Vertex Energy", "Orbit Media",
  "Sahara Textiles", "Pyramid Pharma", "Riverstone Group", "Lighthouse Legal",
  "Cedar Analytics", "Northwind Trading", "Emerald Construction", "Kite Mobility",
] as const

export const DEPARTMENTS = [
  "Engineering", "Sales", "Marketing", "Finance", "Operations",
  "People", "Customer Success", "Legal",
] as const

export const BRANCHES = [
  "Cairo HQ", "Alexandria", "Giza", "Dubai", "Riyadh",
] as const

export const JOB_TITLES = [
  "Software Engineer", "Senior Engineer", "Engineering Manager",
  "Account Executive", "Sales Manager", "Marketing Specialist",
  "Financial Analyst", "Accountant", "Operations Lead",
  "HR Generalist", "Recruiter", "Support Specialist",
  "Product Manager", "Designer", "Data Analyst",
] as const
