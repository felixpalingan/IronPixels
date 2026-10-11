// Weight Unit Conversion Utility for IronPixels (KG <-> LBS)

export type WeightUnit = "kg" | "lbs";

export const KG_TO_LBS_RATIO = 2.20462262185;

/**
 * Converts kilograms to pounds (lbs), rounded to 1 decimal place.
 */
export function kgToLbs(kg: number): number {
  if (!kg || isNaN(kg)) return 0;
  return Math.round(kg * KG_TO_LBS_RATIO * 10) / 10;
}

/**
 * Converts pounds (lbs) to kilograms (kg), rounded to 1 decimal place.
 */
export function lbsToKg(lbs: number): number {
  if (!lbs || isNaN(lbs)) return 0;
  return Math.round((lbs / KG_TO_LBS_RATIO) * 10) / 10;
}

/**
 * Formats a canonical weight in KG into the user's preferred display unit.
 */
export function formatWeightWithUnit(weightKg: number, unit: WeightUnit = "kg"): string {
  const safeWeight = Number(weightKg) || 0;
  if (unit === "lbs") {
    const val = kgToLbs(safeWeight);
    return `${val % 1 === 0 ? val : val.toFixed(1)} LBS`;
  }
  return `${safeWeight % 1 === 0 ? safeWeight : safeWeight.toFixed(1)} KG`;
}

/**
 * Converts canonical KG weight to display value number for inputs/ghosts.
 */
export function toDisplayWeight(weightKg: number, unit: WeightUnit = "kg"): number {
  if (unit === "lbs") {
    return kgToLbs(weightKg);
  }
  return Math.round(weightKg * 10) / 10;
}

/**
 * Converts user input weight (which is in `unit`) back to canonical KG for storage/RVS calculation.
 */
export function toCanonicalKg(inputWeight: number, unit: WeightUnit = "kg"): number {
  if (unit === "lbs") {
    return lbsToKg(inputWeight);
  }
  return Number(inputWeight) || 0;
}
