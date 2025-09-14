import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trophy } from "lucide-react"
import Link from "next/link"

export default async function SportsPage() {
  const supabase = await createClient()

  // Get sports with event count
  const { data: sports } = await supabase
    .from("sports")
    .select(`
      *,
      events:events(count)
    `)
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  // Group sports by category
  const sportsByCategory = sports?.reduce(
    (acc, sport) => {
      if (!acc[sport.category]) {
        acc[sport.category] = []
      }
      acc[sport.category].push(sport)
      return acc
    },
    {} as Record<string, typeof sports>,
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports Management</h1>
          <p className="text-gray-600 mt-2">Manage sports categories and point systems</p>
        </div>
        <Button asChild>
          <Link href="/admin/sports/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Sport
          </Link>
        </Button>
      </div>

      {sportsByCategory && Object.keys(sportsByCategory).length > 0 ? (
        Object.entries(sportsByCategory).map(([category, categorySports]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">{category} Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorySports.map((sport) => (
                <Card key={sport.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        {sport.name}
                      </CardTitle>
                      <Badge variant={sport.is_active ? "default" : "secondary"}>
                        {sport.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>Max {sport.max_participants_per_house} per house</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-medium">
                          {sport.points_first}/{sport.points_second}/{sport.points_third}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Events:</span>
                        <span className="font-medium">{sport.events?.[0]?.count || 0}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/sports/${sport.id}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/sports/${sport.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sports found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first sport category.</p>
            <Button asChild>
              <Link href="/admin/sports/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Sport
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
