"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold uppercase",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px] leading-4",
        sm: "size-7 text-[11px] leading-4",
        default: "size-8 text-xs leading-4",
        lg: "size-10 text-sm leading-5",
        xl: "size-12 text-base leading-6",
      },
      color: {
        primary: "bg-brand-primary text-white",
        success: "bg-brand-success text-white",
        warning: "bg-brand-warning text-white",
        danger: "bg-brand-danger text-white",
        info: "bg-brand-info text-white",
        neutral: "bg-surface-hover text-content-secondary",
      },
    },
    defaultVariants: {
      size: "default",
      color: "primary",
    },
  },
)

type AvatarProps = React.ComponentProps<"span"> &
  VariantProps<typeof avatarVariants> & {
    src?: string
    alt?: string
    fallback?: string
  }

function getInitials(name?: string) {
  if (!name) return ""
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function Avatar({
  className,
  size,
  color,
  src,
  alt,
  fallback,
  children,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = React.useState(false)
  const showImage = !!src && !hasError
  const initials = fallback ?? getInitials(alt)

  return (
    <span
      data-slot="avatar"
      className={cn(avatarVariants({ size, color }), className)}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="size-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        (children ?? initials)
      )}
    </span>
  )
}

export { Avatar, avatarVariants, getInitials }
