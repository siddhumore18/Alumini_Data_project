"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
}

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMyPosts()
  }, [])

  const loadMyPosts = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setPosts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading my posts:", error)
        setPosts([])
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error("Error loading my posts:", error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return

    try {
      const { error } = await supabase.from("posts").delete().eq("id", postToDelete)

      if (error) {
        console.error("Error deleting post:", error)
        alert("Failed to delete post: " + error.message)
        return
      }

      // Remove post from local state
      setPosts((prev) => prev.filter((post) => post.id !== postToDelete))
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("An unexpected error occurred")
    }
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
          <p className="text-muted-foreground font-medium">Loading your posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">My Posts</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your posts and see engagement</p>
        </div>
        <div className="flex gap-3">
          <Link href="/protected/posts">
            <Button variant="outline">← Back to Feed</Button>
          </Link>
          <Link href="/protected/posts">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">+ Create New Post</Button>
          </Link>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No Posts Yet</h3>
            <p className="mb-4 text-muted-foreground">You haven't created any posts yet. Start sharing with the community!</p>
            <Link href="/protected/posts">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">Create Your First Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getPostTypeColor(post.post_type)}>
                      {getPostTypeLabel(post.post_type)}
                    </Badge>
                    <CardDescription>{formatTimeAgo(post.created_at)}</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(post.id)}
                  >
                    🗑️ Delete
                  </Button>
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

                {/* Engagement Stats */}
                <div className="flex items-center gap-6 pt-2 border-t text-sm text-muted-foreground">
                  <span>❤️ {post.likes_count || 0} likes</span>
                  <span>💬 {post.comments_count || 0} comments</span>
                  <span className="text-xs text-muted-foreground/60">
                    Posted on {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone. All likes and comments will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

