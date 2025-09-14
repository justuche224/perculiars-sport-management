import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PublicParticipantsPage() {
  const supabase = await createClient()

  // Get participants with house information
  const { data: participants } = await supabase
    .from("participants")
    .select(`
      *,
      house:houses(name, color)
    `)
    .eq("is_active", true)
    .order("full_name")

  // Group participants by house
  const participantsByHouse = participants?.reduce(
    (acc, participant) => {
      const houseName = participant.house?.name || "Unassigned"
      if (!acc[houseName]) {
        acc[houseName] = []
      }
      acc[houseName].push(participant)
      return acc
    },
    {} as Record<string, typeof participants>,
  )

  const totalParticipants = participants?.length || 0

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
            <h1 className="text-4xl font-bold text-gray-900">Participants</h1>
            <p className="text-gray-600 mt-2">{totalParticipants} athletes competing across all house teams</p>
          </div>
        </div>

        {participantsByHouse && Object.keys(participantsByHouse).length > 0 ? (
          Object.entries(participantsByHouse).map(([houseName, houseParticipants]) => (
            <Card key={houseName} className="shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {houseParticipants[0]?.house && (
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: houseParticipants[0].house.color }}
                    />
                  )}
                  <CardTitle className="text-2xl text-gray-900">{houseName}</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {houseParticipants.length} participants
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {houseParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{participant.full_name}</div>
                        <div className="text-sm text-gray-600">Age: {participant.age}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
              <p className="text-gray-600">Participant information will be available soon</p>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Participation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalParticipants}</div>
                <div className="text-sm text-gray-600">Total Athletes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {participantsByHouse ? Object.keys(participantsByHouse).length : 0}
                </div>
                <div className="text-sm text-gray-600">House Teams</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {participantsByHouse && Object.keys(participantsByHouse).length > 0
                    ? Math.round(totalParticipants / Object.keys(participantsByHouse).length)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg per House</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {participants && participants.length > 0
                    ? Math.round(participants.reduce((sum, p) => sum + (p.age || 0), 0) / participants.length)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Average Age</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
