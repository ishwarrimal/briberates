"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Login failed.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-sm space-y-3">
      <input
        type="password"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
      >
        {busy ? "…" : "Log in"}
      </button>
    </form>
  );
}
