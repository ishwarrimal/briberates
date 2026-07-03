import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/admin";
import { getPendingReports } from "@/lib/queries";
import { LoginForm } from "./LoginForm";
import { ModerationList } from "./ModerationList";

export const metadata: Metadata = {
  title: "Moderation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isValidAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Moderation queue</h1>

      {!authed ? (
        <>
          <p className="mt-2 text-black/60 dark:text-white/60">
            Log in to review pending reports.
          </p>
          <LoginForm />
        </>
      ) : (
        <>
          <p className="mt-2 text-black/60 dark:text-white/60">
            Approve reports to publish them, or reject spam. Approved figures
            feed straight into the public medians.
          </p>
          <ModerationList reports={await getPendingReports()} />
        </>
      )}
    </div>
  );
}
