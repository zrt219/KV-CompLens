import type { ScoredComparable, SubjectProperty } from "../../../lib/types";

export function describePropertyMarker(property: SubjectProperty | ScoredComparable, role: "subject" | "comparable" | "candidate") {
  return {
    role,
    latitude: property.latitude,
    longitude: property.longitude,
    label: `${property.address}, ${property.city}`
  };
}
