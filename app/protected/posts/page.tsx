"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

interface Post {
  id: string
  user_id: string
  content: string
  post_type: string
  event_title?: string
  event_date?: string
  event_location?: string
  event_link?: string
  is_online?: boolean
  company_name?: string
  position_title?: string
  job_description?: string
  application_link?: string
  salary_range?: string
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    email: string
    avatar_url?: string
    linkedin_url?: string
  }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())
  const [commentsOpenPostId, setCommentsOpenPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Array<any>>([])
  const [commentText, setCommentText] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    content: "",
    post_type: "general",
    event_title: "",
    event_date: "",
    event_location: "",
    event_link: "",
    is_online: false,
    company_name: "",
    position_title: "",
    job_description: "",
    application_link: "",
    salary_range: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUser()
    loadPosts()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)

    if (user) {
      loadUserLikes(user.id)
    }
  }

  const loadUserLikes = async (userId: string) => {
    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)

    if (data) {
      setUserLikes(new Set(data.map((like) => like.post_id)))
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)

      // First, get all posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (postsError) {
        console.error("Error loading posts:", postsError)
        console.error("Error details:", JSON.stringify(postsError, null, 2))
        // Don't show alert, just log and show empty state
        setPosts([])
        setLoading(false)
        return
      }

      console.log("Loaded posts:", postsData?.length || 0)
      console.log("Post user IDs:", postsData?.map(p => p.user_id))

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Get current user to filter out their own posts
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      // Filter out current user's posts from feed (they'll see their own posts in "My Posts" page)
      const otherUsersPosts = currentUser
        ? postsData.filter((post) => post.user_id !== currentUser.id)
        : postsData

      // Get unique user IDs from filtered posts
      const userIds = [...new Set(otherUsersPosts.map((post) => post.user_id))]

      console.log("Unique user IDs to fetch profiles for:", userIds)

      // Fetch profiles for all users (handle single or multiple IDs)
      let profilesData = []
      let profilesError = null

      if (userIds.length === 0) {
        console.warn("No user IDs to fetch profiles for")
      } else {
        // Fetch profiles one by one to avoid .in() query issues
        profilesData = []
        for (const userId of userIds) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, email, profile_picture_url, first_name, last_name, linkedin_url")
            .eq("id", userId)
            .maybeSingle()

          if (error) {
            console.error(`Error loading profile for user ${userId}:`, error)
            if (!profilesError) profilesError = error
          } else if (data) {
            profilesData.push(data)
            console.log(`Profile found for user ${userId}:`, data)
          } else {
            console.warn(`No profile found for user ${userId}`)
          }
        }
      }

      if (profilesError) {
        console.error("Error loading profiles:", profilesError)
        console.error("Error details:", JSON.stringify(profilesError, null, 2))
        console.error("User IDs being queried:", userIds)

        // This fallback is no longer needed since we're already fetching one by one
      } else {
        console.log("Profiles loaded:", profilesData?.length || 0, "profiles found")
        console.log("Profile data:", profilesData)
      }

      // Combine posts with profiles (using filtered posts)
      const postsWithProfilesBase = otherUsersPosts.map((post) => {
        const profile = profilesData?.find((p) => p.id === post.user_id)

        // Build full name from first_name + last_name (full_name field doesn't exist in profiles table)
        let fullName = "Anonymous User"
        if (profile) {
          // Build name from first_name + last_name
          const firstName = (profile.first_name || "").trim()
          const lastName = (profile.last_name || "").trim()

          if (firstName || lastName) {
            fullName = `${firstName} ${lastName}`.trim()
          }

          // If still empty after combining, use email as fallback
          if (!fullName || fullName === "") {
            if (profile.email) {
              fullName = profile.email.split("@")[0] || "User"
            } else {
              fullName = "Anonymous User"
            }
          }
        } else {
          console.warn(`No profile found for user_id: ${post.user_id}`)
        }

        console.log(`Post ${post.id} - User ${post.user_id} - Name: "${fullName}"`, {
          profile_exists: !!profile,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          email: profile?.email
        })

        return {
          ...post,
          profiles: profile
            ? {
              full_name: fullName !== "Anonymous User" ? fullName : (profile.email?.split("@")[0] || "User"),
              email: profile.email || "",
              avatar_url: profile.avatar_url || profile.profile_picture_url || null,
              linkedin_url: profile.linkedin_url || null,
            }
            : {
              full_name: "Anonymous User",
              email: "",
              avatar_url: null,
              linkedin_url: null,
            },
        }
      })

      // Compute like counts reliably from post_likes table
      const postIds = postsWithProfilesBase.map((p) => p.id)
      let likeCountsByPostId: Record<string, number> = {}
      if (postIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", postIds)
        if (likesError) {
          console.error("Error loading like counts:", likesError)
        } else if (likesData) {
          for (const row of likesData as any[]) {
            likeCountsByPostId[row.post_id] = (likeCountsByPostId[row.post_id] || 0) + 1
          }
        }
      }

      // Compute comment counts reliably from post_comments table
      let commentCountsByPostId: Record<string, number> = {}
      if (postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from("post_comments")
          .select("post_id")
          .in("post_id", postIds)
        if (commentsError) {
          console.error("Error loading comment counts:", commentsError)
        } else if (commentsData) {
          for (const row of commentsData as any[]) {
            commentCountsByPostId[row.post_id] = (commentCountsByPostId[row.post_id] || 0) + 1
          }
        }
      }

      const postsWithProfiles = postsWithProfilesBase.map((p) => ({
        ...p,
        likes_count: likeCountsByPostId[p.id] ?? p.likes_count ?? 0,
        comments_count: commentCountsByPostId[p.id] ?? p.comments_count ?? 0,
      }))

      console.log("Posts with profiles:", postsWithProfiles.map(p => ({
        post_id: p.id,
        user_id: p.user_id,
        name: p.profiles?.full_name
      })))

      setPosts(postsWithProfiles)
    } catch (error) {
      console.error("Error loading posts:", error)
      alert("An unexpected error occurred while loading posts")
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!formData.content.trim() && formData.post_type === "general") {
      alert("Please enter post content")
      return
    }

    if (formData.post_type === "event" && !formData.event_title) {
      alert("Please enter event title")
      return
    }

    if (formData.post_type === "placement" && !formData.company_name) {
      alert("Please enter company name")
      return
    }

    try {
      setSaving(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Please log in to create a post")
        return
      }

      const postData: any = {
        user_id: user.id,
        content: formData.content,
        post_type: formData.post_type,
      }

      // Add event-specific fields
      if (formData.post_type === "event" || formData.post_type === "reunion" || formData.post_type === "webinar" || formData.post_type === "workshop") {
        postData.event_title = formData.event_title
        postData.event_date = formData.event_date || null
        postData.event_location = formData.event_location || null
        postData.event_link = formData.event_link || null
        postData.is_online = formData.is_online
      }

      // Add placement-specific fields
      if (formData.post_type === "placement") {
        postData.company_name = formData.company_name
        postData.position_title = formData.position_title || null
        postData.job_description = formData.job_description || null
        postData.application_link = formData.application_link || null
        postData.salary_range = formData.salary_range || null
      }

      const { error } = await supabase.from("posts").insert(postData)

      if (error) {
        console.error("Error creating post:", error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        alert("Failed to create post: " + error.message + "\n\nCheck console for details.")
        return
      }

      console.log("Post created successfully!")

      // Reset form
      setFormData({
        content: "",
        post_type: "general",
        event_title: "",
        event_date: "",
        event_location: "",
        event_link: "",
        is_online: false,
        company_name: "",
        position_title: "",
        job_description: "",
        application_link: "",
        salary_range: "",
      })
      setShowCreateDialog(false)

      // Reload posts after a short delay to ensure DB consistency
      setTimeout(() => {
        loadPosts()
      }, 500)
    } catch (error) {
      console.error("Error creating post:", error)
      alert("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) return

    const isLiked = userLikes.has(postId)

    // Optimistic Update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes_count: isLiked ? (post.likes_count - 1) : (post.likes_count + 1)
        }
      }
      return post
    }))

    if (isLiked) {
      setUserLikes(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    } else {
      setUserLikes(prev => new Set(prev).add(postId))
    }

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUser.id)

      if (error) {
        console.error("Error unliking:", error)
        alert(`Unable to unlike: ${error.message}`)
        // Revert on error
        loadPosts()
      }
    } else {
      // Like
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: currentUser.id })

      if (error) {
        console.error("Error liking:", error)
        alert(`Unable to like: ${error.message}`)
        // Revert on error
        loadPosts()
      }
    }
  }

  const openComments = async (postId: string) => {
    setCommentsOpenPostId(postId)
    setCommentText("")
    setComments([])
    setCommentsLoading(true)

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading comments:", error)
        alert(`Unable to load comments: ${error.message}`)
        return
      }

      setComments(data || [])
    } finally {
      setCommentsLoading(false)
    }
  }

  const addComment = async () => {
    if (!currentUser) {
      alert("Please log in to comment.")
      return
    }
    if (!commentsOpenPostId) return
    if (!commentText.trim()) return

    const postId = commentsOpenPostId
    const content = commentText.trim()

    // optimistic
    setCommentText("")
    setComments((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, post_id: postId, user_id: currentUser.id, content, created_at: new Date().toISOString() },
    ])

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: currentUser.id,
      content,
    })

    if (error) {
      console.error("Error adding comment:", error)
      alert(`Unable to comment: ${error.message}`)
      // reload counts/comments
      await openComments(postId)
      await loadPosts()
      return
    }

    await openComments(postId)
    await loadPosts()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "placement":
        return "bg-green-100 text-green-700"
      case "event":
      case "reunion":
      case "webinar":
      case "workshop":
        return "bg-blue-100 text-blue-700"
      case "achievement":
        return "bg-yellow-100 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case "placement":
        return "💼 Placement"
      case "event":
        return "📅 Event"
      case "reunion":
        return "👥 Reunion"
      case "webinar":
        return "🎓 Webinar"
      case "workshop":
        return "🔧 Workshop"
      case "achievement":
        return "🏆 Achievement"
      default:
        return "📝 Post"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground font-medium">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Feed</h1>
          <p className="mt-2 text-lg text-muted-foreground">Connect with alumni and stay updated</p>
        </div>
        <div className="flex gap-3">
          <Link href="/protected/my-posts">
            <Button variant="outline">My Posts</Button>
          </Link>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                + Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>Share updates, events, or placement opportunities</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="post_type">Post Type</Label>
                  <Select
                    value={formData.post_type}
                    onValueChange={(value) => setFormData({ ...formData, post_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📝 General Post</SelectItem>
                      <SelectItem value="placement">💼 Placement Opportunity</SelectItem>
                      <SelectItem value="event">📅 Event</SelectItem>
                      <SelectItem value="reunion">👥 Reunion</SelectItem>
                      <SelectItem value="webinar">🎓 Webinar</SelectItem>
                      <SelectItem value="workshop">🔧 Workshop</SelectItem>
                      <SelectItem value="achievement">🏆 Achievement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* General Content */}
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="What's on your mind?"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Event Fields */}
                {(formData.post_type === "event" ||
                  formData.post_type === "reunion" ||
                  formData.post_type === "webinar" ||
                  formData.post_type === "workshop") && (
                    <>
                      <div>
                        <Label htmlFor="event_title">Event Title *</Label>
                        <Input
                          id="event_title"
                          value={formData.event_title}
                          onChange={(e) => setFormData({ ...formData, event_title: e.target.value })}
                          placeholder="e.g., Annual Alumni Reunion 2025"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="event_date">Event Date</Label>
                          <Input
                            id="event_date"
                            type="datetime-local"
                            value={formData.event_date}
                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="event_location">Location</Label>
                          <Input
                            id="event_location"
                            value={formData.event_location}
                            onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                            placeholder="Venue or Online"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="event_link">Event Link</Label>
                        <Input
                          id="event_link"
                          type="url"
                          value={formData.event_link}
                          onChange={(e) => setFormData({ ...formData, event_link: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_online"
                          checked={formData.is_online}
                          onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="is_online">Online Event</Label>
                      </div>
                    </>
                  )}

                {/* Placement Fields */}
                {formData.post_type === "placement" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position_title">Position Title</Label>
                        <Input
                          id="position_title"
                          value={formData.position_title}
                          onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                          placeholder="Job Title"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="job_description">Job Description</Label>
                      <Textarea
                        id="job_description"
                        value={formData.job_description}
                        onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                        placeholder="Job requirements and details..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="application_link">Application Link</Label>
                        <Input
                          id="application_link"
                          type="url"
                          value={formData.application_link}
                          onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="salary_range">Salary Range</Label>
                        <Input
                          id="salary_range"
                          value={formData.salary_range}
                          onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                          placeholder="e.g., ₹5L - ₹10L"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreatePost}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {saving ? "Posting..." : "Post"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No Posts Yet</h3>
            <p className="mb-4 text-muted-foreground">Be the first to share something with the community!</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const profile = post.profiles as any
            const isLiked = userLikes.has(post.id)
            const initials = profile?.full_name
              ? profile.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              : "U"

            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="text-lg">
                          {profile?.full_name || "Anonymous User"}
                        </CardTitle>
                        <Badge className={getPostTypeColor(post.post_type)}>
                          {getPostTypeLabel(post.post_type)}
                        </Badge>
                        {profile?.linkedin_url && (
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              🔗 Connect on LinkedIn
                            </Button>
                          </a>
                        )}
                      </div>
                      <CardDescription>
                        {formatTimeAgo(post.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Post Content */}
                  {post.content && (
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  )}

                  {/* Event Details */}
                  {(post.post_type === "event" ||
                    post.post_type === "reunion" ||
                    post.post_type === "webinar" ||
                    post.post_type === "workshop") &&
                    post.event_title && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-semibold text-primary mb-2">{post.event_title}</h4>
                        {post.event_date && (
                          <p className="text-sm text-primary/80">
                            📅 {new Date(post.event_date).toLocaleString()}
                          </p>
                        )}
                        {post.event_location && (
                          <p className="text-sm text-primary/80">
                            📍 {post.is_online ? "Online" : post.event_location}
                          </p>
                        )}
                        {post.event_link && (
                          <a
                            href={post.event_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-2 inline-block font-medium"
                          >
                            🔗 View Event Details
                          </a>
                        )}
                      </div>
                    )}

                  {/* Placement Details */}
                  {post.post_type === "placement" && post.company_name && (
                    <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-secondary mb-2">
                        💼 {post.company_name}
                        {post.position_title && ` - ${post.position_title}`}
                      </h4>
                      {post.job_description && (
                        <p className="text-sm text-foreground/80 mb-2">{post.job_description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-secondary/80">
                        {post.salary_range && <span>💰 {post.salary_range}</span>}
                        {post.application_link && (
                          <a
                            href={post.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:underline font-medium"
                          >
                            🔗 Apply Now
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Engagement */}
                  <div className="flex items-center gap-6 pt-2 border-t flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={isLiked ? "text-blue-600" : ""}
                    >
                      {isLiked ? "❤️" : "🤍"} {post.likes_count || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openComments(post.id)}
                    >
                      💬 {post.comments_count || 0}
                    </Button>
                    <Link href={`/protected/browse/${post.user_id}`}>
                      <Button variant="ghost" size="sm">
                        👤 View Profile
                      </Button>
                    </Link>
                    {profile?.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          🔗 Connect
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Comments Dialog */}
      <Dialog open={!!commentsOpenPostId} onOpenChange={(open) => !open && setCommentsOpenPostId(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>Be respectful and helpful.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Add a comment</Label>
              <Textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={addComment} disabled={!commentText.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              {commentsLoading ? (
                <div className="text-sm text-muted-foreground">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No comments yet.</div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3">
                      <div className="text-sm text-foreground whitespace-pre-wrap">{c.content}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

