"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { PasswordInput } from "@/src/shared/components/ui/password-input"
import { cn } from "@/src/shared/lib/utils/utils"
import {
  registerSchema,
  type RegisterFormValues,
} from "@/src/shared/lib/schema/auth"

import { OnboardingButton } from "../onboarding-button"
import { OnboardingLogo } from "../onboarding-logo"
import { OnboardingField, onboardingInputClass } from "../onboarding-field"

type SignupStepProps = Readonly<{
  /** Runs once the account exists and the session is established. */
  onSuccess: () => Promise<void> | void
  /** Escape hatch for someone who already has an account. */
  onSignIn: () => void
  isSubmitting?: boolean
}>

const FIELD_NAMES = [
  "name",
  "email",
  "password",
  "password_confirmation",
] as const

function isFieldName(key: string): key is (typeof FIELD_NAMES)[number] {
  return (FIELD_NAMES as readonly string[]).includes(key)
}

type RegisterErrorBody = {
  message?: string
  errors?: Record<string, string[]>
}

export function SignupStep({
  onSuccess,
  onSignIn,
  isSubmitting = false,
}: SignupStepProps) {
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  })

  const { errors, isSubmitting: isValidating } = form.formState
  const isBusy = isValidating || isSubmitting

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)

    let result: RegisterErrorBody & { ok?: boolean }
    let response: Response
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      result = (await response.json()) as RegisterErrorBody
    } catch {
      setFormError("Unable to reach the server. Please try again.")
      return
    }

    if (!response.ok) {
      // "email has already been taken" belongs on the email input, not in a
      // banner the user has to map back to a field themselves.
      for (const [field, messages] of Object.entries(result.errors ?? {})) {
        if (isFieldName(field) && messages?.[0]) {
          form.setError(field, { message: messages[0] })
        }
      }
      setFormError(result.message ?? "We couldn't create your account.")
      return
    }

    const signedIn = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (signedIn?.error) {
      // The account exists, so pushing them at sign-in is better than letting
      // them submit the form again and collide with their own email.
      setFormError("Your account is ready — please sign in to continue.")
      onSignIn()
      return
    }

    await onSuccess()
  }

  return (
    <form
      className="flex flex-col items-center gap-3"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <OnboardingLogo />

      <div className="flex flex-col items-center pt-3">
        <h1 className="font-heading text-content-primary text-center text-[39px] leading-[42.9px] font-bold">
          Create your account.
        </h1>
        <p className="text-content-tertiary pt-3 pb-5 text-center text-xl leading-7 font-normal">
          One last step before your workspace is ready.
        </p>
      </div>

      <div className="border-stroke-default bg-surface-white flex w-full flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <OnboardingField id="signup-name" label="Full name" error={errors.name?.message}>
          <input
            id="signup-name"
            autoComplete="name"
            placeholder="Islam Walied"
            aria-invalid={Boolean(errors.name) || undefined}
            className={cn(onboardingInputClass)}
            {...form.register("name")}
          />
        </OnboardingField>

        <OnboardingField id="signup-email" label="E-mail" error={errors.email?.message}>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email) || undefined}
            className={cn(onboardingInputClass)}
            {...form.register("email")}
          />
        </OnboardingField>

        <OnboardingField
          id="signup-password"
          label="Password"
          hint="12+ chars, mixed case, a symbol"
          error={errors.password?.message}
        >
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password) || undefined}
            className={cn(onboardingInputClass, "pe-10")}
            {...form.register("password")}
          />
        </OnboardingField>

        <OnboardingField
          id="signup-password-confirmation"
          label="Confirm password"
          error={errors.password_confirmation?.message}
        >
          <PasswordInput
            id="signup-password-confirmation"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password_confirmation) || undefined}
            className={cn(onboardingInputClass, "pe-10")}
            {...form.register("password_confirmation")}
          />
        </OnboardingField>
      </div>

      {formError && (
        <p role="alert" className="text-brand-danger w-full text-center text-sm">
          {formError}
        </p>
      )}

      <OnboardingButton
        type="submit"
        variant="compact"
        disabled={isBusy}
        className="mt-2"
      >
        {isSubmitting
          ? "Setting up your workspace…"
          : isValidating
            ? "Creating your account…"
            : "Create account"}
      </OnboardingButton>

      <p className="text-content-tertiary text-sm leading-5">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="text-brand-primary cursor-pointer font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}
