"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface FacultyFormData {
  full_name: string
  department: string
  designation: string
  employee_id: string
  email: string
  phone: string
  years_of_experience: string
  skills_expertise: string
  bio: string
  profile_picture_url: string
}

export default function FacultyRegistrationPage() {
  const [formData, setFormData] = useState<FacultyFormData>({
    full_name: "",
    department: "",
    designation: "",
    employee_id: "",
    email: "",
    phone: "",
    years_of_experience: "",
    skills_expertise: "",
    bio: "",
    profile_picture_url: "",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role === "faculty") {
        // Load existing faculty data if available
        const { data: facultyData } = await supabase
          .from("faculty_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (facultyData) {
          setFormData({
            full_name: facultyData.full_name || "",
            department: facultyData.department || "",
            designation: facultyData.designation || "",
            employee_id: facultyData.employee_id || "",
            email: facultyData.email || "",
            phone: facultyData.phone || "",
            years_of_experience: facultyData.years_of_experience || "",
            skills_expertise: facultyData.skills_expertise || "",
            bio: facultyData.bio || "",
            profile_picture_url: facultyData.profile_picture_url || "",
          })
          if (facultyData.profile_picture_url) {
            setImagePreview(facultyData.profile_picture_url)
          }
        }
      }
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: "error", text: "User not authenticated" })
        setSaving(false)
        return
      }

      let profilePictureUrl = formData.profile_picture_url

      // Upload image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `faculty-profiles/${fileName}`

        const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, profileImage)

        if (uploadError) {
          setMessage({ type: "error", text: `Image upload failed: ${uploadError.message}` })
          setSaving(false)
          return
        }

        const { data } = supabase.storage.from("profiles").getPublicUrl(filePath)
        profilePictureUrl = data.publicUrl
      }

      // Check if faculty profile exists
      const { data: existingProfile } = await supabase
        .from("faculty_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("faculty_profiles")
          .update({
            ...formData,
            profile_picture_url: profilePictureUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (error) {
          setMessage({ type: "error", text: `Error updating profile: ${error.message}` })
        } else {
          setMessage({ type: "success", text: "Profile updated successfully!" })
          setTimeout(() => router.push("/protected/dashboard"), 2000)
        }
      } else {
        // Create new profile
        const { error } = await supabase.from("faculty_profiles").insert({
          user_id: user.id,
          ...formData,
          profile_picture_url: profilePictureUrl,
        })

        if (error) {
          setMessage({ type: "error", text: `Error creating profile: ${error.message}` })
        } else {
          setMessage({ type: "success", text: "Profile created successfully!" })
          setTimeout(() => router.push("/protected/dashboard"), 2000)
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Faculty Registration</h1>
        <p className="mt-2 text-slate-600">Complete your profile to be visible to students and faculty</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Share your professional details and expertise</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="space-y-3">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                    id="profile_photo"
                  />
                  <p className="mt-2 text-xs text-slate-500">JPG, PNG or GIF (max. 5MB)</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="bg-white"
              />
            </div>

            {/* Department and Designation */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="e.g., Computer Science"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  name="designation"
                  placeholder="e.g., Assistant Professor"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            {/* Employee ID and Years of Experience */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  placeholder="e.g., FAC-001"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience *</Label>
                <Input
                  id="years_of_experience"
                  name="years_of_experience"
                  type="number"
                  placeholder="e.g., 5"
                  value={formData.years_of_experience}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                  min="0"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@sharad.edu.in"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            {/* Skills/Expertise */}
            <div className="space-y-2">
              <Label htmlFor="skills_expertise">Skills & Expertise *</Label>
              <Textarea
                id="skills_expertise"
                name="skills_expertise"
                placeholder="List your skills and areas of expertise (e.g., Web Development, Machine Learning, Database Design)"
                value={formData.skills_expertise}
                onChange={handleInputChange}
                required
                className="min-h-24 bg-white"
              />
              <p className="text-xs text-slate-500">Separate multiple skills with commas</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Short Bio *</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Write a brief bio about yourself, your teaching approach, and professional interests"
                value={formData.bio}
                onChange={handleInputChange}
                required
                className="min-h-24 bg-white"
              />
              <p className="text-xs text-slate-500">150-300 characters recommended</p>
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
