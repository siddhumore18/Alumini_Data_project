"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalJobs: 0,
    pendingFeedback: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    loadDashboard()
  }, [])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/admin/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      router.push("/admin/login")
      return
    }

    setUser(user)
  }

  const loadDashboard = async () => {
    try {
      // Load announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      setAnnouncements(announcementsData || [])

      // Load stats
      const [usersRes, eventsRes, jobsRes, feedbackRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("job_postings").select("id", { count: "exact" }),
        supabase.from("feedback").select("id", { count: "exact" }),
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalJobs: jobsRes.count || 0,
        pendingFeedback: feedbackRes.count || 0,
      })
    } catch (error) {
      console.error("Error loading dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-red-600 to-orange-600 p-3">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">Administrator Panel</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Job Postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingFeedback}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/announcements">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Announcements</CardTitle>
                  <CardDescription>Create and manage announcements</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/events">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Events</CardTitle>
                  <CardDescription>Schedule and manage events</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/users">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Users</CardTitle>
                  <CardDescription>View and manage user accounts</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/jobs">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Manage Jobs</CardTitle>
                  <CardDescription>Review and manage job postings</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Announcements */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Recent Announcements</h2>
            <Link href="/admin/announcements">
              <Button>View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  No announcements yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription>
                          {new Date(announcement.created_at).toLocaleDateString()}
                          {announcement.expires_at && (
                            <span className="ml-2">
                              • Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          announcement.priority === "urgent"
                            ? "bg-red-100 text-red-700"
                            : announcement.priority === "high"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {announcement.priority}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{announcement.message}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
