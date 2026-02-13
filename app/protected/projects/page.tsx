"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface Project {
  id: string
  project_name: string
  description: string
  technologies: string
  project_url: string
  github_url: string
  completion_date: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    technologies: "",
    project_url: "",
    github_url: "",
    completion_date: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Failed to authenticate. Please try logging in again.")
        setLoading(false)
        return
      }

      const { data, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (projectsError) {
        console.error("Error loading projects:", projectsError)
        setError(`Failed to load projects: ${projectsError.message}`)
        setProjects([])
      } else {
        setProjects(data || [])
        setError(null)
      }
    } catch (err) {
      console.error("Unexpected error loading projects:", err)
      setError("An unexpected error occurred. Please try again.")
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddProject = async () => {
    if (!formData.project_name.trim()) {
      setError("Project name is required")
      return
    }

    try {
      setSaving(true)
      setError(null)
      const supabase = createClient()

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Failed to authenticate. Please try logging in again.")
        setSaving(false)
        return
      }

      const { error: insertError } = await supabase.from("projects").insert({
        user_id: user.id,
        ...formData,
      })

      if (insertError) {
        console.error("Error adding project:", insertError)
        setError(`Failed to add project: ${insertError.message}`)
      } else {
        setFormData({
          project_name: "",
          description: "",
          technologies: "",
          project_url: "",
          github_url: "",
          completion_date: "",
        })
        setShowForm(false)
        await loadProjects()
      }
    } catch (err) {
      console.error("Unexpected error adding project:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      setError(null)
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)

      if (deleteError) {
        console.error("Error deleting project:", deleteError)
        setError(`Failed to delete project: ${deleteError.message}`)
      } else {
        await loadProjects()
      }
    } catch (err) {
      console.error("Unexpected error deleting project:", err)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 bg-background text-foreground">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="text-muted-foreground font-medium">Loading projects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Projects</h1>
          <p className="mt-2 text-muted-foreground">Showcase your work and achievements</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
          {showForm ? "Cancel" : "Add Project"}
        </Button>
      </div>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  onClick={loadProjects}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                name="project_name"
                placeholder="Enter project name"
                value={formData.project_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your project"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technologies">Technologies (comma-separated)</Label>
              <Input
                id="technologies"
                name="technologies"
                placeholder="React, Node.js, MongoDB"
                value={formData.technologies}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project_url">Project URL</Label>
                <Input
                  id="project_url"
                  name="project_url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.project_url}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  name="github_url"
                  type="url"
                  placeholder="https://github.com/..."
                  value={formData.github_url}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input
                id="completion_date"
                name="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={handleInputChange}
              />
            </div>

            <Button onClick={handleAddProject} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
              {saving ? "Saving..." : "Save Project"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No projects yet. Add your first project!</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-1">{project.project_name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {project.technologies && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Technologies</p>
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
                  <Button onClick={() => handleDeleteProject(project.id)} variant="destructive" className="text-xs">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
