import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Trophy } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { notFound, redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailsPage({ params }: PageProps) {
  const { id } = await params

  if (id === "new") {
    redirect("/admin/events/new")
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  const supabase = await createClient()

  // Get event details with related data
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      sport:sports(*),
      event_participants:event_participants(
        *,
        participant:participants(
          *,
          house:houses(name, color)
        )
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching event with ID:", id, "Error:", error)
    notFound()
  }

  if (!event) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "default"
      case "in_progress":
        return "destructive"
      case "completed":
        return "secondary"
      case "cancelled":
        return "outline"
      default:
        return "default"
    }
  }

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not scheduled"
    return format(new Date(dateTime), "EEEE, MMMM dd, yyyy 'at' h:mm a")
  }

  // Group participants by house
  const participantsByHouse = event.event_participants?.reduce(
    (acc, ep) => {
      const houseName = ep.participant?.house?.name || "Unassigned"
      if (!acc[houseName]) {
        acc[houseName] = []
      }
      acc[houseName].push(ep)
      return acc
    },
    {} as Record<string, typeof event.event_participants>,
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-gray-600 mt-2">
            {event.sport?.name} - {event.sport?.category}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={getStatusColor(event.status)}>{event.status.replace("_", " ")}</Badge>
          <Button variant="outline" asChild>
            <Link href={`/admin/events/${event.id}/edit`}>Edit Event</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{formatDateTime(event.scheduled_time)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{event.event_participants?.length || 0} participants registered</span>
            </div>
          </CardContent>
        </Card>

        {/* Sport Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Sport Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm font-medium capitalize">{event.sport?.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Max per house:</span>
              <span className="text-sm font-medium">{event.sport?.max_participants_per_house}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Points (1st/2nd/3rd):</span>
              <span className="text-sm font-medium">
                {event.sport?.points_first}/{event.sport?.points_second}/{event.sport?.points_third}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registered Participants</CardTitle>
            <Button variant="outline" asChild>
              <Link href={`/admin/events/${event.id}/participants`}>Manage Participants</Link>
            </Button>
          </div>
          <CardDescription>Participants registered for this event by house</CardDescription>
        </CardHeader>
        <CardContent>
          {participantsByHouse && Object.keys(participantsByHouse).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(participantsByHouse).map(([houseName, houseParticipants]) => (
                <div key={houseName} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {houseParticipants[0]?.participant?.house && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: houseParticipants[0].participant.house.color }}
                      />
                    )}
                    <h3 className="font-medium">{houseName}</h3>
                    <Badge variant="secondary">{houseParticipants.length} participants</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                    {houseParticipants.map((ep) => (
                      <div key={ep.id} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="font-medium">{ep.participant?.full_name}</div>
                        <div className="text-gray-600">Age: {ep.participant?.age}</div>
                        {ep.position && (
                          <div className="text-sm">
                            Position: {ep.position} ({ep.points_earned} pts)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No participants registered yet</p>
              <Button variant="outline" className="mt-4 bg-transparent" asChild>
                <Link href={`/admin/events/${event.id}/participants`}>Add Participants</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
