"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      // Figma toast spec — 10px radius, soft shadow, 19% colored border
      style={
        {
          "--normal-bg": "var(--color-surface-white)",
          "--normal-text": "var(--color-content-primary)",
          "--normal-border": "var(--color-stroke-default)",
          "--border-radius": "10px",
          "--success-bg": "#ecfdf5",
          "--success-border": "rgba(16,185,129,0.19)",
          "--success-text": "#065f46",
          "--warning-bg": "#fef3c7",
          "--warning-border": "rgba(245,158,11,0.19)",
          "--warning-text": "#92400e",
          "--error-bg": "#fee2e2",
          "--error-border": "rgba(239,68,68,0.19)",
          "--error-text": "#991b1b",
          "--info-bg": "#eff6ff",
          "--info-border": "rgba(59,130,246,0.19)",
          "--info-text": "#1e40af",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group/toast text-xs font-medium shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]",
          icon: "size-4 shrink-0",
         
        },
        closeButton: false,
      }}
      {...props}
    />
  )
}

export { Toaster }
