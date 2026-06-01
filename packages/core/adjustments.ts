import type { AdjustedComparable, AdjustmentLine, ScoredComparable, SubjectProperty } from "./types";

const CONDITION_ADJUSTMENT = { Poor: -35000, Average: 0, Good: 18000, Renovated: 42000, New: 58000 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function roundToThousand(value: number) {
  return Math.round(value / 1000) * 1000;
}

function direction(amount: number): AdjustmentLine["direction"] {
  if (amount > 0) return "up";
  if (amount < 0) return "down";
  return "neutral";
}

function line(key: AdjustmentLine["key"], label: string, amount: number, rationale: string, confidence: number, reviewType: AdjustmentLine["reviewType"] = "automatic"): AdjustmentLine {
  return { key, label, amount, rationale, confidence, direction: direction(amount), reviewType };
}

export function adjustComparableValue(subject: SubjectProperty, comp: ScoredComparable): AdjustedComparable {
  const ppsf = comp.salePrice / comp.livingAreaSqft;
  const monthsSinceSale = comp.daysSinceSale / 30.44;
  const monthlyMarketTrend = 0.0026;
  const localDollarPerSqft = ppsf;
  const bedroomValue = 12000;
  const bathroomValue = 9000;
  const conditionStepValue = 18000;
  const parkingValue = 8000;
  const locationDollarPerKm = 3600;
  const time = comp.salePrice * monthlyMarketTrend * monthsSinceSale;
  const location = -comp.distanceKm * locationDollarPerKm;
  const squareFootage = (subject.livingAreaSqft - comp.livingAreaSqft) * localDollarPerSqft * 0.45;
  const bedroomsBathrooms = (subject.bedrooms - comp.bedrooms) * bedroomValue + (subject.bathrooms - comp.bathrooms) * bathroomValue;
  const age = (comp.yearBuilt - subject.yearBuilt) * 850;
  const condition = (CONDITION_ADJUSTMENT[subject.condition] - CONDITION_ADJUSTMENT[comp.condition]) / 18000 * conditionStepValue;
  const parking = (subject.parking - comp.parking) * parkingValue;
  const landFactor = clamp(ppsf * 0.02, 4, 14);
  const lotSize = subject.lotSizeSqft > 0 && comp.lotSizeSqft > 0 ? (subject.lotSizeSqft - comp.lotSizeSqft) * landFactor * 0.15 : 0;
  const outlier = comp.outlierProbability > 0.5 || comp.breakdown.pricePerSqftScore < 55 ? -Math.max(7000, 18000 * comp.outlierProbability) : 0;
  const adjustments = {
    time: roundToThousand(time),
    location: roundToThousand(location),
    squareFootage: roundToThousand(squareFootage),
    bedroomsBathrooms: roundToThousand(bedroomsBathrooms),
    age: roundToThousand(age),
    condition: roundToThousand(condition),
    parking: roundToThousand(parking),
    lotSize: roundToThousand(lotSize),
    outlier: roundToThousand(outlier),
    total: 0
  };
  adjustments.total =
    adjustments.time +
    adjustments.location +
    adjustments.squareFootage +
    adjustments.bedroomsBathrooms +
    adjustments.age +
    adjustments.condition +
    adjustments.parking +
    adjustments.lotSize +
    adjustments.outlier;

  return {
    ...comp,
    adjustedValue: comp.salePrice + adjustments.total,
    adjustments,
    adjustmentLines: [
      line("time", "Time adjustment", adjustments.time, `${comp.daysSinceSale} days since sale at ${(monthlyMarketTrend * 100).toFixed(2)}% monthly market trend.`, 0.68),
      line("location", "Location adjustment", adjustments.location, `${comp.distanceKm.toFixed(1)} km from subject at ${roundToThousand(locationDollarPerKm).toLocaleString()} dollars per km.`, 0.62),
      line("size", "Living area adjustment", adjustments.squareFootage, `${subject.livingAreaSqft.toLocaleString()} subject sqft versus ${comp.livingAreaSqft.toLocaleString()} comp sqft at 45% local PPSF.`, 0.74),
      line("bedsBaths", "Beds/baths adjustment", adjustments.bedroomsBathrooms, `${subject.bedrooms}/${subject.bathrooms} subject profile compared with ${comp.bedrooms}/${comp.bathrooms}.`, 0.7),
      line("age", "Age adjustment", adjustments.age, `${subject.yearBuilt} subject year built compared with ${comp.yearBuilt}.`, 0.56),
      line("condition", "Condition adjustment", adjustments.condition, `${subject.condition} subject condition compared with ${comp.condition} comp condition.`, 0.58, "analyst-reviewed"),
      line("lot", "Lot size adjustment", adjustments.lotSize, `${subject.lotSizeSqft.toLocaleString()} subject lot sqft versus ${comp.lotSizeSqft.toLocaleString()} comp lot sqft at a 15% land factor.`, 0.52),
      line("parking", "Parking adjustment", adjustments.parking, `${subject.parking} subject parking stalls compared with ${comp.parking}.`, 0.68),
      line("outlier", "Outlier adjustment", adjustments.outlier, adjustments.outlier ? `Robust PPSF outlier probability is ${Math.round(comp.outlierProbability * 100)}%.` : "No outlier adjustment applied.", 0.64, "analyst-reviewed")
    ]
  };
}
