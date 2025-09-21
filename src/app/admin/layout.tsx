import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { SiteHeader } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  console.log("User ID:", user.id);
  console.log("User email:", user.email);

  // eslint-disable-next-line prefer-const
  let { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("Profile query result:", profile);
  console.log("Profile query error:", error);

  // If no profile exists, create one with admin role for the first user
  if (!profile) {
    console.log("No profile found, creating one for user:", user.email);

    // Check if this is the first user (no other profiles exist)
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    const isFirstUser = count === 0;

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: isFirstUser ? "admin" : "parent",
      })
      .select("role")
      .single();

    if (error) {
      console.log("Error creating profile:", error);
      redirect("/");
    }

    profile = newProfile;
    console.log("Created profile with role:", profile?.role);
  }

  if (!profile || !["admin"].includes(profile.role)) {
    console.log("Access denied. User role:", profile?.role);
    redirect("/");
  }

  console.log("Access granted. User role:", profile.role);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
