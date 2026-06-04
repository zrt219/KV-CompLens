import { assistantDraftSchema, buildAssistantPrompt, buildLocalAssistantDraft, createAssistantContext, normalizeAssistantDraft, type AssistantDraft } from "../../../../lib/assistant";
import type { PceAnalysisSnapshot } from "../../../../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../../../../lib/types";

export const runtime = "nodejs";

type AssistantRequestBody = {
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
};

export async function POST(request: Request) {
  const body = await request.json() as Partial<AssistantRequestBody>;

  if (!body.subject || !body.snapshot) {
    return new Response("Missing assistant payload.", { status: 400 });
  }

  const context = createAssistantContext(body.subject, body.snapshot);
  const fallback = buildLocalAssistantDraft(context);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(fallback);
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
            content: "You draft concise review-support memos for KV CompLens. Keep the deterministic valuation unchanged. Return only JSON that matches the supplied schema."
          },
          {
            role: "user",
            content: buildAssistantPrompt(context)
          }
        ],
        max_tokens: 700,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kv_complens_assistant_draft",
            strict: true,
            schema: assistantDraftSchema
          }
        }
      })
    });

    if (!response.ok) {
      return Response.json({
        ...fallback,
        summary: `${fallback.summary} OpenAI returned ${response.status}; using the local fallback draft.`
      } satisfies AssistantDraft);
    }

    const payload = await response.json() as Record<string, unknown>;
    const parsedDraft = parseOpenAIAssistantDraft(payload);
    const responseModel = typeof payload.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : (process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini");

    return Response.json(
      normalizeAssistantDraft(
        parsedDraft,
        {
          ...fallback,
          source: "openai",
          model: responseModel
        }
      )
    );
  } catch (error) {
    return Response.json({
      ...fallback,
      summary: error instanceof Error
        ? `${fallback.summary} OpenAI request failed (${error.message}); using the local fallback draft.`
        : `${fallback.summary} OpenAI request failed; using the local fallback draft.`
    } satisfies AssistantDraft);
  }
}

function parseOpenAIAssistantDraft(payload: Record<string, unknown>) {
  if (Array.isArray(payload.choices) && payload.choices.length > 0) {
    const firstChoice = payload.choices[0] as Record<string, unknown>;
    if (firstChoice.message && typeof firstChoice.message === "object") {
      const message = firstChoice.message as Record<string, unknown>;
      if (typeof message.content === "string") {
        return safeParseJson(message.content);
      }
    }
  }
  return undefined;
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}
