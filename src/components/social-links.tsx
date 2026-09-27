import { cn } from "@/lib/utils";

const LINKS = [
  {
    label: "Telegram",
    handle: "@mahmud_ulashev",
    href: "https://t.me/mahmud_ulashev",
    path: "M21.94 4.3 18.7 19.6c-.24 1.07-.88 1.34-1.78.83l-4.93-3.63-2.38 2.29c-.26.26-.48.48-.99.48l.35-5.02 9.14-8.26c.4-.35-.09-.55-.62-.2L6.2 13.2 1.33 11.68c-1.06-.33-1.08-1.06.22-1.57L20.6 2.77c.88-.33 1.65.2 1.34 1.53Z",
  },
  {
    label: "GitHub",
    handle: "mahmudulashev",
    href: "https://github.com/mahmudulashev",
    path: "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
  },
] as const;

/** Links to the site owner's Telegram and GitHub. */
export function SocialLinks({ withHandles = false, className }: { withHandles?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {LINKS.map(({ label, handle, href, path }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}: ${handle}`}
          title={`${label}: ${handle}`}
          className={cn(
            "flex items-center gap-2 rounded-full text-ink-2 transition hover:bg-canvas hover:text-ink",
            withHandles ? "px-3 py-1.5 ring-1 ring-line" : "size-9 justify-center",
          )}
        >
          <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="currentColor" aria-hidden>
            <path d={path} />
          </svg>
          {withHandles && <span className="text-sm font-medium">{handle}</span>}
        </a>
      ))}
    </div>
  );
}
