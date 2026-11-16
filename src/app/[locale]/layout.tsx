import { DM_Sans, Geist_Mono, IBM_Plex_Sans_Arabic, Inter } from "next/font/google"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { setRequestLocale } from "next-intl/server"

import "../globals.css"
import { cn } from "@/src/shared/lib/utils/utils"
import Providers from "@/src/shared/providers"
import { TrackingListener } from "@/src/features/marketing-tracking/components/tracking-listener"
import { getLocaleDirection, routing } from "@/src/i18n/routing"

const latinHeading = DM_Sans({ subsets: ["latin"], variable: "--font-heading" })
const latinSans = Inter({ subsets: ["latin"], variable: "--font-sans" })
const arabicHeading = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
})
const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const dir = getLocaleDirection(locale)
  const fonts =
    dir === "rtl"
      ? [arabicSans.variable, arabicHeading.variable]
      : [latinSans.variable, latinHeading.variable]

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", fontMono.variable, ...fonts)}
    >
      <body>
        <NextIntlClientProvider>
          <Providers dir={dir}>
            <TrackingListener />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
