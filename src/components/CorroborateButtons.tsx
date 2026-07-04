"use client";

import { useEffect, useState } from "react";

type Direction = "same" | "more" | "less";

const OPTIONS: { dir: Direction; label: string }[] = [
  { dir: "less", label: "I paid less" },
  { dir: "same", label: "About the same" },
  { dir: "more", label: "I paid more" },
];

export function CorroborateButtons({
  officeId,
  subItemId,
}: {
  officeId: number;
  subItemId: number;
}) {
  const storageKey = `corr:${officeId}:${subItemId}`;
  const [voted, setVoted] = useState<Direction | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const prev = window.localStorage.getItem(storageKey) as Direction | null;
    if (prev) setVoted(prev);
  }, [storageKey]);

  async function vote(dir: Direction) {
    if (voted || pending) return;
    setPending(true);
    try {
      await fetch("/api/corroborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeId, subItemId, direction: dir }),
      });
      window.localStorage.setItem(storageKey, dir);
      setVoted(dir);
    } finally {
      setPending(false);
    }
  }

  if (voted) {
    return (
      <p className="text-xs text-faint">Thanks — your input was recorded.</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-faint">Been here?</span>
      {OPTIONS.map((o) => (
        <button
          key={o.dir}
          onClick={() => vote(o.dir)}
          disabled={pending}
          className="rounded-full border border-hairline px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
