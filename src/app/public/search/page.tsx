"use client"

import { createClient } from "@/lib/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, Trophy, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { format } from "date-fns"

interface SearchResult {
  type: "participant" | "event" | "result"
  id: string
  title: string
  subtitle: string
  details: string
  house?: { name: string; color: string }
  position?: number
  points?: number
  date?: string
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    const searchResults: SearchResult[] = []

    try {
      // Search participants
      if (searchType === "all" || searchType === "participants") {
        const { data: participants } = await supabase
          .from("participants")
          .select(`
            id,
            full_name,
            age,
            house:houses(name, color)
          `)
          .ilike("full_name", `%${searchTerm}%`)
          .eq("is_active", true)
          .limit(10)

        participants?.forEach((participant) => {
          searchResults.push({
            type: "participant",
            id: participant.id,
            title: participant.full_name,
            subtitle: `Age: ${participant.age}`,
            details: `House: ${participant.house?.name || "Unassigned"}`,
            house: participant.house,
          })
        })
      }

      // Search events
      if (searchType === "all" || searchType === "events") {
        const { data: events } = await supabase
          .from("events")
          .select(`
            id,
            name,
            scheduled_time,
            status,
            sport:sports(name, category)
          `)
          .or(`name.ilike.%${searchTerm}%,sport.name.ilike.%${searchTerm}%`)
          .limit(10)

        events?.forEach((event) => {
          searchResults.push({
            type: "event",
            id: event.id,
            title: event.name,
            subtitle: `${event.sport?.name} - ${event.sport?.category}`,
            details: `Status: ${event.status.replace("_", " ")}`,
            date: event.scheduled_time,
          })
        })
      }

      // Search results
      if (searchType === "all" || searchType === "results") {
        const { data: resultData } = await supabase
          .from("results")
          .select(`
            id,
            position,
            points_awarded,
            created_at,
            participant:participants(full_name),
            event:events(name, sport:sports(name)),
            house:houses(name, color)
          `)
          .or(`participant.full_name.ilike.%${searchTerm}%,event.name.ilike.%${searchTerm}%`)
          .limit(10)

        resultData?.forEach((result) => {
          searchResults.push({
            type: "result",
            id: result.id,
            title: `${result.participant?.full_name} - ${result.event?.name}`,
            subtitle: `${result.event?.sport?.name}`,
            details: `${result.house?.name}`,
            house: result.house,
            position: result.position,
            points: result.points_awarded,
            date: result.created_at,
          })
        })
      }

      setResults(searchResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchType])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ""
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const getPositionBadge = (position: number) => {
    const colors = {
      1: "bg-yellow-500 text-white",
      2: "bg-gray-400 text-white",
      3: "bg-amber-600 text-white",
    }
    return colors[position as keyof typeof colors] || "bg-gray-300 text-gray-700"
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
            <h1 className="text-4xl font-bold text-gray-900">Search</h1>
            <p className="text-gray-600 mt-2">Find participants, events, and results</p>
          </div>
        </div>

        {/* Search Interface */}
        <Card className="shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Sports Day Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search for participants, events, or results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="results">Results</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Results */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 mt-2">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {result.type === "participant" && <User className="h-5 w-5 text-blue-500" />}
                          {result.type === "event" && <Calendar className="h-5 w-5 text-green-500" />}
                          {result.type === "result" && <Trophy className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{result.title}</h3>
                          <p className="text-sm text-gray-600">{result.subtitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {result.house && (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: result.house.color }} />
                                <span className="text-sm text-gray-600">{result.details}</span>
                              </div>
                            )}
                            {!result.house && <span className="text-sm text-gray-600">{result.details}</span>}
                            {result.date && <span className="text-xs text-gray-500">• {formatDate(result.date)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {result.type}
                        </Badge>
                        {result.position && (
                          <Badge className={getPositionBadge(result.position)}>
                            {result.position === 1
                              ? "1st"
                              : result.position === 2
                                ? "2nd"
                                : result.position === 3
                                  ? "3rd"
                                  : `${result.position}th`}
                          </Badge>
                        )}
                        {result.points && result.points > 0 && <Badge variant="secondary">+{result.points} pts</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try searching with different keywords or check the spelling</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">Enter a search term to find participants, events, or results</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Search Suggestions */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Quick Search Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => setSearchTerm("100m")} className="justify-start bg-transparent">
                <Trophy className="h-4 w-4 mr-2" />
                100m Events
              </Button>
              <Button variant="outline" onClick={() => setSearchTerm("relay")} className="justify-start bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Relay Races
              </Button>
              <Button variant="outline" onClick={() => setSearchTerm("track")} className="justify-start bg-transparent">
                <Trophy className="h-4 w-4 mr-2" />
                Track Events
              </Button>
              <Button variant="outline" onClick={() => setSearchTerm("field")} className="justify-start bg-transparent">
                <Trophy className="h-4 w-4 mr-2" />
                Field Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
