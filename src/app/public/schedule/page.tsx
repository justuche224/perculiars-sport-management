import { createClient } from "@/lib/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format, isToday, isFuture, isPast } from "date-fns";

export default async function PublicSchedulePage() {
  const supabase = await createClient();

  // Get all events with sport and participant information
  const { data: events } = await supabase
    .from("events")
    .select(
      `
      *,
      sport:sports(name, category),
      event_participants:event_participants(count)
    `
    )
    .order("scheduled_time", { ascending: true });

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Time TBD";
    const date = new Date(dateTime);
    return format(date, "EEEE, MMMM dd 'at' h:mm a");
  };

  const formatTime = (dateTime: string | null) => {
    if (!dateTime) return "TBD";
    return format(new Date(dateTime), "h:mm a");
  };

  const getEventStatus = (event: any) => {
    if (event.status === "completed")
      return { label: "Completed", color: "secondary" };
    if (event.status === "in_progress")
      return { label: "In Progress", color: "destructive" };
    if (event.status === "cancelled")
      return { label: "Cancelled", color: "outline" };

    if (!event.scheduled_time) return { label: "Scheduled", color: "default" };

    const eventDate = new Date(event.scheduled_time);
    if (isToday(eventDate)) return { label: "Today", color: "destructive" };
    if (isFuture(eventDate)) return { label: "Upcoming", color: "default" };
    if (isPast(eventDate)) return { label: "Past", color: "secondary" };

    return { label: "Scheduled", color: "default" };
  };

  // Group events by date
  const eventsByDate = events?.reduce((acc, event) => {
    if (!event.scheduled_time) {
      if (!acc["TBD"]) acc["TBD"] = [];
      acc["TBD"].push(event);
      return acc;
    }

    const dateKey = format(new Date(event.scheduled_time), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="link" asChild>
            <Link href="/public/results">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-100">Event Schedule</h1>
            <p className="text-gray-400 mt-2">
              Complete schedule of sports day events
            </p>
          </div>
        </div>

        {eventsByDate && Object.keys(eventsByDate).length > 0 ? (
          Object.entries(eventsByDate).map(([dateKey, dateEvents]: any) => (
            <div key={dateKey} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-100">
                {dateKey === "TBD"
                  ? "Time To Be Determined"
                  : format(new Date(dateKey), "EEEE, MMMM dd, yyyy")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dateEvents.map((event: any, index: number) => {
                  const status = getEventStatus(event);
                  return (
                    <Card
                      key={event.id}
                      className="hover:shadow-lg transition-shadow liquid-glass-enhanced"
                      style={{
                        backgroundColor:
                          index === 0
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            {event.name}
                          </CardTitle>
                          <Badge variant={status.color as any}>
                            {status.label}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400">
                          {event.sport?.name} - {event.sport?.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-white">
                            <Clock className="h-4 w-4" />
                            {event.scheduled_time
                              ? formatTime(event.scheduled_time)
                              : "Time TBD"}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-white">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-white">
                            <Users className="h-4 w-4" />
                            {event.event_participants?.[0]?.count || 0}{" "}
                            participants
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-100 mb-2">
                No events scheduled
              </h3>
              <p className="text-gray-400">
                The event schedule will be updated soon
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
