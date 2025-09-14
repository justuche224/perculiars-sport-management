import { createClient } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Home,
  Trophy,
  ArrowLeft,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParticipantDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get participant with house information
  const { data: participant, error } = await supabase
    .from("participants")
    .select(
      `
      *,
      house:houses(id, name, color, captain_id)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !participant) {
    notFound();
  }

  // Get participant's event registrations and results
  const { data: eventParticipations } = await supabase
    .from("event_participants")
    .select(
      `
      *,
      event:events(
        id,
        name,
        scheduled_time,
        status,
        sport:sports(name, category)
      )
    `
    )
    .eq("participant_id", id);

  // Get participant's results
  const { data: results } = await supabase
    .from("results")
    .select(
      `
      *,
      event:events(
        id,
        name,
        sport:sports(name, category)
      )
    `
    )
    .eq("participant_id", id)
    .order("created_at", { ascending: false });

  const totalPoints =
    results?.reduce((sum, result) => sum + result.points_awarded, 0) || 0;
  const totalEvents = eventParticipations?.length || 0;
  const completedEvents = results?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/participants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Participants
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{participant.full_name}</h1>
            <p className="text-muted-foreground mt-1">Participant Details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/participants/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Participant
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participant Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={participant.is_active ? "default" : "secondary"}
                >
                  {participant.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{participant.age} years</span>
              </div>
              {participant.guardian_email && (
                <div className="space-y-1">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Guardian Email
                  </span>
                  <span className="font-medium text-sm">
                    {participant.guardian_email}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Registered
                </span>
                <span className="font-medium text-sm">
                  {new Date(participant.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* House Information */}
          {participant.house && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  House Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: participant.house.color }}
                  />
                  <div>
                    <div className="font-medium">{participant.house.name}</div>
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link href={`/admin/houses/${participant.house.id}`}>
                        View House Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Points</span>
                <span className="font-bold text-lg text-blue-600">
                  {totalPoints}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Events Registered</span>
                <span className="font-medium">{totalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Events Completed</span>
                <span className="font-medium">{completedEvents}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Registrations */}
          <Card>
            <CardHeader>
              <CardTitle>Event Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {eventParticipations && eventParticipations.length > 0 ? (
                <div className="space-y-3">
                  {eventParticipations.map((participation) => (
                    <div
                      key={participation.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {participation.event.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participation.event.sport.name} •{" "}
                          {participation.event.sport.category}
                        </div>
                        {participation.event.scheduled_time && (
                          <div className="text-sm text-muted-foreground">
                            {new Date(
                              participation.event.scheduled_time
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            participation.event.status === "completed"
                              ? "default"
                              : participation.event.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {participation.event.status}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/admin/events/${participation.event.id}`}
                          >
                            View Event
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No event registrations found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results History */}
          <Card>
            <CardHeader>
              <CardTitle>Results History</CardTitle>
            </CardHeader>
            <CardContent>
              {results && results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{result.event.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.event.sport.name} •{" "}
                          {result.event.sport.category}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-foreground">
                            {result.position === 1
                              ? "🥇"
                              : result.position === 2
                              ? "🥈"
                              : result.position === 3
                              ? "🥉"
                              : `#${result.position}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Position
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {result.points_awarded}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Points
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No results recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
