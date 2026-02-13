"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, Briefcase, Building, GraduationCap, Calendar, Linkedin } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

export default function AlumniProfilePage() {
    const [alumnus, setAlumnus] = useState(null)
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) return

                // Get current user role
                const { data: userData } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single()

                setUserRole(userData?.role)

                // Only faculty and admin can access this page
                if (userData?.role !== "faculty" && userData?.role !== "admin") {
                    router.push("/protected/dashboard")
                    return
                }

                // Fetch alumni profile
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", params.id)
                    .single()

                if (error) {
                    console.error("Error loading alumni profile:", error)
                } else {
                    setAlumnus(data)
                }
            } catch (error) {
                console.error("Error loading profile:", error)
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [supabase, params.id, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center font-medium text-foreground">Loading profile...</div>
            </div>
        )
    }

    if (!alumnus) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="p-8 max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h2>
                    <p className="text-muted-foreground mb-4">
                        The alumni profile you're looking for doesn't exist.
                    </p>
                    <Link href="/protected/alumni-directory">
                        <Button>Back to Directory</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    const fullName = `${alumnus.first_name || ''} ${alumnus.last_name || ''}`.trim() || 'N/A'

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link href="/protected/alumni-directory">
                <Button variant="outline" className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Directory
                </Button>
            </Link>

            {/* Header Card */}
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl font-bold text-foreground mb-2">
                                {fullName}
                            </CardTitle>
                            <p className="text-lg text-muted-foreground">
                                {alumnus.current_position || 'Alumni'}
                                {alumnus.company_name && ` at ${alumnus.company_name}`}
                            </p>
                        </div>
                        <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Alumni</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Contact Information */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-foreground font-medium">{alumnus.email || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="text-foreground font-medium">{alumnus.phone || 'Not provided'}</p>
                        </div>
                    </div>
                    {alumnus.linkedin_url && (
                        <div className="flex items-center gap-3 md:col-span-2">
                            <Linkedin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">LinkedIn</p>
                                <a
                                    href={alumnus.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    View Profile
                                </a>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Course/Department</p>
                            <p className="text-foreground font-medium">{alumnus.course || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Batch Year</p>
                            <p className="text-foreground font-medium">{alumnus.batch_year || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Graduation Year</p>
                            <p className="text-foreground font-medium">{alumnus.graduation_year || 'Not provided'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Current Position</p>
                            <p className="text-foreground font-medium">{alumnus.current_position || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Company</p>
                            <p className="text-foreground font-medium">{alumnus.company_name || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Work Experience</p>
                            <p className="text-foreground font-medium">
                                {alumnus.work_experience_years ? `${alumnus.work_experience_years} years` : 'Not provided'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Currently Working</p>
                            <p className="text-foreground font-medium">
                                {alumnus.is_currently_working ? 'Yes' : 'No'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bio */}
            {alumnus.bio && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-foreground">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-foreground leading-relaxed">{alumnus.bio}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
