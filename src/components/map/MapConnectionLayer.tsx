import { buildMapConnectionFeatures } from "../../../lib/geo";
import type { ScoredComparable, SubjectProperty } from "../../../lib/types";

export function createMapConnectionLayer(subject: SubjectProperty, comps: ScoredComparable[], newCompId?: string) {
  return buildMapConnectionFeatures(subject, comps, newCompId);
}
