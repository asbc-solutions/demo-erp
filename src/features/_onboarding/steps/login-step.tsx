"use client";

import * as React from "react";
import { signIn } from "next-auth/react";

import { OnboardingButton } from "../onboarding-button";
import { OnboardingLogo } from "../onboarding-logo";

type LoginStepProps = Readonly<{
  onSuccess: () => Promise<void> | void;
  isSubmitting?: boolean;
}>;

export function LoginStep({ onSuccess, isSubmitting = false }: LoginStepProps) {
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
        setError("Invalid email or password. Please try again.");
        setIsPending(false);
        return;
      }

      await onSuccess();
    } catch {
      setError("Unable to sign in right now. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col items-center gap-3" onSubmit={handleSubmit}>
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

      <div className="border-stroke-default bg-surface-white w-full rounded-2xl border shadow-sm">
        <FieldRow
          id="onboarding-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
        />
        <FieldRow
          id="onboarding-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
        />
      </div>

      {error && <p className="w-full text-center text-sm text-red-500">{error}</p>}

      <OnboardingButton
        type="submit"
        variant="compact"
        disabled={!isValid || isBusy}
        className="mt-2"
      >
        {isSubmitting
          ? "Setting up your workspace…"
          : isPending
            ? "Signing in…"
            : "Continue"}
      </OnboardingButton>
    </form>
  );
}

type FieldRowProps = Readonly<{
  id: string;
  label: string;
  type: React.HTMLInputTypeAttribute;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}>;

function FieldRow({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: FieldRowProps) {
  return (
    <div className="flex flex-col gap-2 p-6">
      <label htmlFor={id} className="text-content-tertiary text-xs leading-4.5 font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-stroke-default bg-muted text-content-primary placeholder:text-content-quaternary h-12 w-full rounded-lg border px-3 text-base leading-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none transition-[border-color,box-shadow] focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/15 dark:shadow-none"
      />
    </div>
  );
}
