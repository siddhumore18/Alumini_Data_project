"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let subscription = null

    // Get initial session and check admin status
    const getInitialSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (error || !user) {
          router.replace("/auth/login")
          setLoading(false)
          return
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!mounted) return

        if (profileError || profile?.role !== "admin") {
          router.replace("/protected/dashboard")
          setLoading(false)
          return
        }

        setUser(user)
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        router.replace("/auth/login")
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        // Check admin status on auth change
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profile?.role !== "admin") {
          router.replace("/protected/dashboard")
          return
        }

        setUser(session.user)
        setLoading(false)
      } else {
        // Only redirect if we're not already on login page
        if (window.location.pathname !== "/auth/login") {
          setUser(null)
          router.replace("/auth/login")
        }
      }
    })

    subscription = authSubscription

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-red-600 to-orange-600 p-3">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Admin Panel</h1>
              <p className="text-xs text-slate-500">Sharad Institute</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/admin/announcements" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Announcements
            </Link>
            <Link href="/admin/events" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Events
            </Link>
            <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Users
            </Link>
            <Link href="/admin/jobs" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Jobs
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  Admin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/protected/profile">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-slate-50">{children}</main>
    </div>
  )
}

