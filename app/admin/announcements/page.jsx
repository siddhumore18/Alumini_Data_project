"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "normal",
    expires_at: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    loadAnnouncements()
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
  }

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error("Error loading announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        expires_at: formData.expires_at || null,
        created_by: user.id,
        is_active: true,
      })

      if (error) throw error

      toast.success("Announcement created successfully!")
      setIsDialogOpen(false)
      setFormData({ title: "", message: "", priority: "normal", expires_at: "" })
      loadAnnouncements()
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast.error("Failed to create announcement")
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id)

      if (error) throw error

      toast.success("Announcement deleted successfully!")
      loadAnnouncements()
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Failed to delete announcement")
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success(`Announcement ${!currentStatus ? "activated" : "deactivated"}!`)
      loadAnnouncements()
    } catch (error) {
      console.error("Error updating announcement:", error)
      toast.error("Failed to update announcement")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="outline">← Back</Button>
            </Link>
            <div>
              <h1 className="font-bold text-slate-900">Manage Announcements</h1>
              <p className="text-xs text-slate-500">Create and manage announcements</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between">
          <h2 className="text-2xl font-bold text-slate-900">All Announcements</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Announcement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>Create an announcement that will appear on user dashboards</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    placeholder="Announcement message"
                    rows={5}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expires At (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Leave empty for no expiration. Announcement will auto-delete after this time.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Announcement</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                No announcements yet. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => {
              const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date()
              return (
                <Card key={announcement.id} className={!announcement.is_active || isExpired ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {!announcement.is_active && (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                              Inactive
                            </span>
                          )}
                          {isExpired && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                              Expired
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              announcement.priority === "urgent"
                                ? "bg-red-100 text-red-700"
                                : announcement.priority === "high"
                                  ? "bg-orange-100 text-orange-700"
                                  : announcement.priority === "normal"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {announcement.priority}
                          </span>
                        </div>
                        <CardDescription className="mt-2">
                          Created: {new Date(announcement.created_at).toLocaleString()}
                          {announcement.expires_at && (
                            <span className="ml-4">
                              Expires: {new Date(announcement.expires_at).toLocaleString()}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-slate-700">{announcement.message}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                      >
                        {announcement.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(announcement.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
