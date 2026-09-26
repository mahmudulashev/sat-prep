import { Check, Maximize, MonitorX, ShieldCheck, X } from "lucide-react";
import { CountUp } from "./reveal";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

/** Landing-page features, each shown as a small live-looking preview of the product. */
export function FeatureBento() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Tile className="lg:col-span-2" delay={0} eyebrow="Real test layout" title="The interface you'll see on test day">
        <TestPreview />
      </Tile>

      <div data-reveal style={delay(120)} className="flex flex-col overflow-hidden rounded-3xl bg-ink p-7 text-white">
        <p className="text-sm font-semibold text-lime">Exam lockdown</p>
        <h3 className="mt-2 text-2xl leading-tight font-bold">Honest scores, every attempt.</h3>
        <ul className="mt-6 space-y-2.5 text-sm">
          {[
            { icon: Maximize, label: "Full screen only" },
            { icon: MonitorX, label: "Developer tools blocked" },
            { icon: ShieldCheck, label: "Tab switches detected" },
          ].map(({ icon: Icon, label }, i) => (
            <li key={label} className="on-show-slide flex items-center gap-3 rounded-2xl bg-white/7 px-4 py-3" style={delay(450 + i * 120)}>
              <Icon className="size-4 text-lime" />
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-1.5 flex-1 rounded-full bg-white/15">
              <span className="on-show-grow-x block h-full rounded-full bg-[#ff6b6b]" style={delay(1000)} />
            </span>
            <span className="h-1.5 flex-1 rounded-full bg-white/15" />
            <span className="h-1.5 flex-1 rounded-full bg-white/15" />
          </div>
          <p className="mt-2 text-xs text-white/55">Warning 1 of 3 — the third submits the test.</p>
        </div>
      </div>

      <Tile delay={0} eyebrow="Built-in tools" title="Graphing calculator & reference sheet">
        <CalculatorPreview />
      </Tile>

      <Tile delay={120} eyebrow="Question review" title="Every answer, explained">
        <ReviewPreview />
      </Tile>

      <Tile delay={240} eyebrow="Analytics" title="Progress you can actually see">
        <ProgressPreview />
      </Tile>
    </div>
  );
}

function Tile({
  eyebrow,
  title,
  children,
  className = "",
  delay: ms,
}: {
  delay: number;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-reveal style={delay(ms)} className={`flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card ${className}`}>
      <div className="px-7 pt-7">
        <p className="text-sm font-semibold text-brand">{eyebrow}</p>
        <h3 className="mt-2 text-xl leading-snug font-bold">{title}</h3>
      </div>
      <div className="mt-6 flex flex-1 items-end px-7" aria-hidden>
        {children}
      </div>
    </div>
  );
}

function TestPreview() {
  return (
    <div className="pointer-events-none w-full overflow-hidden rounded-t-2xl border border-b-0 border-line font-exam text-[0.625rem] text-bb-ink select-none">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-bb-header px-4 py-2.5">
        <div>
          <p className="text-[0.72rem] font-medium">Section 1, Module 1: Reading and Writing</p>
          <p className="mt-0.5 font-medium text-[#555]">Directions ⌄</p>
        </div>
        <div className="text-center">
          <p className="text-[0.8rem] font-bold">31:58</p>
          <span className="rounded-full border border-bb-ink px-1.5 text-[0.5rem] font-bold">Hide</span>
        </div>
        <div className="flex justify-end gap-4 text-[0.55rem] font-medium">
          <span>Highlights &amp; Notes</span>
          <span>More</span>
        </div>
      </div>
      <div className="bb-dashed-thin" />
      <div className="mx-3 rounded-b-md bg-bb-navy py-1 text-center text-[0.5rem] font-bold text-white">THIS IS A PRACTICE TEST</div>

      <div className="grid grid-cols-2 bg-white">
        <div className="space-y-1.5 border-r-2 border-[#9a9a9a] px-5 py-4 font-serif text-[0.62rem] leading-relaxed">
          <p>
            Mangrove forests protect coastlines by absorbing the energy of incoming waves.{" "}
            <mark className="on-show-highlight px-0.5" style={delay(700)}>Areas with healthy mangroves</mark> often suffer less damage during
            storms than areas where mangroves have been cleared.
          </p>
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-11/12 rounded bg-[#eceef3]" />
            <div className="h-1.5 w-4/5 rounded bg-[#eceef3]" />
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center bg-[#f0f0f0]">
            <span className="grid h-5 w-5 place-items-center bg-[#1e1e1e] text-[0.6rem] font-bold text-white">7</span>
            <span className="ml-2 text-[0.55rem]">Mark for Review</span>
          </div>
          <div className="bb-dashed-thin mt-0.5 opacity-70" />
          <p className="mt-2 font-serif text-[0.6rem]">Which choice completes the text with the most logical transition?</p>
          <div className="mt-2 space-y-1.5 font-serif text-[0.58rem]">
            {[
              { l: "A", t: "In contrast,", s: "" },
              { l: "B", t: "Nonetheless,", s: "out" },
              { l: "C", t: "As a result,", s: "on" },
              { l: "D", t: "Previously,", s: "" },
            ].map((c) => (
              <div
                key={c.l}
                className={`relative flex items-center gap-2 rounded-md border px-2 py-1 ${
                  c.s === "on" ? "border-bb-blue shadow-[inset_0_0_0_1px_var(--color-bb-blue)]" : "border-[#1e1e1e]"
                } ${c.s === "out" ? "text-[#9a9a9a]" : ""}`}
              >
                <span
                  className={`grid size-3.5 place-items-center rounded-full border font-exam text-[0.45rem] font-bold ${
                    c.s === "on" ? "on-show-pop border-bb-blue bg-bb-blue text-white" : "border-current"
                  }`}
                  style={c.s === "on" ? delay(1500) : undefined}
                >
                  {c.l}
                </span>
                {c.t}
                {c.s === "out" && <span className="on-show-grow-x absolute inset-x-0 top-1/2 h-px bg-[#1e1e1e]" style={delay(1100)} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bb-dashed-thin" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-bb-header px-4 py-2">
        <span className="text-[0.7rem] font-medium">Alex Morgan</span>
        <span className="rounded bg-[#1e1e1e] px-2 py-1 text-[0.55rem] font-bold text-white">Question 7 of 27 ⌃</span>
        <div className="flex justify-end gap-1.5">
          <span className="rounded-full bg-bb-blue px-2.5 py-1 text-[0.55rem] font-bold text-white">Back</span>
          <span className="rounded-full bg-bb-blue px-2.5 py-1 text-[0.55rem] font-bold text-white">Next</span>
        </div>
      </div>
    </div>
  );
}

function CalculatorPreview() {
  return (
    <div className="w-full overflow-hidden rounded-t-2xl border border-b-0 border-line">
      <svg viewBox="0 0 300 150" className="block w-full bg-white">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="150" stroke="#eef0f4" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20 + 15} x2="300" y2={i * 20 + 15} stroke="#eef0f4" />
        ))}
        <line x1="0" y1="95" x2="300" y2="95" stroke="#1e1e1e" strokeWidth="1.2" />
        <line x1="140" y1="0" x2="140" y2="150" stroke="#1e1e1e" strokeWidth="1.2" />
        <path d="M60 10 Q140 180 220 10" pathLength={1} className="on-show-draw" style={delay(400)} fill="none" stroke="#2d70b3" strokeWidth="2.5" />
        <line x1="40" y1="140" x2="260" y2="30" pathLength={1} className="on-show-draw" style={delay(800)} stroke="#c74440" strokeWidth="2.5" />
        <circle cx="183" cy="73.5" r="4.5" className="on-show-pop" style={delay(1900)} fill="#1e1e1e" stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="space-y-px bg-[#f3f3f3] font-serif text-[0.75rem] italic">
        <p className="flex items-center gap-2 bg-white px-3 py-2">
          <span className="size-2.5 rounded-full bg-[#c74440]" /> y = ½x + 2
        </p>
        <p className="flex items-center gap-2 bg-white px-3 py-2">
          <span className="size-2.5 rounded-full bg-[#2d70b3]" /> y = x² − 4
        </p>
      </div>
    </div>
  );
}

function ReviewPreview() {
  return (
    <div className="w-full space-y-2 pb-7 text-sm">
      <div className="on-show-slide flex items-center gap-3 rounded-2xl border border-danger/40 bg-[#fdf0f0] px-3 py-2.5" style={delay(400)}>
        <span className="grid size-6 place-items-center rounded-full bg-danger text-white">
          <X className="size-3.5" strokeWidth={3} />
        </span>
        <span className="flex-1">
          <span className="font-semibold">B</span> · 16 feet
        </span>
        <span className="text-xs font-bold text-danger">Your answer</span>
      </div>
      <div className="on-show-slide flex items-center gap-3 rounded-2xl border border-success/40 bg-[#effaf3] px-3 py-2.5" style={delay(650)}>
        <span className="grid size-6 place-items-center rounded-full bg-success text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="flex-1">
          <span className="font-semibold">C</span> · 21 feet
        </span>
        <span className="text-xs font-bold text-success">Correct</span>
      </div>
      <p className="on-show-slide rounded-2xl bg-brand-soft/70 px-4 py-3 text-xs leading-relaxed text-ink-2" style={delay(900)}>
        <span className="font-bold text-ink">Explanation · </span>
        Set up the proportion 6/4 = h/14, so h = 21. Similar triangles keep the same ratio of height to shadow.
      </p>
    </div>
  );
}

function ProgressPreview() {
  const bars = [52, 58, 55, 66, 71, 78, 84];
  return (
    <div className="w-full pb-7">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">Latest total</p>
          <p className="text-3xl font-extrabold tracking-tight">
            <CountUp from={1160} to={1340} delay={500} duration={1600} />
          </p>
        </div>
        <span className="on-show-pop rounded-full bg-lime px-2.5 py-1 text-xs font-bold" style={delay(1600)}>
          +180 in 3 weeks
        </span>
      </div>
      <div className="mt-5 flex h-24 items-end gap-2">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`on-show-grow-y flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-brand" : "bg-brand-soft"}`}
            style={{ height: `${h}%`, "--d": `${400 + i * 90}ms` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
