import { createClient } from "@/lib/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, User } from "lucide-react";
import Link from "next/link";

export default async function ParticipantsPage() {
  const supabase = await createClient();

  // Get participants with house and guardian information
  const { data: participants } = await supabase
    .from("participants")
    .select(
      `
      *,
      house:houses(name, color),
      guardian:profiles(id, full_name, email)
    `
    )
    .order("full_name");

  // Group participants by house
  const participantsByHouse = participants?.reduce((acc, participant) => {
    const houseName = participant.house?.name || "Unassigned";
    if (!acc[houseName]) {
      acc[houseName] = [];
    }
    acc[houseName].push(participant);
    return acc;
  }, {} as Record<string, NonNullable<typeof participants>>);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Participant Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage participant registrations and house assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/participants/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Participant
          </Link>
        </Button>
      </div>

      {participantsByHouse && Object.keys(participantsByHouse).length > 0 ? (
        Object.entries(participantsByHouse).map(
          ([houseName, houseParticipants]: any) => (
            <div key={houseName} className="space-y-4">
              <div className="flex items-center gap-2">
                {houseParticipants[0]?.house && (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: houseParticipants[0].house.color,
                    }}
                  />
                )}
                <h2 className="text-xl font-semibold">{houseName}</h2>
                <Badge variant="secondary">
                  {houseParticipants.length} participants
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {houseParticipants.map((participant: any) => (
                  <Card
                    key={participant.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {participant.full_name}
                        </CardTitle>
                        <Badge
                          variant={
                            participant.is_active ? "default" : "secondary"
                          }
                        >
                          {participant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription>Age: {participant.age}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {participant.guardian && (
                          <p className="text-sm text-muted-foreground">
                            Guardian: {participant.guardian.full_name} (
                            {participant.guardian.email})
                          </p>
                        )}
                        {!participant.guardian &&
                          participant.guardian_email && (
                            <p className="text-sm text-muted-foreground">
                              Guardian: {participant.guardian_email}
                            </p>
                          )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/participants/${participant.id}`}
                            >
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/admin/participants/${participant.id}/edit`}
                            >
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        )
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No participants found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by registering your first participant.
            </p>
            <Button asChild>
              <Link href="/admin/participants/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Participant
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
