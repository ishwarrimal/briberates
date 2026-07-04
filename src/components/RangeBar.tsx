import { formatINR } from "@/lib/format";

/**
 * Distribution meter for a single rate: a zoomed number line showing the range
 * (min–max whisker), the interquartile band (q1–q3, where most people land),
 * and the median as the headline marker. Single-hue magnitude form — no legend
 * needed; the card title names the series.
 */
export function RangeBar({
  min,
  q1,
  median,
  q3,
  max,
}: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}) {
  // Zoom the domain to the data (with padding) so the spread is legible; the
  // labelled ends keep it honest.
  const span = max - min;
  const pad = Math.max(span * 0.18, max * 0.05, 1);
  const dMin = Math.max(0, min - pad);
  const dMax = max + pad;
  const dSpan = dMax - dMin || 1;
  const pos = (v: number) => `${((v - dMin) / dSpan) * 100}%`;

  return (
    <div className="mt-4">
      {/* median value floating above its marker */}
      <div className="relative h-6">
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap text-sm font-semibold tabular-nums text-ink"
          style={{ left: pos(median) }}
        >
          {formatINR(median)}
        </div>
      </div>

      {/* the meter */}
      <div className="relative h-4" title={`Range ${formatINR(min)}–${formatINR(max)}`}>
        {/* recessive baseline across the full domain */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />

        {/* min–max whisker */}
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-accent/35"
          style={{ left: pos(min), width: pos(max - min + dMin) }}
        />

        {/* interquartile band (q1–q3) */}
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded bg-accent-soft ring-1 ring-inset ring-accent/25"
          style={{ left: pos(q1), width: pos(q3 - q1 + dMin) }}
          title={`Most paid ${formatINR(q1)}–${formatINR(q3)}`}
        />

        {/* median marker */}
        <div
          className="absolute top-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: pos(median) }}
          title={`Median ${formatINR(median)}`}
        />
      </div>

      {/* labelled ends */}
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-faint">
        <span>{formatINR(min)}</span>
        <span>{formatINR(max)}</span>
      </div>
    </div>
  );
}
