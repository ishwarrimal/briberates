"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PendingReport } from "@/lib/queries";

function NewTag() {
  return (
    <span className="ml-1 rounded bg-amber-500/20 px-1 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">
      new
    </span>
  );
}

export function ModerationList({ reports }: { reports: PendingReport[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function moderate(id: number, action: "approve" | "reject") {
    setBusyId(id);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (reports.length === 0) {
    return (
      <p className="mt-6 text-black/60 dark:text-white/60">
        No pending reports. All caught up. ✅
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10"
        >
          <div>
            <p className="font-medium">
              ₹{r.extra_paid.toLocaleString("en-IN")}{" "}
              <span className="font-normal text-black/60 dark:text-white/60">
                for {r.sub_item_name}
                {r.sub_item_new && <NewTag />} at {r.office_name}
                {r.office_new && <NewTag />}
              </span>
            </p>
            <p className="text-xs text-black/50 dark:text-white/50">
              {r.service_name}
              {r.service_new && <NewTag />} · {r.city_name}
              {r.city_new && <NewTag />} · {r.paid_to} · {r.period || "no date"}
              {r.note ? ` · “${r.note}”` : ""}
            </p>
            {(r.office_new || r.sub_item_new || r.service_new || r.city_new) && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Approving publishes the new entries marked “new”.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              disabled={busyId === r.id}
              onClick={() => moderate(r.id, "approve")}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busyId === r.id}
              onClick={() => moderate(r.id, "reject")}
              className="rounded-full border border-red-500/40 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-300"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
