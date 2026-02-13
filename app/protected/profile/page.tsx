"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSetupMode, setIsSetupMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error: profileLoadError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileLoadError && profileLoadError.code !== "PGRST116") {
          console.error("Error loading profile:", profileLoadError)
        }

        console.log("Profile loaded:", data)
        console.log("User ID:", user.id)
        console.log("User email:", user.email)

        // Check if this is setup mode (first time login)
        const setup = searchParams.get("setup") === "true"
        setIsSetupMode(setup)

        if (data) {
          setProfile(data)
          // Check if profile is incomplete
          const isIncomplete = !data.first_name || !data.last_name || !data.email
          setIsSetupMode(setup || isIncomplete)

          // Initialize formData with user email if profile doesn't have it
          setFormData({
            ...data,
            email: data.email || user.email || "",
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            role: data.role || "alumni",
            // Initialize role-specific fields with defaults
            course: data.course || "",
            semester: data.semester || "",
            enrollment_year: data.enrollment_year || "",
            graduation_year: data.graduation_year || "",
            work_experience_years: data.work_experience_years || "",
            is_currently_working: data.is_currently_working ?? (data.current_position || data.company_name ? true : false),
          })
        } else {
          // No profile exists, create initial form data
          setFormData({
            id: user.id,
            email: user.email || "",
            first_name: "",
            last_name: "",
            phone: "",
            current_position: "",
            company_name: "",
            bio: "",
            linkedin_url: "",
            role: "alumni", // Default role
            course: "",
            semester: "",
            enrollment_year: "",
            batch_year: "",
            graduation_year: "",
            work_experience_years: "",
            is_currently_working: false,
          })
          setIsSetupMode(true)
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (type === "checkbox") {
      setFormData((prev: any) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = async () => {
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setMessage("Please fill in all required fields (First Name, Last Name, Email)")
      return
    }

    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      let error: any

      // Prepare data for insert/update (ensure required fields)
      const profileData: any = {
        id: user.id,
        first_name: formData.first_name?.trim() || "",
        last_name: formData.last_name?.trim() || "",
        email: formData.email?.trim() || user.email || "",
        phone: formData.phone?.trim() || null,
        bio: formData.bio?.trim() || null,
        linkedin_url: formData.linkedin_url?.trim() || null,
        role: formData.role || "alumni",
      }

      // Add role-specific fields
      if (formData.role === "student") {
        profileData.course = formData.course?.trim() || null
        profileData.semester = formData.semester ? parseInt(formData.semester) : null
        profileData.enrollment_year = formData.enrollment_year ? parseInt(formData.enrollment_year) : null
        profileData.batch_year = formData.batch_year ? parseInt(formData.batch_year) : null
      } else if (formData.role === "alumni") {
        profileData.current_position = formData.current_position?.trim() || null
        profileData.company_name = formData.company_name?.trim() || null
        profileData.batch_year = formData.batch_year ? parseInt(formData.batch_year) : null
        profileData.graduation_year = formData.graduation_year ? parseInt(formData.graduation_year) : null
        profileData.work_experience_years = formData.work_experience_years ? parseInt(formData.work_experience_years) : null
        profileData.is_currently_working = formData.is_currently_working ?? (formData.current_position || formData.company_name ? true : false)
      } else if (formData.role === "faculty") {
        profileData.current_position = formData.current_position?.trim() || null
        profileData.company_name = formData.company_name?.trim() || null
      }

      console.log("Saving profile data:", profileData)

      const runUpsert = async (dataToSave: any) => {
        if (existingProfile) {
          return await supabase.from("profiles").update(dataToSave).eq("id", user.id).select()
        }
        return await supabase.from("profiles").insert(dataToSave).select()
      }

      // First attempt: save with full data
      let result = await runUpsert(profileData)
      error = (result as any).error

      // If schema cache / missing column error, retry with a minimal safe payload
      if (error?.message?.includes("Could not find the") && error?.message?.includes("column")) {
        console.warn("Schema cache / missing column detected. Retrying with minimal payload.", error.message)
        const minimalProfileData: any = {
          id: user.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          bio: profileData.bio,
          linkedin_url: profileData.linkedin_url,
          role: profileData.role,
          // keep these widely-existing columns only
          phone: profileData.phone,
          current_position: formData.current_position?.trim() || null,
          company_name: formData.company_name?.trim() || null,
          batch_year: formData.batch_year ? parseInt(formData.batch_year) : null,
        }

        result = await runUpsert(minimalProfileData)
        error = (result as any).error

        if (!error) {
          setMessage(
            "Profile saved, but some new fields (like Graduation Year) are not in your database yet. " +
              "Please run `scripts/015_add_role_specific_fields.sql` in Supabase SQL Editor, then refresh."
          )
        }
      }

      if (!error) {
        console.log("Profile saved successfully:", (result as any).data)
      } else {
        console.error("Profile save error:", error)
      }

      if (error) {
        console.error("Full error details:", JSON.stringify(error, null, 2))
        setMessage(`Error: ${error.message}`)
        setSaving(false)
      } else {
        // Only set generic success if we didn't already set a more specific message above
        setMessage((prev) => prev || "Profile saved successfully!")

        // Reload profile to get updated data
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (updatedProfile) {
          setProfile(updatedProfile)
          setFormData(updatedProfile)
          console.log("Profile reloaded:", updatedProfile)
        }

        // If this was setup mode, redirect to dashboard after saving
        if (isSetupMode) {
          setTimeout(() => {
            router.replace("/protected/dashboard")
          }, 1500)
        } else {
          setTimeout(() => setMessage(null), 3000)
        }
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center font-medium">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {isSetupMode ? "Complete Your Profile" : "My Profile"}
        </h1>
        <p className="mt-2 text-muted-foreground font-medium">
          {isSetupMode
            ? "Please complete your profile to continue using the platform"
            : "Update your information"}
        </p>
      </div>

      {isSetupMode && (
        <Alert className="mb-6 border-primary/20 bg-primary/10">
          <AlertTitle className="text-primary font-bold">Welcome! 👋</AlertTitle>
          <AlertDescription className="text-foreground/80">
            Complete your profile information to get started. This information will be visible to other alumni and help you connect with the community.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            {isSetupMode
              ? "Fill in your details to complete your profile"
              : "Keep your profile information up to date"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData?.first_name || ""}
                onChange={handleInputChange}
                required
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData?.last_name || ""}
                onChange={handleInputChange}
                required
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData?.email || ""}
              onChange={handleInputChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={formData?.phone || ""} onChange={handleInputChange} />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData?.role || "alumni"}
              onValueChange={(value) => setFormData((prev: any) => ({ ...prev, role: value }))}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student-Specific Fields */}
          {formData?.role === "student" && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    name="course"
                    value={formData?.course || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science, Mechanical Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Current Semester</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    min="1"
                    max="6"
                    value={formData?.semester || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_year">Enrollment Year</Label>
                  <Input
                    id="enrollment_year"
                    name="enrollment_year"
                    type="number"
                    min="2000"
                    max="2099"
                    value={formData?.enrollment_year || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch_year">Batch Year</Label>
                  <Input
                    id="batch_year"
                    name="batch_year"
                    type="number"
                    min="2000"
                    max="2099"
                    value={formData?.batch_year || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2026"
                  />
                </div>
              </div>
            </>
          )}

          {/* Alumni-Specific Fields */}
          {formData?.role === "alumni" && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch_year">Batch Year</Label>
                  <Input
                    id="batch_year"
                    name="batch_year"
                    type="number"
                    min="2000"
                    max="2099"
                    value={formData?.batch_year || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">Graduation Year</Label>
                  <Input
                    id="graduation_year"
                    name="graduation_year"
                    type="number"
                    min="2000"
                    max="2099"
                    value={formData?.graduation_year || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current_position">Current Position</Label>
                  <Input
                    id="current_position"
                    name="current_position"
                    value={formData?.current_position || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., Senior Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData?.company_name || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., TechCorp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="work_experience_years">Years of Work Experience</Label>
                  <Input
                    id="work_experience_years"
                    name="work_experience_years"
                    type="number"
                    min="0"
                    value={formData?.work_experience_years || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      id="is_currently_working"
                      name="is_currently_working"
                      checked={formData?.is_currently_working || false}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <Label htmlFor="is_currently_working" className="cursor-pointer">
                      Currently Working
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Faculty-Specific Fields */}
          {formData?.role === "faculty" && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current_position">Designation/Position</Label>
                  <Input
                    id="current_position"
                    name="current_position"
                    value={formData?.current_position || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., Assistant Professor, Head of Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Department</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData?.company_name || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science, Mechanical Engineering"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData?.bio || ""}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData?.linkedin_url || ""}
              onChange={handleInputChange}
              placeholder="https://www.linkedin.com/in/yourprofile"
            />
            <p className="text-xs text-muted-foreground font-medium">Share your LinkedIn profile so others can connect with you</p>
          </div>

          {message && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary font-medium border border-primary/20">{message}</div>}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {saving ? "Saving..." : isSetupMode ? "Complete Profile & Continue" : "Save Changes"}
            </Button>
            {isSetupMode && (
              <Button
                variant="outline"
                onClick={() => router.push("/protected/dashboard")}
                disabled={saving}
              >
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
