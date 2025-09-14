"use client"

import type React from "react"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

interface House {
  id: string
  name: string
  color: string
}

interface Participant {
  id: string
  full_name: string
  age: number
  house_id: string
  guardian_email: string | null
  is_active: boolean
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditParticipantPage({ params }: PageProps) {
  const [participantId, setParticipantId] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [age, setAge] = useState("")
  const [houseId, setHouseId] = useState("")
  const [guardianEmail, setGuardianEmail] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [houses, setHouses] = useState<House[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeData = async () => {
      const resolvedParams = await params
      setParticipantId(resolvedParams.id)

      const supabase = createClient()

      try {
        // Fetch participant data
        const { data: participant, error: participantError } = await supabase
          .from("participants")
          .select("*")
          .eq("id", resolvedParams.id)
          .single()

        if (participantError) throw participantError

        // Fetch houses
        const { data: housesData, error: housesError } = await supabase
          .from("houses")
          .select("id, name, color")
          .order("name")

        if (housesError) throw housesError

        // Set form data
        setFullName(participant.full_name)
        setAge(participant.age.toString())
        setHouseId(participant.house_id)
        setGuardianEmail(participant.guardian_email || "")
        setIsActive(participant.is_active)
        setHouses(housesData || [])
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load participant data")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("participants")
        .update({
          full_name: fullName,
          age: Number.parseInt(age),
          house_id: houseId,
          guardian_email: guardianEmail || null,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participantId)

      if (error) throw error
      router.push(`/admin/participants/${participantId}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href={`/admin/participants/${participantId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Participant</h1>
          <p className="text-gray-600 mt-1">Update participant information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g., John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="5"
                  max="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house">House</Label>
              <Select value={houseId} onValueChange={setHouseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: house.color }} />
                        {house.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianEmail">Guardian Email (Optional)</Label>
              <Input
                id="guardianEmail"
                type="email"
                placeholder="parent@example.com"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="isActive">Active Participant</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
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
