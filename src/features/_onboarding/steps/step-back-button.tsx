"use client";

import { ChevronLeft } from "lucide-react";

import { cn } from "@/src/shared/lib/utils/utils";

type StepBackButtonProps = Readonly<{
  onClick: () => void;
  className?: string;
}>;

export function StepBackButton({ onClick, className }: StepBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-content-quaternary hover:text-content-primary -ml-1 inline-flex w-fit items-center gap-1.5 rounded text-xs leading-[18px] font-normal transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
        className,
      )}
    >
      <ChevronLeft className="size-4" strokeWidth={2} suppressHydrationWarning />
      Back
    </button>
  );
}
