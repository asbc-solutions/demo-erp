"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/src/shared/lib/utils/utils"
import { Input } from "./input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import {
  DEFAULT_COUNTRIES,
  isValidE164,
  splitE164,
  toE164,
  type Country,
} from "./countries"

export type PhoneInputMeta = {
  country: Country
  /** Digits only, trunk prefix stripped. */
  national: string
  isValid: boolean
}

type PhoneInputProps = {
  countries?: Country[]
  /** ISO code used when `value` carries no recognisable dial code. */
  defaultCountry?: string
  /** Initial national number for uncontrolled use. */
  defaultValue?: string
  /** Full E.164 string. Controlled. */
  value?: string
  /** Forces a country when `value` is empty. */
  countryCode?: string
  disabled?: boolean
  invalid?: boolean
  success?: boolean
  placeholder?: string
  /** Fires with the full E.164 string and whether it is valid. */
  onValueChange?: (value: string, meta: PhoneInputMeta) => void
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  className?: string
  id?: string
  name?: string
  required?: boolean
  "aria-describedby"?: string
  countryLabel?: string
}

/**
 * Flags come from flagcdn as a background image because the regional-indicator
 * emoji in `countries.ts` render as bare letters on Windows. The emoji is kept
 * as the fallback for when the image cannot be resolved.
 */
function flagUrl(country: Country): string | undefined {
  if (country.flagUrl) return country.flagUrl
  if (country.code.length !== 2) return undefined
  return `https://flagcdn.com/${country.code.toLowerCase()}.svg`
}

function CountryFlag({ country }: Readonly<{ country: Country }>) {
  const url = flagUrl(country)

  if (url) {
    return (
      <span
        aria-hidden
        className="block h-4 w-6 shrink-0 rounded-[2px] bg-cover bg-center shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
        style={{ backgroundImage: `url(${url})` }}
      />
    )
  }

  return country.flag ? (
    <span className="text-base leading-none" aria-hidden>
      {country.flag}
    </span>
  ) : null
}

/** Strips the surrounding box off `Input` so it sits flush inside the shell. */
const innerInputClass =
  "h-full w-full min-w-0 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:bg-transparent"

/** Phone input with a country flag + dial-code dropdown and E.164 validation. */
function PhoneInput({
  countries = DEFAULT_COUNTRIES,
  defaultCountry = "EG",
  defaultValue = "",
  value = "",
  countryCode,
  disabled,
  invalid,
  success,
  placeholder = "Enter your phone number",
  onValueChange,
  onBlur,
  className,
  id,
  name,
  required,
  countryLabel = "Select country",
  ...props
}: Readonly<PhoneInputProps>) {
  const initial = splitE164(value, countries)
  const initialCountry =
    initial.country ??
    countries.find((c) => c.code === countryCode) ??
    countries.find((c) => c.code === defaultCountry) ??
    countries[0]

  const [country, setCountry] = React.useState<Country>(initialCountry)
  const [national, setNational] = React.useState(
    () => initial.national || defaultValue,
  )

  // Sync from the controlled `value` prop during render rather than in an
  // effect, so the input never paints a stale number first.
  const [previousValue, setPreviousValue] = React.useState(value)

  if (value !== previousValue) {
    setPreviousValue(value)
    const next = splitE164(value, countries)
    if (value && next.country) {
      setCountry(next.country)
      setNational(next.national)
    } else if (!value) {
      setNational("")
    }
  }

  const emit = (nextCountry: Country, nextNational: string) => {
    const full = toE164(nextCountry.dial, nextNational)
    onValueChange?.(full, {
      country: nextCountry,
      national: full.slice(nextCountry.dial.length),
      isValid: isValidE164(full),
    })
  }

  return (
    <div
      data-slot="phone-input"
      data-invalid={invalid || undefined}
      dir="ltr"
      className={cn(
        "border-stroke-default bg-surface-white flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border px-3 shadow-xs transition-[color,box-shadow,border-color]",
        "focus-within:border-brand-primary focus-within:ring-brand-primary/15 focus-within:ring-[3px]",
        success &&
          !invalid &&
          "border-brand-success focus-within:border-brand-success focus-within:ring-brand-success/15",
        invalid &&
          "border-brand-danger ring-brand-danger/15 ring-[3px] focus-within:border-brand-danger focus-within:ring-brand-danger/20",
        disabled &&
          "bg-surface-hover text-content-quaternary/70 pointer-events-none cursor-not-allowed",
        className,
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          disabled={disabled}
          aria-label={countryLabel}
          data-slot="phone-input-country"
          className="text-content-primary focus-visible:ring-brand-primary/30 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[6px] text-sm leading-5 font-medium outline-none focus-visible:ring-2 disabled:pointer-events-none"
        >
          <CountryFlag country={country} />
          <span className="tabular-nums">{country.dial}</span>
          <ChevronDown className="text-content-tertiary size-3.5" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="max-h-64 min-w-[260px] overflow-x-hidden overflow-y-auto"
        >
          {countries.map((c) => (
            <DropdownMenuItem
              key={c.code}
              onSelect={() => {
                setCountry(c)
                emit(c, national)
              }}
            >
              <CountryFlag country={c} />
              <span className="grow truncate">{c.name}</span>
              <span className="text-content-tertiary tabular-nums">
                {c.dial}
              </span>
              {c.code === country.code ? (
                <Check className="text-brand-primary size-4" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="bg-stroke-default h-5 w-px shrink-0" aria-hidden />

      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        dir="ltr"
        autoComplete="tel-national"
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={national}
        onBlur={onBlur}
        onChange={(event) => {
          setNational(event.target.value)
          emit(country, event.target.value)
        }}
        className={cn(innerInputClass, "text-start")}
        {...props}
      />
    </div>
  )
}

export { PhoneInput }
export type { PhoneInputProps }
