"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Profile {
  id: string
  first_name: string
  last_name: string
  role: string
  batch_year?: number
  current_position?: string
  company_name?: string
  email: string
  phone?: string
  bio?: string
  profile_picture_url?: string
  course?: string
  semester?: number
  graduation_year?: number
  work_experience_years?: number
  linkedin_url?: string
}

interface AcademicRecord {
  id: string
  semester: number
  cgpa: number
  total_marks: number
  obtained_marks: number
}

interface Project {
  id: string
  project_name: string
  description: string
  technologies: string
  project_url: string
  github_url: string
  completion_date: string
}

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

export default function ProfileViewPage() {
  const params = useParams()
  const userId = params.id as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [academics, setAcademics] = useState<AcademicRecord[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProfileData()
  }, [userId])

  const loadProfileData = async () => {
    const supabase = createClient()

    // Fetch profile
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileData) {
      setProfile(profileData)

      // Fetch academics
      const { data: academicsData } = await supabase
        .from("academic_records")
        .select("*")
        .eq("user_id", userId)
        .order("semester", { ascending: true })

      setAcademics(academicsData || [])

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      setProjects(projectsData || [])

      // Fetch posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      setPosts(postsData || [])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center font-medium">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center bg-background text-foreground">
        <p className="text-muted-foreground font-medium text-lg">Profile not found</p>
        <Link href="/protected/browse">
          <Button className="mt-4 bg-primary text-primary-foreground">Back to Directory</Button>
        </Link>
      </div>
    )
  }

  const roleColor = profile.role === "faculty" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link href="/protected/browse" className="mb-6 inline-block">
        <Button variant="outline" className="bg-transparent">
          ← Back to Directory
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <h1 className="text-4xl font-bold text-foreground">
                {profile.first_name} {profile.last_name}
              </h1>
              <Badge className={roleColor}>{roleLabel}</Badge>
            </div>
            {profile.current_position && (
              <p className="text-xl text-foreground/90 font-medium">{profile.current_position}</p>
            )}
            {profile.company_name && <p className="text-muted-foreground font-medium">{profile.company_name}</p>}
            {profile.batch_year && <p className="mt-2 text-sm text-primary font-bold">Batch {profile.batch_year}</p>}
            {profile.course && profile.role === "student" && (
              <p className="mt-2 text-sm text-slate-600">Course: {profile.course}</p>
            )}
            {profile.semester && profile.role === "student" && (
              <p className="text-sm text-slate-600">Semester: {profile.semester}</p>
            )}
            {profile.graduation_year && profile.role === "alumni" && (
              <p className="mt-2 text-sm text-slate-600">Graduated: {profile.graduation_year}</p>
            )}
            {profile.work_experience_years && profile.role === "alumni" && (
              <p className="text-sm text-slate-600">Experience: {profile.work_experience_years} years</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-slate-600">{profile.email}</span>
              </div>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span>LinkedIn Profile</span>
              </a>
            )}
            {/* Phone number is private and not displayed to other users */}
          </div>
        </div>
        {profile.bio && (
          <div className="mt-6 border-t border-primary/10 pt-6">
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Academic Records */}
      {academics.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-foreground">Academic Records</h2>
          <div className="space-y-4">
            {academics.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">Semester {record.semester}</p>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">CGPA</p>
                          <p className="font-bold text-primary text-xl">{record.cgpa}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Total Marks</p>
                          <p className="font-bold text-primary text-xl">{record.total_marks}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Obtained Marks</p>
                          <p className="font-bold text-primary text-xl">{record.obtained_marks}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Posts</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {post.post_type === "event" && post.event_title
                        ? post.event_title
                        : post.post_type === "placement" && post.position_title
                          ? post.position_title
                          : "Post"}
                    </CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {post.post_type}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>

                  {/* Event-specific details */}
                  {post.post_type === "event" && (
                    <div className="space-y-2 mb-4 p-4 bg-blue-50 rounded-lg">
                      {post.event_date && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Date:</span>{" "}
                          {new Date(post.event_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                      {post.event_location && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Location:</span> {post.event_location}
                          {post.is_online && <span className="ml-2 text-blue-600">(Online)</span>}
                        </p>
                      )}
                      {post.event_link && (
                        <a
                          href={post.event_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          🔗 Event Link
                        </a>
                      )}
                    </div>
                  )}

                  {/* Placement-specific details */}
                  {post.post_type === "placement" && (
                    <div className="space-y-2 mb-4 p-4 bg-green-50 rounded-lg">
                      {post.company_name && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Company:</span> {post.company_name}
                        </p>
                      )}
                      {post.job_description && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Description:</span> {post.job_description}
                        </p>
                      )}
                      {post.salary_range && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Salary:</span> {post.salary_range}
                        </p>
                      )}
                      {post.application_link && (
                        <a
                          href={post.application_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          🔗 Apply Here
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-slate-500 pt-2 border-t">
                    <span>👍 {post.likes_count || 0}</span>
                    <span>💬 {post.comments_count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">Projects</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{project.project_name}</CardTitle>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {project.technologies && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Technologies</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {project.technologies.split(",").map((tech) => (
                          <span
                            key={tech}
                            className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto flex gap-2">
                    {project.project_url && (
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full text-xs bg-transparent">
                          View
                        </Button>
                      </a>
                    )}
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" className="w-full text-xs bg-transparent">
                          Code
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {academics.length === 0 && projects.length === 0 && posts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground font-medium underline underline-offset-4 decoration-primary/30">
              This user hasn't added any posts, academic records, or projects yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
