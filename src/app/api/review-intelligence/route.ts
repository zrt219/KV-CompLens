import type { PceAnalysisSnapshot } from "../../../../lib/pce/runPcePipeline";
import { buildReviewEvidencePack } from "../../../../lib/rag/buildReviewEvidencePack";
import { retrieveReviewContext, type ReviewIntent } from "../../../../lib/rag/retrieveReviewContext";
import { generateDeterministicZrtReviewInsight } from "../../../../lib/review-intelligence/generateZrtReviewInsight";
import { generateLlmZrtReviewInsight } from "../../../../lib/review-intelligence/generateLlmZrtReviewInsight";
import type { ReviewInsightSource, ZrtReviewInsight } from "../../../../lib/review-intelligence/types";
import { verifyZrtReviewInsight } from "../../../../lib/review-intelligence/verifyZrtReviewInsight";
import { buildEvidenceCourtResultFromInsight } from "../../../../lib/review-intelligence-v2/runEvidenceCourt";
import { runCounterfactualAnalyst } from "../../../../lib/review-intelligence-v2/counterfactualAnalyst";

export const runtime = "nodejs";

type ReviewIntelligenceRequestBody = {
  snapshot: PceAnalysisSnapshot;
  intent?: ReviewIntent;
  focusComparableId?: string;
};

export async function POST(request: Request) {
  const body = await request.json() as Partial<ReviewIntelligenceRequestBody>;

  if (!body.snapshot) {
    return new Response("Missing review-intelligence payload.", { status: 400 });
  }

  const intent = body.intent ?? "review_set_summary";
  const pack = buildReviewEvidencePack(body.snapshot);
  const context = retrieveReviewContext(pack, intent, {
    focusComparableId: body.focusComparableId,
    page: intent === "export_summary" ? "export" : intent === "adjustment_summary" ? "adjust" : "review"
  });
  const deterministicInsight = generateDeterministicZrtReviewInsight(context);
  const deterministicVerification = verifyZrtReviewInsight(context, deterministicInsight);

  let finalInsight: ZrtReviewInsight = deterministicVerification.verifiedInsight ?? deterministicInsight;
  let source: ReviewInsightSource = "deterministic";
  let fallbackUsed = false;
  const warnings = [...context.warnings, ...deterministicVerification.warnings];

  if (process.env.OPENAI_API_KEY?.trim()) {
    const llmResult = await generateLlmZrtReviewInsight(context);
    if (!llmResult.usedFallback) {
      const verification = verifyZrtReviewInsight(context, llmResult.insight);
      warnings.push(...verification.warnings);
      if (verification.ok && verification.verifiedInsight) {
        finalInsight = verification.verifiedInsight;
        source = "llm_verified";
      } else {
        fallbackUsed = true;
        warnings.push(...verification.errors);
      }
    } else if (llmResult.error) {
      fallbackUsed = true;
      warnings.push(llmResult.error);
    }
  }

  const finalVerification = verifyZrtReviewInsight(context, finalInsight);
  const counterfactuals = runCounterfactualAnalyst(pack, body.snapshot);
  const result = buildEvidenceCourtResultFromInsight(
    context,
    finalVerification.verifiedInsight ?? finalInsight,
    {
      ...finalVerification,
      verifiedClaimCount: (finalVerification.verifiedInsight ?? finalInsight).keyEvidence.length + (finalVerification.verifiedInsight ?? finalInsight).keyRisks.length,
      rejectedClaimCount: finalVerification.errors.length
    },
    counterfactuals,
    source
  );

  return Response.json({
    context,
    result,
    fallbackUsed,
    warnings
  });
}
