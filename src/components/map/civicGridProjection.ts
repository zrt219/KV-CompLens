import type { ScoredComparable, SubjectProperty } from "../../../lib/types";

export type CivicGridPoint = {
  id: string;
  x: number;
  y: number;
  dxKm: number;
  dyKm: number;
  distanceKm: number;
  district: string;
};

const CENTER_X = 500;
const CENTER_Y = 340;
const MAX_X_RADIUS = 360;
const MAX_Y_RADIUS = 250;

export function latLngDeltaKm(subject: Pick<SubjectProperty, "latitude" | "longitude">, property: Pick<ScoredComparable, "latitude" | "longitude">) {
  const meanLatRadians = ((subject.latitude + property.latitude) / 2) * Math.PI / 180;
  const dxKm = (property.longitude - subject.longitude) * 111.32 * Math.cos(meanLatRadians);
  const dyKm = (property.latitude - subject.latitude) * 110.57;
  return { dxKm, dyKm };
}

export function districtForPoint(x: number, y: number) {
  if (y < 245 && x < 470) return "Northwest Growth";
  if (y < 255 && x >= 470) return "Northeast Infill";
  if (y >= 450 && x < 470) return "Southwest Estate";
  if (y >= 450 && x >= 470) return "Southeast Builder";
  return "Central Evidence";
}

export function projectToCivicGrid(subject: SubjectProperty, property: ScoredComparable, maxDistanceKm: number): CivicGridPoint {
  const { dxKm, dyKm } = latLngDeltaKm(subject, property);
  const distanceKm = Math.sqrt(dxKm * dxKm + dyKm * dyKm);
  const denominator = Math.max(1, maxDistanceKm);
  const x = CENTER_X + Math.max(-MAX_X_RADIUS, Math.min(MAX_X_RADIUS, (dxKm / denominator) * MAX_X_RADIUS));
  const y = CENTER_Y - Math.max(-MAX_Y_RADIUS, Math.min(MAX_Y_RADIUS, (dyKm / denominator) * MAX_Y_RADIUS));
  return {
    id: property.id,
    x: Math.round(x),
    y: Math.round(y),
    dxKm,
    dyKm,
    distanceKm,
    district: districtForPoint(x, y)
  };
}

export function subjectCivicGridPoint(subject: SubjectProperty): CivicGridPoint {
  return {
    id: subject.id ?? "subject",
    x: CENTER_X,
    y: CENTER_Y,
    dxKm: 0,
    dyKm: 0,
    distanceKm: 0,
    district: "Central Evidence"
  };
}
