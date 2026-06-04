import { buildEvidenceCourtResultFromPacket } from "./runEvidenceCourt"
import type { CounterfactualCheck, EvidenceCourtPacket, EvidenceCourtResult } from "./types"

export async function generateLLMEvidenceCourt(
  packet: EvidenceCourtPacket,
  counterfactuals: CounterfactualCheck[],
  deterministicFallback?: EvidenceCourtResult
) {
  const fallback = deterministicFallback ?? buildEvidenceCourtResultFromPacket(packet, counterfactuals)
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  if (!apiKey) {
    return fallback
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
            content: "You are an underwriting review assistant. Use only the supplied EvidenceCourtPacket. Do not calculate valuation. Do not invent facts. Do not expose chain-of-thought. Return only structured public reasoning artifacts."
          },
          {
            role: "user",
            content: JSON.stringify(packet)
          }
        ],
        max_tokens: 1100,
        response_format: {
          type: "json_object"
        }
      })
    })

    if (!response.ok) {
      return fallback
    }

    const payload = await response.json() as Record<string, unknown>
    const content = parseCompletionJson(payload)
    if (!content || typeof content !== "object") {
      return fallback
    }

    return fallback
  } catch {
    return fallback
  }
}

function parseCompletionJson(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    return undefined
  }
  const choice = payload.choices[0] as { message?: { content?: string } }
  if (!choice.message?.content) {
    return undefined
  }
  try {
    return JSON.parse(choice.message.content) as unknown
  } catch {
    return undefined
  }
}
