"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Show error from auth callback (e.g. verification failed)
  useEffect(() => {
    const callbackError = searchParams.get("error")
    if (callbackError === "email_verification_failed" || callbackError === "verification_failed") {
      setError("Email verification failed. The link may have expired. Please sign up again or request a new confirmation email.")
    }
  }, [searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Provide clearer message for unverified email
        if (authError.message?.toLowerCase().includes("email not confirmed")) {
          setError("Please verify your email first. Check your inbox (and spam folder) for the confirmation link.")
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      // Wait a moment for session to be established in cookies
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify session is established and get user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !currentUser) {
        setError("Failed to establish session. Please try again.")
        setLoading(false)
        return
      }

      // Check if user is admin and redirect accordingly
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, first_name, last_name, email")
        .eq("id", currentUser.id)
        .single()

      if (profileError) {
        console.error("Profile fetch error:", profileError)
      }

      // Check if profile is incomplete
      const isProfileIncomplete = !profile ||
        !profile.first_name ||
        !profile.last_name ||
        !profile.email

      // Use router.replace to avoid back button issues
      if (profile?.role === "admin") {
        router.replace("/admin/dashboard")
      } else if (isProfileIncomplete) {
        // Redirect to profile page to complete setup
        router.replace("/protected/profile?setup=true")
      } else {
        router.replace("/protected/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-primary/10 shadow-2xl bg-card/95 backdrop-blur-xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground mb-8">Sign in to your account</p>

        {error && <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-background border-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-background border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline font-semibold">
            Sign up here
          </Link>
        </div>
      </div>
    </Card>
  )
}
