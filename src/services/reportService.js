import { getAnimals } from "./livestockService";
import { getFinanceRecords } from "./financeService";
import { getBreedingRecords } from "./breedingService";
import { getHealthRecords } from "./healthService";
import { getTotalPoultryBirds } from "./flockService";

function safeResult(result) {
  return result.status === "fulfilled" ? result.value : [];
}

export async function getFarmReport() {
  const results = await Promise.allSettled([
    getAnimals(),
    getFinanceRecords(),
    getBreedingRecords(),
    getHealthRecords(),
    getTotalPoultryBirds(),
  ]);

  const animals = safeResult(results[0]);
  const finance = safeResult(results[1]);
  const breeding = safeResult(results[2]);
  const health = safeResult(results[3]);

  const poultryBirds = results[4].status === "fulfilled" ? results[4].value : 0;
  const totalAnimals = animals.length + poultryBirds;

  const totalIncome = finance
    .filter((r) => r.category === "Income")
    .reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

  const totalExpenses = finance
    .filter((r) => r.category === "Expense")
    .reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

  const netProfit = totalIncome - totalExpenses;

  return {
    totalAnimals,
    poultryBirds,
    totalIncome,
    totalExpenses,
    netProfit,

    animals,
    finance,
    breeding,
    health,
  };
}
