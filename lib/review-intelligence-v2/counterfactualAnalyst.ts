import type { PceAnalysisSnapshot } from "../pce/runPcePipeline"
import { runPcePipeline } from "../pce/runPcePipeline"
import type { CounterfactualCheck, EvidenceCourtPacket } from "./types"

export function runCounterfactualAnalyst(packet: EvidenceCourtPacket, snapshot: PceAnalysisSnapshot): CounterfactualCheck[] {
  const selectedIds = snapshot.selectedComparables.map((comp) => comp.id)
  return packet.selectedComparables.map((comp) => {
    const remainingIds = selectedIds.filter((id) => id !== comp.id)
    try {
      const rerun = runPcePipeline({
        subject: snapshot.subject,
        candidates: snapshot.rankedComparables,
        selectedComparableIds: remainingIds,
        generatedAt: snapshot.generatedAt
      })

      const deltaMidpoint = roundToWhole(rerun.valuation.midpointEstimate - snapshot.valuation.midpointEstimate)
      const deltaConfidence = roundToTenth(rerun.valuation.confidenceScore - snapshot.valuation.confidenceScore)
      const rangeImpact = roundToWhole(rerun.valuation.rangeWidth - snapshot.valuation.rangeWidth)

      return {
        id: `counterfactual:${comp.id}`,
        label: `Remove ${comp.address}`,
        comparableId: comp.id,
        beforeMidpoint: snapshot.valuation.midpointEstimate,
        afterMidpoint: rerun.valuation.midpointEstimate,
        deltaMidpoint,
        beforeConfidence: snapshot.valuation.confidenceScore,
        afterConfidence: rerun.valuation.confidenceScore,
        deltaConfidence,
        rangeImpact,
        interpretation: interpretCounterfactual(comp.address, deltaMidpoint, deltaConfidence, rangeImpact, false)
      }
    } catch {
      const estimatedMidpointShift = roundToWhole((comp.adjustedValue - snapshot.valuation.midpointEstimate) * comp.evidenceWeight)
      const estimatedConfidenceShift = roundToTenth(-Math.max(1.5, comp.evidenceWeight * 10))
      const estimatedRangeImpact = roundToWhole(Math.max(2500, snapshot.valuation.rangeWidth * Math.max(0.03, comp.evidenceWeight * 0.18)))

      return {
        id: `counterfactual:${comp.id}`,
        label: `Remove ${comp.address}`,
        comparableId: comp.id,
        beforeMidpoint: snapshot.valuation.midpointEstimate,
        afterMidpoint: snapshot.valuation.midpointEstimate + estimatedMidpointShift,
        deltaMidpoint: estimatedMidpointShift,
        beforeConfidence: snapshot.valuation.confidenceScore,
        afterConfidence: snapshot.valuation.confidenceScore + estimatedConfidenceShift,
        deltaConfidence: estimatedConfidenceShift,
        rangeImpact: estimatedRangeImpact,
        interpretation: `${interpretCounterfactual(comp.address, estimatedMidpointShift, estimatedConfidenceShift, estimatedRangeImpact, true)} Local sensitivity estimate.`
      }
    }
  })
}

function interpretCounterfactual(address: string, deltaMidpoint: number, deltaConfidence: number, rangeImpact: number, estimated: boolean) {
  const midpointShare = Math.abs(deltaMidpoint)
  const confidenceShare = Math.abs(deltaConfidence)
  const rangeShare = Math.abs(rangeImpact)
  const prefix = estimated ? "" : ""

  if (midpointShare < 5000 && confidenceShare < 2 && rangeShare < 10000) {
    return `${prefix}Removing ${address} has minimal impact on the midpoint and confidence, so the comp appears low influence.`
  }
  if (midpointShare >= 15000 || confidenceShare >= 6) {
    return `${prefix}Removing ${address} materially shifts the midpoint or confidence, which indicates that the comp is important to the review conclusion.`
  }
  if (rangeImpact > 0) {
    return `${prefix}Removing ${address} widens the range, which suggests that the comp supports range stability.`
  }
  return `${prefix}Removing ${address} changes the review set moderately and should be checked before finalizing the memo.`
}

function roundToWhole(value: number) {
  return Math.round(value)
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10
}
