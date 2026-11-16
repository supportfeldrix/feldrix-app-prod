import { supabase } from "./supabase";

/**
 * FarmHand PRO — Auto Finance Service
 *
 * Automatically creates finance records when livestock or health events
 * have associated costs. Uses a source reference marker in the description
 * field to prevent duplicate entries.
 *
 * Source reference format: [auto:{type}-{id}]
 * Examples:
 *   [auto:purchase-abc123]
 *   [auto:health-def456]
 */

/**
 * Creates a finance record for a livestock purchase if purchase_price > 0.
 * Skips if a finance record already exists for this animal purchase.
 *
 * @param {object} animal - The livestock record (must include id, tag, purchase_price, purchase_date)
 */
export async function createPurchaseFinanceRecord(animal) {
  const price = Number(animal.purchase_price);
  if (!price || price <= 0) return null;

  const sourceRef = `[auto:purchase-${animal.id}]`;

  // Check for existing auto-created record to prevent duplicates
  const existing = await findExistingAutoRecord(sourceRef);
  if (existing) return existing;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const record = {
    user_id: user.id,
    animal_id: animal.id,
    category: "Expense",
    transaction_type: "Other",
    amount: price,
    transaction_date: animal.purchase_date || new Date().toISOString().split("T")[0],
    description: `Livestock purchase: ${animal.tag || "Unknown"} (${animal.breed || animal.animal_type || "Animal"}) ${sourceRef}`,
    applies_to: "animal",
  };

  const { data, error } = await supabase
    .from("finance_records")
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error("Auto-finance (purchase) failed:", error);
    return null;
  }

  return data;
}

/**
 * Creates (or updates) the expense for a poultry flock purchase.
 * purchase_price is the TOTAL for the flock. Idempotent via [auto:flock-{id}]:
 * if a record exists its amount/date/quantity are refreshed instead of duplicated.
 *
 * @param {object} flock - livestock_flocks row (id, coop_name, species, breed, purchase_price, placed_date, initial_count)
 */
export async function syncFlockPurchaseFinanceRecord(flock) {
  const price = Number(flock.purchase_price);
  if (!price || price <= 0) return null;
  const sourceRef = `[auto:flock-${flock.id}]`;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const qty = Number(flock.initial_count ?? flock.bird_count);
  const fields = {
    amount: price,
    transaction_date: flock.placed_date || new Date().toISOString().split("T")[0],
    description: `Flock purchase: ${flock.coop_name} (${flock.breed || flock.species || "Poultry"}) ${sourceRef}`,
    quantity: qty > 0 ? qty : null,
    unit: qty > 0 ? "head" : null,
  };
  const existing = await findExistingAutoRecord(sourceRef);
  if (existing) {
    const { error } = await supabase.from("finance_records").update(fields).eq("id", existing.id);
    if (error) {
      console.error("Auto-finance (flock update) failed:", error);
      throw new Error(`Finance record could not be updated: ${error.message}`);
    }
    return existing;
  }
  const { data, error } = await supabase
    .from("finance_records")
    .insert([{ user_id: user.id, category: "Expense", transaction_type: "Other", applies_to: "farm", ...fields }])
    .select()
    .single();
  if (error) {
    console.error("Auto-finance (flock) failed:", error);
    throw new Error(`Finance record could not be created: ${error.message}`);
  }
  return data;
}

/**
 * Income for a closed broiler cycle (sale / slaughter). Idempotent via
 * [auto:flock-sale-{id}]: re-closing or correcting the sale updates the
 * same record instead of adding a second one.
 */
export async function syncFlockSaleFinanceRecord(flock) {
  const amount = Number(flock.sale_amount);
  if (!amount || amount <= 0) return null;
  const sourceRef = `[auto:flock-sale-${flock.id}]`;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const sold = Number(flock.birds_sold) || 0;
  const fields = {
    amount,
    transaction_date: flock.closed_date || new Date().toISOString().split("T")[0],
    description: `Broiler sale: ${flock.coop_name} cycle ${flock.cycle_number || 1} (${flock.breed || flock.species || "Poultry"}) ${sourceRef}`,
    quantity: sold > 0 ? sold : null,
    unit: sold > 0 ? "head" : null,
  };
  const existing = await findExistingAutoRecord(sourceRef);
  if (existing) {
    const { error } = await supabase.from("finance_records").update(fields).eq("id", existing.id);
    if (error) throw new Error(`Finance record could not be updated: ${error.message}`);
    return existing;
  }
  const { data, error } = await supabase
    .from("finance_records")
    .insert([{ user_id: user.id, category: "Income", transaction_type: "Animal Sale", applies_to: "farm", ...fields }])
    .select()
    .single();
  if (error) throw new Error(`Finance record could not be created: ${error.message}`);
  return data;
}

/**
 * Creates a finance record for a health treatment if cost > 0.
 * Skips if a finance record already exists for this health record.
 *
 * @param {object} healthRecord - The health record (must include id, animal_id, cost, treatment_type, treatment_date, medication)
 */
export async function createHealthFinanceRecord(healthRecord) {
  const cost = Number(healthRecord.cost);
  if (!cost || cost <= 0) return null;

  const sourceRef = `[auto:health-${healthRecord.id}]`;

  // Check for existing auto-created record to prevent duplicates
  const existing = await findExistingAutoRecord(sourceRef);
  if (existing) return existing;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Map treatment_type to the closest finance transaction_type
  const transactionType = mapTreatmentToTransactionType(healthRecord.treatment_type);

  const description = buildHealthDescription(healthRecord, sourceRef);

  const record = {
    user_id: user.id,
    animal_id: healthRecord.animal_id || null,
    category: "Expense",
    transaction_type: transactionType,
    amount: cost,
    transaction_date: healthRecord.treatment_date || new Date().toISOString().split("T")[0],
    description,
    applies_to: healthRecord.animal_id ? "animal" : "farm",
  };

  const { data, error } = await supabase
    .from("finance_records")
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error("Auto-finance (health) failed:", error);
    return null;
  }

  return data;
}

/**
 * Checks if an auto-created finance record already exists by searching
 * for the source reference marker in the description field.
 */
async function findExistingAutoRecord(sourceRef) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("finance_records")
    .select("id")
    .eq("user_id", user.id)
    .like("description", `%${sourceRef}%`)
    .limit(1);

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Maps a health treatment_type to the nearest finance transaction_type.
 */
function mapTreatmentToTransactionType(treatmentType) {
  switch (treatmentType) {
    case "Veterinary Visit":
      return "Veterinary";
    case "Medication":
    case "Vaccination":
    case "Deworming":
      return "Medication";
    case "Treatment":
    default:
      return "Veterinary";
  }
}

/**
 * Builds a descriptive string for the finance record from a health record.
 */
function buildHealthDescription(healthRecord, sourceRef) {
  const parts = [];

  if (healthRecord.treatment_type) {
    parts.push(healthRecord.treatment_type);
  }

  if (healthRecord.medication) {
    parts.push(healthRecord.medication);
  }

  if (healthRecord.veterinarian) {
    parts.push(`Vet: ${healthRecord.veterinarian}`);
  }

  const desc = parts.length > 0 ? parts.join(" - ") : "Health treatment";

  return `${desc} ${sourceRef}`;
}
