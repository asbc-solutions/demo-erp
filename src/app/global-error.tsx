"use client"

import "./globals.css"

/**
 * Replaces the root layout when it fails, so it renders its own <html> and
 * cannot rely on next-intl — both languages are shown.
 */
export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <html lang="en">
      <body className="bg-surface-page flex h-screen flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-content-primary text-2xl font-bold">Something went wrong</h1>
        <p lang="ar" dir="rtl" className="text-content-tertiary text-lg">
          حدث خطأ ما
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-brand-primary hover:bg-brand-primary-hover rounded-lg px-4 py-2 text-sm text-white"
        >
          Try again · حاول مرة أخرى
        </button>
      </body>
    </html>
  )
}
