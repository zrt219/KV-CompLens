export * from "../packages/core/data";
import type { SubjectProperty, PropertyType, PropertyCondition } from "./types";

export const defaultMockSubject: SubjectProperty = {
  id: "SUBJ-EDM-001",
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good",
  targetPriceHint: 690000,
  dealName: "Oakridge Builder Draw Review",
  borrowerType: "Home builder",
  underwritingDate: "2026-05-31",
  targetUnderwritingDate: "2026-05-31",
  intendedUse: "Residential construction lending",
  analystName: "Alex Carter"
};

export const propertyTypes: PropertyType[] = ["Detached", "SemiDetached", "Townhouse", "Condo"];
export const conditions: PropertyCondition[] = ["Poor", "Average", "Good", "Renovated", "New"];
export const cities = ["Edmonton", "Calgary", "Airdrie", "Sherwood Park", "St. Albert"];
