/**
 * Display label for a breeding record's sire.
 * Registered bull tag > free-text sire details > "AI" for insemination > "Unknown".
 */
export function sireLabel(record) {
  if (!record) return "Unknown";
  if (record.male?.tag) return record.male.tag;
  if (record.sire_details) return record.sire_details;
  if (record.breeding_method === "Artificial Insemination") return "AI";
  return "Unknown";
}

/** Gender values the breeding module treats as female (matches getFemaleAnimals). */
export const FEMALE_GENDERS = ["Female", "Cow", "Ewe", "Doe", "Sow", "Hen"];
export const isFemaleAnimal = (animal) => FEMALE_GENDERS.includes(animal?.gender);
