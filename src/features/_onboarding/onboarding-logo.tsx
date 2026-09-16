import { Zap } from "lucide-react";

import { cn } from "@/src/shared/lib/utils/utils";

type OnboardingLogoProps = Readonly<{
  size?: number;
  className?: string;
}>;

export function OnboardingLogo({ size = 80, className }: OnboardingLogoProps) {
  const iconSize = Math.round(size / 2);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Dark-mode extensions (Dark Reader) rewrite `stroke` on SVGs before React
          hydrates, so the icons mismatch on attributes we never rendered. */}
      <Zap
        style={{ width: iconSize, height: iconSize }}
        strokeWidth={2}
        className="fill-white"
        suppressHydrationWarning
      />
    </div>
  );
}
