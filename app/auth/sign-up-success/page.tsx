"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState("")

  const handleResendConfirmation = async () => {
    if (!email) return
    setResendLoading(true)
    setResendError("")
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        setResendError(error.message)
        return
      }
      setResendSuccess(true)
    } catch (err) {
      setResendError("Failed to resend. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 inline-block rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Please check your email to confirm your account. You should receive a confirmation email shortly.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Check your spam folder if you don&apos;t see it. Once you click the link in the email, you can log in.
            </p>

            {email && (
              <div className="space-y-2">
                {resendSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Confirmation email sent! Check your inbox.
                  </p>
                )}
                {resendError && (
                  <p className="text-sm text-destructive">{resendError}</p>
                )}
                <Button
                  variant="outline"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? "Sending..." : "Resend confirmation email"}
                </Button>
              </div>
            )}

            <Link href="/auth/login" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  )
}
