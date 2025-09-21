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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Trophy,
  Calendar,
  Home,
  ArrowLeft,
  TrendingUp,
  Award,
  Activity,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function ChildDetailPage({ params }: PageProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    redirect("/admin");
  }

  // Get specific child
  const { data: participant } = await supabase
    .from("participants")
    .select(
      `
      *,
      house:houses(name, color),
      events:event_participants(
        event_id,
        position,
        points_earned,
        event:events(id, name, scheduled_time, sport:sports(name))
      ),
      results:results(position, points_awarded, event:events(name, scheduled_time))
    `
    )
    .eq("id", params.id)
    .eq("guardian_id", user.id)
    .eq("is_active", true)
    .single();

  if (!participant) {
    redirect("/guardian");
  }

  // Calculate comprehensive statistics
  const totalEvents = participant.events?.length || 0;
  const totalPoints =
    (participant.events?.reduce(
      (sum: number, event: any) => sum + (event.points_earned || 0),
      0
    ) || 0) +
    (participant.results?.reduce(
      (sum: number, result: any) => sum + result.points_awarded,
      0
    ) || 0);

  // Get recent events (last 10)
  const recentEvents =
    participant.events?.sort(
      (a: any, b: any) =>
        new Date(b.event?.scheduled_time || 0).getTime() -
        new Date(a.event?.scheduled_time || 0).getTime()
    ) || [];

  // Calculate average position
  const avgPosition = participant.events?.length
    ? (
        participant.events.reduce(
          (sum: number, event: any) => sum + (event.position || 0),
          0
        ) / participant.events.length
      ).toFixed(1)
    : null;

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href="/guardian">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-6 p-6 liquid-glass rounded-lg shadow-sm">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" />
              <AvatarFallback
                className="text-2xl font-bold"
                style={{
                  backgroundColor: `${
                    Array.isArray(participant.house)
                      ? participant.house[0]?.color
                      : participant.house?.color
                  }20`,
                }}
              >
                {participant.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">
                {participant.full_name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="bg-card">
                  Age {participant.age}
                </Badge>
                <div className="flex items-center gap-2 text-white">
                  <Home className="h-4 w-4" />
                  <span>{participant.house?.name || "Unassigned"}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-white">{totalPoints}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {totalEvents}
                  </div>
                  <div className="text-sm text-blue-600">Total Events</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {totalPoints}
                  </div>
                  <div className="text-sm text-green-600">Points Earned</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {avgPosition || "-"}
                  </div>
                  <div className="text-sm text-purple-600">Avg Position</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {participant.results?.length || 0}
                  </div>
                  <div className="text-sm text-orange-600">Top 3 Finishes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Event History
              </CardTitle>
              <CardDescription>Recent events and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-3">
                  {recentEvents.map((event: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: Array.isArray(participant.house)
                              ? participant.house[0]?.color
                              : participant.house?.color,
                          }}
                        />
                        <div>
                          <div className="font-medium">
                            {event.event?.sport?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.event?.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {event.points_earned > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            +{event.points_earned} pts
                          </Badge>
                        )}
                        {event.position && (
                          <Badge variant="outline">#{event.position}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No events participated yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Button asChild>
            <Link href={`/guardian/children/${participant.id}/events`}>
              <Calendar className="h-4 w-4 mr-2" />
              View All Events
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/guardian/children/${participant.id}/results`}>
              <Trophy className="h-4 w-4 mr-2" />
              View Results
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
