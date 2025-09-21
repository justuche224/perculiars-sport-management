"use client";

import type React from "react";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface House {
  id: string;
  name: string;
  color: string;
}

interface Guardian {
  id: string;
  full_name: string;
  email: string;
}

export default function NewParticipantPage() {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [houseId, setHouseId] = useState("");
  const [guardianId, setGuardianId] = useState("");
  const [houses, setHouses] = useState<House[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [housesResult, guardiansResult] = await Promise.all([
        supabase.from("houses").select("id, name, color").order("name"),
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "parent")
          .order("full_name"),
      ]);

      if (housesResult.data) setHouses(housesResult.data);
      if (guardiansResult.data) setGuardians(guardiansResult.data);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.from("participants").insert({
        full_name: fullName,
        age: Number.parseInt(age),
        house_id: houseId,
        guardian_id: guardianId || null,
      });

      if (error) throw error;
      router.push("/admin/participants");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Participant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g., John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="5"
                  max="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house">House</Label>
              <Select value={houseId} onValueChange={setHouseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a house" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: house.color }}
                        />
                        {house.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardian">Guardian (Optional)</Label>
              <Select value={guardianId} onValueChange={setGuardianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a guardian (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {guardians.map((guardian) => (
                    <SelectItem key={guardian.id} value={guardian.id}>
                      <div className="flex flex-col">
                        <span>{guardian.full_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {guardian.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Participant"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
