import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, TrendingUp, ArrowLeft, Award } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function RecordsPage() {
  const supabase = await createClient()

  // Get top performers by sport
  const { data: topPerformers } = await supabase
    .from("results")
    .select(`
      *,
      participant:participants(full_name, age),
      event:events(name, sport:sports(name, category)),
      house:houses(name, color)
    `)
    .eq("position", 1)
    .order("points_awarded", { ascending: false })

  // Get house performance summary
  const { data: housePerformance } = await supabase
    .from("houses")
    .select(`
      *,
      results:results(position, points_awarded)
    `)
    .order("total_points", { ascending: false })

  // Get recent achievements (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentAchievements } = await supabase
    .from("results")
    .select(`
      *,
      participant:participants(full_name),
      event:events(name, sport:sports(name)),
      house:houses(name, color)
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .lte("position", 3)
    .order("created_at", { ascending: false })
    .limit(10)

  // Calculate house statistics
  const houseStats = housePerformance?.map((house) => {
    const results = house.results || []
    const goldMedals = results.filter((r: any) => r.position === 1).length
    const silverMedals = results.filter((r: any) => r.position === 2).length
    const bronzeMedals = results.filter((r: any) => r.position === 3).length
    const totalMedals = goldMedals + silverMedals + bronzeMedals

    return {
      ...house,
      goldMedals,
      silverMedals,
      bronzeMedals,
      totalMedals,
    }
  })

  // Group top performers by sport category
  const performersByCategory = topPerformers?.reduce(
    (acc, performer) => {
      const category = performer.event?.sport?.category || "Other"
      if (!acc[category]) acc[category] = []
      acc[category].push(performer)
      return acc
    },
    {} as Record<string, typeof topPerformers>,
  )

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getPositionBadge = (position: number) => {
    const styles = {
      1: "bg-yellow-500 text-white",
      2: "bg-gray-400 text-white",
      3: "bg-amber-600 text-white",
    }
    return styles[position as keyof typeof styles] || "bg-gray-300 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href="/public/results">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Records & Achievements</h1>
            <p className="text-gray-600 mt-2">Outstanding performances and house statistics</p>
          </div>
        </div>

        {/* House Medal Count */}
        <Card className="shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              House Medal Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {houseStats?.map((house, index) => (
                <div
                  key={house.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    index === 0 ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: house.color }} />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{house.name}</h3>
                        <p className="text-sm text-gray-600">{house.total_points} total points</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {house.goldMedals}
                      </div>
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {house.silverMedals}
                      </div>
                      <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {house.bronzeMedals}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{house.totalMedals}</div>
                      <div className="text-sm text-gray-600">medals</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers by Category */}
        {performersByCategory && Object.keys(performersByCategory).length > 0 && (
          <Card className="shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                Champions by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {Object.entries(performersByCategory).map(([category, performers]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">{category} Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {performers.slice(0, 6).map((performer) => (
                      <div key={performer.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {performer.house && (
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: performer.house.color }}
                              />
                            )}
                            <span className="font-semibold text-gray-900">{performer.participant?.full_name}</span>
                          </div>
                          <Badge className="bg-yellow-500 text-white">1st</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{performer.event?.name}</div>
                        <div className="text-sm text-gray-600">{performer.event?.sport?.name}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">{performer.house?.name}</span>
                          <Badge variant="secondary">+{performer.points_awarded} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Achievements */}
        <Card className="shadow-lg bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Recent Achievements (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {recentAchievements && recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {recentAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getPositionBadge(achievement.position)}>
                        {achievement.position === 1 ? "1st" : achievement.position === 2 ? "2nd" : "3rd"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {achievement.house && (
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: achievement.house.color }} />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{achievement.participant?.full_name}</div>
                          <div className="text-sm text-gray-600">
                            {achievement.event?.name} - {achievement.event?.sport?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{formatDate(achievement.created_at)}</div>
                      <Badge variant="secondary">+{achievement.points_awarded} pts</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent achievements</h3>
                <p className="text-gray-600">New achievements will appear here as events are completed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Summary */}
        <Card className="shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Competition Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{topPerformers?.length || 0}</div>
                <div className="text-sm text-gray-600">Gold Medals</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{houseStats?.length || 0}</div>
                <div className="text-sm text-gray-600">Competing Houses</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {houseStats?.reduce((sum, house) => sum + house.totalMedals, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Medals</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {houseStats?.reduce((sum, house) => sum + house.total_points, 0) || 0}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
