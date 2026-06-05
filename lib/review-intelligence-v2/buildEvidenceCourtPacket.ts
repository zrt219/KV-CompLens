import type { PceAnalysisSnapshot } from "../pce/runPcePipeline";

export { buildReviewEvidencePack as buildEvidenceCourtPacket } from "../rag/buildReviewEvidencePack";

export function dataBoundaryNote(snapshot?: PceAnalysisSnapshot) {
  return snapshot?.sourceScan.dataBoundaryNote || "Synthetic/public-style demo data.";
}
