export function clamp01(x: number) {
  return Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
}

export function clampScore(x: number) {
  return Math.max(0, Math.min(100, Number.isFinite(x) ? x : 0));
}

export function sigmoid(x: number) {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

export function logit(p: number) {
  const clamped = Math.max(1e-9, Math.min(1 - 1e-9, Number.isFinite(p) ? p : 0.5));
  return Math.log(clamped / (1 - clamped));
}

export function safeExp(x: number) {
  return Math.exp(Math.max(-60, Math.min(60, x)));
}

export function gaussianKernel(x: number, bandwidth: number) {
  if (bandwidth <= 0) return x === 0 ? 1 : 0;
  return clamp01(safeExp(-Math.pow(x / bandwidth, 2)));
}

export function exponentialDecay(x: number, halfLife: number) {
  if (halfLife <= 0) return x <= 0 ? 1 : 0;
  return clamp01(safeExp(-x / halfLife));
}

export function normalizeWeights(weights: number[]) {
  const cleaned = weights.map((weight) => Math.max(0, Number.isFinite(weight) ? weight : 0));
  const total = cleaned.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return cleaned.map(() => cleaned.length ? 1 / cleaned.length : 0);
  return cleaned.map((weight) => weight / total);
}

export function weightedMean(values: number[], weights: number[]) {
  if (!values.length) return 0;
  const normalized = normalizeWeights(weights);
  return values.reduce((sum, value, index) => sum + value * (normalized[index] ?? 0), 0);
}

export function weightedVariance(values: number[], weights: number[]) {
  if (values.length < 2) return 0;
  const mean = weightedMean(values, weights);
  const normalized = normalizeWeights(weights);
  return values.reduce((sum, value, index) => sum + Math.pow(value - mean, 2) * (normalized[index] ?? 0), 0);
}

export function weightedPercentile(values: number[], weights: number[], percentile: number) {
  if (!values.length) return 0;
  const normalizedTarget = clamp01(percentile);
  const pairs = values
    .map((value, index) => ({ value, weight: Math.max(0, weights[index] ?? 0) }))
    .sort((a, b) => a.value - b.value);
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);
  if (totalWeight <= 0) return pairs[Math.min(pairs.length - 1, Math.floor(normalizedTarget * (pairs.length - 1)))].value;
  let cumulative = 0;
  for (const pair of pairs) {
    cumulative += pair.weight / totalWeight;
    if (cumulative >= normalizedTarget) return pair.value;
  }
  return pairs[pairs.length - 1].value;
}

export function entropy(weights: number[]) {
  const cleaned = weights.map((weight) => Math.max(0, Number.isFinite(weight) ? weight : 0));
  const total = cleaned.reduce((sum, weight) => sum + weight, 0);
  if (!cleaned.length || total <= 0) return 0;
  const rawEntropy = cleaned.reduce((sum, weight) => {
    const p = weight / total;
    return p > 0 ? sum - p * Math.log(p) : sum;
  }, 0);
  return cleaned.length > 1 ? rawEntropy / Math.log(cleaned.length) : 0;
}

export function effectiveSampleSize(weights: number[]) {
  const cleaned = weights.map((weight) => Math.max(0, Number.isFinite(weight) ? weight : 0));
  const sum = cleaned.reduce((acc, weight) => acc + weight, 0);
  const squaredSum = cleaned.reduce((acc, weight) => acc + weight * weight, 0);
  return squaredSum > 0 ? (sum * sum) / squaredSum : 0;
}
