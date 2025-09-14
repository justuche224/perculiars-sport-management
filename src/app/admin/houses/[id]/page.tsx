import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, ArrowLeft, Edit, Crown, Calendar } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function HouseDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get house details with participants and captain info
  const { data: house, error } = await supabase
    .from("houses")
    .select(`
      *,
      participants:participants(
        id,
        full_name,
        age,
        guardian_email,
        is_active,
        created_at
      ),
      captain:profiles!houses_captain_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq("id", params.id)
    .maybeSingle()

  if (error || !house) {
    notFound()
  }

  // Get recent results for this house
  const { data: recentResults } = await supabase
    .from("results")
    .select(`
      *,
      event:events(name, scheduled_time),
      participant:participants(full_name)
    `)
    .eq("house_id", params.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get house ranking
  const { data: allHouses } = await supabase
    .from("houses")
    .select("id, total_points")
    .order("total_points", { ascending: false })

  const houseRank = allHouses?.findIndex((h) => h.id === house.id) + 1 || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/admin/houses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Houses
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: house.color }} />
            <h1 className="text-3xl font-bold text-gray-900">{house.name}</h1>
            {houseRank === 1 && (
              <Badge className="bg-yellow-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Leading
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-2">House team details and management</p>
        </div>
        <Button asChild>
          <Link href={`/admin/houses/${house.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit House
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{house.total_points}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{house.participants?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">House Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">#{houseRank}</span>
              <span className="text-sm text-gray-600">of {allHouses?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Captain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {house.captain ? (
                <div>
                  <div className="font-medium">{house.captain.full_name}</div>
                  <div className="text-gray-600">{house.captain.email}</div>
                </div>
              ) : (
                <span className="text-gray-500">Not assigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Participants List */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>All registered participants for this house</CardDescription>
          </CardHeader>
          <CardContent>
            {house.participants && house.participants.length > 0 ? (
              <div className="space-y-3">
                {house.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{participant.full_name}</div>
                      <div className="text-sm text-gray-600">Age: {participant.age}</div>
                      {participant.guardian_email && (
                        <div className="text-sm text-gray-600">Guardian: {participant.guardian_email}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={participant.is_active ? "default" : "secondary"}>
                        {participant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No participants registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
            <CardDescription>Latest competition results for this house</CardDescription>
          </CardHeader>
          <CardContent>
            {recentResults && recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{result.event?.name}</div>
                      <div className="text-sm text-gray-600">{result.participant?.full_name}</div>
                      {result.event?.scheduled_time && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.event.scheduled_time).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={result.position <= 3 ? "default" : "secondary"}>
                        {result.position === 1
                          ? "1st"
                          : result.position === 2
                            ? "2nd"
                            : result.position === 3
                              ? "3rd"
                              : `${result.position}th`}
                      </Badge>
                      <div className="text-sm font-medium text-green-600">+{result.points_awarded} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No results recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
