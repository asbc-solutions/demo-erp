import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

/**
 * Mirrors the rules `POST /auth/register` enforces, so a weak password is
 * caught in the form instead of coming back as a server error after the user
 * has already submitted. The one rule that cannot live here is the breach
 * check — that stays server-side and reaches the form through the route's
 * field-error relay.
 */
export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[^A-Za-z0-9]/, "Password must contain a symbol"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
