import { CONFIDENCE_LABEL } from "@/lib/aggregate";
import type { Confidence } from "@/lib/types";

const FILLED: Record<Confidence, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function ConfidenceBadge({
  confidence,
  count,
}: {
  confidence: Confidence;
  count: number;
}) {
  const filled = FILLED[confidence];
  return (
    <div
      className="flex items-center gap-2 text-right"
      title={`${count} report${count === 1 ? "" : "s"} used`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {CONFIDENCE_LABEL[confidence]}
      </span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < filled ? "bg-accent" : "bg-hairline"
            }`}
          />
        ))}
      </span>
    </div>
  );
}
