import sources from "../../data/public_assessment_sources.json";

export type PublicAssessmentSource = {
  name: string;
  jurisdiction: string;
  url: string;
  useInDemo: string;
  caveat: string;
};

export const publicAssessmentSources = sources as PublicAssessmentSource[];

export const dataProvenanceLabel =
  "Local synthetic home sales calibrated against public assessment context. Not MLS sold data.";
