import React from "react";

import { Toaster } from "@/src/shared/components/ui/sonner";
import { TooltipProvider } from "@/src/shared/components/ui/tooltip";
import ReactQueryProvider from "./components/react-query.provider";
import NextAuthProvider from "./components/next-auth.provider";
import { DirectionProvider } from "./components/direction-provider";
import { PointerEventsGuard } from "./components/pointer-events-guard";
import { ThemeProvider } from "./components/theme-provider";

export default function Providers({
  dir,
  children,
}: Readonly<{ dir: "ltr" | "rtl"; children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <NextAuthProvider>
        <ThemeProvider>
          <DirectionProvider dir={dir}>
            <TooltipProvider>
              {children}
              <Toaster
                dir={dir}
                position={dir === "rtl" ? "bottom-left" : "bottom-right"}
                richColors
                closeButton
              />
              <PointerEventsGuard />
            </TooltipProvider>
          </DirectionProvider>
        </ThemeProvider>
      </NextAuthProvider>
    </ReactQueryProvider>
  );
}
