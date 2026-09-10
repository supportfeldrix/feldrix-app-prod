import { supabase } from "../supabase";
import { zar } from "./_period";

/**
 * ============================================================
 * Machinery Report — Phase 1
 *
 * PERIOD ACTIVITY comes from machinery_services (service_date within
 * the selected range): how many services were performed and the hour
 * meter readings recorded.
 *
 * FINANCIAL TRUTH: machinery EXPENSE for the period comes from
 * finance_records (transaction_type "Machinery Repair" / "Machinery
 * Service"). machinery_services.cost is shown ONLY as operational
 * context and is CLEARLY LABELLED as "may overlap Finance" — it is
 * NEVER added to the report's expense totals, because the same repair
 * can appear both as a machinery_services row and a finance_records
 * row. Finance remains the single source of truth for money.
 *
 * RLS note: machinery_services has no user_id; ownership is enforced
 * through the parent machinery row. We inner-join machinery so the
 * query is both correctly scoped (RLS via the join) and filterable.
 * Current fleet state is reported as a clearly labelled snapshot.
 * ============================================================
 */

export async function generateMachineryReport({ from, to, farmContext } = {}) {
  const ctx = farmContext || null;
  // ── Current fleet snapshot (not period activity) ───────────────
  const { data: machinesData } = await supabase.from("machinery").select("*");
  const machines = machinesData || [];
  const activeNow = machines.filter((m) => m.status === "Active").length;
  const fleetValue = machines.reduce((s, m) => s + Number(m.purchase_price || 0), 0);

  // ── Period service activity (machinery_services.service_date) ──
  // Inner-join machinery so RLS (owner-through-machinery) applies and
  // we can present ownership-safe rows only.
  let svcQuery = supabase
    .from("machinery_services")
    .select("id, service_type, service_date, hour_meter, cost, machinery!inner(id, name, user_id)");

  if (from) svcQuery = svcQuery.gte("service_date", from.split("T")[0]);
  if (to) svcQuery = svcQuery.lte("service_date", to.split("T")[0]);

  const { data: svcData } = await svcQuery.order("service_date", { ascending: false });
  const services = svcData || [];

  const servicesCount = services.length;
  // Operational context only — explicitly NOT added to expense totals.
  const servicesRecordedCost = services.reduce((s, r) => s + Number(r.cost || 0), 0);

  // ── Machinery EXPENSE from Finance (source of truth) ───────────
  const machinerySpend = await getMachinerySpendFromFinance(from, to);

  return {
    title: "Machinery Cost Report",
    statistics: {
      servicesThisPeriod: servicesCount,
      machineryExpenditure: zar(machinerySpend, ctx),
      activeMachines: activeNow,
      fleetValue: zar(fleetValue, ctx),
    },
    sections: [
      {
        title: "Service Activity (this period)",
        items: servicesCount
          ? [
              { label: "Services performed", value: servicesCount },
              { label: "Recorded service cost (may overlap Finance)", value: zar(servicesRecordedCost, ctx) },
            ]
          : [{ label: "No services recorded in period", value: "—" }],
      },
      {
        title: "Machinery Expenditure (from Finance — source of truth)",
        items: [
          { label: "Machinery Repair + Service spend", value: zar(machinerySpend, ctx) },
        ],
      },
      {
        title: "Current Fleet (snapshot)",
        items: [
          { label: "Total machines", value: machines.length },
          { label: "Active", value: activeNow },
          { label: "Fleet value", value: zar(fleetValue, ctx) },
        ],
      },
    ],
    machineryData: {
      servicesThisPeriod: servicesCount,
      servicesRecordedCost, // operational only
      machinerySpend, // from Finance
      activeMachines: activeNow,
    },
    aiSummary:
      servicesCount > 0
        ? `${servicesCount} machinery service(s) performed this period.`
        : "No machinery services recorded for this period.",
  };
}

/**
 * Machinery spend for the period from finance_records (source of truth),
 * limited to the standardised machinery expense types.
 */
async function getMachinerySpendFromFinance(from, to) {
  let q = supabase
    .from("finance_records")
    .select("amount, category, transaction_type, transaction_date")
    .eq("category", "Expense")
    .in("transaction_type", ["Machinery Repair", "Machinery Service"]);

  if (from) q = q.gte("transaction_date", from.split("T")[0]);
  if (to) q = q.lte("transaction_date", to.split("T")[0]);

  const { data } = await q;
  return (data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
}
