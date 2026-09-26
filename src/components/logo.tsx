import Link from "next/link";
import { cn, SITE_NAME } from "@/lib/utils";

/** An answer grid with one bubble filled in. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="36" height="36" rx="10" fill="#11132a" />
      <circle cx="12.5" cy="12.5" r="4.3" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.8" />
      <circle cx="23.5" cy="12.5" r="5" fill="#e3f86b" />
      <circle cx="12.5" cy="23.5" r="4.3" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.8" />
      <circle cx="23.5" cy="23.5" r="4.3" fill="none" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.8" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label={`${SITE_NAME} home`}>
      <LogoMark />
      <span className="text-[1.25rem] font-extrabold tracking-[-0.03em] text-ink">
        {SITE_NAME.toLowerCase()}
        <span className="text-brand">.</span>
      </span>
    </Link>
  );
}
