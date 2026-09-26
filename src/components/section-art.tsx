import type { Section } from "@/lib/exam/types";
import { cn } from "@/lib/utils";

/** Soft, flat illustrations used on section and test cards. */
export function SectionArt({ section, className }: { section: Section; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {section === "math" && <MathArt />}
      {section === "english" && <EnglishArt />}
      {section === "general" && <GeneralArt />}
    </div>
  );
}

function Frame({ from, to, children }: { from: string; to: string; children: React.ReactNode }) {
  const id = `g-${from.slice(1)}-${to.slice(1)}`;
  return (
    <svg viewBox="0 0 320 200" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1b1446" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect width="320" height="200" fill={`url(#${id})`} />
      <g opacity="0.14" stroke="#fff">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="200" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="320" y2={i * 40} />
        ))}
      </g>
      <g filter={`url(#${id}-s)`}>{children}</g>
    </svg>
  );
}

function MathArt() {
  return (
    <Frame from="#9b8cff" to="#6c5ce7">
      <rect x="78" y="38" width="164" height="112" rx="14" fill="#fff" />
      <rect x="78" y="38" width="164" height="22" rx="14" fill="#f1eeff" />
      <circle cx="94" cy="49" r="3.5" fill="#ff8fb1" />
      <circle cx="105" cy="49" r="3.5" fill="#ffd166" />
      <circle cx="116" cy="49" r="3.5" fill="#7ee3c6" />
      <rect x="96" y="112" width="14" height="24" rx="3" fill="#c9c1ff" />
      <rect x="116" y="96" width="14" height="40" rx="3" fill="#a597ff" />
      <rect x="136" y="104" width="14" height="32" rx="3" fill="#c9c1ff" />
      <rect x="156" y="82" width="14" height="54" rx="3" fill="#7b6cff" />
      <path d="M182 128 C196 118 204 86 226 76" stroke="#ff8fb1" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="226" cy="76" r="5" fill="#ff8fb1" />
      <path d="M244 150 L286 150 L244 104 Z" fill="#e3f86b" />
      <path d="M252 142 L270 142 L252 122 Z" fill="#9b8cff" opacity="0.5" />
      <circle cx="54" cy="150" r="18" fill="#fff" opacity="0.95" />
      <text x="54" y="157" textAnchor="middle" fontSize="20" fontWeight="700" fill="#6c5ce7" fontFamily="serif" fontStyle="italic">
        x²
      </text>
      <circle cx="270" cy="46" r="10" fill="#ffd166" />
    </Frame>
  );
}

function EnglishArt() {
  return (
    <Frame from="#4fd8c4" to="#0f9f8f">
      <path d="M72 58 Q116 44 160 60 L160 156 Q116 142 72 156 Z" fill="#fff" />
      <path d="M248 58 Q204 44 160 60 L160 156 Q204 142 248 156 Z" fill="#f0fbf9" />
      {[76, 90, 104, 118].map((y) => (
        <rect key={`l${y}`} x="88" y={y} width={y === 118 ? 38 : 56} height="5" rx="2.5" fill="#bdeee6" />
      ))}
      {[76, 90, 104].map((y) => (
        <rect key={`r${y}`} x="176" y={y} width="54" height="5" rx="2.5" fill="#bdeee6" />
      ))}
      <rect x="176" y="118" width="30" height="8" rx="2" fill="#ffd166" />
      <g transform="rotate(38 250 70)">
        <rect x="236" y="30" width="14" height="92" rx="4" fill="#ff8fb1" />
        <path d="M236 122 L250 122 L243 138 Z" fill="#ffe4ec" />
        <rect x="236" y="30" width="14" height="14" rx="4" fill="#11132a" opacity="0.8" />
      </g>
      <text x="52" y="72" fontSize="54" fontWeight="800" fill="#e3f86b" fontFamily="serif">
        “
      </text>
      <circle cx="58" cy="160" r="9" fill="#e3f86b" />
    </Frame>
  );
}

function GeneralArt() {
  return (
    <Frame from="#ffc56b" to="#f59e0b">
      <rect x="112" y="44" width="120" height="96" rx="14" fill="#fff" opacity="0.55" transform="rotate(-8 172 92)" />
      <rect x="96" y="52" width="128" height="104" rx="14" fill="#fff" />
      <text x="124" y="118" fontSize="46" fontWeight="800" fill="#7b6cff" fontFamily="serif">
        A
      </text>
      <circle cx="186" cy="100" r="24" fill="#fff4dd" />
      <path d="M186 100 L186 76 A24 24 0 0 1 208 108 Z" fill="#14b8a6" />
      <path d="M186 100 L208 108 A24 24 0 0 1 170 118 Z" fill="#ff8fb1" />
      <rect x="116" y="134" width="88" height="6" rx="3" fill="#ffe2a8" />
      <rect x="236" y="120" width="40" height="40" rx="10" fill="#e3f86b" />
      <path d="M246 140 l7 7 l13 -15" stroke="#11132a" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="58" r="14" fill="#fff" opacity="0.9" />
      <circle cx="62" cy="58" r="6" fill="#7b6cff" />
    </Frame>
  );
}
