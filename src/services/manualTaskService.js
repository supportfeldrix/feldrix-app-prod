import { supabase } from "../supabase";
import { offlineCapture } from "./offline/offlineCapture";

export async function getManualTasks() {
  const { data, error } = await supabase
    .from("planner_tasks")
    .select("*")
    .order("due_date", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function addManualTask(task) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const payload = {
    user_id: user.id,
    title: task.title,
    description: task.description,
    module: task.module,
    priority: task.priority,
    assigned_to: task.assigned_to,
    due_date: task.due_date,
    status: "Pending",
    completed: false,
    source: "Manual",
  };

  // Offline capture
  if (!navigator.onLine) {
    await offlineCapture({
      action: "insert",
      module: "Planner",
      table: "planner_tasks",
      payload,
    });
    return { ...payload, id: `offline-${Date.now()}`, _offline: true };
  }

  const { data, error } = await supabase
    .from("planner_tasks")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateManualTask(
  id,
  updates
) {
  const { data, error } = await supabase
    .from("planner_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function completeManualTask(id) {
  const { data, error } = await supabase
    .from("planner_tasks")
    .update({
      completed: true,
      status: "Completed",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteManualTask(id) {
  const { error } = await supabase
    .from("planner_tasks")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}
