import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function EventsPage() {
  const supabase = await createClient()

  // Get events with sport information
  const { data: events } = await supabase
    .from("events")
    .select(`
      *,
      sport:sports(name, category),
      event_participants:event_participants(count)
    `)
    .order("scheduled_time", { ascending: true })

  // Group events by status
  const eventsByStatus = events?.reduce(
    (acc, event) => {
      if (!acc[event.status]) {
        acc[event.status] = []
      }
      acc[event.status].push(event)
      return acc
    },
    {} as Record<string, typeof events>,
  )

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
    return format(new Date(dateTime), "MMM dd, yyyy 'at' h:mm a")
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-2">Schedule and manage sports day events</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Event
          </Link>
        </Button>
      </div>

      {eventsByStatus && Object.keys(eventsByStatus).length > 0 ? (
        Object.entries(eventsByStatus).map(([status, statusEvents]) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800 capitalize">{status.replace("_", " ")} Events</h2>
              <Badge variant="secondary">{statusEvents.length} events</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        {event.name}
                      </CardTitle>
                      <Badge variant={getStatusColor(event.status)}>{event.status.replace("_", " ")}</Badge>
                    </div>
                    <CardDescription>
                      {event.sport?.name} - {event.sport?.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatDateTime(event.scheduled_time)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Participants:</span>
                        <span className="font-medium">{event.event_participants?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/events/${event.id}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600 mb-4">Get started by scheduling your first sports event.</p>
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
