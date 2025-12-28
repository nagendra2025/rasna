import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MemoriesClient from "./memories-client";

export default async function MemoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch memories
  const { data: memories, error } = await supabase
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Family Memories</h1>
          <p className="mt-2 text-lg text-gray-600">
            Preserve and share special family moments
          </p>
        </header>

        <MemoriesClient initialMemories={memories || []} />
      </div>
    </div>
  );
}

