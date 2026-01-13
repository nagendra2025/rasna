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
  const { title, date, time, notes, category } = body;

  if (!title || !date || !category) {
    return NextResponse.json(
      { error: "Title, date, and category are required" },
      { status: 400 }
    );
  }

  // Check if the current user is the creator of this event
  const { data: existingEvent } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const eventCreatorId = String(existingEvent.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (eventCreatorId !== currentUserId) {
    console.log('Event edit denied:', { eventCreatorId, currentUserId, eventId: id });
    return NextResponse.json(
      { error: "You can only edit events you created" },
      { status: 403 }
    );
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      title,
      date,
      time: time || null,
      notes: notes || null,
      category,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
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

  // Check if the current user is the creator of this event
  const { data: existingEvent } = await supabase
    .from("events")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existingEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const eventCreatorId = String(existingEvent.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (eventCreatorId !== currentUserId) {
    console.log('Event delete denied:', { eventCreatorId, currentUserId, eventId: id });
    return NextResponse.json(
      { error: "You can only delete events you created" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}








