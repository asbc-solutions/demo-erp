import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { MESSAGE_FILES } from "./message-files"
import { routing, type Locale } from "./routing"

async function loadMessages(locale: Locale) {
  const files = await Promise.all(
    MESSAGE_FILES.map(
      (file) =>
        import(`./messages/${locale}/${file}.json`) as Promise<{ default: Record<string, unknown> }>,
    ),
  )
  return Object.assign({}, ...files.map((file) => file.default))
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
