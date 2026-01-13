import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { note } = body;

  // Check if the current user is the creator of this memory
  const { data: existingMemory } = await supabase
    .from("memories")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existingMemory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const memoryCreatorId = String(existingMemory.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (memoryCreatorId !== currentUserId) {
    console.log('Memory edit denied:', { memoryCreatorId, currentUserId, memoryId: id });
    return NextResponse.json(
      { error: "You can only edit memories you created" },
      { status: 403 }
    );
  }

  const { data: memory, error } = await supabase
    .from("memories")
    .update({
      note: note || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  return NextResponse.json({ memory });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get memory to check ownership and delete photo from storage
  const { data: memory } = await supabase
    .from("memories")
    .select("photo_url, created_by")
    .eq("id", id)
    .single();

  if (!memory) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const memoryCreatorId = String(memory.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (memoryCreatorId !== currentUserId) {
    console.log('Memory delete denied:', { memoryCreatorId, currentUserId, memoryId: id });
    return NextResponse.json(
      { error: "You can only delete memories you created" },
      { status: 403 }
    );
  }

  if (memory?.photo_url) {
    // Extract file path from URL
    const urlParts = memory.photo_url.split("/");
    const filePath = urlParts.slice(urlParts.indexOf("memories")).join("/");
    
    // Delete from storage
    await supabase.storage.from("memories").remove([filePath]);
  }

  const { error } = await supabase.from("memories").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}








