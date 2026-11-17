'use client'

import * as React from 'react'
import { usePathname } from '@/src/i18n/navigation'

export type LayoutHeaderSubTitleEntry = {
  pathname: string
  label: string
}

type LayoutHeaderContextValue = {
  subTitle: LayoutHeaderSubTitleEntry | null
  setSubTitle: (subTitle: LayoutHeaderSubTitleEntry | null) => void
}

const LayoutHeaderContext = React.createContext<LayoutHeaderContextValue | null>(
  null,
)

export function LayoutHeaderProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [subTitle, setSubTitle] =
    React.useState<LayoutHeaderSubTitleEntry | null>(null)
  const value = React.useMemo(
    () => ({ subTitle, setSubTitle }),
    [subTitle],
  )
  return (
    <LayoutHeaderContext.Provider value={value}>
      {children}
    </LayoutHeaderContext.Provider>
  )
}

/** Tab label for the current route only (avoids stale labels after navigation). */
export function useLayoutHeaderTabLabel(pathname: string): string | null {
  const entry = React.useContext(LayoutHeaderContext)?.subTitle ?? null
  if (!entry) return null
  return entry.pathname === pathname ? entry.label : null
}

/** Registers the active inner tab label in the shell header; clears on unmount or when label is empty. */
export function useRegisterLayoutHeaderTab(tabLabel: string) {
  const pathname = usePathname()
  const setSubTitle = React.useContext(LayoutHeaderContext)?.setSubTitle
  React.useEffect(() => {
    if (!setSubTitle) return
    if (!tabLabel) {
      setSubTitle(null)
      return
    }
    setSubTitle({ pathname, label: tabLabel })
    return () => setSubTitle(null)
  }, [tabLabel, pathname, setSubTitle])
}
