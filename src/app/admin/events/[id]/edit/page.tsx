"use client"

import type React from "react"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Sport {
  id: string
  name: string
  category: string
}

interface Event {
  id: string
  name: string
  sport_id: string
  scheduled_time: string | null
  location: string | null
  status: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditEventPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<string>("")
  const [name, setName] = useState("")
  const [sportId, setSportId] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("")
  const [sports, setSports] = useState<Sport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initializeData = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)

      const supabase = createClient()

      try {
        // Fetch event data
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", resolvedParams.id)
          .single()

        if (eventError) throw eventError

        // Fetch sports data
        const { data: sportsData } = await supabase
          .from("sports")
          .select("id, name, category")
          .eq("is_active", true)
          .order("category")
          .order("name")

        if (eventData) {
          setName(eventData.name)
          setSportId(eventData.sport_id)
          setStatus(eventData.status)
          setLocation(eventData.location || "")

          // Parse scheduled_time
          if (eventData.scheduled_time) {
            const date = new Date(eventData.scheduled_time)
            setScheduledDate(date.toISOString().split("T")[0])
            setScheduledTime(date.toTimeString().slice(0, 5))
          }
        }

        if (sportsData) setSports(sportsData)
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load event data")
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
      // Combine date and time
      const scheduledDateTime =
        scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null

      const { error } = await supabase
        .from("events")
        .update({
          name,
          sport_id: sportId,
          scheduled_time: scheduledDateTime,
          location: location || null,
          status,
        })
        .eq("id", eventId)

      if (error) throw error
      router.push(`/admin/events/${eventId}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Group sports by category
  const sportsByCategory = sports.reduce(
    (acc, sport) => {
      if (!acc[sport.category]) {
        acc[sport.category] = []
      }
      acc[sport.category].push(sport)
      return acc
    },
    {} as Record<string, Sport[]>,
  )

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading event data...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Boys 100m Sprint Final"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Select value={sportId} onValueChange={setSportId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sportsByCategory).map(([category, categorySports]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-medium text-gray-500 capitalize">{category} Events</div>
                      {categorySports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Main Track, Field Area A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
