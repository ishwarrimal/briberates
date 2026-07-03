import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CorroborateButtons } from "./CorroborateButtons";
import { formatINR } from "@/lib/format";
import type { SubItemRate } from "@/lib/types";

export function RateCard({
  rate,
  officeId,
  submitHref,
}: {
  rate: SubItemRate;
  officeId?: number;
  submitHref: string;
}) {
  const { subItem, stats } = rate;
  const hasData = stats.median != null;

  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{subItem.name}</h3>
          {subItem.official_fee_note && (
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
              {subItem.official_fee_note}
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={stats.confidence} count={stats.count} />
      </div>

      {hasData ? (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {formatINR(stats.median)}
            </span>
            <span className="text-xs text-black/50 dark:text-white/50">
              typical extra paid
            </span>
          </div>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Most people paid{" "}
            <span className="font-medium text-black/80 dark:text-white/80">
              {formatINR(stats.q1)} – {formatINR(stats.q3)}
            </span>{" "}
            (range {formatINR(stats.min)}–{formatINR(stats.max)})
          </p>
        </div>
      ) : (
        <div className="mt-3 text-sm text-black/60 dark:text-white/60">
          No reports yet.{" "}
          <Link href={submitHref} className="font-medium text-amber-600 underline">
            Be the first to report
          </Link>
          .
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {officeId != null && hasData ? (
          <CorroborateButtons officeId={officeId} subItemId={subItem.id} />
        ) : (
          <span />
        )}
        <Link
          href={submitHref}
          className="text-xs font-medium text-amber-600 hover:underline"
        >
          Report a rate →
        </Link>
      </div>
    </div>
  );
}
