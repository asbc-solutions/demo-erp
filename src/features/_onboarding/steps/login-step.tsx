"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

import { PasswordInput } from "@/src/shared/components/ui/password-input";

import { OnboardingButton } from "../onboarding-button";
import { OnboardingLogo } from "../onboarding-logo";
import { OnboardingField, onboardingInputClass } from "../onboarding-field";

type LoginStepProps = Readonly<{
  onSuccess: () => Promise<void> | void;
  isSubmitting?: boolean;
}>;

export function LoginStep({ onSuccess, isSubmitting = false }: LoginStepProps) {
  const t = useTranslations("OnboardingLogin");
  const tOnboarding = useTranslations("Onboarding");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const isValid = email.trim().length > 2 && password.length >= 6;
  const isBusy = isPending || isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isBusy) return;

    setError(null);
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("invalidCredentials"));
        setIsPending(false);
        return;
      }

      await onSuccess();
    } catch {
      setError(t("signInUnavailable"));
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col items-center gap-3" onSubmit={handleSubmit}>
      <OnboardingLogo />

      <div className="flex flex-col items-center pt-3">
        <h1 className="font-heading text-content-primary text-center text-[39px] leading-[42.9px] font-bold">
          {tOnboarding.rich("heroTitle", { br: () => <br /> })}
        </h1>
        <p className="text-content-tertiary pt-3 pb-5 text-center text-xl leading-7 font-normal">
          {tOnboarding("heroSubtitle")}
        </p>
      </div>

      <div className="border-stroke-default bg-surface-white flex w-full flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <OnboardingField id="onboarding-email" label={tOnboarding("emailLabel")}>
          <input
            id="onboarding-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={onboardingInputClass}
          />
        </OnboardingField>

        <OnboardingField id="onboarding-password" label={tOnboarding("passwordLabel")}>
          <PasswordInput
            id="onboarding-password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${onboardingInputClass} pe-10`}
          />
        </OnboardingField>
      </div>

      {error && <p role="alert" className="text-brand-danger w-full text-center text-sm">{error}</p>}

      <OnboardingButton
        type="submit"
        variant="compact"
        disabled={!isValid || isBusy}
        className="mt-2"
      >
        {isSubmitting
          ? tOnboarding("settingUpWorkspace")
          : isPending
            ? t("signingIn")
            : tOnboarding("continue")}
      </OnboardingButton>
    </form>
  );
}
