import { createClient } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Edit, Calendar, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewResultsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select(
      `
      *,
      sport:sports(name, category, points_first, points_second, points_third)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  // Get results for this event
  const { data: results } = await supabase
    .from("results")
    .select(
      `
      *,
      participant:participants(full_name, age),
      house:houses(name, color)
    `
    )
    .eq("event_id", id)
    .order("position", { ascending: true });

  // Get event participants count
  const { data: participantsData } = await supabase
    .from("event_participants")
    .select("participant_id")
    .eq("event_id", id);

  const totalParticipants = participantsData?.length || 0;
  const hasResults = results && results.length > 0;

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not scheduled";
    return format(new Date(dateTime), "MMM dd, yyyy 'at' h:mm a");
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-gray-400";
      case 3:
        return "bg-amber-600";
      default:
        return "bg-gray-300";
    }
  };

  const getPositionText = (position: number) => {
    switch (position) {
      case 1:
        return "1st Place";
      case 2:
        return "2nd Place";
      case 3:
        return "3rd Place";
      default:
        return `${position}th Place`;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/results">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Results
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground mt-2">
            {event.sport?.name} - {event.sport?.category}
          </p>
        </div>
        <div className="flex gap-2">
          {event.status !== "completed" && (
            <Button asChild>
              <Link href={`/admin/results/${id}/record`}>
                <Edit className="h-4 w-4 mr-2" />
                Record Results
              </Link>
            </Button>
          )}
          {hasResults && (
            <Button variant="outline" asChild>
              <Link href={`/admin/results/${id}/record`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Results
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge
                variant={
                  event.status === "completed" ? "secondary" : "destructive"
                }
              >
                {event.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Scheduled Time
              </div>
              <div className="font-medium">
                {formatDateTime(event.scheduled_time)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">
                {event.location || "Not specified"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasResults ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Podium Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Podium Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.slice(0, 3).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPositionColor(
                          result.position
                        )}`}
                      >
                        {result.position}
                      </div>
                      <div className="flex items-center gap-3">
                        {result.house && (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: result.house.color }}
                          />
                        )}
                        <div>
                          <div className="font-semibold">
                            {result.participant?.full_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.house?.name} • Age {result.participant?.age}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-lg">
                        +{result.points_awarded}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        points
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5" />
                All Results ({results.length} of {totalParticipants}{" "}
                participants)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPositionColor(
                          result.position
                        )}`}
                      >
                        {result.position}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.house && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: result.house.color }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {result.participant?.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.house?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{result.points_awarded}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Results Recorded
            </h3>
            <p className="text-muted-foreground mb-6">
              Results haven't been recorded for this event yet.
            </p>
            <Button asChild>
              <Link href={`/admin/results/${id}/record`}>
                <Medal className="h-4 w-4 mr-2" />
                Record Results
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Points Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Points System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {event.sport?.points_first}
              </div>
              <div className="text-sm text-muted-foreground">1st Place</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-muted-foreground">
                {event.sport?.points_second}
              </div>
              <div className="text-sm text-muted-foreground">2nd Place</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">
                {event.sport?.points_third}
              </div>
              <div className="text-sm text-muted-foreground">3rd Place</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
