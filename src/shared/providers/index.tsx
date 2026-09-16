import React from "react";

import { Toaster } from "@/src/shared/components/ui/sonner";
import { TooltipProvider } from "@/src/shared/components/ui/tooltip";
import ReactQueryProvider from "./components/react-query.provider";
import NextAuthProvider from "./components/next-auth.provider";
import { PointerEventsGuard } from "./components/pointer-events-guard";
import { ThemeProvider } from "./components/theme-provider";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <NextAuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
            <PointerEventsGuard />
          </TooltipProvider>
        </ThemeProvider>
      </NextAuthProvider>
    </ReactQueryProvider>
  );
}