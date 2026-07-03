import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">{SITE.name}</span>
          <span className="hidden text-xs text-black/50 dark:text-white/50 sm:inline">
            {SITE.tagline}
          </span>
        </Link>
        <Link
          href="/submit"
          className="rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Report what you paid
        </Link>
      </div>
    </header>
  );
}
