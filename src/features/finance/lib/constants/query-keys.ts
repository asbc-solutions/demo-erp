/**
 * Root of every finance query key. Section keys extend `financeKeys.all` and
 * include the scope, so a mutation can refresh the whole module (nav badges
 * included) with `invalidateQueries({ queryKey: financeKeys.all })`.
 */
export const financeKeys = {
  all: ["finance"] as const,
  shell: {
    entities: () => [...financeKeys.all, "shell", "entities"] as const,
    periods: () => [...financeKeys.all, "shell", "periods"] as const,
    navCounts: () => [...financeKeys.all, "shell", "nav-counts"] as const,
    search: (q: string) => [...financeKeys.all, "shell", "search", q] as const,
  },
  masterData: {
    contacts: (kind?: string) => [...financeKeys.all, "master-data", "contacts", kind ?? "all"] as const,
    treasuries: () => [...financeKeys.all, "master-data", "treasuries"] as const,
  },
} as const
