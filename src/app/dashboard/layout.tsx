import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { Greeting, MobileNav, Sidebar } from "@/components/dashboard/nav";
import { daysUntil, getDashboardData } from "@/lib/dashboard";
import { formatDate, initials } from "@/lib/utils";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { name, profile, user } = await getDashboardData();

  const testDate = profile?.test_date;
  const daysLeft = testDate ? daysUntil(testDate) : null;

  return (
    <div className="flex min-h-screen" data-page-scale="app">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-6xl min-[1800px]:max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark className="lg:hidden" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold sm:text-xl">
                  <Greeting name={name} />
                </h1>
                <p className="flex items-center gap-1.5 text-xs text-muted sm:text-sm">
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
            </div>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-full bg-surface py-1 pr-4 pl-1 shadow-card ring-1 ring-line transition hover:ring-brand/30"
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
          <div className="mx-auto max-w-6xl min-[1800px]:max-w-7xl px-4 pb-3 sm:px-8 lg:hidden">
            <MobileNav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl min-[1800px]:max-w-7xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
