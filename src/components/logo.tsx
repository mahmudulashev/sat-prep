import Link from "next/link";
import { cn, SITE_NAME } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#8b7bff] to-brand text-white shadow-[0_6px_16px_-6px_rgb(108_92_231/0.8)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path d="M4 17.5 12 5l8 12.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="15.5" r="2.2" fill="#e3f86b" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[19px] font-extrabold tracking-tight text-ink">{SITE_NAME}</span>
    </Link>
  );
}
