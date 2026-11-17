import { z } from "zod"

import { vk } from "./validation-key"

/**
 * Phone number: an optional leading "+", then digits and common separators
 * (spaces, hyphens, parentheses), with 7–15 actual digits. Rejects letters
 * and any other symbols.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[\d\s()-]+$/,
    vk("phoneChars"),
  )
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length
    return digits >= 7 && digits <= 15
  }, vk("phoneDigits"))

/** Minimum legal working age an employee's date of birth must satisfy. */
export const MINIMUM_EMPLOYEE_AGE = 18

/**
 * Full completed years between a "YYYY-MM-DD" date of birth and today, or
 * `null` if the string is not a real calendar date. Uses local date parts so
 * it is not shifted by timezone offsets.
 */
export function ageFromDateOfBirth(dob: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const birth = new Date(year, month - 1, day)
  // Reject impossible dates that JS rolls over (e.g. 2021-02-31 → March).
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null
  }

  const now = new Date()
  let age = now.getFullYear() - year
  if (
    now.getMonth() < month - 1 ||
    (now.getMonth() === month - 1 && now.getDate() < day)
  ) {
    age -= 1
  }
  return age
}

/**
 * Date of birth: a real calendar date, in the past, that makes the employee at
 * least the minimum working age.
 */
export const dateOfBirthSchema = z
  .string()
  .trim()
  .refine((v) => ageFromDateOfBirth(v) !== null, vk("dobInvalid"))
  .refine((v) => {
    const age = ageFromDateOfBirth(v)
    return age !== null && age >= 0
  }, vk("dobPast"))
  .refine((v) => {
    const age = ageFromDateOfBirth(v)
    return age !== null && age >= MINIMUM_EMPLOYEE_AGE
  }, vk("employeeMinAge"))
