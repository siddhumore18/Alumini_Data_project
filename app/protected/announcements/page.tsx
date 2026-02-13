"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Announcement {
  id: string
  title: string
  message: string
  priority: string
  expires_at: string | null
  created_at: string
  is_active: boolean
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get all active announcements that haven't expired
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading announcements:", error)
        return
      }

      setAnnouncements(data || [])
    } catch (error) {
      console.error("Error loading announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "normal":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "🔴"
      case "high":
        return "🟠"
      case "normal":
        return "🔵"
      case "low":
        return "⚪"
      default:
        return "🔵"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground font-medium">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Announcements</h1>
            <p className="mt-2 text-lg text-muted-foreground">Stay updated with the latest news and updates</p>
          </div>
          <Link href="/protected/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📢</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No Announcements</h3>
            <p className="text-muted-foreground">There are no active announcements at the moment. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => {
            const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()
            if (isExpired) return null

            return (
              <Card
                key={announcement.id}
                className={`border-2 transition-shadow hover:shadow-lg ${getPriorityColor(announcement.priority)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl mt-1">{getPriorityIcon(announcement.priority)}</span>
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 text-foreground">{announcement.title}</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                          {new Date(announcement.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {announcement.expires_at && (
                            <span className="ml-4">
                              • Expires:{" "}
                              {new Date(announcement.expires_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getPriorityColor(announcement.priority)} border`}>
                      {announcement.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Show count */}
      {announcements.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground font-medium">
          Showing {announcements.length} active announcement{announcements.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}

