"use client";

import { useTranslations } from "next-intl";

type OnboardingProgressProps = Readonly<{
  current: number;
  total: number;
}>;

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const t = useTranslations("Onboarding");
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="flex w-full flex-col gap-2">
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={t("stepProgress", { current, total })}
        className="bg-muted relative h-1 w-full overflow-hidden rounded-full"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-content-quaternary font-mono text-[11px] leading-[15.4px] font-normal">
        {t("stepProgress", { current, total })}
      </p>
    </div>
  );
}
