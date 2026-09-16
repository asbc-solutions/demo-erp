"use client"

import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { PasswordInput } from "@/src/shared/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { MINIMUM_EMPLOYEE_AGE } from "../../../lib/schema/personal-info"
import type { Gender, NewEmployeeDraft } from "../../../types/employee"
import { StepShell } from "../step-shell"

type PersonalInfoStepProps = Readonly<{
  value: NewEmployeeDraft["personal"]
  onChange: (next: NewEmployeeDraft["personal"]) => void
  errors?: PersonalInfoErrors
  mode?: "add" | "edit"
}>

export type PersonalInfoField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "password"
  | "dateOfBirth"
  | "gender"
  | "nationality"
  | "nationalId"
  | "address"
  | "city"
  | "country"
  | "postalCode"

export type PersonalInfoErrors = Partial<Record<PersonalInfoField, string>>

/** Local-date "YYYY-MM-DD" for exactly `years` ago (no timezone drift). */
function isoYearsAgo(years: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Keep only characters valid in a phone number: digits, spaces, hyphens,
 * parentheses, and a single leading "+". Letters and other symbols are
 * dropped as they are typed or pasted.
 */
function sanitizePhone(raw: string) {
  const cleaned = raw.replace(/[^\d\s()+-]/g, "")
  // Allow "+" only as the first character.
  return cleaned.replace(/(?!^)\+/g, "")
}

function RequiredLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span>
      {children} <span className="text-brand-danger">*</span>
    </span>
  )
}

