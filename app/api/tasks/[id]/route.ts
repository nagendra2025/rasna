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
  const { title, due_date, assigned_to, completed } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // Check if the current user is the creator of this task
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const taskCreatorId = String(existingTask.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (taskCreatorId !== currentUserId) {
    console.log('Task edit denied:', { taskCreatorId, currentUserId, taskId: id });
    return NextResponse.json(
      { error: "You can only edit tasks you created" },
      { status: 403 }
    );
  }

  const updateData: any = {
    title,
    due_date: due_date || null,
    assigned_to: assigned_to || "all",
  };

  // Handle completion
  if (completed !== undefined) {
    updateData.completed = completed;
    if (completed) {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({ task });
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

  // Check if the current user is the creator of this task
  const { data: existingTask } = await supabase
    .from("tasks")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Ensure both are strings for comparison (UUID comparison)
  const taskCreatorId = String(existingTask.created_by || '');
  const currentUserId = String(user.id || '');
  
  if (taskCreatorId !== currentUserId) {
    console.log('Task delete denied:', { taskCreatorId, currentUserId, taskId: id });
    return NextResponse.json(
      { error: "You can only delete tasks you created" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}








