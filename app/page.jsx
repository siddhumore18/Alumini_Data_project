"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        
        if (!error) {
          setUser(user)
        }
      } catch (err) {
        console.error("Error checking user:", err)
        // Silently fail - page should still load
      }
    }

    checkUser()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-3">
              <span className="text-2xl font-bold text-white">SI</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Sharad Institute</h1>
              <p className="text-xs text-slate-500">Alumni Portal</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/protected/dashboard">
                  <Button variant="outline" className="bg-transparent">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/protected/profile">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">Profile</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="bg-transparent">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl md:text-6xl">
            Welcome to Sharad Institute Alumni Network
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            Connect with fellow alumni, showcase your achievements, and celebrate your journey through Sharad Institute
            of Technology. Maintain your academic records and project portfolio all in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <>
                <Link href="/protected/dashboard" className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-6 text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-up" className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-6 text-lg">
                    Create Account
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
                  >
                    Already a Member?
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-slate-900">Key Features</h3>
            <p className="mt-4 text-lg text-slate-600">Everything you need to manage your alumni profile</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 rounded-full bg-blue-100 p-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-900">Complete Profile</h4>
              <p className="mt-2 text-slate-600">
                Create and manage your professional profile with your current position, company, and bio
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 rounded-full bg-indigo-100 p-4">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-900">Academic Records</h4>
              <p className="mt-2 text-slate-600">
                Maintain all your 3-year diploma data including CGPA, marks, and semester-wise performance
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-4 rounded-full bg-purple-100 p-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-slate-900">Project Portfolio</h4>
              <p className="mt-2 text-slate-600">
                Showcase your projects with descriptions, technologies used, and links to live demos and GitHub repos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-white">Ready to Join?</h3>
          <p className="mt-4 text-lg text-blue-100">Connect with your alumni network and showcase your achievements</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!user && (
              <>
                <Link href="/auth/sign-up">
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg sm:w-auto">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2">
                  <span className="text-xl font-bold text-white">SI</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Sharad Institute</h4>
                  <p className="text-xs text-slate-400">Alumni Portal</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Contact</h4>
              <p className="mt-4 text-sm text-slate-300">
                Sharad Institute of Technology
                <br />
                Yadrav
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
            <p>© 2025 Sharad Institute of Technology. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
