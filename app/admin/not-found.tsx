import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function AdminNotFound() {
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">404</h1>
          <h2 className="mb-2 text-2xl font-semibold text-slate-800">Admin Page Not Found</h2>
          <p className="mb-6 text-slate-600">
            The admin page you're looking for doesn't exist.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Link href="/admin/dashboard">Go to Admin Dashboard</Link>
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

