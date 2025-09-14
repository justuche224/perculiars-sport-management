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
import { Plus, Users, Trophy } from "lucide-react";
import Link from "next/link";

interface House {
  id: string;
  name: string;
  color: string;
  total_points: number;
  participants: { count: number }[];
  captain: { full_name: string };
}

export default async function HousesPage() {
  const supabase = await createClient();

  // Get houses with participant count
  const { data: houses } = await supabase
    .from("houses")
    .select(
      `
      *,
      participants:participants(count),
      captain:profiles!houses_captain_id_fkey(full_name)
    `
    )
    .order("name");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">House Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage house teams and assign captains
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/houses/new">
            <Plus className="h-4 w-4 mr-2" />
            Add House
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses?.map((house: House) => (
          <Card key={house.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: house.color }}
                  />
                  {house.name}
                </CardTitle>
                <Badge variant="secondary">
                  <Trophy className="h-3 w-3 mr-1" />
                  {house.total_points} pts
                </Badge>
              </div>
              <CardDescription>
                Captain: {house.captain?.full_name || "Not assigned"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {house.participants?.[0]?.count || 0} participants
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/houses/${house.id}`}>View Details</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/houses/${house.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!houses || houses.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No houses found
            </h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first house team.
            </p>
            <Button asChild>
              <Link href="/admin/houses/new">
                <Plus className="h-4 w-4 mr-2" />
                Add House
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
