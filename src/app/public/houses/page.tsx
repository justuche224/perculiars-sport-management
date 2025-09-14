import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Trophy, ArrowLeft, Crown } from "lucide-react"
import Link from "next/link"

export default async function PublicHousesPage() {
  const supabase = await createClient()

  // Get houses with participant count and captain info
  const { data: houses } = await supabase
    .from("houses")
    .select(`
      *,
      participants:participants(count),
      captain:profiles!houses_captain_id_fkey(full_name)
    `)
    .order("total_points", { ascending: false })

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
            <h1 className="text-4xl font-bold text-gray-900">House Teams</h1>
            <p className="text-gray-600 mt-2">Meet the competing house teams</p>
          </div>
        </div>

        {houses && houses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {houses.map((house, index) => (
              <Card
                key={house.id}
                className={`hover:shadow-xl transition-all duration-300 bg-white ${
                  index === 0 ? "ring-2 ring-yellow-400 shadow-lg" : ""
                }`}
              >
                <CardHeader className="relative">
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-yellow-500 text-white px-3 py-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Leading
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: house.color }}
                    >
                      <div className="text-white font-bold text-2xl">{house.name.charAt(0)}</div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">{house.name}</CardTitle>
                      <CardDescription className="text-lg">
                        {house.captain?.full_name ? `Captain: ${house.captain.full_name}` : "Captain: TBA"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Total Points</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{house.total_points}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Participants</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{house.participants?.[0]?.count || 0}</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: house.color }} />
                        <span className="font-medium">House Color</span>
                      </div>
                      <div className="text-lg font-medium capitalize" style={{ color: house.color }}>
                        {house.color}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="text-center text-sm text-gray-600">Current Position: #{index + 1}</div>
                      {index === 0 && (
                        <div className="text-center mt-2">
                          <Badge className="bg-yellow-500 text-white">🏆 Current Leader</Badge>
                        </div>
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
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No houses found</h3>
              <p className="text-gray-600">House information will be available soon</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
