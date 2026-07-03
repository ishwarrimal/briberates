import type { Confidence, RateStats } from "./types";

function sorted(nums: number[]): number[] {
  return [...nums].sort((a, b) => a - b);
}

export function quantile(values: number[], q: number): number {
  const s = sorted(values);
  if (s.length === 0) return 0;
  if (s.length === 1) return s[0];
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = s[base + 1] ?? s[base];
  return s[base] + rest * (next - s[base]);
}

export function median(values: number[]): number {
  return quantile(values, 0.5);
}

/**
 * Drop statistical outliers using the 1.5 * IQR rule. This is what neutralises
 * troll entries (a single ₹5,00,000 report) without any manual moderation.
 */
export function trimOutliers(values: number[]): number[] {
  if (values.length < 4) return values;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lo && v <= hi);
}

function confidenceFor(effectiveSamples: number): Confidence {
  if (effectiveSamples <= 0) return "none";
  if (effectiveSamples < 3) return "low";
  if (effectiveSamples < 6) return "medium";
  return "high";
}

/**
 * Turn a set of reported "extra paid" amounts + one-tap corroborations into a
 * headline rate. One report is a rumour; many reports are a price.
 */
export function computeStats(
  extraPaidValues: number[],
  corroborations = 0,
): RateStats {
  const kept = trimOutliers(extraPaidValues);
  const count = kept.length;
  if (count === 0) {
    return {
      count: 0,
      corroborations,
      median: null,
      q1: null,
      q3: null,
      min: null,
      max: null,
      confidence: confidenceFor(corroborations > 0 ? 1 : 0),
    };
  }
  const s = sorted(kept);
  return {
    count,
    corroborations,
    median: Math.round(median(kept)),
    q1: Math.round(quantile(kept, 0.25)),
    q3: Math.round(quantile(kept, 0.75)),
    min: s[0],
    max: s[s.length - 1],
    // Corroborations count as half a report towards confidence.
    confidence: confidenceFor(count + Math.floor(corroborations / 2)),
  };
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  none: "No reports yet",
  low: "Unverified",
  medium: "Emerging",
  high: "Well-established",
};
