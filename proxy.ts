import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Skip proxy for public routes
  // Only check auth for protected/admin routes
  if (!request.nextUrl.pathname.startsWith("/protected") && !request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // Check if Supabase env vars are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables are missing")
      // Allow the request to continue - let the client handle the error
      return supabaseResponse
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure cookies are set with proper options for persistence
              supabaseResponse.cookies.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? false,
                secure: process.env.NODE_ENV === "production",
                sameSite: options?.sameSite ?? "lax",
                path: options?.path ?? "/",
              })
            })
          },
        },
      },
    )

    // Refresh session if expired - required for Supabase Auth
    // Add timeout to prevent hanging (2 seconds max)
    let user = null
    let authError = null
    
    try {
      const getUserPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise<{ data: { user: null }, error: { message: string } }>((resolve) => 
        setTimeout(() => resolve({ data: { user: null }, error: { message: "Timeout" } }), 2000)
      )
      
      const result = await Promise.race([getUserPromise, timeoutPromise]) as any
      
      if (result?.error?.message === "Timeout") {
        console.warn("Auth check timed out, allowing request to continue")
        return supabaseResponse
      }
      
      user = result?.data?.user || null
      authError = result?.error || null
    } catch (err) {
      console.warn("Auth check failed, allowing request to continue:", err)
      return supabaseResponse
    }

    // Redirect protected routes to login
    if (request.nextUrl.pathname.startsWith("/protected") && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect admin routes to login if not authenticated
    if (request.nextUrl.pathname.startsWith("/admin") && !user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (err) {
    console.error("Proxy error:", err)
    // On error, allow the request to continue - let the client handle authentication
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
