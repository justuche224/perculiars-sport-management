"use client"

import type React from "react"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const HOUSE_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Teal", value: "#14b8a6" },
]

interface Captain {
  id: string
  full_name: string
  email: string
}

export default function EditHousePage({ params }: { params: { id: string } }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("")
  const [captainId, setCaptainId] = useState<string>("")
  const [captains, setCaptains] = useState<Captain[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load house data
        const { data: house, error: houseError } = await supabase
          .from("houses")
          .select("*")
          .eq("id", params.id)
          .single()

        if (houseError) throw houseError

        setName(house.name)
        setColor(house.color)
        setCaptainId(house.captain_id || "")

        // Load potential captains (admins and house captains)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("role", ["admin", "house_captain"])
          .order("full_name")

        if (profilesError) throw profilesError
        setCaptains(profiles || [])
      } catch (error) {
        console.error("Error loading data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("houses")
        .update({
          name,
          color,
          captain_id: captainId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error
      router.push(`/admin/houses/${params.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading house details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href={`/admin/houses/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit House</h1>
          <p className="text-gray-600">Update house information and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>House Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* House Name */}
            <div className="space-y-2">
              <Label htmlFor="name">House Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Red Dragons"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* House Color */}
            <div className="space-y-2">
              <Label>House Color</Label>
              <div className="grid grid-cols-4 gap-3">
                {HOUSE_COLORS.map((houseColor) => (
                  <button
                    key={houseColor.value}
                    type="button"
                    onClick={() => setColor(houseColor.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      color === houseColor.value
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: houseColor.value }} />
                    <span className="text-sm font-medium">{houseColor.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Captain Selection */}
            <div className="space-y-2">
              <Label htmlFor="captain">House Captain</Label>
              <Select value={captainId} onValueChange={setCaptainId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a captain (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No captain assigned</SelectItem>
                  {captains.map((captain) => (
                    <SelectItem key={captain.id} value={captain.id}>
                      {captain.full_name} ({captain.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
