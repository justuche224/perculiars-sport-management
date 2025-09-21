import { createClient } from "@/lib/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Award, Star } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function ChildResultsPage({ params }: PageProps) {
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

  // Get child's results
  const { data: participant } = await supabase
    .from("participants")
    .select(
      `
      id,
      full_name,
      house:houses(name, color),
      results:results(
        id,
        position,
        points_awarded,
        event:events(
          id,
          name,
          scheduled_time,
          sport:sports(name)
        )
      )
    `
    )
    .eq("id", params.id)
    .eq("guardian_id", user.id)
    .eq("is_active", true)
    .single();

  if (!participant) {
    redirect("/guardian");
  }

  const results = participant.results || [];
  const topThreeResults = results.filter((r) => r.position <= 3);

  // Group results by position
  const firstPlace = results.filter((r) => r.position === 1);
  const secondPlace = results.filter((r) => r.position === 2);
  const thirdPlace = results.filter((r) => r.position === 3);

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link href={`/guardian/children/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {participant.full_name}
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: Array.isArray(participant.house)
                  ? participant.house[0]?.color
                  : // @ts-ignore - TypeScript doesn't know about the Array.isArray check
                    participant.house?.color,
              }}
            />
            <h1 className="text-3xl font-bold">
              {participant.full_name}&apos;s Results
            </h1>
          </div>
        </div>

        {/* Achievement Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-yellow-700">
                {firstPlace.length}
              </div>
              <div className="text-yellow-600 font-medium">1st Place</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-700">
                {secondPlace.length}
              </div>
              <div className="text-gray-600 font-medium">2nd Place</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-amber-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-amber-700">
                {thirdPlace.length}
              </div>
              <div className="text-amber-600 font-medium">3rd Place</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <div className="space-y-6">
          {results.length > 0 ? (
            <>
              <h2 className="text-xl font-bold">All Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result: any, idx: number) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              result.position === 1
                                ? "bg-yellow-500"
                                : result.position === 2
                                ? "bg-gray-400"
                                : result.position === 3
                                ? "bg-amber-600"
                                : "bg-blue-500"
                            }`}
                          >
                            {result.position}
                          </div>
                          <div>
                            <div className="font-medium">
                              {result.event?.sport?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {result.event?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            +{result.points_awarded} pts
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              result.event?.scheduled_time
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results yet</h3>
                <p className="text-gray-600">
                  {participant.full_name} hasn&apos;t achieved any top positions
                  yet. Keep participating!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
