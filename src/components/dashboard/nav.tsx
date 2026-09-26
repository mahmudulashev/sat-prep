"use client";

import { BookOpenCheck, History, LayoutGrid, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/tests", label: "Tests", icon: BookOpenCheck },
  { href: "/dashboard/history", label: "History", icon: History },
];
const ACCOUNT = [{ href: "/dashboard/profile", label: "Profile", icon: UserRound }];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-4 py-6 lg:flex">
      <Logo className="px-2" />
      <div className="mt-6 border-t border-dashed border-line" />

      <NavGroup title="Main" items={MAIN} pathname={pathname} />
      <div className="mt-6 border-t border-dashed border-line" />
      <NavGroup title="Account" items={ACCOUNT} pathname={pathname} />

      <form action={signOut} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-canvas hover:text-ink"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-canvas">
            <LogOut className="size-4" />
          </span>
          Sign out
        </button>
      </form>
    </aside>
  );
}

function NavGroup({ title, items, pathname }: { title: string; items: typeof MAIN; pathname: string }) {
  return (
    <nav className="mt-5">
      <p className="px-3 text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-brand-soft text-ink" : "text-ink-2 hover:bg-canvas",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg transition",
                    active ? "bg-brand text-white shadow-[0_4px_12px_-4px_rgb(108_92_231/0.8)]" : "bg-canvas",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
      {[...MAIN, ...ACCOUNT].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
            isActive(pathname, href) ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line",
          )}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}

/** Rendered on the client so it uses the visitor's local time. */
export function Greeting({ name }: { name: string }) {
  const [text, setText] = useState("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    const id = requestAnimationFrame(() =>
      setText(hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <span>
      {text}, {name.split(" ")[0]}
    </span>
  );
}
