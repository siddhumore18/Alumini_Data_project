"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!role) {
        setError("Please select a role")
        setLoading(false)
        return
      }

      // Validate password match
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }

      // Split full name into first and last name for the trigger
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Normalize email (trim and lowercase)
      const normalizedEmail = email.trim().toLowerCase()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName, // Keep for backward compatibility
            role: role === 'student' ? 'alumni' : role, // Map student to alumni
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        // Provide more helpful error messages
        let errorMessage = signUpError.message

        // Check if it's an email validation error from Supabase
        if (signUpError.message.includes('invalid') && signUpError.message.includes('email')) {
          errorMessage = `Email "${normalizedEmail}" was rejected by Supabase. 
          
This might be due to Supabase email validation settings. 

SOLUTION:
1. Try using a Gmail address (e.g., admin.sharad@gmail.com)
2. After signup, run this SQL in Supabase to make yourself admin:
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   
3. Or check Supabase Dashboard > Authentication > Settings to adjust email validation.`
        }

        setError(errorMessage)
        console.error("Sign up error:", signUpError)
        console.error("Error details:", JSON.stringify(signUpError, null, 2))
        return
      }

      if (data?.user) {
        router.push(`/auth/sign-up-success?email=${encodeURIComponent(normalizedEmail)}`)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-primary/10 shadow-2xl bg-card/95 backdrop-blur-xl">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
        <p className="text-muted-foreground mb-8">Join Sharad Institute Alumni Network</p>

        {error && <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium">{error}</div>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="bg-background border-input"
            />
          </div>

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

          <div>
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-background border-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="role" className="text-foreground">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger id="role" className="bg-background border-input">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </Card>
  )
}
