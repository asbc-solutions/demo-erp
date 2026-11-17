import { createNavigation } from "next-intl/navigation"

import { routing } from "./routing"

/**
 * Locale-aware replacements for `next/link` and `next/navigation`. Always import
 * `Link`, `redirect`, `usePathname` and `useRouter` from here: hrefs stay
 * locale-less (`/finance`) and the active locale prefix is added for you, and
 * `usePathname` returns the path without the prefix.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
