"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface AcademicRecord {
  id: string
  semester: number
  cgpa: number
  total_marks: number
  obtained_marks: number
}

export default function AcademicsPage() {
  const [records, setRecords] = useState<AcademicRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    semester: 1,
    cgpa: "",
    total_marks: "",
    obtained_marks: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from("academic_records")
        .select("*")
        .eq("user_id", user.id)
        .order("semester", { ascending: true })

      setRecords(data || [])
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSemesterChange = (semester: number) => {
    setFormData((prev) => ({ ...prev, semester }))
  }

  const handleAddRecord = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from("academic_records").insert({
        user_id: user.id,
        semester: formData.semester,
        cgpa: Number.parseFloat(formData.cgpa),
        total_marks: Number.parseFloat(formData.total_marks),
        obtained_marks: Number.parseFloat(formData.obtained_marks),
      })

      if (!error) {
        setFormData({ semester: 1, cgpa: "", total_marks: "", obtained_marks: "" })
        setShowForm(false)
        loadRecords()
      }
    }
    setSaving(false)
  }

  const handleDeleteRecord = async (id: string) => {
    const supabase = createClient()
    await supabase.from("academic_records").delete().eq("id", id)
    loadRecords()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Academic Records</h1>
          <p className="mt-2 text-slate-600">Your 3-year diploma data</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
          {showForm ? "Cancel" : "Add Record"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Academic Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block text-sm font-medium">Semester</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((sem) => (
                  <Button
                    key={sem}
                    onClick={() => handleSemesterChange(sem)}
                    variant={formData.semester === sem ? "default" : "outline"}
                    className="w-12"
                  >
                    {sem}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cgpa">CGPA</Label>
                <Input
                  id="cgpa"
                  name="cgpa"
                  type="number"
                  step="0.01"
                  max="10"
                  placeholder="e.g., 8.5"
                  value={formData.cgpa}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_marks">Total Marks</Label>
                <Input
                  id="total_marks"
                  name="total_marks"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.total_marks}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obtained_marks">Obtained Marks</Label>
              <Input
                id="obtained_marks"
                name="obtained_marks"
                type="number"
                placeholder="e.g., 85"
                value={formData.obtained_marks}
                onChange={handleInputChange}
              />
            </div>

            <Button onClick={handleAddRecord} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
              {saving ? "Saving..." : "Save Record"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {records.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-slate-500">No academic records yet. Add your first record!</p>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Semester {record.semester}</p>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">CGPA</p>
                        <p className="font-semibold text-blue-600">{record.cgpa}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total Marks</p>
                        <p className="font-semibold text-blue-600">{record.total_marks}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Obtained Marks</p>
                        <p className="font-semibold text-blue-600">{record.obtained_marks}</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleDeleteRecord(record.id)} variant="destructive" className="text-sm">
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
