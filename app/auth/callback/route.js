import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Auth callback route - handles email verification redirects from Supabase.
 * When users click the confirmation link in their email, Supabase redirects here
 * with a `code` parameter. We exchange it for a session and redirect to the app.
 */
export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/protected/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback error:", error)
      // Redirect to login with error message
      const loginUrl = new URL("/auth/login", requestUrl.origin)
      loginUrl.searchParams.set("error", "email_verification_failed")
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code - maybe hash fragments (older flow) or error
  const error = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error")
  if (error) {
    console.error("Auth callback error:", error)
    const loginUrl = new URL("/auth/login", requestUrl.origin)
    loginUrl.searchParams.set("error", "verification_failed")
    return NextResponse.redirect(loginUrl)
  }

  // No code and no error - redirect to login
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin))
}
