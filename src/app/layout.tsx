import {  Geist_Mono, Inter, DM_Sans } from "next/font/google"

import "./globals.css"
import { cn } from "@/src/shared/lib/utils/utils";
import Providers from "@/src/shared/providers";
import { TrackingListener } from "@/src/features/marketing-tracking/components/tracking-listener";


const dmSansHeading = DM_Sans({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, dmSansHeading.variable)}
    >
      <body>
        <Providers>
          <TrackingListener />
          {children}
        </Providers>
      </body>
    </html>
  )
}
