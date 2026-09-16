"use client";

import * as React from "react";

import { cn } from "@/src/shared/lib/utils/utils";

import { TEAM_SIZES, type TeamSizeId } from "../options";
import { OnboardingButton } from "../onboarding-button";
import { StepBackButton } from "./step-back-button";

type TeamSizeStepProps = Readonly<{
  defaultValue?: TeamSizeId;
  onBack: () => void;
  onSubmit: (teamSize: TeamSizeId) => void;
}>;

export function TeamSizeStep({
  defaultValue,
  onBack,
  onSubmit,
}: TeamSizeStepProps) {
  const [teamSize, setTeamSize] = React.useState<TeamSizeId | undefined>(
    defaultValue,
  );
  const isValid = Boolean(teamSize);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!teamSize) return;
        onSubmit(teamSize);
      }}
    >
      <StepBackButton onClick={onBack} />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-content-primary text-[31px] leading-[37.2px] font-bold">
          How big is your team?
        </h2>
        <p className="text-content-tertiary text-base leading-6 font-normal">
          We&apos;ll tailor the People module for your team size.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEAM_SIZES.map((opt) => {
          const selected = teamSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTeamSize(opt.id)}
              className={cn(
                "bg-surface-white flex flex-col items-center gap-1 rounded-2xl border px-4 pt-4 pb-4 text-center transition-all",
                "hover:border-brand-primary/40 hover:bg-brand-primary/5",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                selected
                  ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_1px_var(--color-brand-primary)]"
                  : "border-stroke-default",
              )}
            >
              <span className="font-heading text-content-primary text-[31px] leading-[37.2px] font-bold">
                {opt.count}
              </span>
              <span className="text-content-tertiary text-[11px] leading-[15.4px] font-normal">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>

      <OnboardingButton type="submit" disabled={!isValid}>
        Continue
      </OnboardingButton>
    </form>
  );
}