export function PersonalInfoStep({
  value,
  onChange,
  errors = {},
  mode = "add",
}: PersonalInfoStepProps) {
  const update =
    <K extends keyof NewEmployeeDraft["personal"]>(key: K) =>
    (next: NewEmployeeDraft["personal"][K]) =>
      onChange({ ...value, [key]: next })

  return (
    <StepShell
      title="Step 1: Personal Info"
      description="Enter basic personal information"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="firstName">
            <RequiredLabel>First Name</RequiredLabel>
          </FieldLabel>
          <Input
            id="firstName"
            placeholder="John"
            required
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            value={value.firstName ?? ""}
            onChange={(event) => update("firstName")(event.target.value)}
          />
          {errors.firstName && (
            <FieldError id="firstName-error">{errors.firstName}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="lastName">
            <RequiredLabel>Last Name</RequiredLabel>
          </FieldLabel>
          <Input
            id="lastName"
            placeholder="Smith"
            required
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            value={value.lastName ?? ""}
            onChange={(event) => update("lastName")(event.target.value)}
          />
          {errors.lastName && (
            <FieldError id="lastName-error">{errors.lastName}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">
            <RequiredLabel>Email</RequiredLabel>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="john.smith@company.com"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            value={value.email ?? ""}
            onChange={(event) => update("email")(event.target.value)}
          />
          {errors.email && (
            <FieldError id="email-error">{errors.email}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">
            <RequiredLabel>Phone</RequiredLabel>
          </FieldLabel>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+20 100 123 4567"
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            value={value.phone ?? ""}
            onChange={(event) =>
              update("phone")(sanitizePhone(event.target.value))
            }
          />
          {errors.phone && (
            <FieldError id="phone-error">{errors.phone}</FieldError>
          )}
        </Field>
      </div>

      {mode === "add" && (
        <Field>
          <FieldLabel htmlFor="password">
            <RequiredLabel>Password</RequiredLabel>
          </FieldLabel>
          <PasswordInput
            id="password"
            placeholder="****************"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            value={value.password ?? ""}
            onChange={(event) =>
              onChange({ ...value, password: event.target.value })
            }
          />
          {errors.password && (
            <FieldError id="password-error">{errors.password}</FieldError>
          )}
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="dateOfBirth">
            <RequiredLabel>Date of Birth</RequiredLabel>
            <span className="text-content-quaternary ml-1 text-[11px] font-normal">
              {MINIMUM_EMPLOYEE_AGE}+ years
            </span>
          </FieldLabel>
          <Input
            id="dateOfBirth"
            type="date"
            max={isoYearsAgo(MINIMUM_EMPLOYEE_AGE)}
            required
            aria-invalid={Boolean(errors.dateOfBirth)}
            aria-describedby={
              errors.dateOfBirth ? "dateOfBirth-error" : undefined
            }
            value={value.dateOfBirth ?? ""}
            onChange={(event) => update("dateOfBirth")(event.target.value)}
          />
          {errors.dateOfBirth && (
            <FieldError id="dateOfBirth-error">
              {errors.dateOfBirth}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="gender">
            <RequiredLabel>Gender</RequiredLabel>
          </FieldLabel>
          <Select
            value={value.gender}
            onValueChange={(next) => update("gender")(next as Gender)}
          >
            <SelectTrigger
              id="gender"
              aria-invalid={Boolean(errors.gender)}
              aria-describedby={errors.gender ? "gender-error" : undefined}
            >
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <FieldError id="gender-error">{errors.gender}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="nationality">
            <RequiredLabel>Nationality</RequiredLabel>
            <span className="text-content-quaternary ml-1 text-[11px] font-normal">
              ISO-3 code
            </span>
          </FieldLabel>
          <Input
            id="nationality"
            placeholder="EGY"
            maxLength={3}
            className="uppercase"
            required
            aria-invalid={Boolean(errors.nationality)}
            aria-describedby={
              errors.nationality ? "nationality-error" : undefined
            }
            value={value.nationality ?? ""}
            onChange={(event) =>
              update("nationality")(event.target.value.toUpperCase().slice(0, 3))
            }
          />
          {errors.nationality && (
            <FieldError id="nationality-error">
              {errors.nationality}
            </FieldError>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="nationalId">
          <RequiredLabel>National ID</RequiredLabel>
        </FieldLabel>
        <Input
          id="nationalId"
          placeholder="ID number"
          required
          aria-invalid={Boolean(errors.nationalId)}
          aria-describedby={
            errors.nationalId ? "nationalId-error" : undefined
          }
          value={value.nationalId ?? ""}
          onChange={(event) => update("nationalId")(event.target.value)}
        />
        {errors.nationalId && (
          <FieldError id="nationalId-error">{errors.nationalId}</FieldError>
        )}
      </Field>

      {mode === "add" && (
        <Field>
          <FieldLabel htmlFor="address">
            <RequiredLabel>Address</RequiredLabel>
          </FieldLabel>
          <Textarea
            id="address"
            rows={2}
            placeholder="Full address"
            required
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "address-error" : undefined}
            value={value.address ?? ""}
            onChange={(event) => update("address")(event.target.value)}
          />
          {errors.address && (
            <FieldError id="address-error">{errors.address}</FieldError>
          )}
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="city">
            <RequiredLabel>City</RequiredLabel>
          </FieldLabel>
          <Input
            id="city"
            placeholder="New York"
            required
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "city-error" : undefined}
            value={value.city ?? ""}
            onChange={(event) => update("city")(event.target.value)}
          />
          {errors.city && (
            <FieldError id="city-error">{errors.city}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="country">
            <RequiredLabel>Country</RequiredLabel>
            <span className="text-content-quaternary ml-1 text-[11px] font-normal">
              ISO-3 code
            </span>
          </FieldLabel>
          <Input
            id="country"
            placeholder="EGY"
            maxLength={3}
            className="uppercase"
            required
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "country-error" : undefined}
            value={value.country ?? ""}
            onChange={(event) =>
              update("country")(event.target.value.toUpperCase().slice(0, 3))
            }
          />
          {errors.country && (
            <FieldError id="country-error">{errors.country}</FieldError>
          )}
        </Field>
        {mode === "add" && (
          <Field>
            <FieldLabel htmlFor="postalCode">
              <RequiredLabel>Postal Code</RequiredLabel>
            </FieldLabel>
            <Input
              id="postalCode"
              placeholder="10001"
              required
              aria-invalid={Boolean(errors.postalCode)}
              aria-describedby={
                errors.postalCode ? "postalCode-error" : undefined
              }
              value={value.postalCode ?? ""}
              onChange={(event) => update("postalCode")(event.target.value)}
            />
            {errors.postalCode && (
              <FieldError id="postalCode-error">{errors.postalCode}</FieldError>
            )}
          </Field>
        )}
      </div>
    </StepShell>
  )
}
