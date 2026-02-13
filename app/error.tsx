"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Something went wrong!</h1>
          <p className="mb-6 text-slate-600">
            We encountered an unexpected error. Please try again or return to the home page.
          </p>
          {error.message && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
              <p className="text-sm font-semibold text-red-900">Error Details:</p>
              <p className="mt-1 text-sm text-red-700">{error.message}</p>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

