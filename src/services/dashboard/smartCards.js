/**
 * FarmHand PRO — Smart Dashboard Card Engine
 * Sprint 37
 *
 * Generates standardized summary cards for the Dashboard KPI row.
 * Each card provides a module snapshot with value, status, and action.
 *
 * Card Object Schema:
 * {
 *   id: string,
 *   module: string,
 *   title: string,
 *   value: string | number,
 *   subtitle: string,
 *   status: "good" | "warning" | "critical",
 *   actionLabel: string,
 *   route: string
 * }
 *
 * @module smartCards
 */

/**
 * Generates smart dashboard cards from farm data.
 *
 * @param {object} data - Farm data context
 * @param {object} data.planner - Planner data with tasks, overdue, today, upcoming arrays
 * @param {object} data.livestock - Livestock data with animals and healthRecords arrays
 * @param {object} data.crops - Crops data with crops array
 * @param {object} data.machinery - Machinery data with machines and maintenancePlans arrays
 * @param {object} data.finance - Finance data with records array
 * @returns {Array} Array of card objects
 */
export function getSmartDashboardCards(data = {}) {
  return [
    generatePlannerCard(data.planner),
    generateLivestockCard(data.livestock),
    generateCropsCard(data.crops),
    generateMachineryCard(data.machinery),
    generateFinanceCard(data.finance),
  ];
}

// =====================================================
// Card Generators
// =====================================================

/**
 * Generates the Planner KPI card.
 */
function generatePlannerCard(planner = {}) {
  const tasks = Array.isArray(planner.tasks) ? planner.tasks : [];
  const overdue = Array.isArray(planner.overdue) ? planner.overdue : [];
  const today = Array.isArray(planner.today) ? planner.today : [];

  const totalActive = tasks.filter((t) => t.completed !== true && t.status !== "Completed").length;
  const overdueCount = overdue.length;
  const todayCount = today.length;

  let status = "good";
  let subtitle = "All on track";

  if (overdueCount > 0) {
    status = "critical";
    subtitle = `${overdueCount} overdue`;
  } else if (todayCount > 0) {
    status = "warning";
    subtitle = `${todayCount} due today`;
  }

  return {
    id: "card-planner",
    module: "Planner",
    title: "Planner",
    value: totalActive || todayCount + overdueCount,
    subtitle,
    status,
    actionLabel: "View Planner",
    route: "/planner",
  };
}

/**
 * Generates the Livestock KPI card.
 */
function generateLivestockCard(livestock = {}) {
  const animals = Array.isArray(livestock.animals) ? livestock.animals : [];
  const healthRecords = Array.isArray(livestock.healthRecords) ? livestock.healthRecords : [];

  const totalAnimals = animals.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const needAttention = healthRecords.filter((r) => {
    // Completed treatments are never "needing attention". The animal_health
    // table tracks completion via completed_at (next_due is preserved).
    if (r.completed_at) return false;
    if (!r.next_due) return false;
    const due = new Date(r.next_due);
    due.setHours(0, 0, 0, 0);
    return due <= today;
  }).length;

  let status = "good";
  let subtitle = "All healthy";

  if (needAttention > 0) {
    status = needAttention >= 3 ? "critical" : "warning";
    subtitle = `${needAttention} need attention`;
  }

  return {
    id: "card-livestock",
    module: "Livestock",
    title: "Livestock",
    value: totalAnimals,
    subtitle,
    status,
    actionLabel: "View Livestock",
    route: "/livestock",
  };
}

/**
 * Generates the Crops KPI card.
 */
function generateCropsCard(crops = {}) {
  const cropList = Array.isArray(crops.crops) ? crops.crops : (Array.isArray(crops) ? crops : []);

  const totalFields = cropList.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);

  let harvestOverdue = 0;
  let harvestSoon = 0;

  for (const crop of cropList) {
    if (crop.status === "Harvested") continue;
    if (!crop.harvest_date) continue;

    const harvestDate = new Date(crop.harvest_date);
    harvestDate.setHours(0, 0, 0, 0);

    if (harvestDate < today) harvestOverdue++;
    else if (harvestDate <= sevenDays) harvestSoon++;
  }

  let status = "good";
  let subtitle = "On track";

  if (harvestOverdue > 0) {
    status = "critical";
    subtitle = `${harvestOverdue} harvest overdue`;
  } else if (harvestSoon > 0) {
    status = "warning";
    subtitle = `${harvestSoon} harvest soon`;
  }

  return {
    id: "card-crops",
    module: "Crops",
    title: "Crops",
    value: totalFields,
    subtitle,
    status,
    actionLabel: "View Crops",
    route: "/crops",
  };
}

/**
 * Generates the Machinery KPI card.
 */
function generateMachineryCard(machinery = {}) {
  const machines = Array.isArray(machinery.machines) ? machinery.machines : [];
  const plans = Array.isArray(machinery.maintenancePlans) ? machinery.maintenancePlans : [];

  const activeMachines = machines.filter((m) => m.status === "Active").length;

  let overdueServices = 0;

  for (const plan of plans) {
    const machine = machines.find((m) => m.id === plan.machine_id);
    if (!machine) continue;

    const currentHours = Number(machine.hour_meter || 0);
    const nextDue = Number(plan.next_due_hours || 0);

    if (currentHours >= nextDue) overdueServices++;
  }

  let status = "good";
  let subtitle = "All serviced";

  if (overdueServices > 0) {
    status = overdueServices >= 2 ? "critical" : "warning";
    subtitle = `${overdueServices} service overdue`;
  }

  return {
    id: "card-machinery",
    module: "Machinery",
    title: "Machinery",
    value: activeMachines || machines.length,
    subtitle,
    status,
    actionLabel: "View Machinery",
    route: "/machinery",
  };
}

/**
 * Generates the Finance KPI card.
 */
function generateFinanceCard(finance = {}) {
  const records = Array.isArray(finance.records) ? finance.records : [];

  if (records.length === 0) {
    return {
      id: "card-finance",
      module: "Finance",
      title: "Finance",
      value: "R 0",
      subtitle: "No records",
      status: "good",
      actionLabel: "View Finance",
      route: "/finance",
    };
  }

  const income = records
    .filter((r) => (r.category || r.type || "").toLowerCase() === "income")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const expenses = records
    .filter((r) => (r.category || r.type || "").toLowerCase() === "expense")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const profit = income - expenses;

  // Monthly trend
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthIncome = records
    .filter((r) => {
      if ((r.category || r.type || "").toLowerCase() !== "income") return false;
      const d = new Date(r.transaction_date || r.date || r.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const lastMonthIncome = records
    .filter((r) => {
      if ((r.category || r.type || "").toLowerCase() !== "income") return false;
      const d = new Date(r.transaction_date || r.date || r.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    })
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  let status = "good";
  let subtitle = "Profitable";

  if (profit < 0) {
    status = "critical";
    subtitle = "Expenses exceed income";
  } else if (lastMonthIncome > 0 && thisMonthIncome < lastMonthIncome * 0.8) {
    status = "warning";
    subtitle = "Income declining";
  }

  return {
    id: "card-finance",
    module: "Finance",
    title: "Finance",
    value: `R ${Math.abs(profit).toLocaleString()}`,
    subtitle,
    status,
    actionLabel: "View Finance",
    route: "/finance",
  };
}
