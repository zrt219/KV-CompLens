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
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "You draft concise review-support memos for KV CompLens. Keep the deterministic valuation unchanged. Return only JSON that matches the supplied schema."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildAssistantPrompt(context)
              }
            ]
          }
        ],
        max_output_tokens: 700,
        text: {
          format: {
            type: "json_schema",
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
  const direct = typeof payload.output_text === "string" ? payload.output_text : undefined;
  if (direct) {
    return safeParseJson(direct);
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const entry = item as { type?: unknown; content?: unknown };
    if (entry.type !== "message" || !Array.isArray(entry.content)) {
      continue;
    }
    for (const content of entry.content) {
      if (!content || typeof content !== "object") {
        continue;
      }
      const message = content as { type?: unknown; text?: unknown };
      if (message.type === "output_text" && typeof message.text === "string") {
        return safeParseJson(message.text);
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
