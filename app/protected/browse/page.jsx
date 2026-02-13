"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Component for individual profile card with expand functionality
function ProfileCard({ profile, onExpand, isExpanded }) {
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'
  const role = profile.role || 'alumni'

  // Role badge colors
  const roleColors = {
    student: 'bg-green-100 text-green-700',
    alumni: 'bg-blue-100 text-blue-700',
    faculty: 'bg-purple-100 text-purple-700'
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Simple view - just name and status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate text-lg">{fullName}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 capitalize ${roleColors[role] || roleColors.alumni}`}>
          {role}
        </span>
      </div>

      {/* Expanded view (shown on click) */}
      {isExpanded && (
        <div className="mb-4 space-y-3 border-t pt-4">
          {profile.batch_year && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Batch:</span> {profile.batch_year}
            </p>
          )}
          {profile.current_position && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Position:</span> {profile.current_position}
            </p>
          )}
          {profile.company_name && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Company:</span> {profile.company_name}
            </p>
          )}
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{profile.bio}</p>
          )}
          {profile.email && (
            <p className="text-xs text-muted-foreground/80">
              <span className="font-medium text-foreground/80">Email:</span> {profile.email}
            </p>
          )}
          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              🔗 LinkedIn Profile
            </a>
          )}
          {profile.course && profile.role === "student" && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Course:</span> {profile.course}
            </p>
          )}
          {profile.semester && profile.role === "student" && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Semester:</span> {profile.semester}
            </p>
          )}
          {profile.work_experience_years && profile.role === "alumni" && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Experience:</span> {profile.work_experience_years} years
            </p>
          )}
          {profile.graduation_year && profile.role === "alumni" && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Graduated:</span> {profile.graduation_year}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.preventDefault()
            onExpand()
          }}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        <Link href={`/protected/browse/${profile.id}`} className="flex-1">
          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
            View Profile
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export default function BrowseDirectoryPage() {
  const [profiles, setProfiles] = useState([])
  const [filteredProfiles, setFilteredProfiles] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [batchFilter, setBatchFilter] = useState("all")
  const [workingFilter, setWorkingFilter] = useState("all")
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const supabase = createClient()

  const toggleCard = (profileId) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(profileId)) {
        newSet.delete(profileId)
      } else {
        newSet.add(profileId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get current user role (for display purposes only)
        const { data: userData, error: userDataError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userDataError) {
          console.error("Error loading user role:", userDataError)
        }

        setUserRole(userData?.role)

        // Fetch all profiles - exclude admin users and current user
        // Only show students, alumni, and faculty
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("role", "admin") // Exclude admin users
          .neq("id", user.id) // Exclude current user
          .order("created_at", { ascending: false })

        // If the above fails, try an alternative approach
        // This is a fallback in case RLS policies aren't set up correctly
        if (error && error.code === 'PGRST301') {
          console.warn("RLS error detected, trying alternative query method...")
          // Try querying without order first
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("profiles")
            .select("*")

          if (!fallbackError && fallbackData) {
            // Filter out admin users and current user's profile, then sort manually
            const otherProfiles = fallbackData.filter(
              profile => profile.id !== user.id && profile.role !== 'admin'
            )
            const sorted = otherProfiles.sort((a, b) => {
              const dateA = new Date(a.created_at || 0)
              const dateB = new Date(b.created_at || 0)
              return dateB - dateA
            })
            setProfiles(sorted)
            setFilteredProfiles(sorted)
            setErrorMessage(null)
            setLoading(false)
            return
          }
        }

        if (error) {
          console.error("Error loading profiles:", error)
          console.error("Error details:", JSON.stringify(error, null, 2))
          console.error("Error message:", error.message)
          console.error("Error code:", error.code)
          console.error("Error hint:", error.hint)

          // Set error message for user with actionable steps
          let userFriendlyMessage = "Failed to load profiles."

          if (error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
            userFriendlyMessage = `RLS Policy Error: Access denied. 
            
Please run the SQL script in your Supabase database:
1. Go to Supabase Dashboard > SQL Editor
2. Run the script: scripts/004_fix_profiles_rls.sql
3. Refresh this page

Error Code: ${error.code || 'Unknown'}
Error: ${error.message || 'No details available'}`
          } else {
            userFriendlyMessage = `Error: ${error.message || 'Unknown error'}
Code: ${error.code || 'N/A'}
Hint: ${error.hint || 'None'}`
          }

          setErrorMessage(userFriendlyMessage)

          // Still set empty array to show "no profiles" message instead of infinite loading
          setProfiles([])
          setFilteredProfiles([])
          setLoading(false)
          return
        }

        // Clear any previous errors
        setErrorMessage(null)

        console.log("Profiles loaded successfully:", data?.length || 0, "profiles")

        // Filter out admin users and current user's profile
        // Only show students, alumni, and faculty
        const otherProfiles = (data || []).filter(
          profile => profile.id !== user.id && profile.role !== 'admin'
        )

        if (!data || data.length === 0) {
          console.warn("No profiles found in database. Users need to sign up first.")
          setErrorMessage(
            "No profiles found. " +
            "If you just set up the database, users need to sign up through the app first. " +
            "Each sign-up will automatically create a profile."
          )
        } else if (otherProfiles.length === 0) {
          console.log("No other user profiles found. Other users need to sign up.")
        }

        setProfiles(otherProfiles)
        setFilteredProfiles(otherProfiles)
      } catch (error) {
        console.error("Error loading profiles:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [supabase])

  // Filter profiles based on search and filters
  useEffect(() => {
    // Always exclude admin users from directory
    let filtered = profiles.filter((p) => p.role !== 'admin')

    if (searchQuery) {
      filtered = filtered.filter(
        (p) => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase()
          const company = p.company_name?.toLowerCase() || ''
          const position = p.current_position?.toLowerCase() || ''
          const query = searchQuery.toLowerCase()
          return fullName.includes(query) || company.includes(query) || position.includes(query)
        }
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((p) => p.role === roleFilter)
    }

    if (batchFilter !== "all") {
      filtered = filtered.filter((p) => p.batch_year?.toString() === batchFilter)
    }

    // Filter by working status
    if (workingFilter === "working") {
      filtered = filtered.filter((p) =>
        p.is_currently_working === true ||
        (p.current_position && p.current_position.trim() !== "") ||
        (p.company_name && p.company_name.trim() !== "")
      )
    } else if (workingFilter === "not_working") {
      filtered = filtered.filter((p) =>
        p.is_currently_working === false &&
        (!p.current_position || p.current_position.trim() === "") &&
        (!p.company_name || p.company_name.trim() === "")
      )
    }

    setFilteredProfiles(filtered)
  }, [searchQuery, roleFilter, batchFilter, workingFilter, profiles])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center font-medium text-foreground">Loading directory...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Alumni & Faculty Directory</h1>
        <p className="mt-2 text-lg text-muted-foreground">Browse all alumni and faculty members</p>
      </div>

      {/* Filters */}
      <Card className="mb-8 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Input
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2"
          />

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
            </SelectContent>
          </Select>

          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
            </SelectContent>
          </Select>

          <Select value={workingFilter} onValueChange={setWorkingFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Working Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="working">Currently Working</SelectItem>
              <SelectItem value="not_working">Not Working</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setRoleFilter("all")
              setBatchFilter("all")
              setWorkingFilter("all")
            }}
          >
            Reset All Filters
          </Button>
        </div>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <Card className="mb-8 p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error Loading Profiles</h3>
              <p className="text-sm text-red-700">{errorMessage}</p>
              <p className="text-xs text-red-600 mt-2">
                Please check the browser console for more details. Make sure the RLS policy "profiles_select_all_public" exists in your Supabase database.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4 font-medium">
          Found {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? "s" : ""}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isExpanded={expandedCards.has(profile.id)}
              onExpand={() => toggleCard(profile.id)}
            />
          ))}
        </div>

        {filteredProfiles.length === 0 && !errorMessage && (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No other profiles found.</p>
            {profiles.length === 0 ? (
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  You're the only user. Other users need to sign up to appear in the directory.
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  (Your own profile is hidden from this directory. You can view and edit it in "My Profile".)
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Try adjusting your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
