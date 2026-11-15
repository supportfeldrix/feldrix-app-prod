import { sireLabel } from "./breedingSire";

/**
 * Dated steps recorded on one breeding record, oldest first:
 * heat → bred → pregnancy check → birth. Built from the record's columns,
 * so nothing extra is stored.
 */
export function breedingEvents(record) {
  if (!record) return [];
  const events = [];
  if (record.heat_date) {
    events.push({ type: "heat", date: record.heat_date, label: "Heat detected" });
  }
  if (record.breeding_date) {
    const method = record.breeding_method === "Artificial Insemination" ? "AI" : (record.breeding_method || "Bred");
    events.push({ type: "bred", date: record.breeding_date, label: `Bred (${method}), sire ${sireLabel(record)}` });
  }
  if (record.pregnancy_check_date) {
    const method = record.pregnancy_check_method ? ` (${record.pregnancy_check_method})` : "";
    events.push({
      type: "check",
      date: record.pregnancy_check_date,
      label: `Pregnancy check: ${record.pregnancy_check_result || "no result"}${method}`,
    });
  }
  if (record.birth_date) {
    events.push({
      type: "birth",
      date: record.birth_date,
      label: `Birth: ${record.offspring_alive ?? 0} alive, ${record.offspring_dead ?? 0} dead`,
    });
  }
  return events.sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/** Most recent step on the record, or null. */
export function lastBreedingEvent(record) {
  const events = breedingEvents(record);
  return events.length ? events[events.length - 1] : null;
}

/** Short label for tables, e.g. "Check: Pregnant (Scan)". */
export function shortEventLabel(event) {
  if (!event) return "\u2014";
  switch (event.type) {
    case "heat": return "Heat detected";
    case "bred": return "Bred";
    case "check": return event.label.replace("Pregnancy check", "Check");
    case "birth": return event.label;
    default: return event.label;
  }
}
