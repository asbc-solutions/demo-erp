"use client"

import { Direction } from "radix-ui"

/** Tells every Radix primitive (menus, tabs, sliders…) which way the page reads. */
function DirectionProvider({
  dir,
  children,
}: Readonly<{ dir: "ltr" | "rtl"; children: React.ReactNode }>) {
  return <Direction.Provider dir={dir}>{children}</Direction.Provider>
}

export { DirectionProvider }
