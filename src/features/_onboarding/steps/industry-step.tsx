"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/src/shared/lib/utils/utils";

import { INDUSTRIES, STAGES, type IndustryId, type StageId } from "../options";
import { OnboardingButton } from "../onboarding-button";
import { StepBackButton } from "./step-back-button";

type IndustryStepProps = Readonly<{
  defaultIndustry?: IndustryId;
  defaultStage?: StageId;
  onBack: () => void;
  onSubmit: (values: { industry: IndustryId; stage: StageId }) => void;
}>;

export function IndustryStep({
  defaultIndustry,
  defaultStage,
  onBack,
  onSubmit,
}: IndustryStepProps) {
  const t = useTranslations("OnboardingIndustry");
  const tOnboarding = useTranslations("Onboarding");
  const [industry, setIndustry] = React.useState<IndustryId | undefined>(
    defaultIndustry,
  );
  const [stage, setStage] = React.useState<StageId | undefined>(defaultStage);
  const isValid = Boolean(industry) && Boolean(stage);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!industry || !stage) return;
        onSubmit({ industry, stage });
      }}
    >
      <StepBackButton onClick={onBack} className="text-content-tertiary" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-content-primary text-[31px] leading-[37.2px] font-bold">
          {t("title")}
        </h2>
        <p className="text-content-tertiary text-base leading-6 font-normal">
          {t("subtitle")}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-content-primary text-xs leading-[18px] font-medium">
          {t("industryLegend")}
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INDUSTRIES.map((opt) => {
            const selected = industry === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setIndustry(opt.id)}
                className={cn(
                  "bg-surface-white flex flex-col items-center gap-1 rounded-2xl border px-3 pt-3 pb-3.5 text-center transition-all",
                  "hover:border-brand-primary/40 hover:bg-brand-primary/5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                  selected
                    ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_1px_var(--color-brand-primary)]"
                    : "border-stroke-default",
                )}
              >
                <span className="text-[25px] leading-[32.5px]" aria-hidden>
                  {opt.emoji}
                </span>
                <span className="text-content-primary text-[11px] leading-[15.4px] font-medium">
                  {t(`industries.${opt.id}`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-content-primary text-xs leading-[18px] font-medium">
          {t("stageLegend")}
        </legend>
        <div className="flex flex-col gap-2">
          {STAGES.map((opt) => {
            const selected = stage === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setStage(opt.id)}
                className={cn(
                  "bg-surface-white flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-start transition-all",
                  "hover:border-brand-primary/40 hover:bg-brand-primary/5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
                  selected
                    ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_0_1px_var(--color-brand-primary)]"
                    : "border-stroke-default",
                )}
              >
                <div className="flex flex-col">
                  <span className="text-content-primary text-base leading-6 font-medium">
                    {t(`stages.${opt.id}`)}
                  </span>
                  <span className="text-content-tertiary text-[11px] leading-[15.4px] font-normal">
                    {t(`stageDescriptions.${opt.id}`)}
                  </span>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "size-4 rounded-full border-2 transition-colors",
                    selected
                      ? "border-brand-primary bg-brand-primary shadow-[inset_0_0_0_3px_var(--color-background)]"
                      : "border-stroke-default",
                  )}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <OnboardingButton type="submit" disabled={!isValid}>
        {tOnboarding("continue")}
      </OnboardingButton>
    </form>
  );
}
