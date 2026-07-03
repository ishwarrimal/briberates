import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks for your report",
  robots: { index: false, follow: false },
};

export default function ThankYou() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Thank you 🙏</h1>
      <p className="mt-3 text-black/70 dark:text-white/70">
        Your report was submitted anonymously and will appear once it&apos;s
        reviewed. You just made the next person a little less likely to overpay.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-black/20 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/10"
        >
          Back to home
        </Link>
        <Link
          href="/submit"
          className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Report another
        </Link>
      </div>
    </div>
  );
}
