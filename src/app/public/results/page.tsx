import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Calendar, Users, Search, Award } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function PublicResultsPage() {
  const supabase = await createClient()

  // Get house standings
  const { data: houses } = await supabase.from("houses").select("*").order("total_points", { ascending: false })

  // Get recent results with event and participant info
  const { data: recentResults } = await supabase
    .from("results")
    .select(`
      *,
      event:events(name, scheduled_time, sport:sports(name, category)),
      participant:participants(full_name, age),
      house:houses(name, color)
    `)
    .order("created_at", { ascending: false })
    .limit(15)

  // Get completed events count
  const { data: completedEvents } = await supabase.from("events").select("id").eq("status", "completed")
  const totalCompletedEvents = completedEvents?.length || 0

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "Not scheduled"
    return format(new Date(dateTime), "MMM dd, h:mm a")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sports Day Results</h1>
          <p className="text-gray-600 mb-4">Live standings and event results</p>
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {totalCompletedEvents} events completed
            </Badge>
            <Button asChild>
              <Link href="/public/schedule">View Schedule</Link>
            </Button>
          </div>
        </div>

        {/* House Standings */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6" />
              House Standings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {houses?.map((house, index) => (
                <div
                  key={house.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    index === 0
                      ? "border-yellow-400 bg-yellow-50 shadow-md"
                      : index === 1
                        ? "border-gray-400 bg-gray-50"
                        : index === 2
                          ? "border-amber-600 bg-amber-50"
                          : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                            ? "bg-gray-400"
                            : index === 2
                              ? "bg-amber-600"
                              : "bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: house.color }} />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{house.name}</h3>
                        {index === 0 && <Badge className="mt-1 bg-yellow-500">Leading</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{house.total_points}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Latest Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentResults && recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          result.position === 1
                            ? "bg-yellow-500"
                            : result.position === 2
                              ? "bg-gray-400"
                              : result.position === 3
                                ? "bg-amber-600"
                                : "bg-gray-300"
                        }`}
                      >
                        {result.position}
                      </div>
                      <div className="flex items-center gap-3">
                        {result.house && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: result.house.color }} />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{result.participant?.full_name}</div>
                          <div className="text-sm text-gray-600">
                            {result.event?.name} - {result.event?.sport?.name}
                          </div>
                          <div className="text-xs text-gray-500">{formatDateTime(result.event?.scheduled_time)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="mb-2"
                        style={{ backgroundColor: result.house?.color + "20", color: result.house?.color }}
                      >
                        {result.house?.name}
                      </Badge>
                      <div className="font-bold text-green-600 text-lg">+{result.points_awarded}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Medal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
                <p className="text-gray-600">Results will appear here as events are completed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Event Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View upcoming and completed events</p>
              <Button asChild className="w-full">
                <Link href="/public/schedule">View Schedule</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                House Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Learn about each house team</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/public/houses">View Houses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Browse participant directory</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/public/participants">View Participants</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-500" />
                Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Find specific participants, events, or results</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/public/search">Search Now</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-pink-500" />
                Records & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View top performers and house statistics</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/public/records">View Records</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
