"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Download, Printer, Eye } from "lucide-react"
import { exportToCSV } from "@/lib/export-utils"

export default function AlumniDirectoryPage() {
    const [alumni, setAlumni] = useState([])
    const [filteredAlumni, setFilteredAlumni] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [yearFilter, setYearFilter] = useState("all")
    const [deptFilter, setDeptFilter] = useState("all")
    const [userRole, setUserRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const loadAlumni = async () => {
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
                    window.location.href = "/protected/dashboard"
                    return
                }

                // Fetch all alumni profiles
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("role", "alumni")
                    .order("created_at", { ascending: false })

                if (error) {
                    console.error("Error loading alumni:", error)
                } else {
                    setAlumni(data || [])
                    setFilteredAlumni(data || [])
                }
            } catch (error) {
                console.error("Error loading alumni:", error)
            } finally {
                setLoading(false)
            }
        }

        loadAlumni()
    }, [supabase])

    // Filter alumni based on search and filters
    useEffect(() => {
        let filtered = [...alumni]

        if (searchQuery) {
            filtered = filtered.filter((a) => {
                const fullName = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase()
                const company = a.company_name?.toLowerCase() || ''
                const position = a.current_position?.toLowerCase() || ''
                const email = a.email?.toLowerCase() || ''
                const query = searchQuery.toLowerCase()
                return fullName.includes(query) || company.includes(query) || position.includes(query) || email.includes(query)
            })
        }

        if (yearFilter !== "all") {
            filtered = filtered.filter((a) => a.graduation_year?.toString() === yearFilter || a.batch_year?.toString() === yearFilter)
        }

        if (deptFilter !== "all") {
            filtered = filtered.filter((a) => {
                const dept = a.course?.toLowerCase() || a.company_name?.toLowerCase() || ''
                return dept.includes(deptFilter.toLowerCase())
            })
        }

        setFilteredAlumni(filtered)
    }, [searchQuery, yearFilter, deptFilter, alumni])

    const handleExportCSV = () => {
        const csvData = filteredAlumni.map((a) => ({
            Name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
            Email: a.email || '',
            Phone: a.phone || '',
            Department: a.course || a.company_name || '',
            "Year of Passing": a.graduation_year || a.batch_year || '',
            "Current Position": a.current_position || '',
            Company: a.company_name || '',
            "Work Experience (Years)": a.work_experience_years || '',
            LinkedIn: a.linkedin_url || '',
        }))

        exportToCSV(csvData, `alumni_directory_${new Date().toISOString().split('T')[0]}.csv`)
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center font-medium text-foreground">Loading alumni directory...</div>
            </div>
        )
    }

    // Check if user has access
    if (userRole !== "faculty" && userRole !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="p-8 max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">
                        This page is only accessible to faculty members.
                    </p>
                    <Link href="/protected/dashboard">
                        <Button>Go to Dashboard</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground">Alumni Directory</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Manage and view all alumni information
                </p>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-8 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-4">
                    <Input
                        placeholder="Search by name, email, company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="md:col-span-2"
                    />

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                            <SelectItem value="2021">2021</SelectItem>
                            <SelectItem value="2020">2020</SelectItem>
                            <SelectItem value="2019">2019</SelectItem>
                            <SelectItem value="2018">2018</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            <SelectItem value="computer">Computer Science</SelectItem>
                            <SelectItem value="mechanical">Mechanical Engineering</SelectItem>
                            <SelectItem value="electrical">Electrical Engineering</SelectItem>
                            <SelectItem value="civil">Civil Engineering</SelectItem>
                            <SelectItem value="electronics">Electronics Engineering</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchQuery("")
                            setYearFilter("all")
                            setDeptFilter("all")
                        }}
                    >
                        Reset Filters
                    </Button>
                    <Button
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                    </Button>
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="print:hidden"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </Card>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground mb-4 font-medium">
                Found {filteredAlumni.length} alumni
            </p>

            {/* Alumni Table */}
            <div className="overflow-x-auto">
                <Card className="p-0">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Department</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Year</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Position</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Company</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAlumni.map((alumnus) => (
                                <tr key={alumnus.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                                        {`${alumnus.first_name || ''} ${alumnus.last_name || ''}`.trim() || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {alumnus.email || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {alumnus.course || alumnus.company_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {alumnus.graduation_year || alumnus.batch_year || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {alumnus.current_position || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {alumnus.company_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-center print:hidden">
                                        <Link href={`/protected/alumni-directory/${alumnus.id}`}>
                                            <Button size="sm" variant="outline">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View Profile
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredAlumni.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No alumni found matching your filters.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          table, table * {
            visibility: visible;
          }
          table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        </div>
    )
}
