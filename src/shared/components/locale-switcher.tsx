'use client'

import { useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/src/i18n/navigation'
import { routing, type Locale } from '@/src/i18n/routing'
import { Button } from '@/src/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu'
import { cn } from '@/src/shared/lib/utils/utils'

/** Switches the UI language in place, keeping the current path and query. */
function LocaleSwitcher({ className }: Readonly<{ className?: string }>) {
  // Translation
  const t = useTranslations('LocaleSwitcher')
  const activeLocale = useLocale()
  // Navigation
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // State
  const [isSwitching, startTransition] = useTransition()

  // Functions
  const switchLocale = (locale: Locale) => {
    const query = searchParams.toString()
    const href = query ? `${pathname}?${query}` : pathname
    startTransition(() => router.replace(href, { locale }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('label')}
          title={t('label')}
          disabled={isSwitching}
          className={cn(
            'size-9 rounded-lg text-content-tertiary hover:bg-surface-hover hover:text-content-primary',
            className,
          )}
        >
          <Languages strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {routing.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            lang={locale}
            onSelect={() => switchLocale(locale)}
            className="justify-between gap-3"
          >
            {t(locale)}
            {locale === activeLocale ? (
              <Check className="size-4 text-brand-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LocaleSwitcher }
