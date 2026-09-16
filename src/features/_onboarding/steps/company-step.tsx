"use client";

import * as React from "react";

import { OnboardingButton } from "../onboarding-button";
import { OnboardingLogo } from "../onboarding-logo";

type CompanyStepProps = Readonly<{
  defaultValue?: string;
  onSubmit: (companyName: string) => void;
}>;

export function CompanyStep({ defaultValue = "", onSubmit }: CompanyStepProps) {
  const [name, setName] = React.useState(defaultValue);
  const isValid = name.trim().length > 0;

  return (
    <form
      className="flex flex-col items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;
        onSubmit(name.trim());
      }}
    >
      <OnboardingLogo />

      <div className="flex flex-col items-center pt-3">
        <h1 className="font-heading text-content-primary text-center text-[39px] leading-[42.9px] font-bold">
          Your company&apos;s operating
          <br />
          system.
        </h1>
        <p className="text-content-tertiary pt-3 pb-5 text-center text-xl leading-7 font-normal">
          Built for founders who move fast.
        </p>
      </div>

      <div className="border-stroke-default bg-surface-white w-full rounded-2xl border p-6 shadow-sm">
        <label
          htmlFor="onboarding-company"
          className="text-content-tertiary text-xs leading-[18px] font-medium"
        >
          What&apos;s your company name?
        </label>
        <input
          id="onboarding-company"
          autoComplete="organization"
          placeholder="Enter your company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="border-stroke-default bg-muted text-content-primary placeholder:text-content-quaternary mt-2 h-12 w-full rounded-lg border px-3 text-base leading-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none transition-[border-color,box-shadow] focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/15 dark:shadow-none"
        />
      </div>

      <OnboardingButton
        type="submit"
        variant="compact"
        disabled={!isValid}
        className="mt-2"
      >
        Continue
      </OnboardingButton>
    </form>
  );
}
