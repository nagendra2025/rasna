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
  const { title, content, category, is_readonly_for_kids } = body;

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "Title, content, and category are required" },
      { status: 400 }
    );
  }

  // Check if user is a parent
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isParent = ["father", "mother", "parent"].includes(profile.role || "");

  // Check if note is readonly for kids
  const { data: existingNote } = await supabase
    .from("notes")
    .select("is_readonly_for_kids")
    .eq("id", id)
    .single();

  if (existingNote?.is_readonly_for_kids && !isParent) {
    return NextResponse.json(
      { error: "This note is read-only for kids" },
      { status: 403 }
    );
  }

  if (!isParent) {
    return NextResponse.json(
      { error: "Only parents can edit notes" },
      { status: 403 }
    );
  }

  const { data: note, error } = await supabase
    .from("notes")
    .update({
      title,
      content,
      category,
      is_readonly_for_kids: is_readonly_for_kids || false,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ note });
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

  // Check if user is a parent
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isParent = ["father", "mother", "parent"].includes(profile.role || "");

  if (!isParent) {
    return NextResponse.json(
      { error: "Only parents can delete notes" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

