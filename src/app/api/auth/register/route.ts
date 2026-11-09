import { NextResponse } from "next/server"
import axios from "axios"

import { registerSchema } from "@/src/shared/lib/schema/auth"

export const dynamic = "force-dynamic"

/**
 * The ERP API wraps failures as
 * `{ success, error: { code, message, details: { fields } } }` — the same
 * envelope `http-client.ts` unwraps. The flat Laravel-style `errors` key is
 * accepted too so a plainer error response still reaches the right input.
 */
type RegisterErrorBody = {
  message?: string
  errors?: Record<string, string[]>
  error?: {
    code?: string
    message?: string
    details?: { fields?: Record<string, string[]> }
  }
}

/**
 * Account creation. `httpClient` is wired to the demo adapter and never leaves
 * the browser, so — exactly like the login flow in `src/auth.ts` — this talks to
 * the ERP API with its own axios call, server-side.
 *
 * The created token is deliberately *not* returned: the client signs in through
 * NextAuth immediately afterwards and gets its own, so there is no reason to put
 * a second one on the wire.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 },
    )
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the details below.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  const baseUrl = (process.env.ERP_API_URL ?? process.env.NEXT_PUBLIC_ERP_API_URL)
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, message: "Sign-up is unavailable right now." },
      { status: 500 },
    )
  }

  try {
    await axios.post(`${baseUrl}/auth/register`, parsed.data, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      return NextResponse.json(
        { ok: false, message: "Unable to reach the server. Please try again." },
        { status: 502 },
      )
    }

    // Field-level errors are passed straight through so the form can put
    // "email already taken" on the email input instead of in a banner.
    const data = error.response.data as RegisterErrorBody | undefined
    return NextResponse.json(
      {
        ok: false,
        message:
          data?.error?.message ??
          data?.message ??
          "We couldn't create your account.",
        errors: data?.error?.details?.fields ?? data?.errors,
      },
      { status: error.response.status },
    )
  }
}
