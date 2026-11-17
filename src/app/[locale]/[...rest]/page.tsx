import { notFound } from "next/navigation"

/** Sends unknown paths under a locale to `[locale]/not-found.tsx`, which has the locale's layout. */
export default function CatchAllPage() {
  notFound()
}
