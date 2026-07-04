"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { slug: string; name: string; state?: string };

export function BrowseMenu({
  services,
  cities,
}: {
  services: Item[];
  cities: Item[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-ink transition hover:text-accent"
        aria-expanded={open}
      >
        Browse
        <span
          className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[min(92vw,34rem)] rounded-xl border border-hairline bg-surface p-5 shadow-xl">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="kicker mb-3">Departments</p>
              <ul className="space-y-1.5">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/${s.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-sm text-ink transition hover:text-accent"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
                {services.length === 0 && (
                  <li className="text-sm text-faint">None yet</li>
                )}
              </ul>
            </div>
            <div>
              <p className="kicker mb-3">Cities</p>
              <ul className="space-y-1.5">
                {cities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/city/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-sm text-ink transition hover:text-accent"
                    >
                      {c.name}
                      {c.state && (
                        <span className="text-faint"> · {c.state}</span>
                      )}
                    </Link>
                  </li>
                ))}
                {cities.length === 0 && (
                  <li className="text-sm text-faint">None yet</li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-4 border-t border-hairline pt-3">
            <Link
              href="/browse"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-accent hover:underline"
            >
              Browse the full directory →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
