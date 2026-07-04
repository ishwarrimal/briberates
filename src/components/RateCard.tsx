import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { CorroborateButtons } from "./CorroborateButtons";
import { RangeBar } from "./RangeBar";
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
  const hasData =
    stats.median != null &&
    stats.min != null &&
    stats.max != null &&
    stats.q1 != null &&
    stats.q3 != null;

  return (
    <div className="flex flex-col rounded-xl border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-medium leading-snug text-ink">
            {subItem.name}
          </h3>
          {subItem.official_fee_note && (
            <p className="mt-1 text-xs leading-relaxed text-faint">
              {subItem.official_fee_note}
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={stats.confidence} count={stats.count} />
      </div>

      {hasData ? (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums tracking-tight text-ink">
              {formatINR(stats.median)}
            </span>
            <span className="text-xs uppercase tracking-wide text-faint">
              typical extra
            </span>
          </div>

          <RangeBar
            min={stats.min!}
            q1={stats.q1!}
            median={stats.median!}
            q3={stats.q3!}
            max={stats.max!}
          />
        </>
      ) : (
        <div className="mt-4 flex-1 rounded-lg border border-dashed border-hairline px-4 py-6 text-sm text-muted">
          No reports yet.{" "}
          <Link href={submitHref} className="font-medium text-accent underline">
            Be the first to report
          </Link>
          .
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-4">
        {officeId != null && hasData ? (
          <CorroborateButtons officeId={officeId} subItemId={subItem.id} />
        ) : (
          <span />
        )}
        <Link
          href={submitHref}
          className="text-xs font-medium text-accent hover:underline"
        >
          Report a rate →
        </Link>
      </div>
    </div>
  );
}
