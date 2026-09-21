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
} as const
