"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
        setError(authError.message)
        setLoading(false)
        return
      }

      if (authData?.user) {
        // Wait a moment for session to be established in cookies
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Verify session is established
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !currentUser) {
          setError("Failed to establish session. Please try again.")
          setLoading(false)
          return
        }

        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single()

        if (profileError || profileData?.role !== "admin") {
          await supabase.auth.signOut()
          setError("Access denied. Admin credentials required.")
          setLoading(false)
          return
        }

        // Use router.replace to avoid back button issues
        router.replace("/admin/dashboard")
      }
    } catch (err) {
      console.error("Admin login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Login</h1>
            <p className="mt-2 text-slate-600">Administrator access only</p>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In as Admin"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              ← Back to User Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

