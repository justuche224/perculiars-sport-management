import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, TrendingUp } from "lucide-react"

export default async function ScoreboardPage() {
  const supabase = await createClient()

  // Get house standings
  const { data: houses } = await supabase
    .from("houses")
    .select(`
      *,
      results:results(points_awarded),
      participants:participants(count)
    `)
    .order("total_points", { ascending: false })

  // Get recent results
  const { data: recentResults } = await supabase
    .from("results")
    .select(`
      *,
      event:events(name, sport:sports(name)),
      participant:participants(full_name),
      house:houses(name, color)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get completed events count
  const { data: completedEvents } = await supabase.from("events").select("id").eq("status", "completed")

  const totalCompletedEvents = completedEvents?.length || 0

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Scoreboard</h1>
        <p className="text-gray-600">Real-time house standings and recent results</p>
        <Badge variant="secondary" className="mt-2">
          {totalCompletedEvents} events completed
        </Badge>
      </div>

      {/* House Standings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            House Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {houses?.map((house, index) => (
              <div
                key={house.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  index === 0
                    ? "border-yellow-400 bg-yellow-50"
                    : index === 1
                      ? "border-gray-400 bg-gray-50"
                      : index === 2
                        ? "border-amber-600 bg-amber-50"
                        : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
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
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: house.color }} />
                    <div>
                      <h3 className="text-xl font-bold">{house.name}</h3>
                      <p className="text-sm text-gray-600">{house.participants?.[0]?.count || 0} participants</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-blue-500" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentResults && recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
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
                    <div className="flex items-center gap-2">
                      {result.house && (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: result.house.color }} />
                      )}
                      <div>
                        <div className="font-medium">{result.participant?.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {result.event?.name} - {result.event?.sport?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{result.house?.name}</Badge>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{result.points_awarded}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No results recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
