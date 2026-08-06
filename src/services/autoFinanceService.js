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
