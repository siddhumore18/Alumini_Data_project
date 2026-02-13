"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface Announcement {
  id: string
  title: string
  message: string
  priority: string
  expires_at: string | null
  created_at: string
}

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadLatestAnnouncement()
  }, [])

  const loadLatestAnnouncement = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get the latest active, non-expired announcement
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        console.error("Error loading announcement:", error)
        return
      }

      if (data) {
        // Check if user has already seen this announcement
        const seenKey = `announcement_seen_${data.id}`
        const hasSeen = localStorage.getItem(seenKey)

        if (!hasSeen) {
          setAnnouncement(data)
          setIsOpen(true)
        }
      }
    } catch (error) {
      console.error("Error loading announcement:", error)
    }
  }

  const handleClose = () => {
    if (announcement) {
      // Mark as seen in localStorage
      localStorage.setItem(`announcement_seen_${announcement.id}`, "true")
    }
    setIsOpen(false)
  }

  if (!announcement) return null

  const priorityColors = {
    urgent: "bg-red-50 border-red-200",
    high: "bg-orange-50 border-orange-200",
    normal: "bg-blue-50 border-blue-200",
    low: "bg-gray-50 border-gray-200",
  }

  const priorityIcons = {
    urgent: "🔴",
    high: "🟠",
    normal: "🔵",
    low: "⚪",
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`max-w-md ${priorityColors[announcement.priority as keyof typeof priorityColors] || priorityColors.normal}`}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{priorityIcons[announcement.priority as keyof typeof priorityIcons] || "🔵"}</span>
              <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-slate-700">{announcement.message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={handleClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

