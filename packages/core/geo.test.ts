import { describe, expect, it } from "vitest";
import { buildMapConnectionFeatures, getConnectionLineStyle, haversineDistanceKm } from "./geo";
import { createInitialWorkflow } from "./workflow";
import type { SubjectProperty } from "./types";

const subject: SubjectProperty = {
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
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
  condition: "Good"
};

describe("geo helpers", () => {
  it("calculates positive haversine distance between different Edmonton coordinates", () => {
    const distance = haversineDistanceKm(53.5828, -113.5082, 53.5809, -113.5055);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1);
  });

  it("creates one map connection feature per selected comparable", () => {
    const workflow = createInitialWorkflow(subject);
    const features = buildMapConnectionFeatures(subject, workflow.analysis.selectedComparables);
    expect(features).toHaveLength(workflow.analysis.selectedComparables.length);
    expect(features[0].geometry.coordinates[0]).toEqual([subject.longitude, subject.latitude]);
  });

  it("returns distinct styles for new and weak connections", () => {
    const newStyle = getConnectionLineStyle(80, true);
    const weakStyle = getConnectionLineStyle(50, false);
    expect(newStyle.width).toBeGreaterThan(weakStyle.width);
    expect(weakStyle.dasharray).toEqual([2, 2]);
  });
});
