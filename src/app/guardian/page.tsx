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
  TrendingUp,
  Star,
  Award,
  Activity,
  Target,
  Users,
  ChevronRight,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GuardianDashboard() {
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

  // Get children/wards with more detailed information
  const { data: participants } = await supabase
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
    .eq("guardian_id", user.id)
    .eq("is_active", true)
    .order("full_name");

  // Calculate comprehensive statistics
  const participantsWithStats = participants?.map((participant) => {
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

    // Get recent events (last 3)
    const recentEvents =
      participant.events
        ?.sort(
          (a: any, b: any) =>
            new Date(b.event?.scheduled_time || 0).getTime() -
            new Date(a.event?.scheduled_time || 0).getTime()
        )
        .slice(0, 3) || [];

    // Calculate average position
    const avgPosition = participant.events?.length
      ? (
          participant.events.reduce(
            (sum: number, event: any) => sum + (event.position || 0),
            0
          ) / participant.events.length
        ).toFixed(1)
      : null;

    return {
      ...participant,
      totalEvents,
      totalPoints,
      recentEvents,
      avgPosition,
    };
  });

  // Calculate overall family statistics
  const totalChildren = participantsWithStats?.length || 0;
  const totalFamilyPoints =
    participantsWithStats?.reduce((sum, p) => sum + p.totalPoints, 0) || 0;
  const totalFamilyEvents =
    participantsWithStats?.reduce((sum, p) => sum + p.totalEvents, 0) || 0;

  // Get unique houses for family overview
  const familyHouses = [
    ...new Set(
      participantsWithStats?.map((p) => p.house?.name).filter(Boolean) || []
    ),
  ];

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      <div className="space-y-8 p-6">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl liquid-glass text-white p-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {profile.full_name}!
                </h1>
                <p className="text-blue-100 text-lg">
                  Track your children&apos;s progress and achievements
                </p>
              </div>
              <div className="hidden md:block">
                <Avatar className="h-20 w-20 border-4 border-white/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-white/20 text-2xl font-bold">
                    {profile.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Family Overview Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-sm text-blue-100">Children</span>
                </div>
                <div className="text-2xl font-bold">{totalChildren}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm text-blue-100">Total Points</span>
                </div>
                <div className="text-2xl font-bold">{totalFamilyPoints}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm text-blue-100">Events</span>
                </div>
                <div className="text-2xl font-bold">{totalFamilyEvents}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span className="text-sm text-blue-100">Houses</span>
                </div>
                <div className="text-2xl font-bold">{familyHouses.length}</div>
              </div>
            </div>
          </div>
        </div>

        {participantsWithStats && participantsWithStats.length > 0 ? (
          <>
            {/* Children Cards Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Your Children
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {participantsWithStats.map((participant: any) => (
                  <Card
                    key={participant.id}
                    className="hover:shadow-xl transition-all duration-300 border-l-4 liquid-glass"
                    style={{
                      borderLeftColor:
                        (Array.isArray(participant.house)
                          ? participant.house[0]?.color
                          : participant.house?.color) || "#6b7280",
                    }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="" />
                            <AvatarFallback
                              className="font-semibold"
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
                          <div>
                            <CardTitle className="text-xl text-white">
                              {participant.full_name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Home className="h-3 w-3" />
                              <span>
                                {participant.house?.name || "Unassigned"}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-card">
                          Age {participant.age}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Statistics Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {participant.totalEvents}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            Events
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-xl font-bold text-green-600">
                            {participant.totalPoints}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Points
                          </div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-xl font-bold text-purple-600">
                            {participant.avgPosition || "-"}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            Avg Pos
                          </div>
                        </div>
                      </div>

                      {/* Recent Events */}
                      {participant.recentEvents.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Recent Events
                          </h4>
                          <div className="space-y-2">
                            {participant.recentEvents.map(
                              (event: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{
                                        backgroundColor: Array.isArray(
                                          participant.house
                                        )
                                          ? participant.house[0]?.color
                                          : participant.house?.color,
                                      }}
                                    />
                                    <span className="font-medium">
                                      {event.event?.sport?.name}
                                    </span>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-600 truncate">
                                      {event.event?.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {event.points_earned > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +{event.points_earned}pts
                                      </Badge>
                                    )}
                                    {event.position && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        #{event.position}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/guardian/children/${participant.id}/events`}
                          >
                            <Calendar className="h-3 w-3 mr-2" />
                            View Events
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/guardian/children/${participant.id}/results`}
                          >
                            <Trophy className="h-3 w-3 mr-2" />
                            Results
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Target className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-between" variant="outline">
                    <span>View All Events</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button className="w-full justify-between" variant="outline">
                    <span>House Rankings</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button className="w-full justify-between" variant="outline">
                    <span>Performance Reports</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Star className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Award className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-700 font-medium">
                      Great progress!
                    </p>
                    <p className="text-purple-600 text-sm mt-1">
                      Your children are doing excellent this season
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* Enhanced Empty State */
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No children registered
                </h3>
                <p className="text-gray-600 mb-6">
                  No children or wards have been registered under your account
                  yet. Contact your school administrator to add your children.
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Users className="h-4 w-4 mr-2" />
                  Contact Administrator
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
