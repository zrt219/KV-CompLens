import type { ScoredComparable, SubjectProperty } from "./types";

export type MapConnectionFeature = {
  type: "Feature";
  properties: {
    id: string;
    matchScore: number;
    strength: "strong" | "weak";
    isNew: boolean;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const aLat = (lat1 * Math.PI) / 180;
  const bLat = (lat2 * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat) * Math.cos(bLat) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

export function buildMapConnectionFeatures(subject: SubjectProperty, comps: ScoredComparable[], newCompId?: string): MapConnectionFeature[] {
  return comps.map((comp) => ({
    type: "Feature",
    properties: {
      id: comp.id,
      matchScore: comp.totalScore,
      strength: comp.totalScore >= 70 ? "strong" : "weak",
      isNew: comp.id === newCompId
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [subject.longitude, subject.latitude],
        [comp.longitude, comp.latitude]
      ]
    }
  }));
}

export function getConnectionLineStyle(matchScore: number, isNew = false) {
  if (isNew) return { color: "#45a3ff", width: 4, dasharray: [1, 0], opacity: 0.95 };
  if (matchScore >= 70) return { color: "#8fb2dc", width: 2.5, dasharray: [1, 0], opacity: 0.72 };
  return { color: "#7f8da0", width: 1.8, dasharray: [2, 2], opacity: 0.5 };
}
