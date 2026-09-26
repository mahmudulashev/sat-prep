"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { id: "tests", label: "Tests" },
  { id: "features", label: "Features" },
  { id: "plans", label: "Plans" },
];

type Marker = { left: number; width: number } | null;

/**
 * Landing page header. Past the top of the page it lifts into a floating
 * pill, tucks away while scrolling down and returns on the way back up, and a
 * marker slides to the section currently on screen.
 */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [marker, setMarker] = useState<Marker>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      // Tuck away only after a clear downward move, and never near the top.
      if (Math.abs(y - lastY) > 6) setTucked(y > lastY && y > 480);
      lastY = y;

      // The current section is the last one whose top has passed 40% of the viewport.
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const { id } of LINKS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = id;
      }
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = LINKS[LINKS.length - 1].id;
      setActive(current);

      const link = current ? linkRefs.current[current] : null;
      setMarker(link ? { left: link.offsetLeft, width: link.offsetWidth } : null);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[translate,background-color,border-color] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
        scrolled ? "border-b border-transparent bg-transparent" : "border-b border-line/70 bg-canvas/80 backdrop-blur-xl",
        tucked && "-translate-y-[calc(100%+1rem)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 items-center justify-between px-4 transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] sm:px-6",
          scrolled
            ? "mt-2 h-14 w-[calc(100%-1.5rem)] max-w-5xl rounded-full bg-surface/80 shadow-float ring-1 ring-line/80 backdrop-blur-xl sm:pr-2.5 sm:pl-5"
            : "max-w-6xl",
        )}
      >
        <Logo />
        <nav className="relative hidden items-center gap-1 text-sm font-medium md:flex">
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-0 rounded-full bg-ink transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]",
              marker ? "opacity-100" : "scale-75 opacity-0",
            )}
            style={marker ?? undefined}
          />
          {LINKS.map(({ id, label }) => (
            <a
              key={id}
              ref={(el) => {
                linkRefs.current[id] = el;
              }}
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
              className={cn(
                "relative rounded-full px-4 py-1.5 transition-colors duration-300",
                active === id ? "text-white" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <ButtonLink href="/dashboard" size="sm" variant="dark">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" size="sm" variant="ghost" className="hidden sm:inline-flex">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm" variant="dark">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
