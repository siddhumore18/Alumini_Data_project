"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ academics: 0, projects: 0, totalAlumni: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get profile
        const { data: profileData } = await supabase.from("profiles").select().eq("id", user.id).single()

        setProfile(profileData)

        // Get academics count (table is academic_records, not academics)
        const { data: academics, error: academicsError } = await supabase
          .from("academic_records")
          .select("*")
          .eq("user_id", user.id)

        if (academicsError) {
          console.error("Error loading academics:", academicsError)
        }

        // Get projects count
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)

        if (projectsError) {
          console.error("Error loading projects:", projectsError)
        }

        // Get total alumni count - everyone can see this
        const { data: alumni, error: alumniError } = await supabase
          .from("profiles")
          .select("*")

        if (alumniError) {
          console.error("Error loading alumni count:", alumniError)
        }

        // Filter alumni count (only count alumni role, not faculty)
        const alumniCount = alumni?.filter((p) => p.role === "alumni").length || 0

        setStats({
          academics: academics?.length || 0,
          projects: projects?.length || 0,
          totalAlumni: alumniCount,
        })
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome, {profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.email || 'User'}!
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Role: {profile?.role}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
        <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
          <h3 className="text-sm font-medium text-muted-foreground">Academic Records</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{stats.academics}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-secondary hover:shadow-lg transition-all duration-300">
          <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{stats.projects}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
          <h3 className="text-sm font-medium text-muted-foreground">Total Alumni</h3>
          <p className="text-3xl font-bold text-foreground mt-2">{stats.totalAlumni}</p>
        </Card>
      </div>

      {/* Profile Summary Card - Show for Alumni */}
      {profile?.role === "alumni" && (
        <Card className="mb-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Profile Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold text-foreground">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department/Course</p>
              <p className="text-lg font-semibold text-foreground">
                {profile?.course || profile?.company_name || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Year of Passing</p>
              <p className="text-lg font-semibold text-foreground">
                {profile?.graduation_year || profile?.batch_year || 'Not set'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Faculty Alumni Directory Link */}
      {profile?.role === "faculty" && (
        <Card className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Alumni Management</h2>
              <p className="text-muted-foreground">View, filter, and export alumni data</p>
            </div>
            <Link href="/protected/alumni-directory">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                View Alumni Directory →
              </button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/protected/announcements">
          <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📢</span>
              <h3 className="font-semibold text-foreground">Announcements</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-2">View all announcements and updates</p>
          </Card>
        </Link>

        <Link href="/protected/profile">
          <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <h3 className="font-semibold text-foreground">Edit Profile</h3>
            <p className="text-sm text-muted-foreground mt-2">Update your profile information</p>
          </Card>
        </Link>

        <Link href="/protected/academics">
          <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <h3 className="font-semibold text-foreground">Academic Records</h3>
            <p className="text-sm text-muted-foreground mt-2">Manage your academic data</p>
          </Card>
        </Link>

        <Link href="/protected/projects">
          <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <h3 className="font-semibold text-foreground">Projects</h3>
            <p className="text-sm text-muted-foreground mt-2">Showcase your projects</p>
          </Card>
        </Link>

        <Link href="/protected/browse">
          <Card className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
            <h3 className="font-semibold text-foreground">Browse Directory</h3>
            <p className="text-sm text-muted-foreground mt-2">View all alumni & faculty</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
