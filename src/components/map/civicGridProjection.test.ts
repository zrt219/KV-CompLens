import { describe, expect, it } from "vitest";
import { latLngDeltaKm, projectToCivicGrid, subjectCivicGridPoint } from "./civicGridProjection";
import type { ScoredComparable, SubjectProperty } from "../../../lib/types";

const subject: SubjectProperty = {
  id: "S",
  address: "100 Grid St",
  city: "Edmonton",
  neighbourhood: "Central",
  propertyType: "Detached",
  yearBuilt: 2015,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2200,
  lotSizeSqft: 5600,
  parking: 2,
  latitude: 53.54,
  longitude: -113.49,
  condition: "Good"
};

const comp = {
  id: "C",
  latitude: 53.56,
  longitude: -113.45
} as ScoredComparable;

describe("CivicGrid projection", () => {
  it("keeps subject centered while projecting comparable lat/lng into abstract x/y", () => {
    const center = subjectCivicGridPoint(subject);
    const point = projectToCivicGrid(subject, comp, 8);

    expect(center.x).toBe(500);
    expect(center.y).toBe(340);
    expect(point.x).toBeGreaterThan(center.x);
    expect(point.y).toBeLessThan(center.y);
    expect(point.district).toEqual(expect.any(String));
  });

  it("derives kilometre offsets from real coordinates", () => {
    const delta = latLngDeltaKm(subject, comp);

    expect(delta.dxKm).toBeGreaterThan(0);
    expect(delta.dyKm).toBeGreaterThan(0);
  });
});
