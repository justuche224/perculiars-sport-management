"use client"

import { createClient } from "@/lib/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trophy, Save, Medal } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Participant {
  id: string
  full_name: string
  age: number
  house: {
    id: string
    name: string
    color: string
  }
}

interface Event {
  id: string
  name: string
  sport: {
    name: string
    points_first: number
    points_second: number
    points_third: number
  }
}

interface Result {
  participant_id: string
  position: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function RecordResultsPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<string>("")
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const initializeData = async () => {
      const resolvedParams = await params
      setEventId(resolvedParams.id)

      const supabase = createClient()

      try {
        // Fetch event details
        const { data: eventData } = await supabase
          .from("events")
          .select(`
            id,
            name,
            sport:sports(name, points_first, points_second, points_third)
          `)
          .eq("id", resolvedParams.id)
          .single()

        // Fetch event participants
        const { data: participantsData } = await supabase
          .from("event_participants")
          .select(`
            participant:participants(
              id,
              full_name,
              age,
              house:houses(id, name, color)
            )
          `)
          .eq("event_id", resolvedParams.id)

        if (eventData) setEvent(eventData)
        if (participantsData) {
          const participantsList = participantsData.map((ep) => ep.participant).filter(Boolean) as Participant[]
          setParticipants(participantsList)

          // Initialize results array
          setResults(
            participantsList.map((p) => ({
              participant_id: p.id,
              position: 0,
            })),
          )
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [params])

  const updatePosition = (participantId: string, position: number) => {
    setResults((prev) =>
      prev.map((result) => (result.participant_id === participantId ? { ...result, position } : result)),
    )
  }

  const getPointsForPosition = (position: number) => {
    if (!event?.sport) return 0
    switch (position) {
      case 1:
        return event.sport.points_first
      case 2:
        return event.sport.points_second
      case 3:
        return event.sport.points_third
      default:
        return 0
    }
  }

  const handleSave = async () => {
    const supabase = createClient()
    setIsSaving(true)
    setError(null)

    try {
      // Filter out participants with no position assigned
      const validResults = results.filter((result) => result.position > 0)

      if (validResults.length === 0) {
        setError("Please assign positions to at least one participant")
        return
      }

      // Prepare results data
      const resultsToInsert = validResults.map((result) => {
        const participant = participants.find((p) => p.id === result.participant_id)
        return {
          event_id: eventId,
          participant_id: result.participant_id,
          house_id: participant?.house.id,
          position: result.position,
          points_awarded: getPointsForPosition(result.position),
        }
      })

      // Delete existing results for this event
      await supabase.from("results").delete().eq("event_id", eventId)

      // Insert new results
      const { error: insertError } = await supabase.from("results").insert(resultsToInsert)

      if (insertError) throw insertError

      // Update event status to completed
      await supabase.from("events").update({ status: "completed" }).eq("id", eventId)

      // Update house total points
      for (const result of resultsToInsert) {
        if (result.points_awarded > 0) {
          await supabase.rpc("increment_house_points", {
            house_id: result.house_id,
            points: result.points_awarded,
          })
        }
      }

      router.push(`/admin/results/${eventId}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save results")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  if (!event) {
    return <div className="text-center py-8">Event not found</div>
  }

  // Group participants by house
  const participantsByHouse = participants.reduce(
    (acc, participant) => {
      const houseName = participant.house?.name || "Unassigned"
      if (!acc[houseName]) {
        acc[houseName] = []
      }
      acc[houseName].push(participant)
      return acc
    },
    {} as Record<string, Participant[]>,
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Results</h1>
          <p className="text-gray-600 mt-2">
            {event.name} - {event.sport?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Results"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Assign Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(participantsByHouse).map(([houseName, houseParticipants]) => (
                <div key={houseName} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {houseParticipants[0]?.house && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: houseParticipants[0].house.color }}
                      />
                    )}
                    <h3 className="font-medium">{houseName}</h3>
                  </div>
                  <div className="space-y-2 ml-6">
                    {houseParticipants.map((participant) => {
                      const result = results.find((r) => r.participant_id === participant.id)
                      return (
                        <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{participant.full_name}</div>
                            <div className="text-sm text-gray-600">Age: {participant.age}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={result?.position.toString() || "0"}
                              onValueChange={(value) => updatePosition(participant.id, Number.parseInt(value))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Position" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">No position</SelectItem>
                                <SelectItem value="1">1st Place</SelectItem>
                                <SelectItem value="2">2nd Place</SelectItem>
                                <SelectItem value="3">3rd Place</SelectItem>
                                <SelectItem value="4">4th Place</SelectItem>
                                <SelectItem value="5">5th Place</SelectItem>
                                <SelectItem value="6">6th Place</SelectItem>
                              </SelectContent>
                            </Select>
                            {result && result.position > 0 && (
                              <Badge variant="secondary">{getPointsForPosition(result.position)} pts</Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Points: 1st ({event.sport?.points_first}pts) | 2nd ({event.sport?.points_second}pts) | 3rd (
                {event.sport?.points_third}pts)
              </div>

              {[1, 2, 3].map((position) => {
                const winner = results.find((r) => r.position === position)
                const participant = winner ? participants.find((p) => p.id === winner.participant_id) : null

                return (
                  <div key={position} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          position === 1 ? "bg-yellow-500" : position === 2 ? "bg-gray-400" : "bg-amber-600"
                        }`}
                      >
                        {position}
                      </div>
                      <div>
                        {participant ? (
                          <>
                            <div className="font-medium">{participant.full_name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              {participant.house && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: participant.house.color }}
                                />
                              )}
                              {participant.house?.name}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400">Not assigned</div>
                        )}
                      </div>
                    </div>
                    {participant && <Badge variant="secondary">{getPointsForPosition(position)} points</Badge>}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
