import type { RetrievedContext } from "../rag/retrieveReviewContext";
import { generateDeterministicZrtReviewInsight } from "./generateZrtReviewInsight";
import type { ReviewInsightSource, ZrtReviewInsight } from "./types";

type LlmInsightResult = {
  insight: ZrtReviewInsight;
  source: ReviewInsightSource;
  usedFallback: boolean;
  error?: string;
};

export async function generateLlmZrtReviewInsight(context: RetrievedContext): Promise<LlmInsightResult> {
  const fallback = generateDeterministicZrtReviewInsight(context);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      insight: fallback,
      source: "deterministic",
      usedFallback: true
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an underwriting review assistant. Use only the provided facts. Do not compute value. Do not invent facts. Do not expose chain-of-thought. Return only structured JSON matching the schema."
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        max_tokens: 900,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "zrt_review_insight",
            strict: true,
            schema: reviewInsightSchema
          }
        }
      })
    });

    if (!response.ok) {
      return {
        insight: fallback,
        source: "deterministic",
        usedFallback: true,
        error: `OpenAI returned ${response.status}.`
      };
    }

    const payload = await response.json() as Record<string, unknown>;
    const parsed = parseOpenAiJson(payload);

    if (!parsed || typeof parsed !== "object") {
      return {
        insight: fallback,
        source: "deterministic",
        usedFallback: true,
        error: "OpenAI returned an empty or invalid payload."
      };
    }

    return {
      insight: parsed as ZrtReviewInsight,
      source: "llm_verified",
      usedFallback: false
    };
  } catch (error) {
    return {
      insight: fallback,
      source: "deterministic",
      usedFallback: true,
      error: error instanceof Error ? error.message : "Unknown review-intelligence request failure."
    };
  }
}

function parseOpenAiJson(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    return undefined;
  }
  const choice = payload.choices[0] as { message?: { content?: string } };
  if (!choice.message?.content) {
    return undefined;
  }
  try {
    return JSON.parse(choice.message.content) as unknown;
  } catch {
    return undefined;
  }
}

const comparableSchema = {
  type: "object",
  additionalProperties: false,
  required: ["comparableId", "address", "reason", "factIds"],
  properties: {
    comparableId: { type: "string" },
    address: { type: "string" },
    reason: { type: "string" },
    factIds: {
      type: "array",
      items: { type: "string" }
    }
  }
} as const;

const stringArraySchema = {
  type: "array",
  items: { type: "string" }
} as const;

const reviewInsightSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "verdict",
    "summary",
    "confidenceRationale",
    "keyEvidence",
    "keyRisks",
    "analystQuestions",
    "nextAction",
    "memoReadySummary",
    "limitations"
  ],
  properties: {
    title: { type: "string" },
    verdict: { type: "string", enum: ["usable_with_review", "needs_review", "weak_packet"] },
    summary: { type: "string" },
    strongestComparable: comparableSchema,
    weakestComparable: comparableSchema,
    confidenceRationale: {
      type: "object",
      additionalProperties: false,
      required: ["label", "explanation", "factIds"],
      properties: {
        label: { type: "string" },
        explanation: { type: "string" },
        factIds: stringArraySchema
      }
    },
    keyEvidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["point", "factIds"],
        properties: {
          point: { type: "string" },
          factIds: stringArraySchema
        }
      }
    },
    keyRisks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["risk", "severity", "factIds"],
        properties: {
          risk: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          factIds: stringArraySchema
        }
      }
    },
    analystQuestions: stringArraySchema,
    nextAction: { type: "string" },
    memoReadySummary: { type: "string" },
    limitations: stringArraySchema
  }
} as const;
