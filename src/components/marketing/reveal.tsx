"use client";

import { useEffect, useRef } from "react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals every `[data-reveal]` element on the page as it scrolls into view.
 * Elements stay fully visible until this runs, so the page reads fine without
 * JavaScript or with reduced motion.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = document.documentElement;
    root.classList.add("reveal-on");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);

  return null;
}

/** Counts up to `to` once visible. The final value is rendered on the server. */
export function CountUp({ to, from = 0, duration = 1400, delay = 0 }: { to: number; from?: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    let timer = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = String(Math.round(from + (to - from) * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    el.textContent = String(from);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = window.setTimeout(run, delay);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      el.textContent = String(to);
    };
  }, [to, from, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {to}
    </span>
  );
}
