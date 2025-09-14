"use client"

import type React from "react"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState } from "react"

const SPORT_CATEGORIES = [
  { value: "track", label: "Track Events" },
  { value: "field", label: "Field Events" },
  { value: "team", label: "Team Sports" },
  { value: "individual", label: "Individual Sports" },
]

export default function NewSportPage() {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("1")
  const [pointsFirst, setPointsFirst] = useState("10")
  const [pointsSecond, setPointsSecond] = useState("7")
  const [pointsThird, setPointsThird] = useState("5")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("sports").insert({
        name,
        category,
        max_participants_per_house: Number.parseInt(maxParticipants),
        points_first: Number.parseInt(pointsFirst),
        points_second: Number.parseInt(pointsSecond),
        points_third: Number.parseInt(pointsThird),
      })

      if (error) throw error
      router.push("/admin/sports")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Sport</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sport Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., 100m Sprint"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants per House</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Point System</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsFirst">1st Place</Label>
                  <Input
                    id="pointsFirst"
                    type="number"
                    min="0"
                    value={pointsFirst}
                    onChange={(e) => setPointsFirst(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsSecond">2nd Place</Label>
                  <Input
                    id="pointsSecond"
                    type="number"
                    min="0"
                    value={pointsSecond}
                    onChange={(e) => setPointsSecond(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsThird">3rd Place</Label>
                  <Input
                    id="pointsThird"
                    type="number"
                    min="0"
                    value={pointsThird}
                    onChange={(e) => setPointsThird(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Sport"}
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
