import { CONFIDENCE_LABEL } from "@/lib/aggregate";
import type { Confidence } from "@/lib/types";

const STYLES: Record<Confidence, string> = {
  none: "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50",
  low: "bg-red-500/15 text-red-700 dark:text-red-300",
  medium: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export function ConfidenceBadge({
  confidence,
  count,
}: {
  confidence: Confidence;
  count: number;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[confidence]}`}
      title={`${count} report${count === 1 ? "" : "s"} used`}
    >
      {CONFIDENCE_LABEL[confidence]}
      {count > 0 && <span className="opacity-70">· {count}</span>}
    </span>
  );
}
