import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"

export const proxy = createMiddleware(routing)

export const config = {
  // Every route except API handlers, Next internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
