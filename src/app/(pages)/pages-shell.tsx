'use client'

import { Suspense } from 'react'

import LayoutHeader from '@/src/shared/components/layout-header'
import { LayoutHeaderProvider } from '@/src/shared/components/layout-header-context'
import LayoutSideBar from '@/src/shared/components/layout-side-bar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/src/shared/components/ui/sidebar'

const SIDEBAR_STYLE = {
  '--sidebar-width': '240px',
  '--sidebar-width-icon': '72px',
} as React.CSSProperties

export function PagesShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LayoutHeaderProvider>
      <SidebarProvider style={SIDEBAR_STYLE}>
        <Suspense fallback={null}>
          <LayoutSideBar />
        </Suspense>
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <LayoutHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </LayoutHeaderProvider>
  )
}
