import { getHealthRecords } from "../healthService";
import {
  formatDueDate,
  getTaskPriority,
  getTaskStatus,
} from "../../utils/plannerHelpers";

/**
 * Health Planner Provider
 *
 * Generates dynamic planner tasks from Animal Health records.
 * These tasks are virtual and are never stored in planner_tasks.
 */
export async function getHealthPlannerTasks() {
  const tasks = [];

  const healthRecords = await getHealthRecords();

  for (const record of healthRecords) {
    if (!record.next_due) continue;

    // A completed scheduled treatment must no longer generate an active
    // (Overdue/Today/Upcoming) task. It is surfaced as Completed so the
    // Planner can display the completed state, preserving the original
    // next_due (the scheduled/due date) for reporting.
    const isCompleted = !!record.completed_at;

    tasks.push({
      id: `health-${record.id}`,
      module: "Animal Health",

      title:
        record.treatment_type ||
        record.treatment ||
        "Health Treatment",

      animalTag: record.livestock?.tag || "",

      due: formatDueDate(record.next_due),

      originalDate: record.next_due,

      priority: getTaskPriority(record.next_due),

      status: isCompleted ? "Completed" : getTaskStatus(record.next_due),

      completedDate: record.completed_at || null,

      completedSource: record.completed_source || null,

      sourceId: record.id,

      record,
    });
  }

  return tasks;
}