export type ProbabilityInput = {
  closes: number[];
  days: number;
  targetPct: number;
};

function logReturns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      r.push(Math.log(closes[i] / closes[i - 1]));
    }
  }
  return r;
}

function meanStd(arr: number[]): { mean: number; std: number } {
  if (arr.length === 0) return { mean: 0, std: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v =
    arr.reduce((s, x) => s + (x - mean) * (x - mean), 0) /
    Math.max(1, arr.length - 1);
  return { mean, std: Math.sqrt(v) };
}

// Standard normal CDF (Abramowitz & Stegun)
function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

export function historicalFrequency({
  closes,
  days,
  targetPct,
}: ProbabilityInput): number {
  if (closes.length <= days) return 0;
  const target = targetPct / 100;
  let total = 0;
  let hit = 0;
  for (let i = 0; i + days < closes.length; i++) {
    const r = closes[i + days] / closes[i] - 1;
    total++;
    if (r >= target) hit++;
  }
  return total > 0 ? hit / total : 0;
}

function boxMuller(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function monteCarlo({
  closes,
  days,
  targetPct,
}: ProbabilityInput): number {
  const lr = logReturns(closes);
  if (lr.length < 2) return 0;
  const { mean, std } = meanStd(lr);
  const trials = 10000;
  const target = Math.log(1 + targetPct / 100);
  let hit = 0;
  for (let t = 0; t < trials; t++) {
    let cum = 0;
    for (let d = 0; d < days; d++) {
      cum += mean + std * boxMuller();
    }
    if (cum >= target) hit++;
  }
  return hit / trials;
}

export function logNormalProbability({
  closes,
  days,
  targetPct,
}: ProbabilityInput): number {
  const lr = logReturns(closes);
  if (lr.length < 2) return 0;
  const { mean, std } = meanStd(lr);
  const target = Math.log(1 + targetPct / 100);
  const mu = mean * days;
  const sigma = std * Math.sqrt(days);
  if (sigma === 0) return mu >= target ? 1 : 0;
  // P(X >= target) = 1 - Phi((target - mu)/sigma)
  return 1 - normCdf((target - mu) / sigma);
}
