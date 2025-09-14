"use client";

import { createClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Participant {
  id: string;
  full_name: string;
  age: number;
  house: {
    id: string;
    name: string;
    color: string;
  };
}

interface EventParticipant {
  participant_id: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventParticipantsPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [eventParticipants, setEventParticipants] = useState<
    EventParticipant[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeData = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.id);

      const supabase = createClient();

      try {
        // Fetch all participants
        const { data: participantsData } = await supabase
          .from("participants")
          .select(
            `
            id,
            full_name,
            age,
            house:houses(id, name, color)
          `
          )
          .eq("is_active", true)
          .order("full_name");

        // Fetch current event participants
        const { data: eventParticipantsData } = await supabase
          .from("event_participants")
          .select("participant_id")
          .eq("event_id", resolvedParams.id);

        if (participantsData)
          setParticipants(participantsData as unknown as Participant[]);
        if (eventParticipantsData) {
          setEventParticipants(eventParticipantsData);
          setSelectedParticipants(
            new Set(eventParticipantsData.map((ep) => ep.participant_id))
          );
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [params]);

  const handleParticipantToggle = (participantId: string, checked: boolean) => {
    const newSelected = new Set(selectedParticipants);
    if (checked) {
      newSelected.add(participantId);
    } else {
      newSelected.delete(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSave = async () => {
    const supabase = createClient();
    setIsSaving(true);
    setError(null);

    try {
      // Remove all existing participants
      await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", eventId);

      // Add selected participants
      if (selectedParticipants.size > 0) {
        const participantsToAdd = Array.from(selectedParticipants).map(
          (participantId) => ({
            event_id: eventId,
            participant_id: participantId,
          })
        );

        const { error } = await supabase
          .from("event_participants")
          .insert(participantsToAdd);
        if (error) throw error;
      }

      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save participants"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Group participants by house
  const participantsByHouse = participants.reduce((acc, participant) => {
    const houseName = participant.house?.name || "Unassigned";
    if (!acc[houseName]) {
      acc[houseName] = [];
    }
    acc[houseName].push(participant);
    return acc;
  }, {} as Record<string, Participant[]>);

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Event Participants</h1>
          <p className="text-muted-foreground mt-2">
            Select participants for this event
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Available Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(participantsByHouse).map(
                ([houseName, houseParticipants]: [string, Participant[]]) => (
                  <div key={houseName} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {houseParticipants[0]?.house && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: houseParticipants[0].house.color,
                          }}
                        />
                      )}
                      <h3 className="font-medium">{houseName}</h3>
                      <Badge variant="secondary">
                        {houseParticipants.length} participants
                      </Badge>
                    </div>
                    <div className="space-y-2 ml-6">
                      {houseParticipants.map((participant: Participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={participant.id}
                            checked={selectedParticipants.has(participant.id)}
                            onCheckedChange={(checked) =>
                              handleParticipantToggle(
                                participant.id,
                                checked as boolean
                              )
                            }
                          />
                          <label
                            htmlFor={participant.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {participant.full_name} (Age: {participant.age})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedParticipants.size > 0 ? (
              <div className="space-y-2">
                {Array.from(selectedParticipants).map(
                  (participantId: string) => {
                    const participant = participants.find(
                      (p) => p.id === participantId
                    );
                    if (!participant) return null;

                    return (
                      <div
                        key={participantId}
                        className="flex items-center justify-between p-2 bg-background rounded"
                      >
                        <div className="flex items-center gap-2">
                          {participant.house && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: participant.house.color,
                              }}
                            />
                          )}
                          <span className="text-sm font-medium">
                            {participant.full_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({participant.house?.name})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleParticipantToggle(participantId, false)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No participants selected
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
