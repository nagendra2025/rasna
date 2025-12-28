import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotesClient from "./notes-client";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to check if parent
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isParent = profile
    ? ["father", "mother", "parent"].includes(profile.role || "")
    : false;

  // Fetch notes
  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Family Notes</h1>
          <p className="mt-2 text-lg text-gray-600">
            Important information everyone needs to know
          </p>
        </header>

        <NotesClient initialNotes={notes || []} isParent={isParent} />
      </div>
    </div>
  );
}

