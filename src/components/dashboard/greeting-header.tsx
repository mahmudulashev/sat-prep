import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Greeting } from "@/components/dashboard/nav";
import { daysUntil, getDashboardData } from "@/lib/dashboard";
import { formatDate, initials } from "@/lib/utils";

/** Greeting, SAT date and profile chip shown at the top of the Overview page. */
export async function GreetingHeader() {
  const { name, profile, user } = await getDashboardData();
  const testDate = profile?.test_date;
  const daysLeft = testDate ? daysUntil(testDate) : null;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
          <Greeting name={name} />
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays className="size-3.5" />
          {testDate ? (
            <>
              SAT date: {formatDate(testDate, { timeZone: "UTC" })}
              {daysLeft !== null && daysLeft >= 0 && <span className="font-semibold text-ink-2"> · {daysLeft} days to go</span>}
            </>
          ) : (
            <Link href="/dashboard/profile" className="hover:text-ink hover:underline">
              Add your SAT date
            </Link>
          )}
        </p>
      </div>
      <Link
        href="/dashboard/profile"
        className="flex shrink-0 items-center gap-3 rounded-full bg-surface py-1 pr-4 pl-1 shadow-card ring-1 ring-line transition hover:ring-brand/30"
      >
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#8b7bff] to-brand text-sm font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-semibold">{name}</span>
          <span className="block text-xs leading-tight text-muted">{user.email}</span>
        </span>
      </Link>
    </div>
  );
}
