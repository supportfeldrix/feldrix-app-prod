import { supabase } from "../supabaseClient";
import { getCurrentUser } from "./profileService";
import { getTotalPoultryBirds } from "./flockService";

export async function getDashboardStatistics() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      animals: 0,
      crops: 0,
      machinery: 0,
      tasks: 0,
    };
  }

  const [
    animalsResult,
    cropsResult,
    machineryResult,
    tasksResult,
    poultryBirds,
  ] = await Promise.all([
    supabase
      .from("livestock")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),

    supabase
      .from("crops")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),

    supabase
      .from("machinery")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),

    supabase
      .from("planner_tasks")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),
    getTotalPoultryBirds(),
  ]);

  if (
    animalsResult.error ||
    cropsResult.error ||
    machineryResult.error ||
    tasksResult.error
  ) {
    throw (
      animalsResult.error ||
      cropsResult.error ||
      machineryResult.error ||
      tasksResult.error
    );
  }

  return {
    animals: (animalsResult.count ?? 0) + poultryBirds,
    crops: cropsResult.count ?? 0,
    machinery: machineryResult.count ?? 0,
    tasks: tasksResult.count ?? 0,
  };
}
