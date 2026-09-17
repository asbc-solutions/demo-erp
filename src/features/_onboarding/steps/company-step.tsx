"use client";

import * as React from "react";

import { PhoneInput } from "@/src/shared/components/ui/phone-input";
import { isValidE164 } from "@/src/shared/components/ui/countries";

import { OnboardingButton } from "../onboarding-button";
import { OnboardingLogo } from "../onboarding-logo";
import { OnboardingField, onboardingInputClass } from "../onboarding-field";

export type CompanyStepValues = { companyName: string; phone: string };

type CompanyStepProps = Readonly<{
  defaultValue?: string;
  defaultPhone?: string;
  onSubmit: (values: CompanyStepValues) => void;
}>;

export function CompanyStep({
  defaultValue = "",
  defaultPhone = "",
  onSubmit,
}: CompanyStepProps) {
  const [name, setName] = React.useState(defaultValue);
  const [phone, setPhone] = React.useState(defaultPhone);
  const [phoneTouched, setPhoneTouched] = React.useState(false);

  const isPhoneValid = isValidE164(phone);
  const isValid = name.trim().length > 0 && isPhoneValid;
  // Only nag once they have moved on from the field or tried to submit.
  const phoneError =
    phoneTouched && !isPhoneValid ? "Enter a valid phone number." : undefined;

  return (
    <form
      className="flex flex-col items-center gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setPhoneTouched(true);
        if (!isValid) return;
        onSubmit({ companyName: name.trim(), phone });
      }}
      noValidate
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

      <div className="border-stroke-default bg-surface-white flex w-full flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <OnboardingField id="onboarding-company" label="What's your company name?">
          <input
            id="onboarding-company"
            autoComplete="organization"
            placeholder="Enter your company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className={onboardingInputClass}
          />
        </OnboardingField>

        <OnboardingField
          id="onboarding-phone"
          label="What's your phone number?"
          error={phoneError}
        >
          <PhoneInput
            id="onboarding-phone"
            name="phone"
            value={phone}
            required
            invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "onboarding-phone-error" : undefined}
            onValueChange={(next) => setPhone(next)}
            onBlur={() => setPhoneTouched(true)}
            className="bg-muted h-12 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-none"
          />
        </OnboardingField>
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
