import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function BookmarkIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 20" width="14" height="18" {...props}>
      <path
        d="M2 1.5h12v16.2l-6-4.4-6 4.4z"
        fill={filled ? "#c1323f" : "none"}
        stroke={filled ? "#c1323f" : "currentColor"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The "ABC" answer-eliminator toggle. */
export function EliminatorIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 28 22" width="24" height="19" {...props}>
      <text x="14" y="15.5" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="Roboto, Arial, sans-serif" fill="currentColor">
        ABC
      </text>
      <line x1="4" y1="18" x2="24" y2="4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Circled letter with a strike line, shown next to each choice in eliminate mode. */
export function StrikeLetterIcon({ letter, ...props }: IconProps & { letter: string }) {
  return (
    <svg viewBox="0 0 30 30" width="26" height="26" {...props}>
      <circle cx="15" cy="15" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="15" y="19.3" textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="Roboto, Arial, sans-serif" fill="currentColor">
        {letter}
      </text>
      <line x1="1.5" y1="15" x2="28.5" y2="15" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function LocationPinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 20" width="13" height="16" {...props}>
      <path d="M8 19s6-6.3 6-11A6 6 0 0 0 2 8c0 4.7 6 11 6 11z" fill="#1e1e1e" />
      <circle cx="8" cy="8" r="2.3" fill="#fff" />
    </svg>
  );
}

export function DotsSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" width="56" height="56" className={className} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <circle
            key={i}
            cx={30 + Math.cos(angle) * 20}
            cy={30 + Math.sin(angle) * 20}
            r={1.2 + (i / 8) * 3.2}
            fill="#1e1e1e"
          />
        );
      })}
    </svg>
  );
}
