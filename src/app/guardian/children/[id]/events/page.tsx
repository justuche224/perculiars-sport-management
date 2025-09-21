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
import { Calendar, ArrowLeft, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function ChildEventsPage({ params }: PageProps) {
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

  // Get child's events
  const { data: participant } = await supabase
    .from("participants")
    .select(
      `
      id,
      full_name,
      house:houses(name, color),
      events:event_participants(
        event_id,
        position,
        points_earned,
        event:events(
          id,
          name,
          scheduled_time,
          location,
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

  const events = participant.events || [];

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

          <div className="flex items-center gap-3 mb-4">
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
              {participant.full_name}&apos;s Events
            </h1>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((eventData: any, idx: number) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {eventData.event?.sport?.name}
                    </CardTitle>
                    {eventData.position && (
                      <Badge
                        variant={
                          eventData.position <= 3 ? "default" : "secondary"
                        }
                        className={
                          eventData.position <= 3 ? "bg-yellow-500" : ""
                        }
                      >
                        #{eventData.position}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{eventData.event?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(
                        eventData.event?.scheduled_time
                      ).toLocaleDateString()}
                    </div>

                    {eventData.event?.location && (
                      <div className="text-sm text-gray-600">
                        📍 {eventData.event.location}
                      </div>
                    )}

                    {eventData.points_earned > 0 && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-green-600">
                          +{eventData.points_earned} points
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-gray-600">
                {participant.full_name} hasn&apos;t participated in any events
                yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
