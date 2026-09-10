import { supabase } from "./supabase";
import { cropAreaToHa } from "../utils/units";

export async function getDashboardStats() {
  // --------------------------------------------------
  // AUTHENTICATED USER
  // --------------------------------------------------

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    return {
      animals: [],
      totalAnimals: 0,
      healthy: 0,
      pregnant: 0,
      sick: 0,
      averageWeight: 0,
      totalValue: 0,
      heaviestAnimal: null,

      crops: [],
      totalCrops: 0,
      growing: 0,
      harvested: 0,
      totalArea: 0,
      expectedYield: 0,
      recentCrops: [],

      breedingRecords: [],
      totalBreeding: 0,
      pregnantBreeding: 0,
      completedBreeding: 0,
      dueSoonBreeding: 0,
      overdueBreeding: 0,
      latestBreeding: null,
    };
  }

  // --------------------------------------------------
  // LIVESTOCK
  // --------------------------------------------------

  const {
    data: livestock,
    error: livestockError,
  } = await supabase
    .from("livestock")
    .select("*")
    .eq("user_id", user.id);

  if (livestockError) throw livestockError;

  const animals = livestock || [];

  // --------------------------------------------------
  // CROPS
  // --------------------------------------------------

  const {
    data: crops,
    error: cropError,
  } = await supabase
    .from("crops")
    .select("*")
    .eq("user_id", user.id);

  if (cropError) throw cropError;

  const cropList = crops || [];

  // --------------------------------------------------
  // BREEDING
  // --------------------------------------------------

  const {
    data: breeding,
    error: breedingError,
  } = await supabase
    .from("breeding_records")
    .select(`
      *,
      female:female_id(tag),
      male:male_id(tag)
    `)
    .eq("user_id", user.id);

  if (breedingError) throw breedingError;

  const breedingRecords = breeding || [];

  // --------------------------------------------------
  // MACHINERY
  // --------------------------------------------------

  let machines = [];
  let maintenancePlans = [];
  try {
    const { data: machineData } = await supabase
      .from("machinery")
      .select("*")
      .eq("user_id", user.id);
    machines = machineData || [];

    if (machines.length > 0) {
      const machineIds = machines.map((m) => m.id);
      const { data: maintenanceData } = await supabase
        .from("maintenance_plans")
        .select("*")
        .in("machine_id", machineIds);
      maintenancePlans = maintenanceData || [];
    }
  } catch { /* tables may not exist yet */ }

  // --------------------------------------------------
  // FINANCE
  // --------------------------------------------------

  let financeRecords = [];
  try {
    const { data: financeData } = await supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id);
    financeRecords = financeData || [];
  } catch { /* table may not exist yet */ }

  // --------------------------------------------------
  // LIVESTOCK STATS
  // --------------------------------------------------

  const totalAnimals = animals.length;

  const healthy = animals.filter(
    (a) => a.status === "Healthy"
  ).length;

  const pregnant = animals.filter(
    (a) => a.status === "Pregnant"
  ).length;

  const sick = animals.filter(
    (a) => a.status === "Sick"
  ).length;

  const totalWeight = animals.reduce(
    (sum, a) => sum + Number(a.weight || 0),
    0
  );

  const averageWeight =
    totalAnimals > 0
      ? Math.round(totalWeight / totalAnimals)
      : 0;

  const totalValue = animals.reduce(
    (sum, a) => sum + Number(a.purchase_price || 0),
    0
  );

  const heaviestAnimal =
    animals.length > 0
      ? [...animals].sort(
          (a, b) => Number(b.weight || 0) - Number(a.weight || 0)
        )[0]
      : null;

  // --------------------------------------------------
  // CROP STATS
  // --------------------------------------------------

  const totalCrops = cropList.length;

  const growing = cropList.filter(
    (c) => c.status === "Growing"
  ).length;

  const harvested = cropList.filter(
    (c) => c.status === "Harvested"
  ).length;

  // Canonical hectares: normalize each crop from its own area_unit (ha|acres)
  // before summing, so the dashboard total is unit-correct. Display layer
  // converts to the farm's measurement system.
  const totalArea = cropList.reduce(
    (sum, c) => sum + cropAreaToHa(c),
    0
  );

  const expectedYield = cropList.reduce(
    (sum, c) => sum + Number(c.expected_yield || 0),
    0
  );

  const recentCrops = [...cropList]
    .sort(
      (a, b) =>
        new Date(b.created_at) -
        new Date(a.created_at)
    )
    .slice(0, 5);

  // --------------------------------------------------
  // BREEDING STATS
  // --------------------------------------------------

  const totalBreeding = breedingRecords.length;

  const pregnantBreeding =
    breedingRecords.filter(
      (b) => b.status === "Pregnant"
    ).length;

  const completedBreeding =
    breedingRecords.filter(
      (b) => b.status === "Completed"
    ).length;

  const today = new Date();

  const dueSoonBreeding =
    breedingRecords.filter((record) => {
      if (!record.expected_birth) return false;

      const due = new Date(record.expected_birth);

      const diff =
        (due - today) /
        (1000 * 60 * 60 * 24);

      return diff >= 0 && diff <= 30;
    }).length;

  const overdueBreeding =
    breedingRecords.filter((record) => {
      if (!record.expected_birth) return false;

      return new Date(record.expected_birth) < today;
    }).length;

  const latestBreeding =
    breedingRecords.length > 0
      ? [...breedingRecords]
          .sort(
            (a, b) =>
              new Date(b.breeding_date) -
              new Date(a.breeding_date)
          )[0]
      : null;

  // --------------------------------------------------
  // RETURN
  // --------------------------------------------------

  return {
    // Livestock
    animals,
    totalAnimals,
    healthy,
    pregnant,
    sick,
    averageWeight,
    totalValue,
    heaviestAnimal,

    // Crops
    crops: cropList,
    totalCrops,
    growing,
    harvested,
    totalArea,
    expectedYield,
    recentCrops,

    // Breeding
    breedingRecords,
    totalBreeding,
    pregnantBreeding,
    completedBreeding,
    dueSoonBreeding,
    overdueBreeding,
    latestBreeding,

    // Machinery
    machines,
    maintenancePlans,

    // Finance
    financeRecords,
  };
}
