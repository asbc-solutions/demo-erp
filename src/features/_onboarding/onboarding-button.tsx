"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/src/shared/lib/utils/utils";

type OnboardingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Show the inline trailing arrow icon. */
  withArrow?: boolean;
  /** Size variant — 'default' renders full-width, 'compact' caps width at 320px. */
  variant?: "default" | "compact";
};

export function OnboardingButton({
  className,
  children,
  withArrow = true,
  disabled,
  variant = "default",
  ...props
}: OnboardingButtonProps) {
  return (
    <button
      type="button"
      data-slot="onboarding-button"
      data-variant={variant}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center gap-3 overflow-hidden rounded-lg px-3 py-2",
        "bg-gradient-to-r from-indigo-500 to-violet-500",
        "text-sm leading-[22.4px] font-medium text-white",
        "shadow-[0_10px_15px_-3px_rgba(99,102,241,0.2),0_4px_6px_-4px_rgba(99,102,241,0.2)]",
        "transition-all outline-none focus-visible:ring-3 focus-visible:ring-brand-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "enabled:hover:brightness-105 enabled:active:translate-y-px",
        variant === "default" ? "w-full" : "w-full max-w-[320px]",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {withArrow && (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-enabled:group-hover:translate-x-0.5"
          strokeWidth={2}
          suppressHydrationWarning
        />
      )}
    </button>
  );
}
