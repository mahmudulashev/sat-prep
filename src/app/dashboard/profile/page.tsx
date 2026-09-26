import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { signOut } from "@/app/(auth)/actions";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/dashboard";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, profile, name, completed } = await getDashboardData();
  const best = Math.max(0, ...completed.filter((a) => a.section === "general").map((a) => a.score ?? 0));

  return (
    <div>
      <PageHeader title="Profile" description="Your name, target score and test date." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="h-fit rounded-3xl bg-surface p-6 text-center shadow-card">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#8b7bff] to-brand text-2xl font-extrabold text-white">
            {initials(name)}
          </span>
          <p className="mt-4 text-lg font-bold">{name}</p>
          <p className="text-sm text-muted">{user.email}</p>
          {profile?.created_at && <p className="mt-1 text-xs text-muted">Member since {formatDate(profile.created_at)}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-canvas p-4">
              <dt className="text-xs text-muted">Tests completed</dt>
              <dd className="mt-1 text-2xl font-extrabold">{completed.length}</dd>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <dt className="text-xs text-muted">Best full-length</dt>
              <dd className="mt-1 text-2xl font-extrabold">{best || "—"}</dd>
            </div>
          </dl>

          <form action={signOut} className="mt-6">
            <Button type="submit" variant="secondary" className="w-full">
              Sign out
            </Button>
          </form>
        </aside>

        <section className="rounded-3xl bg-surface p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold">Profile details</h2>
          <p className="mt-1 text-sm text-muted">Your goal and test date personalize your dashboard.</p>
          <div className="mt-6">
            <ProfileForm fullName={name} targetScore={profile?.target_score ?? null} testDate={profile?.test_date ?? null} />
          </div>
        </section>
      </div>
    </div>
  );
}
