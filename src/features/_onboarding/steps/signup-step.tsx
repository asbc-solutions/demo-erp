"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useTranslations, type Messages } from "next-intl"
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

type ValidationKey = keyof Messages["OnboardingSignup"]["validation"]

/**
 * `registerSchema` is shared with the register API route, so its messages stay
 * English there. The form maps the ones it knows onto translated copy; anything
 * else (server-side field errors) is shown as received.
 */
const SCHEMA_MESSAGE_KEYS: Readonly<Record<string, ValidationKey>> = {
  "Name is required": "nameRequired",
  "Invalid email address": "invalidEmail",
  "Password must be at least 12 characters": "passwordMinLength",
  "Password must contain a lowercase letter": "passwordLowercase",
  "Password must contain an uppercase letter": "passwordUppercase",
  "Password must contain a symbol": "passwordSymbol",
  "Please confirm your password": "confirmPassword",
  "Passwords do not match": "passwordsMismatch",
}

export function SignupStep({
  onSuccess,
  onSignIn,
  isSubmitting = false,
}: SignupStepProps) {
  const t = useTranslations("OnboardingSignup")
  const tOnboarding = useTranslations("Onboarding")
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

  function fieldError(message: string | undefined): string | undefined {
    if (!message) return undefined
    const key = SCHEMA_MESSAGE_KEYS[message]
    return key ? t(`validation.${key}`) : message
  }

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
      setFormError(t("serverUnreachable"))
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
      setFormError(result.message ?? t("createFailed"))
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
      setFormError(t("accountReady"))
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
          {t("title")}
        </h1>
        <p className="text-content-tertiary pt-3 pb-5 text-center text-xl leading-7 font-normal">
          {t("subtitle")}
        </p>
      </div>

      <div className="border-stroke-default bg-surface-white flex w-full flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <OnboardingField
          id="signup-name"
          label={t("fullNameLabel")}
          error={fieldError(errors.name?.message)}
        >
          <input
            id="signup-name"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            aria-invalid={Boolean(errors.name) || undefined}
            className={cn(onboardingInputClass)}
            {...form.register("name")}
          />
        </OnboardingField>

        <OnboardingField
          id="signup-email"
          label={tOnboarding("emailLabel")}
          error={fieldError(errors.email?.message)}
        >
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
          label={tOnboarding("passwordLabel")}
          hint={t("passwordHint")}
          error={fieldError(errors.password?.message)}
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
          label={t("confirmPasswordLabel")}
          error={fieldError(errors.password_confirmation?.message)}
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
          ? tOnboarding("settingUpWorkspace")
          : isValidating
            ? t("creatingAccount")
            : t("createAccount")}
      </OnboardingButton>

      <p className="text-content-tertiary text-sm leading-5">
        {t.rich("alreadyHaveAccount", {
          signIn: (chunks) => (
            <button
              type="button"
              onClick={onSignIn}
              className="text-brand-primary cursor-pointer font-medium underline-offset-4 hover:underline"
            >
              {chunks}
            </button>
          ),
        })}
      </p>
    </form>
  )
}
