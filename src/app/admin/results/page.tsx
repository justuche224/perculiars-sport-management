import { createClient } from "@/lib/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function ResultsPage() {
  const supabase = await createClient();

  // Get events that can have results recorded
  const { data: events } = await supabase
    .from("events")
    .select(
      `
      *,
      sport:sports(name, category, points_first, points_second, points_third),
      results:results(count),
      event_participants:event_participants(count)
    `
    )
    .in("status", ["in_progress", "completed"])
    .order("scheduled_time", { ascending: false });

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not scheduled";
    return format(new Date(dateTime), "MMM dd, h:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "default";
    }
  };

  const hasResults = (event: any) => {
    return event.results?.[0]?.count > 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Results Management</h1>
          <p className="text-muted-foreground mt-2">
            Record and manage event results
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/scoreboard">
            <Trophy className="h-4 w-4 mr-2" />
            View Live Scoreboard
          </Link>
        </Button>
      </div>

      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {event.name}
                  </CardTitle>
                  <Badge variant={getStatusColor(event.status)}>
                    {event.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription>
                  {event.sport?.name} - {event.sport?.category}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(event.scheduled_time)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-medium">
                      {event.event_participants?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Results recorded:
                    </span>
                    <div className="flex items-center gap-1">
                      {hasResults(event) && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="font-medium">
                        {event.results?.[0]?.count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/results/${event.id}`}>
                        {hasResults(event) ? "View Results" : "Record Results"}
                      </Link>
                    </Button>
                    {event.status === "in_progress" && (
                      <Button size="sm" asChild>
                        <Link href={`/admin/results/${event.id}/record`}>
                          Quick Record
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events ready for results
            </h3>
            <p className="text-muted-foreground mb-4">
              Events must be in progress or completed to record results.
            </p>
            <Button variant="outline" asChild>
              <Link href="/admin/events">Manage Events</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
