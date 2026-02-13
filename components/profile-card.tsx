"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ProfileCardProps {
  id: string
  firstName: string
  lastName: string
  role: string
  batchYear: number
  currentPosition?: string
  company?: string
  bio?: string
  canView?: boolean
}

export default function ProfileCard({
  id,
  firstName,
  lastName,
  role,
  batchYear,
  currentPosition,
  company,
  bio,
  canView = true,
}: ProfileCardProps) {
  const roleColor = role === "faculty" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <Link href={canView ? `/protected/browse/${id}` : "#"}>
      <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate text-lg">
                {firstName} {lastName}
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1 line-clamp-1">{currentPosition || "Not specified"}</p>
            </div>
            <Badge className={roleColor}>{roleLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {company && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1M19 7h1m-1 4h1m-1 4h1"
                />
              </svg>
              <span className="text-slate-700 font-medium">{company}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-slate-700">Batch {batchYear}</span>
          </div>

          {bio && <p className="text-sm text-slate-600 line-clamp-2 italic">{bio}</p>}

          <div className="pt-2 border-t">
            <p className="text-xs text-slate-500">Click to view full profile</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
